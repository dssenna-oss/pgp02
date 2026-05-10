/**
 * GET  /api/avisos-privacidade        — lista Avisos da org + status dos processos
 * POST /api/avisos-privacidade        — cria (gera markdown a partir do Inventário)
 *
 * Auth: DPO-only.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import {
  buildAvisoForCreate,
  slugifyServiceName,
  type BuilderCompany,
  type BuilderInventory,
} from "@/lib/aviso-privacidade-builder";
import {
  defaultIncludedSections,
  normalizeIncludedSections,
  type IncludedSections,
} from "@/lib/aviso-privacidade-sections";

function toBuilderCompany(c: any): BuilderCompany {
  return {
    companyName: c.companyName,
    cnpj: c.cnpj,
    dpoName: c.dpoName,
    dpoEmail: c.dpoEmail,
    dpoPhone: c.dpoPhone,
  };
}

function toBuilderInventory(inv: any): BuilderInventory {
  return {
    serviceName: inv.serviceName,
    purpose: inv.purpose,
    legalBasis: inv.legalBasis,
    legalBasisSensitive: inv.legalBasisSensitive,
    previsaoLegal: inv.previsaoLegal,
    personalData: inv.personalData,
    sharing: inv.sharing,
    retention: inv.retention,
    security: inv.security,
    dataSubjects: inv.dataSubjects,
    storage: inv.storage,
    formAnswers: inv.formAnswers,
  };
}

type GuardOK = {
  user: { id: string; role: string; companyId: string };
};
type GuardErr = { error: string; status: number };

async function getCurrentDPO(): Promise<GuardOK | GuardErr> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: "Não autenticado", status: 401 };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, companyId: true },
  });
  if (!user?.companyId) {
    return { error: "Empresa não encontrada", status: 404 };
  }
  if (!isDPO(user.role)) {
    return { error: "Apenas DPO", status: 403 };
  }
  return { user: { id: user.id, role: user.role, companyId: user.companyId } };
}

export async function GET() {
  const guard = await getCurrentDPO();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const { user } = guard;

  // Lista TODOS os Inventários da org com APROVADO + os que já têm aviso
  // (mesmo se não-aprovado, pra mostrar overrides). Inclui o aviso (null se
  // ainda não existe) pra a UI saber qual estado mostrar.
  const inventories = await prisma.dataInventory.findMany({
    where: {
      companyId: user.companyId,
      OR: [
        { status: "APROVADO" },
        { servicePrivacyNotice: { isNot: null } },
      ],
    },
    select: {
      id: true,
      serviceName: true,
      setor: true,
      status: true,
      updatedAt: true,
      servicePrivacyNotice: {
        select: {
          id: true,
          slug: true,
          status: true,
          currentVersion: true,
          publishedAt: true,
          lastSyncedFromInventoryAt: true,
          forcedDespiteNotApproved: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const items = inventories.map((inv) => {
    const notice = inv.servicePrivacyNotice;
    const outdated =
      notice != null &&
      notice.lastSyncedFromInventoryAt < inv.updatedAt;
    return {
      inventoryId: inv.id,
      serviceName: inv.serviceName,
      setor: inv.setor,
      inventoryStatus: inv.status,
      inventoryUpdatedAt: inv.updatedAt,
      notice: notice
        ? {
            id: notice.id,
            slug: notice.slug,
            status: notice.status,
            currentVersion: notice.currentVersion,
            publishedAt: notice.publishedAt,
            lastSyncedFromInventoryAt: notice.lastSyncedFromInventoryAt,
            forcedDespiteNotApproved: notice.forcedDespiteNotApproved,
            outdated,
          }
        : null,
    };
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = await getCurrentDPO();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const { user } = guard;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const dataInventoryId = typeof body?.dataInventoryId === "string" ? body.dataInventoryId : "";
  if (!dataInventoryId) {
    return NextResponse.json(
      { error: "dataInventoryId obrigatório" },
      { status: 400 },
    );
  }
  const forceDespiteNotApproved = body?.forceDespiteNotApproved === true;
  const includedSectionsRaw =
    body?.includedSections && typeof body.includedSections === "object"
      ? (body.includedSections as IncludedSections)
      : defaultIncludedSections();
  const additionalNotes =
    typeof body?.additionalNotes === "string" ? body.additionalNotes : null;

  const inventory = await prisma.dataInventory.findUnique({
    where: { id: dataInventoryId },
    include: { company: true, servicePrivacyNotice: { select: { id: true } } },
  });
  if (!inventory || inventory.companyId !== user.companyId) {
    return NextResponse.json({ error: "Inventário não encontrado" }, { status: 404 });
  }
  if (inventory.servicePrivacyNotice) {
    return NextResponse.json(
      {
        error: "Já existe Aviso para este processo",
        existingId: inventory.servicePrivacyNotice.id,
      },
      { status: 409 },
    );
  }
  if (inventory.status !== "APROVADO" && !forceDespiteNotApproved) {
    return NextResponse.json(
      {
        error:
          "Inventário ainda não foi APROVADO. Reenvie com forceDespiteNotApproved=true se quiser gerar mesmo assim.",
      },
      { status: 422 },
    );
  }

  const built = buildAvisoForCreate({
    company: toBuilderCompany(inventory.company),
    inventory: toBuilderInventory(inventory),
    includedSections: includedSectionsRaw,
    additionalNotes,
  });

  // Slug com fallback caso colida com outro Aviso da mesma org.
  const baseSlug = slugifyServiceName(inventory.serviceName ?? "servico");
  let slug = baseSlug || "servico";
  for (let attempt = 1; attempt < 50; attempt++) {
    const exists = await prisma.servicePrivacyNotice.findUnique({
      where: { companyId_slug: { companyId: user.companyId, slug } },
      select: { id: true },
    });
    if (!exists) break;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  const created = await prisma.servicePrivacyNotice.create({
    data: {
      companyId: user.companyId,
      dataInventoryId: inventory.id,
      slug,
      status: "RASCUNHO",
      currentContent: built.currentContent,
      includedSections: built.includedSections as any,
      additionalNotes,
      lastSyncedFromInventoryAt: built.lastSyncedFromInventoryAt,
      forcedDespiteNotApproved: forceDespiteNotApproved && inventory.status !== "APROVADO",
      createdById: user.id,
    },
    select: {
      id: true,
      slug: true,
      status: true,
      currentVersion: true,
    },
  });

  return NextResponse.json({ notice: created }, { status: 201 });
}
