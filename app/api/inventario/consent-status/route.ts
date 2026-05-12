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
 * Auth: DPO-only.
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";

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
    return {
      inventoryId: inv.id,
      serviceName: inv.serviceName,
      setor: inv.setor,
      legalBasis: inv.legalBasis,
      legalBasisSensitive: inv.legalBasisSensitive,
      missingTerm: activeTerms.length === 0,
      activeTerms,
    };
  });

  return NextResponse.json({
    items,
    stats: {
      totalConsentProcesses: items.length,
      missingTerm: items.filter((i) => i.missingTerm).length,
    },
  });
}
