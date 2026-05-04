/**
 * Auto-preenchimento (decisão 5b) do GAP Analysis.
 *
 * Lê o estado agregado da organização (processos APROVADOS do Inventário
 * + dados da Company) e devolve sugestões de resposta pra os controles
 * óbvios — decisão mecânica que não precisa do DPO digitar do zero.
 *
 * Filosofia (igual à da Análise de Riscos):
 *   - Preencher SÓ o que dá pra inferir com confiança alta
 *   - Marcar `autoSuggested: true` na resposta — DPO confirma com 1 clique
 *   - Os 119 controles NÃO precisam todos ter sugestão; o que não tiver
 *     fica pro DPO preencher manualmente
 *
 * Não fazemos chamadas ao banco aqui — o caller passa os dados já
 * carregados.
 */

import type { GapMapeamento, GapAderencia } from "@/lib/gap-helpers";
import { GAP_MAPEAMENTO } from "@/lib/gap-helpers";

// ============================================================
// Input agregado
// ============================================================

export interface GapSuggestInput {
  /** Processos APROVADOS da organização (com formAnswers + bases legais). */
  approvedProcesses: ReadonlyArray<{
    id: string;
    serviceName: string;
    setor: string | null;
    dataCategory: string | null;
    legalBasis: string | null;
    legalBasisSensitive: string | null;
    formAnswers: any;
  }>;
  /** Dados da Company (DPO, governança, etc.). */
  company: {
    dpoName: string | null;
    dpoEmail: string | null;
    dpoPhone: string | null;
  };
}

export interface GapSuggestion {
  controlCode: string;
  cenarioAtual?: string;
  mapeamento?: GapMapeamento;
  aderencia?: GapAderencia;
  /** Texto curto pra UI explicar de onde veio a sugestão. */
  reason: string;
}

// ============================================================
// Helpers de leitura defensiva (FormAnswers tem formato livre)
// ============================================================

function getSection(answers: any, sec: string): any {
  return answers?.sections?.[sec] ?? {};
}

function isYes(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return value.trim().toLowerCase().startsWith("sim");
}

function hasNonNAValue(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.some(
    (v) =>
      typeof v === "string" && v.trim() && v.trim().toUpperCase() !== "N/A",
  );
}

function arrIncludes(value: unknown, needle: string): boolean {
  if (!Array.isArray(value)) return false;
  const n = needle.toLowerCase();
  return value.some(
    (v) => typeof v === "string" && v.toLowerCase().includes(n),
  );
}

// ============================================================
// Engine
// ============================================================

/**
 * Devolve o mapa { controlCode → sugestão } pra os controles que dá pra
 * inferir do estado atual da organização. Códigos não-mapeados ficam
 * de fora do retorno (DPO preenche à mão).
 *
 * Regras adotadas (intencionalmente conservadoras — só quando há
 * evidência clara no Inventário):
 *
 *   001: Cenário = lista dos processos APROVADOS.
 *   002: SN = Sim se algum processo aprovado declara dados sensíveis.
 *   003: Cenário = lista dos processos com dados sensíveis.
 *   017: SN = Sim se algum processo coleta consentimento de crianças.
 *   022: SN = Sim se há decisão automatizada em algum processo.
 *   029: SN = Sim se há transferência internacional.
 *   033: SN = Sim se a Company tem DPO designado (dpoName + dpoEmail).
 *
 * Os números acima são códigos do `lib/gap-catalog.ts` (estáveis,
 * derivados da ordem do XLSX).
 */
