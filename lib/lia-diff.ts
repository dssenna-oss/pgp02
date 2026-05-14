/**
 * Engine de comparação entre 2 versões de LiaData (Checkpoint 21).
 *
 * Como a LIA é estruturada em 3 etapas com campos texto + radios +
 * checkbox-groups (sem listas dinâmicas como o RIPD), o diff é simples:
 * para cada pergunta do template, compara valor antigo vs novo. Pra
 * textos longos, usa `diffWords` da `diff` (jsdiff) pra mostrar
 * word-level. Radios e checkboxes mostram apenas "antes → depois".
 *
 * Engine pura — não depende do Prisma. Testável.
 */

import { diffWords, type Change } from "diff";
import type { LiaData } from "./lia-helpers";
import { LIA_TEMPLATE, type LiaQuestion } from "./lia-templates";

// ============================================================
// Tipos do diff
// ============================================================

export type LiaDiffStatus = "unchanged" | "changed";

export interface LiaFieldDiff {
  /** Caminho dot-notation no LiaData. Ex.: "s1.interesseDescricao" */
  path: string;
  /** Pergunta exibida ao usuário. */
  label: string;
  /** Tipo do campo, pra UI escolher como renderizar diff. */
  type: LiaQuestion["type"];
  status: LiaDiffStatus;
  /** Representação textual do valor antigo (sempre preenchido). */
  oldText: string;
  /** Representação textual do valor novo (sempre preenchido). */
  newText: string;
  /** Word-level diff parts (só preenchido se type="textarea" e status="changed"). */
  parts?: ReadonlyArray<Change>;
}

export interface LiaSectionDiff {
  key: keyof LiaData & `s${number}`;
  number: number;
  title: string;
  fields: ReadonlyArray<LiaFieldDiff>;
  /** True se a etapa tem alguma mudança. */
  hasChanges: boolean;
}

export interface LiaDiffStats {
  fieldsChanged: number;
  totalFields: number;
}

export interface LiaDiff {
  sections: ReadonlyArray<LiaSectionDiff>;
  hasChanges: boolean;
  stats: LiaDiffStats;
}

// ============================================================
// Builder principal
// ============================================================

export function buildLiaDiff(a: LiaData, b: LiaData): LiaDiff {
  const sections: LiaSectionDiff[] = [];
  let fieldsChanged = 0;
  let totalFields = 0;

  for (let i = 0; i < LIA_TEMPLATE.length; i++) {
    const sec = LIA_TEMPLATE[i];
    const fields: LiaFieldDiff[] = sec.questions.map((q) => {
      const oldVal = getValue(a, q.path);
      const newVal = getValue(b, q.path);
      totalFields += 1;

      // Renderiza valores como texto pra comparação visual
      const oldText = formatValue(q, oldVal);
      const newText = formatValue(q, newVal);

      if (oldText === newText) {
        return {
          path: q.path,
          label: q.label,
          type: q.type,
          status: "unchanged" as const,
          oldText,
          newText,
        };
      }
      fieldsChanged += 1;
      const base: LiaFieldDiff = {
        path: q.path,
        label: q.label,
        type: q.type,
        status: "changed" as const,
        oldText,
        newText,
      };
      if (q.type === "textarea") {
        base.parts = diffWords(oldText, newText);
      }
      return base;
    });

    sections.push({
      key: sec.key,
      number: i + 1,
      title: sec.title,
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

// ============================================================
// Helpers internos
// ============================================================

/** Resolve um path dot-notation no LiaData (ex.: "s1.interesseDescricao"). */
function getValue(data: LiaData, path: string): unknown {
  const parts = path.split(".");
  let cur: any = data;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * Converte um valor de campo em string pra comparação/exibição.
 *  - textarea/string → string direta
 *  - radio → label da opção (não o `value`) pra ficar legível no diff
 *  - checkbox-group → lista das chaves marcadas separadas por vírgula
 */
function formatValue(q: LiaQuestion, val: unknown): string {
  if (q.type === "textarea") {
    return typeof val === "string" ? val : "";
  }
  if (q.type === "radio") {
    if (val == null || val === "") return "(não respondido)";
    const opt = q.options?.find((o) => o.value === String(val));
    return opt ? opt.label : String(val);
  }
  if (q.type === "checkbox-group") {
    if (!val || typeof val !== "object") return "(nenhum marcado)";
    const obj = val as Record<string, boolean>;
    const labels =
      q.checkboxes
        ?.filter((cb) => obj[cb.key])
        .map((cb) => cb.label) ?? [];
    return labels.length > 0 ? labels.join(" · ") : "(nenhum marcado)";
  }
  return String(val ?? "");
}
