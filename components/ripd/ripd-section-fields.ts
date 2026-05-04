/**
 * Schema declarativo das 8 seções do RIPD (Checkpoint 13 / F2).
 *
 * Cada seção tem N campos editáveis. O editor renderiza dinamicamente
 * a partir desta definição (sem hardcode de cada campo).
 *
 * Tipos de campo:
 *   - "text"     → input single-line
 *   - "textarea" → textarea multiline
 *   - "readonly" → texto exibido sem edição (vem pré-populado e não pode
 *                  ser alterado no editor — usuário muda no Inventário)
 *
 * Notas:
 *   - Campos `prepop: "auto"` indicam que vêm pré-populados do
 *     Inventário/Riscos/GAP/Plano (badge "auto" na UI).
 *   - Seções 6 e 7 são listas (riscos / controles / ações) renderizadas
 *     com componente custom; o schema declarativo só descreve os campos
 *     livres anexos (overallAssessment / additionalSafeguards).
 */

import type { RipdData } from "@/lib/ripd-helpers";

export type FieldKind = "text" | "textarea" | "readonly";

export interface SectionField {
  /** Caminho dot-notation dentro do RipdData (ex: "s1.controller.name"). */
  path: string;
  label: string;
  kind: FieldKind;
  /** Texto de ajuda mostrado abaixo do label. */
  hint?: string;
  /** Placeholder pra campo vazio (opcional). */
  placeholder?: string;
  /** True = campo pré-populado automaticamente. */
  prepop?: boolean;
  /** Linhas pra textarea (default 3). */
  rows?: number;
  /** Largura: "full" | "half" (default "full") — pra grid 2 colunas. */
  width?: "full" | "half";
}

export interface SectionDef {
  key: keyof RipdData & `s${number}`;
  number: number;
  title: string;
  shortTitle: string;
  intro: string;
  fields: ReadonlyArray<SectionField>;
  /** Tem lista anexa (riscos / controles / ações)? */
  hasList?: "risks" | "existingControls" | "plannedActions";
}

