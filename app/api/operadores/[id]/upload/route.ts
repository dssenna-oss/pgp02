export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadOperatorAuth, canEditOperator } from "@/lib/operadores-helpers";
import { uploadFile } from "@/lib/s3";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
]);

/**
 * POST /api/operadores/[id]/upload  (multipart/form-data)
 *
 * Faz upload de anexo (PDF, DOCX, imagem) pra Vercel Blob e devolve URL.
 *
 * Apenas DPO. A UI persiste a URL via PATCH no operador
 * (`contractAttachments` ou `confidentialityTermAttachment`).
 *
 * Form fields:
 *   - file: File (obrigatório)
 *   - kind: CONTRATO | DPA | EVIDENCIA | TERMO_CONFIDENCIALIDADE | OUTRO
 *           (apenas pra organização do filename)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  if (!canEditOperator(user)) {
    return NextResponse.json(
      { error: "Apenas DPO pode anexar arquivos" },
      { status: 403 }
    );
  }

  const op = await prisma.operator.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true, name: true },
  });
  if (!op) {
    return NextResponse.json(
      { error: "Operador não encontrado" },
      { status: 404 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Formato inválido — envie como multipart/form-data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Campo `file` obrigatório" },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Arquivo muito grande (máximo ${MAX_BYTES / 1024 / 1024} MB)` },
      { status: 400 }
    );
  }

  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_TYPES.has(mimeType)) {
    return NextResponse.json(
      {
        error: `Tipo não permitido (${mimeType}). Aceitos: PDF, DOCX, PNG, JPG.`,
      },
      { status: 400 }
    );
  }

  const kindRaw = String(formData.get("kind") ?? "OUTRO").toUpperCase();
  const validKinds = new Set([
    "CONTRATO",
    "DPA",
    "EVIDENCIA",
    "TERMO_CONFIDENCIALIDADE",
    "OUTRO",
  ]);
  const kind = validKinds.has(kindRaw) ? kindRaw : "OUTRO";

  // Filename safe
  const originalName = file.name || "anexo";
  const safeName = originalName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._\- ]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);
  const finalName = `op-${params.id}-${kind.toLowerCase()}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadFile(buffer, finalName, mimeType);

  return NextResponse.json({
    url,
    name: originalName,
    kind,
    uploadedAt: new Date().toISOString(),
    size: file.size,
    mimeType,
  });
}