export function buildGapSuggestions(
  input: GapSuggestInput,
): Map<string, GapSuggestion> {
  const out = new Map<string, GapSuggestion>();
  const procs = input.approvedProcesses;

  // ---------- 001 — Descrever atividades de tratamento ----------
  if (procs.length > 0) {
    const lines = procs
      .map((p) => `• ${p.serviceName}${p.setor ? ` (${p.setor})` : ""}`)
      .join("\n");
    out.set("001", {
      controlCode: "001",
      cenarioAtual: `A organização realiza ${procs.length} processo(s) APROVADO(s) de tratamento de dados pessoais:\n${lines}`,
      mapeamento: GAP_MAPEAMENTO.EM_ANDAMENTO,
      reason: `Lista dos ${procs.length} processo(s) APROVADO(s) do Inventário.`,
    });
  }

  // ---------- 002 — Tratamento de dados sensíveis (S/N) ----------
  const procsComSensiveis = procs.filter((p) => {
    if (/sens[íi]ve/i.test(p.dataCategory ?? "")) return true;
    const sec3 = getSection(p.formAnswers, "sec3");
    return isYes(sec3?.data_sensitive_yn);
  });
  if (procsComSensiveis.length > 0) {
    out.set("002", {
      controlCode: "002",
      cenarioAtual: "Sim",
      mapeamento: GAP_MAPEAMENTO.EM_ANDAMENTO,
      reason: `${procsComSensiveis.length} processo(s) APROVADO(s) declara(m) dados sensíveis no Inventário.`,
    });

    // ---------- 003 — Quais atividades sensíveis (condicional do 002) ----------
    const lines = procsComSensiveis
      .map((p) => `• ${p.serviceName}${p.setor ? ` (${p.setor})` : ""}`)
      .join("\n");
    out.set("003", {
      controlCode: "003",
      cenarioAtual: `Processos APROVADOS com dados pessoais sensíveis:\n${lines}`,
      mapeamento: GAP_MAPEAMENTO.EM_ANDAMENTO,
      reason: "Lista dos processos com dados sensíveis (puxada do Inventário).",
    });
  } else if (procs.length > 0) {
    // Há processos aprovados mas nenhum com sensíveis
    out.set("002", {
      controlCode: "002",
      cenarioAtual: "Não",
      mapeamento: GAP_MAPEAMENTO.EM_ANDAMENTO,
      reason: "Nenhum processo APROVADO declara dados sensíveis no Inventário.",
    });
  }

  // ---------- 017 — Tratamento sensíveis com/sem consentimento ----------
  // Aproveitamos pra o consentimento de crianças (controle 017 = sub-pergunta
  // sobre consentimento de sensíveis). Evidência: algum processo com
  // data_children_consent preenchido.
  const procsComConsentChild = procs.filter((p) => {
    const sec3 = getSection(p.formAnswers, "sec3");
    return hasNonNAValue(sec3?.data_children_consent);
  });
  if (procsComConsentChild.length > 0) {
    out.set("017", {
      controlCode: "017",
      cenarioAtual: "Sim",
      mapeamento: GAP_MAPEAMENTO.EM_ANDAMENTO,
      reason: `${procsComConsentChild.length} processo(s) APROVADO(s) coleta(m) consentimento pra dados de crianças.`,
    });
  }

  // ---------- 022 — Decisão automatizada (Direito dos titulares) ----------
  // Controle 022 = "Existem decisões tomadas com base em tratamentos automatizados?"
  // (filho do controle 7 — Direito dos titulares).
  const procsComAutomatizada = procs.filter((p) => {
    const sec4 = getSection(p.formAnswers, "sec4");
    return isYes(sec4?.use_automated_decision);
  });
  if (procsComAutomatizada.length > 0) {
    const lines = procsComAutomatizada
      .map((p) => `• ${p.serviceName}`)
      .join("\n");
    out.set("022", {
      controlCode: "022",
      cenarioAtual: `Sim — processos com decisão automatizada:\n${lines}`,
      mapeamento: GAP_MAPEAMENTO.EM_ANDAMENTO,
      reason: `${procsComAutomatizada.length} processo(s) APROVADO(s) usa(m) decisão automatizada.`,
    });
  }

  // ---------- 029 — Transferência internacional ----------
  const procsComInternacional = procs.filter((p) => {
    const sec6 = getSection(p.formAnswers, "sec6");
    return isYes(sec6?.share_international);
  });
  if (procsComInternacional.length > 0) {
    const lines = procsComInternacional
      .map((p) => {
        const sec6 = getSection(p.formAnswers, "sec6");
        const countries = sec6?.share_international_countries;
        const c = Array.isArray(countries)
          ? countries.filter(Boolean).join(", ")
          : typeof countries === "string"
            ? countries
            : "";
        return `• ${p.serviceName}${c ? ` → ${c}` : ""}`;
      })
      .join("\n");
    out.set("029", {
      controlCode: "029",
      cenarioAtual: `Sim — transferência internacional confirmada:\n${lines}`,
      mapeamento: GAP_MAPEAMENTO.EM_ANDAMENTO,
      reason: `${procsComInternacional.length} processo(s) APROVADO(s) confirma(m) transferência internacional.`,
    });
  } else if (procs.length > 0) {
    out.set("029", {
      controlCode: "029",
      cenarioAtual: "Não",
      mapeamento: GAP_MAPEAMENTO.EM_ANDAMENTO,
      reason: "Nenhum processo APROVADO declara transferência internacional.",
    });
  }

  // ---------- 033 — DPO designado ----------
  // (pergunta 23 = "DPO" no catálogo, mas é o controle 33 com o número 23 no XLSX
  // — código estável "033" via ordem de aparição)
  const dpoNomeado = !!(input.company.dpoName?.trim() && input.company.dpoEmail?.trim());
  if (dpoNomeado) {
    out.set("033", {
      controlCode: "033",
      cenarioAtual: `Sim. DPO designado: ${input.company.dpoName}${
        input.company.dpoEmail ? ` (${input.company.dpoEmail})` : ""
      }${input.company.dpoPhone ? ` — ${input.company.dpoPhone}` : ""}.`,
      mapeamento: GAP_MAPEAMENTO.EM_ANDAMENTO,
      reason: "Dados do DPO presentes no perfil da empresa.",
    });
  }

  // ---------- BR (Compartilhamento com terceiros) — bandeirinha agregada ----------
  // Não é controle do GAP em si, mas se houver muitos processos sem base legal
  // preenchida, isso pode virar um sinal pra outros controles. Fica pra V2.

  return out;
}
