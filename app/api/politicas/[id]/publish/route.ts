export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadPolicyAuth,
  policyToDTO,
} from "@/lib/policies-helpers";

/**
 * POST /api/politicas/[id]/publish
 *
 * Publica uma nova versão da política. Operação:
 *   1. Valida que existe `currentContent` não vazio
 *   2. Increment `currentVersion`
 *   3. Cria PolicyVersion (snapshot do currentContent)
 *   4. Atualiza Policy.publishedContent = currentContent
 *   5. Marca status = PUBLICADA + publishedAt + publishedById
 *
 * Idempotente do ponto de vista do conteúdo (publicar 2x sem editar
 * cria 2 versões idênticas, mas com timestamps diferentes — útil pra
 * auditoria de "revisão sem mudança"). Evita publish vazio.
 *
 * Body opcional:
 *   - changeLog: string (descrição do que mudou nessa versão)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const r = await loadPolicyAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  const { id } = await params;

  const policy = await prisma.policy.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!policy) {
    return NextResponse.json({ error: "Política não encontrada" }, { status: 404 });
  }

  if (!policy.currentContent || !policy.currentContent.trim()) {
    return NextResponse.json(
      { error: "Conteúdo do rascunho está vazio. Edite antes de publicar." },
      { status: 400 },
    );
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // body opcional
  }
  const changeLog = body.changeLog ? String(body.changeLog).slice(0, 500) : null;

  const newVersion = policy.currentVersion + 1;

  // Transação: cria PolicyVersion + atualiza Policy
  const updated = await prisma.$transaction(async (tx) => {
    await tx.policyVersion.create({
      data: {
        policyId: policy.id,
        version: newVersion,
        content: policy.currentContent,
        changeLog,
        publishedById: user.id,
      },
    });
    return tx.policy.update({
      where: { id: policy.id },
      data: {
        status: "PUBLICADA",
        publishedContent: policy.currentContent,
        currentVersion: newVersion,
        publishedAt: new Date(),
        publishedById: user.id,
      },
      include: {
        publishedBy: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { versions: true } },
      },
    });
  });

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { slug: true },
  });

  return NextResponse.json({
    policy: policyToDTO(updated, company?.slug ?? null),
    publishedVersion: newVersion,
  });
}
