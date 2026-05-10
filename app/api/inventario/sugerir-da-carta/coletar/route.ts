/**
 * POST /api/inventario/sugerir-da-carta/coletar
 *
 * Etapa 1 do fluxo 2-cliques: scrape Firecrawl + concat markdown.
 * NÃO chama o LLM. Devolve o corpus pra UI mostrar ao user antes de
 * proceder pra Etapa 2 (/classificar).
 *
 * Por que 2 etapas? Vercel Hobby corta serverless functions em 60s.
 * Pipeline antiga (1-shot) tinha mapSite + scrape + LLM tudo numa
 * chamada — Cartas pesadas estouravam o limite. Agora cada etapa
 * cabe folgada em ~25-30s.
 *
 * Auth: DPO-only.
 *
 * Body:
 *   { url: string }
 *
 * Response 200: CollectionResult
 *   {
 *     corpus: string,       // texto bruto a mandar pra Etapa 2
 *     sourceLabel: string,
 *     pagesRead: number,
 *     urlsRead: string[],
 *     charCount: number,
 *     blockingError: string | null,
 *     warnings: string[]
 *   }
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import { collectFromUrl } from "@/lib/sugestao-carta";

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

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
      return NextResponse.json(
        { error: "Apenas DPO pode coletar conteúdo da Carta" },
        { status: 403 },
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
    if (!rawUrl) {
      return NextResponse.json(
        { error: "Forneça a URL pública da Carta de Serviços." },
        { status: 400 },
      );
    }
    if (!isValidHttpUrl(rawUrl)) {
      return NextResponse.json(
        {
          error:
            "URL inválida. Use um endereço completo com http:// ou https://",
        },
        { status: 400 },
      );
    }

    const result = await collectFromUrl(rawUrl);
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("[sugerir-da-carta/coletar] erro inesperado", e);
    return NextResponse.json(
      { error: e?.message ?? "Erro inesperado no servidor" },
      { status: 500 },
    );
  }
}
