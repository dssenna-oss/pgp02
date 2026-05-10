/**
 * POST /api/inventario/sugerir-da-carta/materialize
 *
 * Recebe N serviços previamente sugeridos e cria N Inventários em
 * RASCUNHO com formAnswers pré-preenchido + provenance tag
 * "firecrawl:suggest:<url>" pra a UI exibir o badge "🤖 IA" nos campos.
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
 *     }>
 *   }
 *
 * Response 200:
 *   {
 *     created: Array<{ id: string, name: string }>,
 *     skipped: Array<{ name: string, reason: "duplicate" | "invalid" }>
 *   }
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import {
  prefillToFormAnswers,
  type SuggestedService,
} from "@/lib/sugestao-carta";

const MAX_BATCH = 30;

export async function POST(request: NextRequest) {
  try {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, companyId: true },
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

  const created: Array<{ id: string; name: string }> = [];
  const skipped: Array<{ name: string; reason: "duplicate" | "invalid" }> = [];

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
    // Marca o nome como existente desta iteração em diante (evita duplicar
    // se o user mandar 2 itens com nome igual)
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

    // _meta.provenance fica em formAnswers — extensão informal já usada
    // pela Fatia "a" (Modelos Padronizados) e Fatia "b" (Carta URL).
    const formAnswersWithMeta = {
      ...formAnswers,
      _meta: {
        provenance,
        suggestedFromCartaAt: new Date().toISOString(),
        suggestedFromUrl: fakeService.sourceUrl || null,
      },
    };

    try {
      // Campos legados (dataCategory, personalData, etc.) são obrigatórios
      // no schema mas estão sendo gradualmente migrados pra formAnswers.
      // Preenchemos com placeholder pra satisfazer o NOT NULL.
      const placeholder = "(a preencher)";
      const inv = await prisma.dataInventory.create({
        data: {
          companyId: user.companyId,
          createdById: user.id,
          serviceName: name,
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
      created.push({ id: inv.id, name: inv.serviceName ?? name });
    } catch (e) {
      console.error("[sugerir-da-carta/materialize] erro ao criar inv", e);
      skipped.push({ name, reason: "invalid" });
    }
  }

  return NextResponse.json({ created, skipped });
  } catch (e: any) {
    console.error("[sugerir-da-carta/materialize] erro inesperado", e);
    return NextResponse.json(
      { error: e?.message ?? "Erro inesperado no servidor" },
      { status: 500 },
    );
  }
}
