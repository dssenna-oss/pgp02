/**
 * GET /api/consent-terms/[id]/versions
 *
 * Lista versões publicadas (snapshots). Inclui o `content` pra permitir
 * diff word-level no client.
 *
 * Auth: DPO-only.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";

export async function GET(
  _req: NextRequest,
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

  const versions = await prisma.consentTermVersion.findMany({
    where: { termId: term.id },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      content: true,
      changeLog: true,
      publishedAt: true,
      publishedBy: { select: { id: true, name: true, email: true } },
      _count: { select: { records: true } },
    },
  });

  return NextResponse.json({
    versions: versions.map((v) => ({
      ...v,
      acceptedCount: v._count.records,
      _count: undefined,
    })),
  });
}
