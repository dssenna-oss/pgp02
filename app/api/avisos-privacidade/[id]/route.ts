/**
 * GET    /api/avisos-privacidade/[id]  — detalhe (incluindo Inventário fonte)
 * PATCH  /api/avisos-privacidade/[id]  — edita currentContent / includedSections / additionalNotes
 * DELETE /api/avisos-privacidade/[id]  — arquiva (status=ARQUIVADO; URL pública para)
 *
 * Auth: DPO-only.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import { normalizeIncludedSections, type IncludedSections } from "@/lib/aviso-privacidade-sections";

async function getDPOAndNotice(noticeId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: "Não autenticado", status: 401 } as const;
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, companyId: true },
  });
  if (!user?.companyId) {
    return { error: "Empresa não encontrada", status: 404 } as const;
  }
  if (!isDPO(user.role)) {
    return { error: "Apenas DPO", status: 403 } as const;
  }
  const notice = await prisma.servicePrivacyNotice.findUnique({
    where: { id: noticeId },
    select: { id: true, companyId: true },
  });
  if (!notice || notice.companyId !== user.companyId) {
    return { error: "Aviso não encontrado", status: 404 } as const;
  }
  return { user, noticeId: notice.id } as const;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await getDPOAndNotice(params.id);
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const notice = await prisma.servicePrivacyNotice.findUnique({
    where: { id: guard.noticeId },
    include: {
      dataInventory: {
        select: {
          id: true,
          serviceName: true,
          status: true,
          updatedAt: true,
          setor: true,
        },
      },
      company: { select: { slug: true, companyName: true } },
    },
  });
  if (!notice) {
    return NextResponse.json({ error: "Aviso não encontrado" }, { status: 404 });
  }
  const outdated = notice.lastSyncedFromInventoryAt < notice.dataInventory.updatedAt;
  return NextResponse.json({ notice: { ...notice, outdated } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await getDPOAndNotice(params.id);
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const update: any = {};
  if (typeof body?.currentContent === "string") {
    update.currentContent = body.currentContent;
  }
  if (body?.includedSections && typeof body.includedSections === "object") {
    update.includedSections = normalizeIncludedSections(
      body.includedSections as IncludedSections,
    );
  }
  if (typeof body?.additionalNotes === "string" || body?.additionalNotes === null) {
    update.additionalNotes = body.additionalNotes ?? null;
  }
  if (typeof body?.slug === "string" && body.slug.trim()) {
    update.slug = body.slug.trim().toLowerCase();
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada pra atualizar" }, { status: 400 });
  }

  try {
    const updated = await prisma.servicePrivacyNotice.update({
      where: { id: guard.noticeId },
      data: update,
      select: {
        id: true,
        slug: true,
        status: true,
        currentVersion: true,
        currentContent: true,
        includedSections: true,
        additionalNotes: true,
      },
    });
    return NextResponse.json({ notice: updated });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe outro Aviso com este slug nesta organização." },
        { status: 409 },
      );
    }
    throw e;
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await getDPOAndNotice(params.id);
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  await prisma.servicePrivacyNotice.update({
    where: { id: guard.noticeId },
    data: { status: "ARQUIVADO", publishedContent: null },
  });
  return NextResponse.json({ ok: true });
}
