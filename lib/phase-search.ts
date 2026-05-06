/**
 * Engine de busca textual nas Fases (CP25 — Highlights pesquisáveis).
 *
 * Varre 4 seções de cada fase:
 *  - descricao   (PhaseInfo.description)
 *  - howto       (PhaseInfo.howToProceed — "Considerações")
 *  - checklist   (PhaseInfo.checklistHtml — HTML descritivo livre)
 *  - documentacao (PhaseDocument.title + description)
 *
 * Busca = substring case-insensitive normalizada (sem acento), com
 * extração de snippet em torno do match (até 160 chars).
 *
 * Não tenta full-text/stemming PT-BR — o conteúdo é da própria empresa
 * e o volume é pequeno. Substring resolve.
 */

import { PrismaClient } from "@prisma/client";
import { PHASE_CONTENT_INDEX } from "./phase-content-index";

export interface PhaseSearchHit {
  /** ID da fase: "entendendo-pgp" | "preliminar" | "fase-1" ... "fase-7" */
  phase: string;
  /** Label amigável da fase */
  phaseLabel: string;
  /** Rota pra abrir a fase */
  phaseHref: string;
  /** Seção dentro da fase */
  section: "descricao" | "howto" | "checklist" | "documentacao";
  /** Label amigável da seção */
  sectionLabel: string;
  /** Ícone curto (emoji) */
  sectionIcon: string;
  /** Snippet com ~80 chars antes/depois do match (texto puro) */
  snippet: string;
  /** Posição 0..N do termo no snippet pra highlight no client */
  matchStart: number;
  /** Tamanho do termo no snippet */
  matchLength: number;
  /**
   * Identificador adicional (ex.: nome do documento) pra desambiguar quando
   * uma seção tem múltiplos hits. Vazio se não aplicável.
   */
  contextLabel?: string;
}

export interface PhaseSearchResults {
  query: string;
  totalHits: number;
  /** Map phaseId → hits dessa fase, em ordem das fases */
  byPhase: Array<{
    phase: string;
    phaseLabel: string;
    phaseHref: string;
    hits: PhaseSearchHit[];
  }>;
}

interface PhaseMeta {
  id: string;
  label: string;
  href: string;
  order: number;
}

export const PHASE_META: ReadonlyArray<PhaseMeta> = [
  { id: "entendendo-pgp", label: "Entendendo o PGP", href: "/dashboard/entendendo-pgp", order: 0 },
  { id: "preliminar", label: "Fase Preliminar", href: "/dashboard/fase-preliminar", order: 1 },
  { id: "fase-1", label: "Fase 1 — Formação das Equipes", href: "/dashboard/fase-1", order: 2 },
  { id: "fase-2", label: "Fase 2 — Diagnóstico Inicial", href: "/dashboard/fase-2", order: 3 },
  { id: "fase-3", label: "Fase 3 — Mapeamento e Riscos", href: "/dashboard/fase-3", order: 4 },
  { id: "fase-4", label: "Fase 4 — GAP Analysis", href: "/dashboard/fase-4", order: 5 },
  { id: "fase-5", label: "Fase 5 — Plano de Ação", href: "/dashboard/fase-5", order: 6 },
  { id: "fase-6", label: "Fase 6 — Execução", href: "/dashboard/fase-6", order: 7 },
  { id: "fase-7", label: "Fase 7 — Monitoramento", href: "/dashboard/fase-7", order: 8 },
];

const SECTION_LABELS: Record<PhaseSearchHit["section"], { label: string; icon: string }> = {
  descricao: { label: "Descrição", icon: "📄" },
  howto: { label: "Considerações", icon: "💡" },
  checklist: { label: "Checklist", icon: "✅" },
  documentacao: { label: "Documentação", icon: "📂" },
};

