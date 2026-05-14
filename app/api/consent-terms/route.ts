/**
 * GET  /api/consent-terms                     — lista termos da org + KPIs
 * POST /api/consent-terms                     — cria a partir de templateType
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
  buildConsentMarkdown,
  slugifyTitle,
  suggestTitle,
  type BuilderCompany,
  type BuilderInventory,
} from "@/lib/consent-builder";
import {
  isValidTemplateType,
  type ConsentTemplateType,
} from "@/lib/consent-templates";

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

function toBuilderCompany(c: any): BuilderCompany {
  return {
    companyName: c.companyName,
    tradeName: c.tradeName,
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
    personalData: inv.personalData,
    retention: inv.retention,
    sharing: inv.sharing,
  };
}

export async function GET() {
  const guard = await getCurrentDPO();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const { user } = guard;

  const [company, terms] = await Promise.all([
    prisma.company.findUnique({
      where: { id: user.companyId },
      select: { slug: true },
    }),
    prisma.dataInventory.count({
      where: { companyId: user.companyId, status: "APROVADO" },
    }),
  ]);

  const items = await prisma.consentTerm.findMany({
    where: { companyId: user.companyId },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      templateType: true,
      currentVersion: true,
      allowsPhysical: true,
      allowsDigital: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { inventoryLinks: true, records: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const formatted = items.map((t) => ({
    ...t,
    linkedInventories: t._count.inventoryLinks,
    acceptedCount: t._count.records,
    _count: undefined,
  }));

  // Quantos processos APROVADO usam base = Consentimento mas não têm
  // termo associado — alimenta o banner amarelo do Inventário (decisão 3.A).
  // V1: detecta processos cuja legalBasis contém "consentimento" e que não
  // têm vínculo ConsentTermInventoryLink. Caro fazer no GET — defer pra
  // S3 (banner) onde será endpoint próprio. Aqui só conta básico.

  return NextResponse.json({
    items: formatted,
    companySlug: company?.slug ?? null,
    stats: {
      total: items.length,
      published: items.filter((t) => t.status === "PUBLICADO").length,
      draft: items.filter((t) => t.status === "RASCUNHO").length,
      archived: items.filter((t) => t.status === "ARQUIVADO").length,
      totalAccepts: items.reduce((s, t) => s + t._count.records, 0),
      approvedProcesses: terms,
    },
  });
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

  const templateType = body?.templateType;
  if (typeof templateType !== "string" || !isValidTemplateType(templateType)) {
    return NextResponse.json(
      { error: "templateType inválido — use GERAL, SENSIVEIS, MENOR, IMAGEM_VOZ ou COMUNICACAO" },
      { status: 400 },
    );
  }

  const linkedInventoryIds: string[] = Array.isArray(body?.linkedInventoryIds)
    ? body.linkedInventoryIds.filter((s: any) => typeof s === "string")
    : [];

  // Carrega Company + Inventários vinculados (validando que pertencem
  // à mesma org pra blindar contra payload manipulado).
  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
  });
  if (!company) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }

  let inventories: any[] = [];
  if (linkedInventoryIds.length > 0) {
    inventories = await prisma.dataInventory.findMany({
      where: {
        id: { in: linkedInventoryIds },
        companyId: user.companyId,
      },
    });
  }

  const title =
    typeof body?.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 200)
      : suggestTitle(
          templateType as ConsentTemplateType,
          inventories[0] ? toBuilderInventory(inventories[0]) : null,
        );

  const allowsPhysical = body?.allowsPhysical !== false;
  const allowsDigital = body?.allowsDigital !== false;
  if (!allowsPhysical && !allowsDigital) {
    return NextResponse.json(
      { error: "Habilite pelo menos um modo (físico ou digital)" },
      { status: 400 },
    );
  }

  const currentContent = buildConsentMarkdown({
    templateType: templateType as ConsentTemplateType,
    company: toBuilderCompany(company),
    inventories: inventories.map(toBuilderInventory),
  });

  // Slug único por org — incrementa "-2", "-3" se colidir
  const base = slugifyTitle(title);
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const exists = await prisma.consentTerm.findUnique({
      where: { companyId_slug: { companyId: user.companyId, slug } },
      select: { id: true },
    });
    if (!exists) break;
    slug = `${base}-${i}`;
  }

  const created = await prisma.consentTerm.create({
    data: {
      companyId: user.companyId,
      templateType,
      slug,
      title,
      status: "RASCUNHO",
      currentContent,
      allowsPhysical,
      allowsDigital,
      createdById: user.id,
      ...(linkedInventoryIds.length > 0 && inventories.length > 0
        ? {
            inventoryLinks: {
              create: inventories.map((inv) => ({
                inventoryId: inv.id,
              })),
            },
          }
        : {}),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      templateType: true,
      currentVersion: true,
    },
  });

  return NextResponse.json({ term: created }, { status: 201 });
}
