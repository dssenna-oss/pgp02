export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadOperatorAuth } from "@/lib/operadores-helpers";

/**
 * GET /api/operadores/suggestions
 *
 * Sugestão de cadastro de operadores a partir do Inventário (Checkpoint
 * 14 G4). Lista processos APROVADOS que têm `sharing` preenchido
 * (compartilham dados com terceiros) MAS ainda não têm nenhum
 * OperatorProcessLink — ou seja, o processo declara ter operadores mas
 * eles ainda não foram cadastrados na Gestão de Terceiros.
 *
 * Devolve { items: [{ inventoryId, serviceName, sharingText, suggestedNames }] }
 * onde `suggestedNames` é uma heurística simples de nomes extraídos do
 * texto livre (split por vírgula/ponto-e-vírgula/" e ", filtrando
 * nomes com 3+ caracteres).
 *
 * DPO + Contribuidor podem consumir, mas só DPO consegue criar via UI
 * (o componente já trata isso).
 */
export async function GET(_req: NextRequest) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  // Inventários aprovados COM sharing preenchido
  const inventories = await prisma.dataInventory.findMany({
    where: {
      companyId: user.companyId,
      status: "APROVADO",
      // Contribuidor: só processos próprios (mesmo escopo da Gestão de Terceiros)
      ...(user.isDPO ? {} : { createdById: user.id }),
      sharing: { not: null },
    },
    select: {
      id: true,
      serviceName: true,
      sharing: true,
      operatorLinks: { select: { id: true } },
    },
  });

  const items = inventories
    .filter((i) => {
      const sharing = (i.sharing ?? "").trim();
      if (!sharing) return false;
      // Filtra respostas que indicam ausência de compartilhamento
      // (variações comuns: "não compartilhado", "não há", "nenhum", etc.)
      if (
        /^(n[aã]o\b|nenhum|n\/a|none|—|-+|sem\b)/i.test(sharing) &&
        sharing.length < 50
      ) {
        return false;
      }
      return i.operatorLinks.length === 0;
    })
    .map((i) => ({
      inventoryId: i.id,
      serviceName: i.serviceName,
      sharingText: i.sharing ?? "",
      suggestedNames: extractCandidateNames(i.sharing ?? ""),
    }));

  return NextResponse.json({ items });
}

/**
 * Heurística leve pra extrair candidatos a "razão social" do texto livre
 * de `sharing` do Inventário. Splita por vírgula, ponto-e-vírgula, " e ",
 * " com ", " junto " — depois filtra fragmentos pequenos / preposições.
 *
 * Não é perfeito, mas serve como sugestão pro DPO confirmar/editar antes
 * de cadastrar.
 */
function extractCandidateNames(text: string): string[] {
  const splits = text
    .split(/[,;]| e | com | junto a | junto à | junto ao | para | pra /i)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();
  // Lista de palavras comuns que NÃO devem virar nome de operador
  // (substantivos genéricos / cargos / verbos / negações).
  const stopwords = new Set([
    "não compartilhado",
    "compartilhado",
    "compartilha",
    "contador",
    "cliente",
    "clientes",
    "fornecedor",
    "fornecedores",
    "interno",
    "externo",
    "ninguém",
    "ninguem",
    "nenhum",
    "n/a",
    "n\\a",
    "outros",
    "outras",
  ]);
  for (const p of splits) {
    // Limpeza básica: remove pontos finais, prefixos comuns
    const cleaned = p
      .replace(/^(empresa|fornecedor|operador|prestador|terceiro)s?\s+/i, "")
      .replace(/\.+$/, "")
      .trim();
    if (cleaned.length < 3) continue;
    if (cleaned.length > 100) continue;
    const key = cleaned.toLowerCase();
    if (stopwords.has(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
    if (out.length >= 5) break;
  }
  return out;
}
