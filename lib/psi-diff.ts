/**
 * Engine de comparação entre 2 versões de PsiData (Checkpoint 26).
 *
 * Compara cada campo das 7 seções (textareas) + cada controle
 * (booleans). Pra textareas, usa diffWords (jsdiff) pra mostrar
 * word-level. Pra controles, mostra "marcado/desmarcado" antes/depois.
 *
 * Engine pura — não depende do Prisma. Testável.
 */

import { diffWords, type Change } from "diff";
import type { PsiData } from "./psi-helpers";
import { PSI_SECTION_LABELS } from "./psi-helpers";

export type PsiDiffStatus = "unchanged" | "changed";

export interface PsiFieldDiff {
  /** Caminho dot-notation no PsiData. Ex.: "s1.declaracao" */
  path: string;
  /** Rótulo exibido ao usuário. */
  label: string;
  /** Tipo do campo (textarea ou checkbox de controle). */
  type: "textarea" | "checkbox" | "header";
  status: PsiDiffStatus;
  oldText: string;
  newText: string;
  /** Word-level diff (só pra textareas com mudança). */
  parts?: ReadonlyArray<Change>;
}

export interface PsiSectionDiff {
  key: string;
  number: number; // 0=header, 1..7=seções
  title: string;
  fields: ReadonlyArray<PsiFieldDiff>;
  hasChanges: boolean;
}

export interface PsiDiffStats {
  fieldsChanged: number;
  totalFields: number;
}

export interface PsiDiff {
  sections: ReadonlyArray<PsiSectionDiff>;
  hasChanges: boolean;
  stats: PsiDiffStats;
}

// Mapa de campos textarea por seção (path → label)
const TEXTAREA_FIELDS: Record<string, ReadonlyArray<{ key: string; label: string }>> = {
  header: [
    { key: "vigencia", label: "Vigência" },
    { key: "aplicabilidade", label: "Aplicabilidade" },
    { key: "ultimaRevisao", label: "Última revisão" },
    { key: "frequenciaRevisao", label: "Frequência de revisão" },
  ],
  s1: [
    { key: "declaracao", label: "Declaração da alta direção" },
    { key: "responsabilidades", label: "Responsabilidades" },
  ],
  s2: [
    { key: "inventarioAtivos", label: "Inventário de ativos" },
    { key: "classificacaoInformacao", label: "Classificação da informação" },
  ],
  s3: [
    { key: "politicaAcesso", label: "Política de acesso" },
    { key: "autenticacao", label: "Autenticação" },
    { key: "revisaoAcessos", label: "Revisão de acessos" },
  ],
  s4: [
    { key: "criptografiaEmTransito", label: "Criptografia em trânsito" },
    { key: "criptografiaEmRepouso", label: "Criptografia em repouso" },
    { key: "gestaoChaves", label: "Gestão de chaves" },
  ],
  s5: [
    { key: "perimetro", label: "Perímetro físico" },
    { key: "energiaAmbiente", label: "Energia e ambiente" },
    { key: "descarteFisico", label: "Descarte físico" },
  ],
  s6: [
    { key: "deteccaoMonitoramento", label: "Detecção e monitoramento" },
    { key: "respostaIncidente", label: "Resposta a incidente" },
    { key: "comunicacao", label: "Comunicação" },
  ],
  s7: [
    { key: "backupEstrategia", label: "Estratégia de backup" },
    { key: "rtoRpo", label: "RTO/RPO" },
    { key: "testesRecuperacao", label: "Testes de recuperação" },
  ],
};

