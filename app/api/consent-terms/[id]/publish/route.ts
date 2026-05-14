/**
 * POST /api/consent-terms/[id]/publish
 *
 * Congela `currentContent` como `publishedContent`, incrementa versão e
 * cria 1 linha em ConsentTermVersion (snapshot pra rastreabilidade).
 * Status vira PUBLICADO. URL pública passa a renderizar este conteúdo.
 *
 * Auth: DPO-only.
 *
 * Body opcional: { changeLog?: string }
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

  const term = await prisma.consentTerm.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      companyId: true,
      currentContent: true,
      currentVersion: true,
      status: true,
    },
  });
  if (!term || term.companyId !== user.companyId) {
    return NextResponse.json({ error: "Termo não encontrado" }, { status: 404 });
  }
  if (term.status === "ARQUIVADO") {
    return NextResponse.json(
      { error: "Termo arquivado — não pode publicar nova versão" },
      { status: 422 },
    );
  }
  if (!term.currentContent?.trim()) {
    return NextResponse.json(
      { error: "Conteúdo vazio — escreva o termo antes de publicar" },
      { status: 422 },
    );
  }

  const nextVersion = term.currentVersion + 1;
  const updated = await prisma.$transaction(async (tx) => {
    await tx.consentTermVersion.create({
      data: {
        termId: term.id,
        version: nextVersion,
        content: term.currentContent,
        changeLog,
        publishedById: user.id,
      },
    });
    return tx.consentTerm.update({
      where: { id: term.id },
      data: {
        status: "PUBLICADO",
        publishedContent: term.currentContent,
        currentVersion: nextVersion,
        publishedAt: new Date(),
        publishedById: user.id,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        currentVersion: true,
        publishedAt: true,
      },
    });
  });

  return NextResponse.json({ term: updated });
}