/** Remove acentos pra busca case+accent insensitive. */
function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Strip de tags HTML — converte em texto puro pro snippet. */
function stripHtml(html: string): string {
  if (!html) return "";
  // 1) substitui blocos por quebra (pra preservar separação)
  let text = html.replace(/<\/(p|div|li|h[1-6]|br|tr)>/gi, "\n");
  // 2) remove tags
  text = text.replace(/<[^>]+>/g, "");
  // 3) decode entidades comuns
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // 4) colapsa whitespace
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Encontra a primeira ocorrência do termo em texto, retorna snippet
 * com janela de ~80 chars antes e depois e posições do match.
 * Busca normalizada (ignora acento + caso), mas devolve texto original.
 */
function findSnippet(
  text: string,
  query: string,
): { snippet: string; matchStart: number; matchLength: number } | null {
  if (!text || !query) return null;
  const normText = normalize(text);
  const normQuery = normalize(query);
  const idx = normText.indexOf(normQuery);
  if (idx < 0) return null;

  const WINDOW = 80;
  const start = Math.max(0, idx - WINDOW);
  const end = Math.min(text.length, idx + normQuery.length + WINDOW);
  let snippet = text.slice(start, end);
  let matchStart = idx - start;
  if (start > 0) {
    snippet = "…" + snippet;
    matchStart += 1;
  }
  if (end < text.length) {
    snippet = snippet + "…";
  }

  return { snippet, matchStart, matchLength: query.length };
}

interface SearchSource {
  phase: string;
  section: PhaseSearchHit["section"];
  /** Texto bruto (HTML ou plain) — strippado antes de buscar */
  raw: string;
  /** Identificador opcional (ex.: nome do doc) pra `contextLabel` */
  contextLabel?: string;
}

/**
 * Roda a busca e devolve o resultado agrupado por fase.
 *
 * @param prisma PrismaClient
 * @param query Texto buscado (≥ 2 chars)
 * @param companyId Empresa do usuário (não filtra PhaseInfo global mas
 *                  filtra PhaseDocument por company)
 */
export async function searchPhases(
  prisma: PrismaClient,
  query: string,
  companyId: string | null,
): Promise<PhaseSearchResults> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { query: trimmed, totalHits: 0, byPhase: [] };
  }

  // Carrega tudo em paralelo. Volume baixo (poucas dezenas de registros
  // por tabela) — não vale paginar nem indexar full-text.
  const [phaseInfos, phaseDocuments] = await Promise.all([
    prisma.phaseInfo.findMany({
      where: { isGlobal: true, companyId: null },
      select: { phase: true, description: true, howToProceed: true, checklistHtml: true },
    }),
    prisma.phaseDocument.findMany({
      where: companyId
        ? { OR: [{ companyId }, { companyId: null }] }
        : { companyId: null },
      select: { phase: true, title: true, description: true, fileName: true },
    }),
  ]);

  const sources: SearchSource[] = [];

  // Conteúdo do banco (admin personalizou). Tem prioridade — se tiver,
  // reflete a versão atual exibida ao user.
  const dbCovered = new Set<string>(); // chave: `${phase}:${section}`
  for (const pi of phaseInfos) {
    if (pi.description) {
      sources.push({ phase: pi.phase, section: "descricao", raw: pi.description });
      dbCovered.add(`${pi.phase}:descricao`);
    }
    if (pi.howToProceed) sources.push({ phase: pi.phase, section: "howto", raw: pi.howToProceed });
    if (pi.checklistHtml) {
      sources.push({ phase: pi.phase, section: "checklist", raw: pi.checklistHtml });
      dbCovered.add(`${pi.phase}:checklist`);
    }
  }

  // Conteúdo hardcoded (defaultContent + checklistSections) — usa só
  // quando o banco não tem versão personalizada pra essa seção.
  for (const meta of PHASE_META) {
    const fallback = PHASE_CONTENT_INDEX[meta.id];
    if (!fallback) continue;
    if (fallback.description && !dbCovered.has(`${meta.id}:descricao`)) {
      sources.push({ phase: meta.id, section: "descricao", raw: fallback.description });
    }
    if (fallback.checklist && !dbCovered.has(`${meta.id}:checklist`)) {
      sources.push({ phase: meta.id, section: "checklist", raw: fallback.checklist });
    }
  }

  for (const doc of phaseDocuments) {
    const docName = doc.title || doc.fileName || "(sem título)";
    const combined = [doc.title, doc.description, doc.fileName].filter(Boolean).join(" — ");
    if (combined) {
      sources.push({
        phase: doc.phase,
        section: "documentacao",
        raw: combined,
        contextLabel: docName,
      });
    }
  }

  // Roda a busca contra cada source
  const hits: PhaseSearchHit[] = [];
  for (const src of sources) {
    const text = stripHtml(src.raw);
    const found = findSnippet(text, trimmed);
    if (!found) continue;

    const meta = PHASE_META.find((p) => p.id === src.phase);
    if (!meta) continue;

    const sec = SECTION_LABELS[src.section];
    hits.push({
      phase: src.phase,
      phaseLabel: meta.label,
      phaseHref: meta.href,
      section: src.section,
      sectionLabel: sec.label,
      sectionIcon: sec.icon,
      snippet: found.snippet,
      matchStart: found.matchStart,
      matchLength: found.matchLength,
      contextLabel: src.contextLabel,
    });
  }

  // Agrupa por fase respeitando a ordem do PHASE_META
  const byPhaseMap = new Map<string, PhaseSearchHit[]>();
  for (const h of hits) {
    const arr = byPhaseMap.get(h.phase) ?? [];
    arr.push(h);
    byPhaseMap.set(h.phase, arr);
  }

  const byPhase = PHASE_META
    .filter((p) => byPhaseMap.has(p.id))
    .map((p) => ({
      phase: p.id,
      phaseLabel: p.label,
      phaseHref: p.href,
      hits: byPhaseMap.get(p.id) ?? [],
    }));

  return { query: trimmed, totalHits: hits.length, byPhase };
}