// Labels dos controles por seção (key → label)
const CONTROL_LABELS: Record<string, Record<string, string>> = {
  s1: {
    comiteSeguranca: "Comitê de Segurança formal",
    comunicacaoFormal: "Comunicação formal da política",
    revisoesPeriodicas: "Revisões periódicas",
    treinamentoRegular: "Treinamento regular",
  },
  s2: {
    possuiInventario: "Possui inventário de ativos",
    ativosClassificados: "Ativos classificados",
    proprietarioDefinido: "Proprietário definido",
    descarteSeguro: "Descarte seguro",
  },
  s3: {
    menorPrivilegio: "Princípio do menor privilégio",
    mfaCriticos: "MFA em sistemas críticos",
    revisaoSemestral: "Revisão semestral de acessos",
    desligamentoImediato: "Desligamento imediato",
  },
  s4: {
    tlsObrigatorio: "TLS obrigatório",
    criptografiaRepouso: "Criptografia em repouso",
    pseudonimizacao: "Pseudonimização",
    backupCriptografado: "Backup criptografado",
  },
  s5: {
    controleAcessoFisico: "Controle de acesso físico",
    monitoramentoCftv: "Monitoramento CFTV",
    energiaRedundante: "Energia redundante",
    descarteFormal: "Descarte físico formal",
  },
  s6: {
    logsAtivados: "Logs ativados",
    planoResposta: "Plano de resposta",
    notificacao72h: "Notificação ANPD 72h",
    registroIncidentes: "Registro de incidentes (mini-app CP16)",
  },
  s7: {
    backupRegular: "Backup regular",
    backupOffsite: "Backup offsite",
    planoContinuidade: "Plano de continuidade",
    testeAnual: "Teste anual",
  },
};

export function buildPsiDiff(a: PsiData, b: PsiData): PsiDiff {
  const sections: PsiSectionDiff[] = [];
  let fieldsChanged = 0;
  let totalFields = 0;

  // Header (número 0 — cabeçalho institucional)
  const headerFields: PsiFieldDiff[] = TEXTAREA_FIELDS.header.map((f) => {
    const oldText = String((a.header as any)[f.key] ?? "");
    const newText = String((b.header as any)[f.key] ?? "");
    totalFields += 1;
    if (oldText === newText) {
      return {
        path: `header.${f.key}`,
        label: f.label,
        type: "header" as const,
        status: "unchanged" as const,
        oldText,
        newText,
      };
    }
    fieldsChanged += 1;
    return {
      path: `header.${f.key}`,
      label: f.label,
      type: "header" as const,
      status: "changed" as const,
      oldText,
      newText,
      parts: diffWords(oldText, newText),
    };
  });
  sections.push({
    key: "header",
    number: 0,
    title: "Cabeçalho",
    fields: headerFields,
    hasChanges: headerFields.some((f) => f.status === "changed"),
  });

  // 7 seções
  for (let i = 0; i < PSI_SECTION_LABELS.length; i++) {
    const meta = PSI_SECTION_LABELS[i];
    const key = meta.key;
    const fields: PsiFieldDiff[] = [];

    // Textareas
    for (const f of TEXTAREA_FIELDS[key] ?? []) {
      const oldText = String((a as any)[key]?.[f.key] ?? "");
      const newText = String((b as any)[key]?.[f.key] ?? "");
      totalFields += 1;
      if (oldText === newText) {
        fields.push({
          path: `${key}.${f.key}`,
          label: f.label,
          type: "textarea",
          status: "unchanged",
          oldText,
          newText,
        });
      } else {
        fieldsChanged += 1;
        fields.push({
          path: `${key}.${f.key}`,
          label: f.label,
          type: "textarea",
          status: "changed",
          oldText,
          newText,
          parts: diffWords(oldText, newText),
        });
      }
    }

    // Controles (booleans)
    const ctrlMap = CONTROL_LABELS[key] ?? {};
    for (const ctrlKey of Object.keys(ctrlMap)) {
      const oldVal = Boolean((a as any)[key]?.controles?.[ctrlKey]);
      const newVal = Boolean((b as any)[key]?.controles?.[ctrlKey]);
      totalFields += 1;
      const oldText = oldVal ? "Marcado" : "Desmarcado";
      const newText = newVal ? "Marcado" : "Desmarcado";
      if (oldVal === newVal) {
        fields.push({
          path: `${key}.controles.${ctrlKey}`,
          label: ctrlMap[ctrlKey],
          type: "checkbox",
          status: "unchanged",
          oldText,
          newText,
        });
      } else {
        fieldsChanged += 1;
        fields.push({
          path: `${key}.controles.${ctrlKey}`,
          label: ctrlMap[ctrlKey],
          type: "checkbox",
          status: "changed",
          oldText,
          newText,
        });
      }
    }

    sections.push({
      key,
      number: i + 1,
      title: meta.label,
      fields,
      hasChanges: fields.some((f) => f.status === "changed"),
    });
  }

  return {
    sections,
    hasChanges: sections.some((s) => s.hasChanges),
    stats: { fieldsChanged, totalFields },
  };
}

export { TEXTAREA_FIELDS, CONTROL_LABELS };
