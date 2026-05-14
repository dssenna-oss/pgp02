export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadPolicyAuth,
  policyToDTO,
  slugify,
  VALID_POLICY_STATUSES,
} from "@/lib/policies-helpers";
import { trackLastAction, statusToCompleteness, statusIsClosedCleanly } from "@/lib/track-last-action";

/**
 * GET    /api/politicas/[id]    → carrega política + lista de versões
 * PATCH  /api/politicas/[id]    → edita rascunho (currentContent, title, slug, status)
 * DELETE /api/politicas/[id]    → exclui (DPO-only)
 *
 * "Publicar" tem rota separada: POST /api/politicas/[id]/publish
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const r = await loadPolicyAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  const { id } = await params;

  const [p, company] = await Promise.all([
    prisma.policy.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        publishedBy: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { versions: true } },
        versions: {
          orderBy: { version: "desc" },
          select: {
            id: true,
            version: true,
            changeLog: true,
            publishedAt: true,
            publishedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    }),
    prisma.company.findUnique({
      where: { id: user.companyId },
      select: { slug: true },
    }),
  ]);

  if (!p) {
    return NextResponse.json({ error: "Política não encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    policy: policyToDTO(p, company?.slug ?? null),
    versions: p.versions.map((v) => ({
      id: v.id,
      version: v.version,
      changeLog: v.changeLog,
      publishedAt: v.publishedAt.toISOString(),
      publishedBy: v.publishedBy,
    })),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const r = await loadPolicyAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  const { id } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const existing = await prisma.policy.findFirst({
    where: { id, companyId: user.companyId },
    select: { id: true, type: true, slug: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Política não encontrada" }, { status: 404 });
  }

  const data: any = {};

  if (body.title !== undefined) {
    const t = String(body.title).trim();
    if (!t) {
      return NextResponse.json({ error: "Título não pode ficar vazio" }, { status: 400 });
    }
    data.title = t.slice(0, 200);
  }

  if (body.slug !== undefined) {
    const newSlug = slugify(String(body.slug));
    if (!newSlug) {
      return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
    }
    if (newSlug !== existing.slug) {
      const taken = await prisma.policy.findFirst({
        where: {
          companyId: user.companyId,
          type: existing.type,
          slug: newSlug,
          NOT: { id: existing.id },
        },
        select: { id: true },
      });
      if (taken) {
        return NextResponse.json(
          { error: "Já existe outra política com esse slug" },
          { status: 409 },
        );
      }
      data.slug = newSlug;
    }
  }

  if (body.currentContent !== undefined) {
    data.currentContent = String(body.currentContent);
  }

  if (body.status !== undefined) {
    if (!VALID_POLICY_STATUSES.has(body.status)) {
      return NextResponse.json({ error: `Status inválido: ${body.status}` }, { status: 400 });
    }
    // Status só pode ir RASCUNHO ↔ ARQUIVADA por aqui. PUBLICADA usa /publish.
    if (body.status === "PUBLICADA") {
      return NextResponse.json(
        { error: "Use POST /api/politicas/[id]/publish pra publicar" },
        { status: 400 },
      );
    }
    data.status = body.status;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido pra atualizar" }, { status: 400 });
  }

  const updated = await prisma.policy.update({
    where: { id },
    data,
    include: {
      publishedBy: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { versions: true } },
    },
  });

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { slug: true },
  });

  // CP27 Fatia 3 — registra "Continue de onde parou"
  await trackLastAction({
    userId: user.id,
    refType: "POLITICA",
    refId: updated.id,
    route: `/dashboard/politicas/${updated.id}`,
    label: `Política "${updated.title}"`,
    completeness: statusToCompleteness(updated.status, "POLITICA"),
    closedCleanly: statusIsClosedCleanly(updated.status, "POLITICA"),
  });

  return NextResponse.json({ policy: policyToDTO(updated, company?.slug ?? null) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const r = await loadPolicyAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  const { id } = await params;

  const existing = await prisma.policy.findFirst({
    where: { id, companyId: user.companyId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Política não encontrada" }, { status: 404 });
  }
  await prisma.policy.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
