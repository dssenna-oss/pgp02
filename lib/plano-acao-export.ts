/**
 * Builder do XLSX do Plano de Ação (Checkpoint 11 / D3).
 *
 * Gera 1 aba "Plano de Ação" com 1 linha por ação. Função pura — caller
 * passa as ações já carregadas + dicionários auxiliares pra resolver
 * refs polimórficas (GAP/Risco/Inventário).
 */

import * as XLSX from "xlsx";
import {
  originLabel,
  priorityLabel,
  statusLabel,
} from "@/lib/action-plan-helpers";

export interface ExportAction {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  origin: string;
  refGapCode: string | null;
  refRiskId: string | null;
  refInventoryId: string | null;
  assignee: { name: string | null; email: string } | null;
  dueDate: Date | null;
  priority: string;
  status: string;
  completedAt: Date | null;
  createdBy: { name: string | null; email: string } | null;
  createdAt: Date;
}

export interface ExportInput {
  companyName: string;
  actions: ReadonlyArray<ExportAction>;
  inventoryNameById: Record<string, string>;
  gapDomainByCode: Record<string, string>;
}

function refDisplay(
  a: ExportAction,
  resolver: { inventoryNameById: Record<string, string>; gapDomainByCode: Record<string, string> },
): string {
  if (a.origin === "GAP" && a.refGapCode) {
    const dom = resolver.gapDomainByCode[a.refGapCode];
    return dom ? `GAP #${a.refGapCode} — ${dom}` : `GAP #${a.refGapCode}`;
  }
  if (a.origin === "RISCO" && a.refRiskId) {
    const inv = a.refInventoryId
      ? resolver.inventoryNameById[a.refInventoryId]
      : null;
    return inv ? `Risco em "${inv}"` : "Risco identificado";
  }
  if (a.origin === "BASES" && a.refInventoryId) {
    const inv = resolver.inventoryNameById[a.refInventoryId];
    return inv ? `Bases legais — ${inv}` : "Bases legais (processo)";
  }
  return "—";
}

function fmtDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("pt-BR");
}

function fmtDateTime(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleString("pt-BR");
}

export function buildPlanoAcaoXLSX(input: ExportInput): Buffer {
  const wb = XLSX.utils.book_new();
  const rows: any[][] = [];

  // L1: título
  rows.push([
    `Plano de Ação — ${input.companyName} — exportado em ${new Date().toLocaleString("pt-BR")}`,
  ]);
  rows.push([]); // L2 vazia

  // L3: headers
  rows.push([
    "#",
    "Status",
    "Prioridade",
    "Origem",
    "Referência",
    "Título",
    "Descrição",
    "Responsável",
    "Prazo",
    "Concluída em",
    "Notas",
    "Criada por",
    "Criada em",
  ]);

  // L4+: 1 linha por ação
  let n = 1;
  for (const a of input.actions) {
    rows.push([
      n++,
      statusLabel(a.status),
      priorityLabel(a.priority),
      originLabel(a.origin),
      refDisplay(a, input),
      a.title,
      a.description ?? "",
      a.assignee?.name ?? a.assignee?.email ?? "",
      fmtDate(a.dueDate),
      fmtDateTime(a.completedAt),
      a.notes ?? "",
      a.createdBy?.name ?? a.createdBy?.email ?? "",
      fmtDateTime(a.createdAt),
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 5 },   // #
    { wch: 14 },  // Status
    { wch: 12 },  // Prioridade
    { wch: 16 },  // Origem
    { wch: 35 },  // Referência
    { wch: 50 },  // Título
    { wch: 60 },  // Descrição
    { wch: 22 },  // Responsável
    { wch: 12 },  // Prazo
    { wch: 18 },  // Concluída em
    { wch: 40 },  // Notas
    { wch: 22 },  // Criada por
    { wch: 18 },  // Criada em
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Plano de Ação");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return buf as Buffer;
}

export function suggestPlanoAcaoFilename(companyName: string): string {
  const safe = (s: string) =>
    s.normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60);
  const date = new Date().toISOString().slice(0, 10);
  return `Plano_de_Acao_${safe(companyName) || "Organizacao"}_${date}.xlsx`;
}