export const RIPD_SECTIONS: ReadonlyArray<SectionDef> = [
  // ---------------- Seção 1 ----------------
  {
    key: "s1",
    number: 1,
    title: "Identificação dos agentes de tratamento",
    shortTitle: "Agentes",
    intro:
      "Quem é o controlador, quem é o encarregado (DPO), e quais terceiros (operadores) participam do tratamento. Vem pré-preenchido com os dados da sua empresa cadastrada.",
    fields: [
      { path: "s1.controller.name",                label: "Nome do controlador",        kind: "text",     prepop: true, width: "half" },
      { path: "s1.controller.cnpj",                label: "CNPJ",                       kind: "text",     prepop: true, width: "half" },
      { path: "s1.controller.address",             label: "Endereço",                   kind: "textarea", prepop: true, rows: 2 },
      { path: "s1.controller.legalRepresentative", label: "Representante legal",        kind: "text",     prepop: true, width: "half" },
      { path: "s1.dpo.name",                       label: "Nome do encarregado (DPO)",  kind: "text",     prepop: true, width: "half" },
      { path: "s1.dpo.email",                      label: "E-mail do DPO",              kind: "text",     prepop: true, width: "half" },
      { path: "s1.dpo.phone",                      label: "Telefone do DPO",            kind: "text",     prepop: true, width: "half" },
      {
        path: "s1.operators",
        label: "Operadores e terceiros envolvidos",
        kind: "textarea",
        hint: "Empresas e fornecedores que tratam dados em nome do controlador. Vem do campo \"Compartilhamento\" do processo.",
        prepop: true,
        rows: 4,
      },
    ],
  },

  // ---------------- Seção 2 ----------------
  {
    key: "s2",
    number: 2,
    title: "Descrição do projeto/processo",
    shortTitle: "Projeto",
    intro:
      "O que o processo faz e por quê. Quanto mais específico, mais útil pra ANPD e auditoria.",
    fields: [
      { path: "s2.name",            label: "Nome do projeto/processo",  kind: "text",     prepop: true,  width: "half" },
      { path: "s2.responsibleArea", label: "Área responsável",          kind: "text",     prepop: true,  width: "half" },
      {
        path: "s2.description",
        label: "Descrição detalhada",
        kind: "textarea",
        hint: "O que acontece no processo, do início ao fim. Sistemas envolvidos, etapas, integrações.",
        rows: 5,
      },
      {
        path: "s2.objective",
        label: "Objetivo",
        kind: "textarea",
        hint: "Por que o processo existe. Qual problema ele resolve pra organização ou pro titular.",
        prepop: true,
        rows: 4,
      },
    ],
  },

  // ---------------- Seção 3 ----------------
  {
    key: "s3",
    number: 3,
    title: "Dados pessoais tratados",
    shortTitle: "Dados",
    intro:
      "Quais dados pessoais são coletados e tratados, e a quem pertencem.",
    fields: [
      { path: "s3.categories",         label: "Categorias gerais",         kind: "text",     prepop: true,  hint: "Ex: Dados pessoais comuns + sensíveis" },
      { path: "s3.personalData",       label: "Tipos específicos",         kind: "textarea", prepop: true,  rows: 4, hint: "Lista de campos coletados (nome, CPF, e-mail, etc.)" },
      { path: "s3.subjects",           label: "Categorias de titulares",   kind: "textarea", prepop: true,  rows: 2, hint: "Clientes, funcionários, fornecedores, prospects, etc." },
      {
        path: "s3.sensitiveDataNotes",
        label: "Observações sobre dados sensíveis",
        kind: "textarea",
        hint: "Se trata dados sensíveis (origem racial, saúde, religião, biometria, etc.) — descreva quais e a justificativa.",
        prepop: true,
        rows: 3,
      },
      {
        path: "s3.volumeEstimate",
        label: "Estimativa de volume",
        kind: "text",
        hint: "Quantidade aproximada de titulares (ex: 50.000 clientes ativos).",
        prepop: true,
      },
    ],
  },

  // ---------------- Seção 4 ----------------
  {
    key: "s4",
    number: 4,
    title: "Finalidade e bases legais",
    shortTitle: "Finalidade",
    intro:
      "Por que tratar esses dados é necessário e proporcional, e qual base legal autoriza o tratamento (art. 7º ou 11 da LGPD).",
    fields: [
      {
        path: "s4.purposes",
        label: "Finalidades específicas",
        kind: "textarea",
        hint: "Pra quê os dados serão usados. Quanto mais granular, melhor.",
        prepop: true,
        rows: 4,
      },
      {
        path: "s4.legalBasis",
        label: "Base legal aplicável",
        kind: "textarea",
        hint: "Qual hipótese da LGPD autoriza (consentimento, execução de contrato, legítimo interesse, etc.).",
        prepop: true,
        rows: 3,
      },
      {
        path: "s4.sensitiveBasis",
        label: "Base legal específica para dados sensíveis",
        kind: "textarea",
        hint: "Só preencher se houver dados sensíveis no tratamento (art. 11 da LGPD).",
        prepop: true,
        rows: 3,
      },
      {
        path: "s4.necessityJustification",
        label: "Justificativa de necessidade",
        kind: "textarea",
        hint: "Explique por que o tratamento é necessário pra alcançar a finalidade. Há alternativa menos invasiva?",
        rows: 5,
      },
      {
        path: "s4.proportionalityJustification",
        label: "Justificativa de proporcionalidade",
        kind: "textarea",
        hint: "Os dados coletados são adequados e suficientes? Não há excesso? O benefício justifica o tratamento?",
        rows: 5,
      },
    ],
  },

  // ---------------- Seção 5 ----------------
  {
    key: "s5",
    number: 5,
    title: "Ciclo de vida dos dados",
    shortTitle: "Ciclo de vida",
    intro:
      "Como os dados nascem, vivem e morrem dentro do processo.",
    fields: [
      {
        path: "s5.collection",
        label: "Forma de coleta",
        kind: "textarea",
        hint: "Como os dados entram no sistema (formulário, API, integração, importação manual).",
        prepop: true,
        rows: 3,
      },
      {
        path: "s5.storage",
        label: "Armazenamento",
        kind: "textarea",
        hint: "Onde e como os dados ficam guardados (banco interno, cloud, planilha, etc.).",
        prepop: true,
        rows: 3,
      },
      {
        path: "s5.retention",
        label: "Retenção",
        kind: "textarea",
        hint: "Por quanto tempo os dados ficam armazenados e por que.",
        prepop: true,
        rows: 3,
      },
      {
        path: "s5.elimination",
        label: "Eliminação / descarte",
        kind: "textarea",
        hint: "Como os dados são apagados ao fim do prazo de retenção.",
        prepop: true,
        rows: 3,
      },
      {
        path: "s5.internationalTransfer",
        label: "Transferência internacional",
        kind: "textarea",
        hint: "Se os dados saem do Brasil, pra quais países e com quais salvaguardas (cláusulas contratuais, certificações).",
        prepop: true,
        rows: 3,
      },
    ],
  },

  // ---------------- Seção 6 ----------------
  {
    key: "s6",
    number: 6,
    title: "Avaliação de riscos",
    shortTitle: "Riscos",
    intro:
      "Riscos identificados pra esse processo. A lista é puxada da Análise de Riscos do processo (ProcessRisk). Adicione avaliação geral abaixo.",
    hasList: "risks",
    fields: [
      {
        path: "s6.overallAssessment",
        label: "Avaliação geral de riscos",
        kind: "textarea",
        hint: "Resumo qualitativo dos riscos do processo. Tendência geral (alto/médio/baixo), riscos críticos a destacar, observações sobre mitigação.",
        rows: 6,
      },
    ],
  },

  // ---------------- Seção 7 ----------------
  {
    key: "s7",
    number: 7,
    title: "Medidas de mitigação",
    shortTitle: "Mitigação",
    intro:
      "Controles de segurança e privacidade aplicados. Lista os controles aderentes do GAP Analysis e as ações abertas no Plano de Ação ligadas a este processo.",
    hasList: "existingControls",
    fields: [
      {
        path: "s7.additionalSafeguards",
        label: "Salvaguardas adicionais",
        kind: "textarea",
        hint: "Medidas de segurança específicas deste processo que não estão no GAP/Plano (ex: criptografia em repouso, MFA, segregação de rede).",
        prepop: true,
        rows: 6,
      },
    ],
  },

  // ---------------- Seção 8 ----------------
  {
    key: "s8",
    number: 8,
    title: "Parecer e aprovação",
    shortTitle: "Parecer",
    intro:
      "Conclusão técnica do encarregado (DPO). É a parte que vai pra mesa do tomador de decisão.",
    fields: [
      {
        path: "s8.finalConclusion",
        label: "Conclusão técnica",
        kind: "textarea",
        hint: "Posicionamento do DPO sobre o tratamento — recomenda prosseguir, prosseguir com ressalvas, suspender, etc.",
        rows: 8,
      },
      {
        path: "s8.recommendations",
        label: "Recomendações",
        kind: "textarea",
        hint: "O que ainda precisa ser feito (lista priorizada).",
        rows: 6,
      },
    ],
  },
];

// ============================================================
// Helpers de path (dot-notation)
// ============================================================

/** Lê valor profundo do RipdData via "s2.description" → data.s2.description */
export function getFieldValue(
  data: RipdData,
  path: string
): string {
  const parts = path.split(".");
  let cursor: any = data;
  for (const p of parts) {
    if (cursor == null || typeof cursor !== "object") return "";
    cursor = cursor[p];
  }
  if (typeof cursor === "string") return cursor;
  if (cursor == null) return "";
  return String(cursor);
}

/** Atualiza valor em path e devolve novo RipdData (imutável). */
export function setFieldValue(
  data: RipdData,
  path: string,
  value: string
): RipdData {
  const parts = path.split(".");
  const next: any = structuredClone(data);
  let cursor: any = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cursor[p] == null || typeof cursor[p] !== "object") {
      cursor[p] = {};
    }
    cursor = cursor[p];
  }
  cursor[parts[parts.length - 1]] = value;
  return next;
}
