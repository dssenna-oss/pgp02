/**
 * POST /api/inventario/sugerir-da-carta/from-pdf
 *
 * Variante da rota /sugerir-da-carta que aceita um PDF da Carta de Serviços
 * (multipart/form-data com campo `file`) em vez de domínio público.
 *
 * Útil quando:
 *  - A Carta de Serviços é publicada como PDF (comum em tribunais,
 *    autarquias, secretarias)
 *  - O domínio público é bloqueado por WAF/Cloudflare e Firecrawl falha
 *  - O user prefere mandar o documento oficial direto, sem depender do
 *    site institucional ter a Carta indexada
 *
 * Pipeline:
 *  1. Lê o PDF (max 10MB) → extrai texto via pdfjs-dist (max 50 páginas)
 *  2. Manda corpus pro Gemini (mesmo prompt da rota /sugerir-da-carta)
 *  3. Sanitiza + dedup + anota "Já mapeado" contra Inventários da org
 *
 * Auth: DPO-only.
 *
 * Body: multipart/form-data
 *   - file: File (application/pdf, max 10MB)
 *
 * Response 200:
 *   { services, stats, blockingError, warnings, source: "pdf:<filename>" }
 *
 * Errors:
 *   400 — sem arquivo / formato inválido / PDF escaneado sem texto
 *   401 — não autenticado
 *   403 — não-DPO
 *   413 — arquivo > 10MB
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import {
  suggestServicesFromText,
  annotateAlreadyMapped,
} from "@/lib/sugestao-carta";
import { extractPdfText } from "@/lib/pdf-text";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
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
    return NextResponse.json(
      { error: "Apenas DPO pode usar a sugestão da Carta de Serviços" },
      { status: 403 },
    );
  }

  // Parse multipart
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Form data inválido. Envie multipart/form-data com campo `file`." },
      { status: 400 },
    );
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Campo `file` ausente ou não é um arquivo." },
      { status: 400 },
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Arquivo vazio." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error: `Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). Máximo: 10MB.`,
      },
      { status: 413 },
    );
  }
  // Validação de tipo — aceita por extensão também (alguns browsers
  // mandam application/octet-stream)
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json(
      { error: "Apenas PDFs (.pdf) são aceitos." },
      { status: 400 },
    );
  }

  // Extrai texto
  let pdfResult;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    pdfResult = await extractPdfText(buffer, { maxPages: 50 });
  } catch (e: any) {
    console.error("[sugerir-da-carta/from-pdf] erro ao ler PDF", e);
    return NextResponse.json(
      {
        error:
          "Não consegui ler este PDF. Pode estar corrompido ou protegido por senha.",
      },
      { status: 400 },
    );
  }

  if (pdfResult.noText) {
    return NextResponse.json(
      {
        error:
          "O PDF não tem camada de texto pesquisável (provavelmente foi escaneado como imagem). Reenvie uma versão com texto, ou use a opção de domínio.",
      },
      { status: 400 },
    );
  }

  // Roda LLM
  const sourceLabel = file.name || "carta-de-servicos.pdf";
  const result = await suggestServicesFromText(pdfResult.text, sourceLabel);

  // Anota "Já mapeado"
  if (result.services.length > 0) {
    const existing = await prisma.dataInventory.findMany({
      where: { companyId: user.companyId },
      select: { id: true, serviceName: true, updatedAt: true },
    });
    const annotated = annotateAlreadyMapped(
      result.services,
      existing
        .filter((e): e is { id: string; serviceName: string; updatedAt: Date } =>
          typeof e.serviceName === "string" && e.serviceName.length > 0,
        )
        .map((e) => ({
          id: e.id,
          name: e.serviceName,
          updatedAt: e.updatedAt.toISOString(),
        })),
    );
    return NextResponse.json({
      ...result,
      services: annotated,
      source: `pdf:${sourceLabel}`,
      pdfPagesRead: pdfResult.pagesRead,
      pdfTotalPages: pdfResult.totalPages,
    });
  }

  return NextResponse.json({
    ...result,
    source: `pdf:${sourceLabel}`,
    pdfPagesRead: pdfResult.pagesRead,
    pdfTotalPages: pdfResult.totalPages,
  });
}
