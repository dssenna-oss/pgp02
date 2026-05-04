/**
 * Engine de comparação entre 2 versões de RipdData (Checkpoint 13 / F3).
 *
 * Diferente das Políticas (que comparam markdown linha-a-linha), o RIPD
 * é estruturado em seções/campos JSON. O diff aqui compara cada campo
 * individualmente e detecta mudanças em listas (riscos, controles,
 * ações) por chave estável (`code` ou `id`).
 *
 * Pra textos longos com mudanças, usamos `diffWords` da `diff` (jsdiff)
 * pra mostrar word-level inline.
 *
 * Engine pura — não depende do Prisma. Testável.
 */

import { diffWords, type Change } from "diff";
import type { RipdData } from "@/lib/ripd-helpers";
import {
  RIPD_SECTIONS,
  type SectionDef,
  getFieldValue,
} from "@/components/ripd/ripd-section-fields";

// ============================================================
// Tipos do diff
// ============================================================

export type DiffStatus = "unchanged" | "changed" | "added" | "removed";

export interface FieldDiff {
  path: string;
  label: string;
  status: Extract<DiffStatus, "unchanged" | "changed">;
  oldText: string;
  newText: string;
  /** Word-level diff parts (só preenchido se status="changed"). */
  parts?: ReadonlyArray<Change>;
}

export interface ListItemDiff {
  /** Chave estável do item (code do risco / id da ação / code do controle). */
  itemKey: string;
  /** Texto curto pra exibir como rótulo do item. */
  label: string;
  status: DiffStatus;
  /** Snapshot do item antigo (null se status="added"). */
  oldItem?: any;
  /** Snapshot do item novo (null se status="removed"). */
  newItem?: any;
  /** Detalhes textuais das mudanças (só pra status="changed"). */
  detail?: string;
}

export interface SectionDiff {
  key: string;
  number: number;
  title: string;
  fields: ReadonlyArray<FieldDiff>;
  /** Mudanças em listas anexas (riscos / controles / ações). */
  listChanges?: ReadonlyArray<ListItemDiff>;
  /** True se essa seção tem alguma mudança. */
  hasChanges: boolean;
}

export interface RipdDiffStats {
  fieldsChanged: number;
  listItemsAdded: number;
  listItemsRemoved: number;
  listItemsChanged: number;
}

export interface RipdDiff {
  sections: ReadonlyArray<SectionDiff>;
  hasChanges: boolean;
  stats: RipdDiffStats;
}

// ============================================================
// Builder principal
// ============================================================

export function buildRipdDiff(a: RipdData, b: RipdData): RipdDiff {
  const sections: SectionDiff[] = [];
  let fieldsChanged = 0;
  let listItemsAdded = 0;
  let listItemsRemoved = 0;
  let listItemsChanged = 0;

  for (const sec of RIPD_SECTIONS) {
    const fields: FieldDiff[] = sec.fields.map((f) => {
      const oldText = getFieldValue(a, f.path);
      const newText = getFieldValue(b, f.path);
      if (oldText === newText) {
        return {
          path: f.path,
          label: f.label,
          status: "unchanged" as const,
          oldText,
          newText,
        };
      }
      fieldsChanged += 1;
      return {
        path: f.path,
        label: f.label,
        status: "changed" as const,
        oldText,
        newText,
        parts: diffWords(oldText, newText),
      };
    });

    const listChanges = computeListChanges(sec, a, b);
    if (listChanges) {
      for (const lc of listChanges) {
        if (lc.status === "added") listItemsAdded += 1;
        else if (lc.status === "removed") listItemsRemoved += 1;
        else if (lc.status === "changed") listItemsChanged += 1;
      }
    }

    const hasChanges =
      fields.some((f) => f.status === "changed") ||
      (listChanges?.some((l) => l.status !== "unchanged") ?? false);

    sections.push({
      key: sec.key,
      number: sec.number,
      title: sec.title,
      fields,
      listChanges,
      hasChanges,
    });
  }

  const hasChanges = sections.some((s) => s.hasChanges);

  return {
    sections,
    hasChanges,
    stats: { fieldsChanged, listItemsAdded, listItemsRemoved, listItemsChanged },
  };
}

