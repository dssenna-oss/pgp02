/**
 * GET    /api/consent-terms/[id]   — detalhe + links
 * PATCH  /api/consent-terms/[id]   — edita currentContent / title / slug / modos / links
 * DELETE /api/consent-terms/[id]   — arquiva (status=ARQUIVADO; URL pública para)
 *
 * Auth: DPO-only.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";

type GuardOK = {
  user: { id: string; companyId: string };
  termId: string;
};
type GuardErr = { error: string; status: number };

async function guard(noticeId: string): Promise<GuardOK | GuardErr> {
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
  const term = await prisma.consentTerm.findUnique({
    where: { id: noticeId },
    select: { id: true, companyId: true },
  });
  if (!term || term.companyId !== user.companyId) {
    return { error: "Termo não encontrado", status: 404 };
  }
  return {
    user: { id: user.id, companyId: user.companyId },
    termId: term.id,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const g = await guard(params.id);
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const term = await prisma.consentTerm.findUnique({
    where: { id: g.termId },
    include: {
      company: { select: { slug: true, companyName: true } },
      inventoryLinks: {
        include: {
          inventory: {
            select: { id: true, serviceName: true, status: true, setor: true },
          },
        },
      },
      _count: { select: { records: true } },
    },
  });
  if (!term) {
    return NextResponse.json({ error: "Termo não encontrado" }, { status: 404 });
  }
  return NextResponse.json({
    term: {
      ...term,
      acceptedCount: term._count.records,
      _count: undefined,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const g = await guard(params.id);
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

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
  if (typeof body?.title === "string" && body.title.trim()) {
    update.title = body.title.trim().slice(0, 200);
  }
  if (typeof body?.slug === "string" && body.slug.trim()) {
    update.slug = body.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }
  if (typeof body?.allowsPhysical === "boolean") {
    update.allowsPhysical = body.allowsPhysical;
  }
  if (typeof body?.allowsDigital === "boolean") {
    update.allowsDigital = body.allowsDigital;
  }
  // V1: garante ao menos um modo
  if (update.allowsPhysical === false || update.allowsDigital === false) {
    const cur = await prisma.consentTerm.findUnique({
      where: { id: g.termId },
      select: { allowsPhysical: true, allowsDigital: true },
    });
    const newPhys = update.allowsPhysical ?? cur?.allowsPhysical ?? true;
    const newDig = update.allowsDigital ?? cur?.allowsDigital ?? true;
    if (!newPhys && !newDig) {
      return NextResponse.json(
        { error: "Pelo menos um modo (físico ou digital) precisa estar ativo" },
        { status: 400 },
      );
    }
  }

  // Atualização atômica de links (M:N)
  const newLinks: string[] | undefined = Array.isArray(body?.linkedInventoryIds)
    ? body.linkedInventoryIds.filter((s: any) => typeof s === "string")
    : undefined;

  if (Object.keys(update).length === 0 && newLinks === undefined) {
    return NextResponse.json({ error: "Nada pra atualizar" }, { status: 400 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.consentTerm.update({
        where: { id: g.termId },
        data: update,
      });
      if (newLinks !== undefined) {
        // Valida que todos os ids pertencem à mesma org
        const validIds =
          newLinks.length > 0
            ? (
                await tx.dataInventory.findMany({
                  where: { id: { in: newLinks }, companyId: g.user.companyId },
                  select: { id: true },
                })
              ).map((x) => x.id)
            : [];
        // Wipe + re-create — simples e atômico
        await tx.consentTermInventoryLink.deleteMany({
          where: { termId: g.termId },
        });
        if (validIds.length > 0) {
          await tx.consentTermInventoryLink.createMany({
            data: validIds.map((id) => ({ termId: g.termId, inventoryId: id })),
          });
        }
      }
      return t;
    });
    return NextResponse.json({ term: updated });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Slug já em uso por outro termo nesta organização" },
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
  const g = await guard(params.id);
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  await prisma.consentTerm.update({
    where: { id: g.termId },
    data: { status: "ARQUIVADO", publishedContent: null },
  });
  return NextResponse.json({ ok: true });
}
