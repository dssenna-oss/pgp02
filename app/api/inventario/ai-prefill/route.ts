/**
 * POST /api/inventario/ai-prefill
 *
 * Pré-preenchimento do formulário de Inventário a partir de URLs públicas
 * (Fatia "b" — 2026-05-11). Recebe respostas atuais + lista de URLs,
 * faz scrape via Firecrawl, manda pro Gemini com o schema do form como
 * contrato, e retorna `formAnswers` mesclado + resumo.
 *
 * Não persiste nada — quem persiste é o wizard via PUT /api/inventario/[id]
 * depois que o user revisa o resultado.
 *
 * Auth: qualquer user autenticado (DPO ou Contribuidor).
 *
 * Body:
 *   {
 *     formAnswers: FormAnswers,
 *     urls: string[]            // 1 a 5 URLs http(s)
 *   }
 *
 * Response 200:
 *   {
 *     next: FormAnswers,
 *     summary: {
 *       urlsOk: string[],
 *       urlsErr: { url, error }[],
 *       applied: string[],      // ["sec2.process_name", ...]
 *       rejected: string[],     // descartados pelo sanitizer
 *       summary: string         // texto pra mostrar pro user
 *     }
 *   }
 *
 * Errors:
 *   400 — body inválido / nenhuma URL / URL malformada
 *   401 — não autenticado
 *   500 — erro no LLM ou no Firecrawl (raro — pipeline já trata erros parciais)
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60; // scrape + llm pode chegar perto

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { aiPrefillFromUrls } from "@/lib/inventario-ai-prefill";
import type { FormAnswers } from "@/lib/inventario-form-schema";

const MAX_URLS = 5;

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const formAnswers = (body?.formAnswers ?? {}) as FormAnswers;
  const rawUrls = body?.urls;
  if (!Array.isArray(rawUrls) || rawUrls.length === 0) {
    return NextResponse.json(
      { error: "Forneça pelo menos 1 URL em `urls` (array)." },
      { status: 400 },
    );
  }
  if (rawUrls.length > MAX_URLS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_URLS} URLs por requisição.` },
      { status: 400 },
    );
  }

  // Limpa, deduplica e valida
  const urls = Array.from(
    new Set(
      rawUrls
        .map((u) => (typeof u === "string" ? u.trim() : ""))
        .filter((u) => u.length > 0),
    ),
  );

  const invalid = urls.filter((u) => !isValidHttpUrl(u));
  if (invalid.length > 0) {
    return NextResponse.json(
      {
        error: `URLs inválidas: ${invalid.join(", ")}. Use endereços completos começando com http(s)://`,
      },
      { status: 400 },
    );
  }

  try {
    const result = await aiPrefillFromUrls(formAnswers, urls);
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("[ai-prefill] erro inesperado", e);
    return NextResponse.json(
      { error: e?.message ?? "Erro inesperado no pré-preenchimento" },
      { status: 500 },
    );
  }
}
