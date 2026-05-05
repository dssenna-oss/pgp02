export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { loadOperatorAuth, canEditOperator } from "@/lib/operadores-helpers";
import { uploadFile } from "@/lib/s3";
import { extractContractData } from "@/lib/pdf-contract-extractor";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/operadores/extract-pdf  (multipart/form-data)
 *
 * Recebe um PDF de contrato vigente, salva no Vercel Blob e devolve
 * preview com dados extraídos via regex (Checkpoint 14 H1 / D2).
 *
 * Não cria o Operator nesta rota — devolve preview pra DPO confirmar
 * antes. UI faz o create normal via POST /api/operadores com os dados
 * editados + `linkInventoryId` opcional + URL do blob nos
 * `contractAttachments` (PATCH posterior).
 *
 * Apenas DPO. Body: form-data com campo `file` (PDF).
 *
 * Resposta:
 *   {
 *     blob: { url, size, name },
 *     extraction: ContractExtraction
 *   }
 */
export async function POST(request: NextRequest) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  if (!canEditOperator(user)) {
    return NextResponse.json(
      { error: "Apenas DPO pode importar contratos" },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Envie como multipart/form-data" },
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

  const mimeType = file.type || "application/pdf";
  if (mimeType !== "application/pdf") {
    return NextResponse.json(
      { error: "Apenas PDFs são aceitos nesta importação" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 1) Extrair texto + metadados via regex (NÃO usa LLM — pesquisável only)
  let extraction;
  try {
    extraction = await extractContractData(buffer);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: `Falha ao processar PDF: ${err?.message ?? "erro desconhecido"}`,
      },
      { status: 500 }
    );
  }

  if (extraction.noText) {
    return NextResponse.json(
      {
        error:
          "Este PDF não tem camada de texto extraível (provavelmente escaneado sem OCR). Faça OCR antes ou cadastre o operador manualmente e anexe o PDF como evidência.",
      },
      { status: 422 }
    );
  }

  // 2) Subir o PDF pro Vercel Blob (será anexado depois quando DPO confirmar)
  const originalName = file.name || "contrato.pdf";
  const safeName = originalName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._\- ]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);
  const finalName = `op-import-${user.companyId}-${Date.now()}-${safeName}`;
  const url = await uploadFile(buffer, finalName, mimeType);

  return NextResponse.json({
    blob: {
      url,
      size: file.size,
      name: originalName,
      uploadedAt: new Date().toISOString(),
    },
    extraction,
  });
}
