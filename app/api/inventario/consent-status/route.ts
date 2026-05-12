/**
 * GET /api/inventario/consent-status
 *
 * Lista processos APROVADO da org cuja base legal contém "Consentimento"
 * MAS que ainda não têm Termo de Consentimento associado (ConsentTermInventoryLink).
 *
 * Usado pra:
 *   - Banner amarelo na listagem do Inventário (decisão 3.A do cardápio)
 *   - KPI "Sem termo" no painel `/dashboard/termos-consentimento`
 *
 * Heurística do "base legal = Consentimento":
 *   - Match case-insensitive no campo `legalBasis` (Art. 7º) ou
 *     `legalBasisSensitive` (Art. 11) contendo "consent" (consentimento,
 *     consent, etc). Cobre 99% dos casos sem precisar enum rígido.
 *
 * Heurística "cookie-related" (integração CP26 — Sistema de Cookies):
 *   - Se serviceName/purpose menciona palavras como "cookie", "analytics",
 *     "google analytics", "tag manager", "pixel", "remarketing", o processo
 *     já é coberto pelo banner de cookies (CP26) — não conta no
 *     `stats.missingTerm` nem aparece como pendência. Continua na lista
 *     com flag `isCookieRelated:true` pra UI exibir contexto ("via CP26").
 *
 * Auth: DPO-only.
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";

/**
 * Detecta processos que tratam de cookies/analytics — já cobertos pelo
 * Sistema de Cookies (CP26) e não precisam de Termo de Consentimento
 * separado. Match case-insensitive nas keywords principais.
 *
 * Cobrir variações comuns (cookie/cookies, analítico/analitico/analytics)
 * sem ser amplo demais. "Análise" sozinho NÃO entra — análise de dados
 * de saúde, por exemplo, é tratamento real que precisa de termo.
 */
const COOKIE_KEYWORDS = [
  "cookie",
  "cookies",
  "google analytics",
  "google tag",
  "tag manager",
  "gtm",
  "analytics",
  "remarketing",
  "pixel",
  "rastreio",
  "rastreamento",
];

function isCookieRelated(args: {
  serviceName: string | null;
  purpose: string | null;
}): boolean {
  const haystack = `${args.serviceName ?? ""} ${args.purpose ?? ""}`.toLowerCase();
  return COOKIE_KEYWORDS.some((k) => haystack.includes(k));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, companyId: true },
  });
  if (!user?.companyId || !isDPO(user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  // Carrega Inventários APROVADO com base legal indicando consentimento
  // + os links de termo (pra detectar quais ainda não têm).
  const inventories = await prisma.dataInventory.findMany({
    where: {
      companyId: user.companyId,
      status: "APROVADO",
      OR: [
        { legalBasis: { contains: "consent", mode: "insensitive" } },
        { legalBasisSensitive: { contains: "consent", mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      serviceName: true,
      setor: true,
      purpose: true,
      legalBasis: true,
      legalBasisSensitive: true,
      consentTermLinks: {
        select: {
          term: { select: { id: true, slug: true, status: true, title: true } },
        },
      },
    },
  });

  const items = inventories.map((inv) => {
    const activeTerms = inv.consentTermLinks
      .map((l) => l.term)
      .filter((t) => t.status !== "ARQUIVADO");
    const cookieRelated = isCookieRelated({
      serviceName: inv.serviceName,
      purpose: inv.purpose,
    });
    // Cookie-related sem termo NÃO conta como pendência — o CP26 cobre.
    const missingTerm = activeTerms.length === 0 && !cookieRelated;
    return {
      inventoryId: inv.id,
      serviceName: inv.serviceName,
      setor: inv.setor,
      legalBasis: inv.legalBasis,
      legalBasisSensitive: inv.legalBasisSensitive,
      missingTerm,
      isCookieRelated: cookieRelated,
      activeTerms,
    };
  });

  return NextResponse.json({
    items,
    stats: {
      totalConsentProcesses: items.length,
      missingTerm: items.filter((i) => i.missingTerm).length,
      cookieRelated: items.filter((i) => i.isCookieRelated).length,
    },
  });
}
