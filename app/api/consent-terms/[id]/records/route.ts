/**
 * GET /api/consent-terms/[id]/records
 *
 * Lista os ConsentRecord de um termo (registros de aceite digital).
 * Paginado por simplicidade — V1 retorna até 200 mais recentes. Filtro
 * opcional `?status=active|revoked|all`.
 *
 * Auth: DPO-only. CPF é parcialmente mascarado (LGPD - minimização) —
 * IP completo + UA mantidos pra investigação se necessário.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import { maskCpf } from "@/lib/consent-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

  const term = await prisma.consentTerm.findUnique({
    where: { id: params.id },
    select: { id: true, companyId: true },
  });
  if (!term || term.companyId !== user.companyId) {
    return NextResponse.json({ error: "Termo não encontrado" }, { status: 404 });
  }

  const sp = request.nextUrl.searchParams;
  const filter = sp.get("status") ?? "active";
  const where: any = { termId: term.id };
  if (filter === "active") where.revokedAt = null;
  else if (filter === "revoked") where.revokedAt = { not: null };

  const records = await prisma.consentRecord.findMany({
    where,
    orderBy: { acceptedAt: "desc" },
    take: 200,
    select: {
      id: true,
      titularName: true,
      titularEmail: true,
      titularCpf: true,
      ip: true,
      userAgent: true,
      contentChecksum: true,
      acceptedAt: true,
      revokedAt: true,
      revocationReason: true,
      version: { select: { version: true } },
    },
  });

  // Mascara CPF (não email — DPO precisa do email pra contatar o
  // titular caso necessário; CPF é mais sensível pra mostrar inteiro
  // no painel).
  const formatted = records.map((r) => ({
    ...r,
    titularCpfMasked: r.titularCpf ? maskCpf(r.titularCpf) : null,
    titularCpf: undefined,
    version: r.version.version,
  }));

  // Stats globais (não só desta página)
  const [activeCount, revokedCount] = await Promise.all([
    prisma.consentRecord.count({ where: { termId: term.id, revokedAt: null } }),
    prisma.consentRecord.count({
      where: { termId: term.id, revokedAt: { not: null } },
    }),
  ]);

  return NextResponse.json({
    records: formatted,
    stats: {
      active: activeCount,
      revoked: revokedCount,
      total: activeCount + revokedCount,
    },
  });
}
