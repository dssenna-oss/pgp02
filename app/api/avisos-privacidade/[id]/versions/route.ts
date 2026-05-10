/**
 * GET /api/avisos-privacidade/[id]/versions
 *
 * Lista versões publicadas (snapshot). Inclui `content` pra permitir diff
 * word-level no client (mesmo padrão das Políticas).
 *
 * Auth: DPO-only (URL pública usa só `publishedContent` da tabela principal).
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

  const notice = await prisma.servicePrivacyNotice.findUnique({
    where: { id: params.id },
    select: { id: true, companyId: true },
  });
  if (!notice || notice.companyId !== user.companyId) {
    return NextResponse.json({ error: "Aviso não encontrado" }, { status: 404 });
  }

  const versions = await prisma.servicePrivacyNoticeVersion.findMany({
    where: { noticeId: notice.id },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      content: true,
      changeLog: true,
      publishedAt: true,
      publishedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ versions });
}
