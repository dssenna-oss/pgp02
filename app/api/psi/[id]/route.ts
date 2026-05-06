export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadPsiAuth,
  psiToDTO,
  canEditPsi,
  canDeletePsi,
  canArchivePsi,
  psiAccessFilter,
  PSI_FULL_INCLUDE,
  type PsiData,
} from "@/lib/psi-helpers";

const SECTIONS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"] as const;

/**
 * GET /api/psi/[id]
 *
 * Devolve a PSI completa. Filtro de visibilidade:
 *   - DPO: qualquer PSI da empresa
 *   - Contribuidor: apenas as próprias
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadPsiAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const psi = await prisma.psi.findFirst({
    where: { id: params.id, ...psiAccessFilter(user) },
    include: PSI_FULL_INCLUDE,
  });
  if (!psi) {
    return NextResponse.json({ error: "PSI não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ psi: psiToDTO(psi) });
}

/**
 * PATCH /api/psi/[id]
 *
 * Atualiza campos editáveis: title, data (PsiData), status (apenas
 * pra ARQUIVAR — APROVADO → ARQUIVADO; outras transições passam por
 * /submit, /approve, /reject).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadPsiAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const psi = await prisma.psi.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true, status: true, createdById: true },
  });
  if (!psi) {
    return NextResponse.json({ error: "PSI não encontrada" }, { status: 404 });
  }
  if (!user.isDPO && psi.createdById !== user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  // Arquivamento (DPO em APROVADO)
  if (body.status === "ARQUIVADO") {
    if (!canArchivePsi(user, psi)) {
      return NextResponse.json(
        { error: "Apenas DPO pode arquivar PSI aprovada" },
        { status: 403 }
      );
    }
    updates.status = "ARQUIVADO";
  } else {
    if (!canEditPsi(user, psi)) {
      return NextResponse.json(
        {
          error:
            "Não pode editar esta PSI no status atual. Arquivadas são imutáveis; rascunhos só pelo criador ou DPO.",
        },
        { status: 403 }
      );
    }
    if (typeof body.title === "string") {
      const t = body.title.trim();
      if (!t) {
        return NextResponse.json(
          { error: "Título não pode ficar vazio" },
          { status: 400 }
        );
      }
      updates.title = t.slice(0, 200);
    }
    if (body.data && typeof body.data === "object") {
      const d = body.data as Partial<PsiData>;
      if (d.v !== 1) {
        return NextResponse.json(
          { error: "Versão de schema do data inválida (esperado v=1)" },
          { status: 400 }
        );
      }
      for (const k of SECTIONS) {
        if (!(k in d)) {
          return NextResponse.json(
            { error: `Seção ${k} ausente no data` },
            { status: 400 }
          );
        }
      }
      if (!("header" in d)) {
        return NextResponse.json(
          { error: "Cabeçalho (header) ausente no data" },
          { status: 400 }
        );
      }
      updates.data = body.data;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada pra atualizar" }, { status: 400 });
  }

  const updated = await prisma.psi.update({
    where: { id: params.id },
    data: updates,
    include: PSI_FULL_INCLUDE,
  });

  return NextResponse.json({ psi: psiToDTO(updated) });
}

/**
 * DELETE /api/psi/[id]
 *
 * Exclui a PSI (cascade remove PsiVersion).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadPsiAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const psi = await prisma.psi.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true, status: true, createdById: true },
  });
  if (!psi) {
    return NextResponse.json({ error: "PSI não encontrada" }, { status: 404 });
  }

  if (!canDeletePsi(user, psi)) {
    return NextResponse.json(
      { error: "Sem permissão pra excluir esta PSI" },
      { status: 403 }
    );
  }

  await prisma.psi.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