// ============================================================
// Listas (riscos / controles / ações) — diff por chave
// ============================================================

function computeListChanges(
  sec: SectionDef,
  a: RipdData,
  b: RipdData
): ListItemDiff[] | undefined {
  if (sec.hasList === "risks") {
    return diffByKey(
      a.s6.risks,
      b.s6.risks,
      (r) => r.code,
      (r) => r.label,
      (oldR, newR) => {
        const parts: string[] = [];
        if (oldR.severityLevel !== newR.severityLevel) {
          parts.push(
            `severidade: ${oldR.severityLevel || "—"} → ${newR.severityLevel || "—"}`
          );
        }
        if (oldR.status !== newR.status) {
          parts.push(`status: ${oldR.status} → ${newR.status}`);
        }
        if ((oldR.description ?? "") !== (newR.description ?? "")) {
          parts.push("descrição editada");
        }
        if ((oldR.mitigationSummary ?? "") !== (newR.mitigationSummary ?? "")) {
          parts.push("mitigação editada");
        }
        return parts.join("; ");
      }
    );
  }
  if (sec.hasList === "existingControls") {
    // S7 tem 2 listas (controles + ações). Vamos juntar num array só
    // com prefixos pra distinguir.
    const ctrlDiffs = diffByKey(
      a.s7.existingControls,
      b.s7.existingControls,
      (c) => `ctrl:${c.code}`,
      (c) => `Controle ${c.code} — ${c.label}`,
      (oldC, newC) => {
        if ((oldC.cenarioAtual ?? "") !== (newC.cenarioAtual ?? "")) {
          return "cenário atual editado";
        }
        return "";
      }
    );
    const actDiffs = diffByKey(
      a.s7.plannedActions,
      b.s7.plannedActions,
      (act) => `act:${act.id}`,
      (act) => `Ação — ${act.title}`,
      (oldA, newA) => {
        const parts: string[] = [];
        if (oldA.status !== newA.status) parts.push(`status: ${oldA.status} → ${newA.status}`);
        if (oldA.priority !== newA.priority) parts.push(`prioridade: ${oldA.priority} → ${newA.priority}`);
        if ((oldA.dueDate ?? "") !== (newA.dueDate ?? "")) parts.push("prazo alterado");
        if (oldA.title !== newA.title) parts.push("título editado");
        return parts.join("; ");
      }
    );
    return [...ctrlDiffs, ...actDiffs];
  }
  return undefined;
}

/**
 * Compara duas listas por chave estável e devolve diff de cada item.
 * Itens não-modificados saem com status "unchanged" mas são filtrados
 * antes de exibir na UI.
 */
function diffByKey<T>(
  oldList: ReadonlyArray<T>,
  newList: ReadonlyArray<T>,
  getKey: (item: T) => string,
  getLabel: (item: T) => string,
  diffDetail: (oldItem: T, newItem: T) => string
): ListItemDiff[] {
  const oldByKey = new Map<string, T>(oldList.map((i) => [getKey(i), i]));
  const newByKey = new Map<string, T>(newList.map((i) => [getKey(i), i]));
  const allKeys = new Set([...oldByKey.keys(), ...newByKey.keys()]);

  const out: ListItemDiff[] = [];
  for (const key of allKeys) {
    const oldItem = oldByKey.get(key);
    const newItem = newByKey.get(key);
    if (oldItem && newItem) {
      const detail = diffDetail(oldItem, newItem);
      if (detail) {
        out.push({
          itemKey: key,
          label: getLabel(newItem),
          status: "changed",
          oldItem,
          newItem,
          detail,
        });
      } else {
        out.push({
          itemKey: key,
          label: getLabel(newItem),
          status: "unchanged",
          oldItem,
          newItem,
        });
      }
    } else if (oldItem) {
      out.push({
        itemKey: key,
        label: getLabel(oldItem),
        status: "removed",
        oldItem,
      });
    } else if (newItem) {
      out.push({
        itemKey: key,
        label: getLabel(newItem),
        status: "added",
        newItem,
      });
    }
  }
  return out;
}
