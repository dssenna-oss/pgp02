/**
 * POST /api/inventario/sugerir-da-carta/materialize
 *
 * Recebe N serviços previamente sugeridos e cria N Inventários em
 * RASCUNHO com formAnswers pré-preenchido + provenance tag
 * "firecrawl:suggest:<url>" pra a UI exibir o badge "🤖 IA" nos campos.
 *
 * Atribuição (opcional): se `assignments[serviceName] = contributorId`,
 * o Inventário nasce com `createdById = contributor.id` e `setor` puxado
 * do Contribuidor. Sem atribuição cai no comportamento histórico
 * (`createdById = DPO.id`).
 *
 * Notificação por email (opcional, default OFF): se `notifyByEmail=true`,
 * agrupa os rascunhos criados por Contribuidor responsável e envia 1
 * email por Contribuidor com a lista de processos atribuídos. Respeita
 * a preferência `emailNotifyAnnouncements` de cada Contribuidor.
 *
 * Idempotência: se já existe Inventário com o mesmo serviceName na org,
 * pula (não duplica). UI já avisa "Já mapeado" antes de chegar aqui,
 * mas reforçamos server-side por garantia.
 *
 * Auth: DPO-only.
 *
 * Body:
 *   {
 *     services: Array<{
 *       name: string,
 *       description: string,
 *       sourceUrl: string,
 *       prefill: ServicePrefill,    // mesmo tipo da rota suggest
 *     }>,
 *     assignments?: { [serviceName]: contributorId | null },
 *     notifyByEmail?: boolean,
 *   }
 *
 * Response 200:
 *   {
 *     created: Array<{ id: string, name: string, assignedTo: { id, name } | null }>,
 *     skipped: Array<{ name: string, reason: "duplicate" | "invalid" }>,
 *     emailsSent: number,
 *   }
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO, ROLES } from "@/lib/auth-helpers";
import {
  prefillToFormAnswers,
  type SuggestedService,
} from "@/lib/sugestao-carta";
import { sendEmail } from "@/lib/email-sender";
import { tplProcessosAtribuidos } from "@/lib/email-templates";

const MAX_BATCH = 30;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, role: true, companyId: true },
    });
    if (!user?.companyId) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }
    if (!isDPO(user.role)) {
      return NextResponse.json({ error: "Apenas DPO" }, { status: 403 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const services: any[] = Array.isArray(body?.services) ? body.services : [];
    if (services.length === 0) {
      return NextResponse.json(
        { error: "Forneça pelo menos 1 serviço em `services`." },
        { status: 400 },
      );
    }
    if (services.length > MAX_BATCH) {
      return NextResponse.json(
        { error: `Máximo ${MAX_BATCH} serviços por requisição.` },
        { status: 400 },
      );
    }

    const rawAssignments =
      body?.assignments && typeof body.assignments === "object"
        ? (body.assignments as Record<string, unknown>)
        : {};
    const notifyByEmail = body?.notifyByEmail === true;

    // Carrega Contribuidores da org pra validar que cada contributorId
    // recebido pertence à mesma org (defesa contra payload manipulado).
    const contribuidoresArr = await prisma.user.findMany({
      where: {
        companyId: user.companyId,
        role: { in: [ROLES.CONTRIBUIDOR, ROLES.USER_LEGACY] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        setor: true,
        emailNotifyAnnouncements: true,
      },
    });
    const contribuidoresById = new Map(contribuidoresArr.map((c) => [c.id, c]));

    // Carrega Inventários existentes pra dedup
    const existing = await prisma.dataInventory.findMany({
      where: { companyId: user.companyId },
      select: { serviceName: true },
    });
    const norm = (s: string) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    const existingNorm = new Set(
      existing
        .map((e) => (typeof e.serviceName === "string" ? norm(e.serviceName) : ""))
        .filter(Boolean),
    );

    const created: Array<{
      id: string;
      name: string;
      assignedTo: { id: string; name: string | null } | null;
    }> = [];
    const skipped: Array<{ name: string; reason: "duplicate" | "invalid" }> = [];

    // Agrupa o que cada Contribuidor recebeu pra usar no email no final.
    const grouped = new Map<
      string,
      {
        contributor: (typeof contribuidoresArr)[number];
        items: Array<{ id: string; name: string }>;
      }
    >();

    for (const raw of services) {
      if (!raw || typeof raw !== "object") {
        skipped.push({ name: "?", reason: "invalid" });
        continue;
      }
      const name = typeof raw.name === "string" ? raw.name.trim() : "";
      if (!name || name.length < 4) {
        skipped.push({ name: name || "?", reason: "invalid" });
        continue;
      }
      if (existingNorm.has(norm(name))) {
        skipped.push({ name, reason: "duplicate" });
        continue;
      }
      existingNorm.add(norm(name));

      const fakeService: SuggestedService = {
        id: "",
        name,
        description: typeof raw.description === "string" ? raw.description : "",
        classification: "SUGERIDO",
        classificationReason: "",
        sourceUrl: typeof raw.sourceUrl === "string" ? raw.sourceUrl : "",
        category: null,
        prefill: (raw.prefill && typeof raw.prefill === "object") ? raw.prefill : {},
      };
      const { formAnswers, provenance } = prefillToFormAnswers(fakeService);

      // Resolve atribuição (se houver). Aceita o nome literal do serviço
      // como chave; assignmentValue pode ser string (contributorId), null
      // (explícito "sem responsável") ou undefined (não-atribuir).
      const assignmentValue = rawAssignments[name];
      let assignedContributor:
        | (typeof contribuidoresArr)[number]
        | null = null;
      if (typeof assignmentValue === "string" && assignmentValue.trim()) {
        const candidate = contribuidoresById.get(assignmentValue);
        if (candidate) assignedContributor = candidate;
        // Se vier id desconhecido, ignora silenciosamente — cai no fluxo
        // sem responsável (createdById = DPO).
      }

      const createdById = assignedContributor?.id ?? user.id;
      const setor = assignedContributor?.setor ?? null;

      const formAnswersWithMeta = {
        ...formAnswers,
        _meta: {
          provenance,
          suggestedFromCartaAt: new Date().toISOString(),
          suggestedFromUrl: fakeService.sourceUrl || null,
          assignedByDpoId: assignedContributor ? user.id : null,
          assignedByDpoName: assignedContributor ? user.name ?? null : null,
        },
      };

      try {
        const placeholder = "(a preencher)";
        const inv = await prisma.dataInventory.create({
          data: {
            companyId: user.companyId,
            createdById,
            serviceName: name,
            setor,
            dataCategory: placeholder,
            personalData: placeholder,
            legalBasis: fakeService.prefill.legalBasis ?? placeholder,
            purpose: fakeService.prefill.process_purpose ?? placeholder,
            dataSubjects: fakeService.prefill.data_subjects?.join(", ") ?? placeholder,
            retention: placeholder,
            storage: placeholder,
            sharing: fakeService.prefill.share_with_whom ?? "",
            security: placeholder,
            isDraft: true,
            status: "RASCUNHO",
            formAnswers: formAnswersWithMeta as any,
          },
          select: { id: true, serviceName: true },
        });
        created.push({
          id: inv.id,
          name: inv.serviceName ?? name,
          assignedTo: assignedContributor
            ? { id: assignedContributor.id, name: assignedContributor.name }
            : null,
        });

        if (assignedContributor) {
          const bucket = grouped.get(assignedContributor.id) ?? {
            contributor: assignedContributor,
            items: [],
          };
          bucket.items.push({ id: inv.id, name: inv.serviceName ?? name });
          grouped.set(assignedContributor.id, bucket);
        }
      } catch (e) {
        console.error("[sugerir-da-carta/materialize] erro ao criar inv", e);
        skipped.push({ name, reason: "invalid" });
      }
    }

    // Envia emails de atribuição, se pedido. Fire-and-forget pro caller —
    // o array de promessas roda em paralelo e falhas individuais não
    // abortam o response. Respeita preferência `emailNotifyAnnouncements`
    // (mesma usada pra Comunicados — chega na mesma chave mental).
    let emailsSent = 0;
    if (notifyByEmail && grouped.size > 0) {
      const tasks: Array<Promise<boolean>> = [];
      for (const { contributor, items } of grouped.values()) {
        if (!contributor.emailNotifyAnnouncements) continue;
        if (items.length === 0) continue;
        const { subject, html, text } = tplProcessosAtribuidos({
          recipientName: contributor.name,
          recipientEmail: contributor.email,
          dpoName: user.name ?? "DPO",
          companyName: null,
          processes: items,
        });
        tasks.push(
          sendEmail({
            to: { email: contributor.email, name: contributor.name ?? undefined },
            subject,
            html,
            text,
            tag: "processos-atribuidos",
          }).then((ok) => {
            if (ok) emailsSent++;
            return ok;
          }),
        );
      }
      // Aguarda paralelo (curto — Brevo respondem rápido). Não tratamos
      // falha individual; logada por `sendEmail`.
      await Promise.all(tasks);
    }

    return NextResponse.json({ created, skipped, emailsSent });
  } catch (e: any) {
    console.error("[sugerir-da-carta/materialize] erro inesperado", e);
    return NextResponse.json(
      { error: e?.message ?? "Erro inesperado no servidor" },
      { status: 500 },
    );
  }
}
