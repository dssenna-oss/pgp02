/**
 * POST /api/inventario/sugerir-da-carta/classificar
 *
 * Etapa 2 do fluxo 2-cliques: recebe o corpus já coletado (Etapa 1)
 * e roda o LLM pra classificar serviços + anotar "Já mapeado".
 *
 * Por que separado? Vercel Hobby corta em 60s. Quando juntava
 * coleta + classificação numa única chamada, Cartas pesadas
 * estouravam. Separado, cada etapa cabe em ~25s.
 *
 * Auth: DPO-only.
 *
 * Body:
 *   {
 *     corpus: string,        // texto bruto da Etapa 1
 *     sourceLabel: string,   // identificador (URL ou "pdf:filename")
 *   }
 *
 * Response 200:
 *   {
 *     services: Array<SuggestedService & { alreadyMapped? }>,
 *     stats: SuggestionStats,
 *     blockingError: string | null,
 *     warnings: string[],
 *     source: string
 *   }
 */

export const dynamic = "force-dynamic";
// 180s: folga confortável após upgrade Vercel Pro (teto: 300s).
// Gemini com 16k tokens leva ~25-35s; 180s deixa margem pra
// instâncias frias e Cartas extensas.
export const maxDuration = 180;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import {
  classifyCorpus,
  annotateAlreadyMapped,
} from "@/lib/sugestao-carta";

const MAX_CORPUS_BYTES = 200_000; // 200KB — segurança contra abuso

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

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }
    const corpus = typeof body?.corpus === "string" ? body.corpus : "";
    const sourceLabel =
      typeof body?.sourceLabel === "string" ? body.sourceLabel : "fonte fornecida";

    if (!corpus || corpus.trim().length < 200) {
      return NextResponse.json(
        {
          error:
            "Corpus muito curto ou vazio. Rode a Etapa 1 (Coletar conteúdo) antes.",
        },
        { status: 400 },
      );
    }
    if (corpus.length > MAX_CORPUS_BYTES) {
      return NextResponse.json(
        {
          error: `Corpus muito grande (${corpus.length} chars). Máximo: ${MAX_CORPUS_BYTES}.`,
        },
        { status: 413 },
      );
    }

    const result = await classifyCorpus(corpus, sourceLabel);

    if (result.services.length > 0) {
      const existing = await prisma.dataInventory.findMany({
        where: { companyId: user.companyId },
        select: { id: true, serviceName: true, updatedAt: true },
      });
      const annotated = annotateAlreadyMapped(
        result.services,
        existing
          .filter(
            (e): e is { id: string; serviceName: string; updatedAt: Date } =>
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
        source: sourceLabel,
      });
    }
    return NextResponse.json({ ...result, source: sourceLabel });
  } catch (e: any) {
    console.error("[sugerir-da-carta/classificar] erro inesperado", e);
    return NextResponse.json(
      { error: e?.message ?? "Erro inesperado no servidor" },
      { status: 500 },
    );
  }
}
