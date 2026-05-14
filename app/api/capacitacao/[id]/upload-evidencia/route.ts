export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import {
  loadCapacitacaoAuth,
  canManageCapacitacao,
  toCapacitacaoDTO,
  CAPACITACAO_FULL_INCLUDE,
} from "@/lib/capacitacao-helpers";
import { deleteFile } from "@/lib/s3";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

/**
 * POST /api/capacitacao/[id]/upload-evidencia
 * Upload de arquivo (PDF, imagem ou vídeo) como evidência do evento.
 * DPO-only. Substitui evidência anterior (se houver).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const r = await loadCapacitacaoAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  if (!canManageCapacitacao(user.role)) {
    return NextResponse.json(
      { error: "Apenas DPOs podem anexar evidências" },
      { status: 403 },
    );
  }
  const { id } = await params;

  const existing = await prisma.capacitacaoEvento.findFirst({
    where: { id, companyId: user.companyId },
    select: { id: true, evidenceUrl: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Arquivo excede ${MAX_BYTES / 1024 / 1024} MB` },
      { status: 413 },
    );
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      {
        error: `Tipo MIME não permitido: ${file.type}. Aceito: PDF, JPG, PNG, WebP, GIF, MP4, WebM`,
      },
      { status: 415 },
    );
  }

  // Sanitizar nome do arquivo pra usar no path
  const safeName = file.name
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 100);
  const pathname = `pgp/capacitacao/${user.companyId}/${id}-${Date.now()}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await put(pathname, buffer, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: false,
  });

  // Se já tinha evidência anterior, apaga (best-effort)
  if (existing.evidenceUrl) {
    try {
      await deleteFile(existing.evidenceUrl);
    } catch {
      // silencioso
    }
  }

  const updated = await prisma.capacitacaoEvento.update({
    where: { id },
    data: {
      evidenceUrl: result.url,
      evidenceFileName: file.name,
    },
    include: CAPACITACAO_FULL_INCLUDE,
  });

  return NextResponse.json(toCapacitacaoDTO(updated));
}

/**
 * DELETE /api/capacitacao/[id]/upload-evidencia
 * Remove apenas a evidência (não o evento).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const r = await loadCapacitacaoAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  if (!canManageCapacitacao(user.role)) {
    return NextResponse.json(
      { error: "Apenas DPOs podem remover evidências" },
      { status: 403 },
    );
  }
  const { id } = await params;

  const existing = await prisma.capacitacaoEvento.findFirst({
    where: { id, companyId: user.companyId },
    select: { id: true, evidenceUrl: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  if (existing.evidenceUrl) {
    try {
      await deleteFile(existing.evidenceUrl);
    } catch {
      // silencioso
    }
  }

  const updated = await prisma.capacitacaoEvento.update({
    where: { id },
    data: { evidenceUrl: null, evidenceFileName: null },
    include: CAPACITACAO_FULL_INCLUDE,
  });

  return NextResponse.json(toCapacitacaoDTO(updated));
}
