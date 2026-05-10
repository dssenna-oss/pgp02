/**
 * POST /api/inventario/sugerir-da-carta
 *
 * Recebe a URL pública DA Carta de Serviços (não o domínio da
 * instituição) e devolve uma lista de serviços extraídos com
 * classificação SUGERIDO/TALVEZ/NAO pra o user revisar e materializar
 * como Inventário em rascunho.
 *
 * A versão antiga aceitava `domain` e usava Firecrawl /v1/map +
 * heurística de palavras-chave pra descobrir URLs candidatas. Era
 * custoso (até 9 unidades Firecrawl) e errático (sites com URLs
 * fora dos padrões keywords escapavam). Agora aceita 1 URL direta.
 *
 * Pra Cartas publicadas só em PDF, use a rota irmã /from-pdf.
 *
 * Auth: DPO-only.
 *
 * Body:
 *   { url: string }   // URL pública da Carta (http/https)
 *
 * Response 200:
 *   {
 *     services: Array<SuggestedService & { alreadyMapped? }>,
 *     stats: {...},
 *     blockingError: string | null,
 *     warnings: string[],
 *     source: string
 *   }
 *
 * Errors:
 *   400 — URL inválida / ausente
 *   401 — não autenticado
 *   403 — não-DPO
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import {
  suggestServicesFromUrl,
  annotateAlreadyMapped,
} from "@/lib/sugestao-carta";

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
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }
  if (!isDPO(user.role)) {
    return NextResponse.json(
      { error: "Apenas DPO pode usar a sugestão da Carta de Serviços" },
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
      { error: "URL inválida. Use um endereço completo com http:// ou https://" },
      { status: 400 },
    );
  }

  // Pipeline (scrape Firecrawl + LLM)
  const result = await suggestServicesFromUrl(rawUrl);

  // Anota "Já mapeado" comparando nomes contra Inventários da org
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
    return NextResponse.json({ ...result, services: annotated, source: rawUrl });
  }

  return NextResponse.json({ ...result, source: rawUrl });
  } catch (e: any) {
    // Garantia de JSON sempre — runtime Vercel pode retornar HTML em
    // crashes nativos. Aqui interceptamos qualquer throw e devolvemos
    // erro estruturado pra UI exibir mensagem útil.
    console.error("[sugerir-da-carta] erro inesperado", e);
    return NextResponse.json(
      { error: e?.message ?? "Erro inesperado no servidor" },
      { status: 500 },
    );
  }
}
