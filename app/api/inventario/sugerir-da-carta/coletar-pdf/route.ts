/**
 * POST /api/inventario/sugerir-da-carta/coletar-pdf
 *
 * Etapa 1 do fluxo 2-cliques (variante PDF): extrai texto do PDF
 * via pdfjs-dist + envelopa em CollectionResult. NÃO chama o LLM.
 *
 * Auth: DPO-only.
 *
 * Body: multipart/form-data
 *   - file: PDF (max 10MB)
 *
 * Response 200: CollectionResult
 */

export const dynamic = "force-dynamic";
// 180s: folga confortável após upgrade Vercel Pro (teto: 300s).
export const maxDuration = 180;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import { buildCollectionFromPdf } from "@/lib/sugestao-carta";
import { extractPdfText } from "@/lib/pdf-text";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, companyId: true },
    });
    if (!user?.companyId) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 },
      );
    }
    if (!isDPO(user.role)) {
      return NextResponse.json({ error: "Apenas DPO" }, { status: 403 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          error: "Form data inválido. Envie multipart/form-data com campo `file`.",
        },
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
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json(
        { error: "Apenas PDFs (.pdf) são aceitos." },
        { status: 400 },
      );
    }

    let pdfResult;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      pdfResult = await extractPdfText(buffer, { maxPages: 50 });
    } catch (e: any) {
      console.error("[coletar-pdf] erro ao ler PDF", e);
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
            "O PDF não tem camada de texto pesquisável (provavelmente foi escaneado como imagem). Reenvie uma versão com texto pesquisável.",
        },
        { status: 400 },
      );
    }

    const collection = buildCollectionFromPdf(
      pdfResult.text,
      file.name || "carta-de-servicos.pdf",
      pdfResult.pagesRead,
      pdfResult.totalPages,
    );
    return NextResponse.json(collection);
  } catch (e: any) {
    console.error("[sugerir-da-carta/coletar-pdf] erro inesperado", e);
    return NextResponse.json(
      { error: e?.message ?? "Erro inesperado no servidor" },
      { status: 500 },
    );
  }
}
