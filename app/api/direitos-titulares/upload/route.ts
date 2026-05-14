/**
 * Upload público de anexos do formulário de Direitos do Titular.
 *
 * POST /api/direitos-titulares/upload
 *   FormData: file (File), companyId (string), kind ("identity" | "representation" | "additional")
 *
 * Sem autenticação (titular não tem login). Mitiga abuso com:
 *   - Validação de companyId real
 *   - Limite de tamanho (10MB)
 *   - Limite de tipos MIME (PDF + imagens comuns)
 *   - Pathname com prefixo dsr/<companyId>/<timestamp>
 */

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const ALLOWED_KINDS = ["identity", "representation", "additional"] as const;
type Kind = (typeof ALLOWED_KINDS)[number];

function safeFilename(name: string): string {
  // Remove caracteres perigosos e mantém extensão
  const cleaned = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // remove diacríticos
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);
  return cleaned || "file";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const companyId = String(formData.get("companyId") || "").trim();
    const kindRaw = String(formData.get("kind") || "additional").trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Arquivo é obrigatório" },
        { status: 400 },
      );
    }
    if (!companyId) {
      return NextResponse.json(
        { error: "companyId é obrigatório" },
        { status: 400 },
      );
    }
    if (!ALLOWED_KINDS.includes(kindRaw as Kind)) {
      return NextResponse.json(
        { error: "kind inválido" },
        { status: 400 },
      );
    }
    const kind = kindRaw as Kind;

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Arquivo excede o limite de ${MAX_BYTES / 1024 / 1024}MB` },
        { status: 413 },
      );
    }
    if (!ALLOWED_MIMES.has(file.type)) {
      return NextResponse.json(
        {
          error:
            "Tipo de arquivo não suportado. Aceitos: PDF, JPG, PNG, WEBP.",
        },
        { status: 415 },
      );
    }

    // Confirma empresa real (anti-spam)
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = safeFilename(file.name);
    const pathname = `dsr/${companyId}/${kind}/${Date.now()}-${fileName}`;

    const result = await put(pathname, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: true, // evita colisão exata mesmo com timestamp igual
    });

    return NextResponse.json({
      ok: true,
      url: result.url,
      pathname: result.pathname,
      size: file.size,
      name: file.name,
      type: file.type,
    });
  } catch (error) {
    console.error("Erro no upload de anexo DSR:", error);
    return NextResponse.json(
      { error: "Erro ao subir o arquivo" },
      { status: 500 },
    );
  }
}
