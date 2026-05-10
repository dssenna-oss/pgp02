/**
 * POST /api/avisos-privacidade/[id]/publish
 *
 * Congela `currentContent` como `publishedContent`, incrementa
 * `currentVersion` e cria 1 linha em `ServicePrivacyNoticeVersion`
 * (snapshot pra histórico + diff). Status vai pra PUBLICADO.
 *
 * Auth: DPO-only.
 *
 * Body opcional:
 *   { changeLog?: string }
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";

export async function POST(
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
  if (!user?.companyId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }
  if (!isDPO(user.role)) {
    return NextResponse.json({ error: "Apenas DPO" }, { status: 403 });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const changeLog =
    typeof body?.changeLog === "string" ? body.changeLog.slice(0, 500) : null;

  const notice = await prisma.servicePrivacyNotice.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      companyId: true,
      currentContent: true,
      currentVersion: true,
    },
  });
  if (!notice || notice.companyId !== user.companyId) {
    return NextResponse.json({ error: "Aviso não encontrado" }, { status: 404 });
  }
  if (!notice.currentContent || !notice.currentContent.trim()) {
    return NextResponse.json(
      { error: "Aviso vazio — gere conteúdo antes de publicar." },
      { status: 422 },
    );
  }

  const nextVersion = notice.currentVersion + 1;
  const updated = await prisma.$transaction(async (tx) => {
    await tx.servicePrivacyNoticeVersion.create({
      data: {
        noticeId: notice.id,
        version: nextVersion,
        content: notice.currentContent,
        changeLog,
        publishedById: user.id,
      },
    });
    return tx.servicePrivacyNotice.update({
      where: { id: notice.id },
      data: {
        status: "PUBLICADO",
        publishedContent: notice.currentContent,
        currentVersion: nextVersion,
        publishedAt: new Date(),
        publishedById: user.id,
      },
      select: {
        id: true,
        slug: true,
        status: true,
        currentVersion: true,
        publishedAt: true,
      },
    });
  });

  return NextResponse.json({ notice: updated });
}
