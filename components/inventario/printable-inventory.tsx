"use client";

/**
 * Versão impressa/PDF do Inventário.
 *
 * Renderiza TODAS as perguntas do questionário (mesmo as não respondidas)
 * com o MESMO visual da tela de Revisão e Conclusão:
 *  - Card-resumo no topo
 *  - Cada seção com ícone + cor + barra lateral + badge de status
 *  - Perguntas em negrito com ícone HelpCircle (ou AlertTriangle se atenção)
 *  - Multi-choice como chips/badges
 *  - Highlight amarelo em respostas críticas
 *
 * Visível apenas em `@media print` — `hidden print:block` no wrapper.
 */
import { useState, useEffect } from "react";
import {
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ListChecks,
  User as UserIcon,
  FileText,
  Database,
  Activity,
  Inbox,
  Share2,
  Server,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  INVENTARIO_FORM_SCHEMA,
  isFieldVisible,
  type FormField,
  type FormAnswers,
  type WizardStep,
} from "@/lib/inventario-form-schema";

const SECTION_META: Record<string, { Icon: LucideIcon; color: string; bg: string; border: string }> = {
  sec1: { Icon: UserIcon, color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-500" },
  sec2: { Icon: FileText, color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-500" },
  sec3: { Icon: Database, color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-500" },
  sec4: { Icon: Activity, color: "text-pink-600",    bg: "bg-pink-50",    border: "border-pink-500" },
  sec5: { Icon: Inbox,    color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-500" },
  sec6: { Icon: Share2,   color: "text-cyan-600",    bg: "bg-cyan-50",    border: "border-cyan-500" },
  sec7: { Icon: Server,   color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-500" },
};

const ATTENTION_HIGHLIGHTS: Record<string, string[]> = {
  data_sensitive_yn: ["Sim"],
  use_automated_decision: ["Sim"],
  use_marketing: ["Sim"],
  share_international: ["Sim"],
  store_paper_external: ["Sim"],
};

function isAttention(fieldId: string, value: any): boolean {
  const triggers = ATTENTION_HIGHLIGHTS[fieldId];
  if (!triggers) return false;
  if (Array.isArray(value)) return value.some((v) => triggers.includes(v));
  return triggers.includes(value);
}

interface PrintableInventoryProps {
  answers: FormAnswers;
  organizationName?: string;
  printedBy?: string;
}

export function PrintableInventory({
  answers,
  organizationName,
  printedBy,
}: PrintableInventoryProps) {
  const sections = INVENTARIO_FORM_SCHEMA.filter(
    (s): s is Extract<WizardStep, { kind: "section" }> => s.kind === "section"
  );

  const sec1 = (answers as any).sec1 ?? {};
  const processName =
    (answers as any).sec2?.process_name?.toString().trim() || "(processo sem nome)";

  const [printedAt, setPrintedAt] = useState("");
  useEffect(() => {
    setPrintedAt(new Date().toLocaleString("pt-BR"));
  }, []);
  const completedAt = answers._meta?.completedAt
    ? new Date(answers._meta.completedAt).toLocaleString("pt-BR")
    : printedAt;

  // Stats agregados
  let totalVisible = 0;
  let totalFilled = 0;
  let completeSections = 0;
  let attentionPoints = 0;
  for (const sec of sections) {
    const sa = ((answers as any)[sec.id] ?? {}) as Record<string, any>;
    const visible = sec.fields.filter((f) => isFieldVisible(f, sa));
    const filled = visible.filter((f) => {
      const v = sa[f.id];
      return Array.isArray(v) ? v.length > 0 : !!v?.toString().trim();
    });
    totalVisible += visible.length;
    totalFilled += filled.length;
    if (filled.length === visible.length && visible.length > 0) completeSections++;
    for (const f of visible) {
      if (isAttention(f.id, sa[f.id])) attentionPoints++;
    }
  }
  const pct = totalVisible ? Math.round((totalFilled / totalVisible) * 100) : 0;
  const allComplete = totalFilled === totalVisible && totalVisible > 0;

  return (
    <div
      className="hidden print:block bg-white text-gray-900"
      style={{ fontFamily: "Inter, -apple-system, system-ui, sans-serif" }}
    >
      {/* Cabeçalho oficial — usa <div> em vez de <header> pra escapar
          do CSS de print que esconde <header> do dashboard. */}
      <div className="mb-6 pb-4 border-b-2 border-gray-900">
        <h1 className="text-xl font-bold mb-0.5">
          Mapeamento de Dados Pessoais (LGPD)
        </h1>
        <p className="text-sm text-gray-700">Processo: <strong>{processName}</strong></p>
        {organizationName && (
          <p className="text-sm text-gray-700 mt-0.5">
            Organização: <strong>{organizationName}</strong>
          </p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-gray-700">
          <div>
            <strong>Respondente:</strong> {sec1.respondent_name || "—"}
            {sec1.respondent_role ? ` · ${sec1.respondent_role}` : ""}
          </div>
          <div>
            <strong>Departamento:</strong> {sec1.respondent_department || "—"}
          </div>
          <div>
            <strong>E-mail:</strong> {sec1.respondent_email || "—"}
          </div>
          <div>
            <strong>Data:</strong> {completedAt || "—"}
          </div>
        </div>
      </div>

      {/* Card-resumo */}
      <div
        className={`rounded-lg border-l-4 p-3 mb-5 print-section ${
          allComplete
            ? "border-emerald-500 bg-emerald-50"
            : "border-amber-500 bg-amber-50"
        }`}
      >
        <div className="flex items-start gap-2">
          <Sparkles
            className={`h-5 w-5 shrink-0 ${
              allComplete ? "text-emerald-600" : "text-amber-600"
            }`}
          />
          <div className="text-xs text-gray-800">
            <p className="font-semibold">
              {completeSections} de {sections.length} seções concluídas ·{" "}
              {totalFilled} de {totalVisible} perguntas respondidas · {pct}%
            </p>
            <p className="mt-0.5 text-gray-600">
              {allComplete
                ? "Mapeamento completo."
                : "Algumas perguntas opcionais ficaram em branco."}
              {attentionPoints > 0 && (
                <>
                  {" "}
                  <strong>{attentionPoints} ponto(s) de atenção</strong> destacados
                  em amarelo (transferência internacional, dados sensíveis, etc.).
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Seções */}
      {sections.map((sec) => (
        <PrintSectionCard
          key={sec.id}
          section={sec}
          answers={answers}
        />
      ))}

      {/* Rodapé — também <div> pra evitar que CSS oculte */}
      <div className="mt-8 pt-3 border-t border-gray-300 text-[10px] text-gray-500">
        <ListChecks className="inline h-3 w-3 mr-1 align-text-bottom" />
        Documento gerado pelo Sistema PGP — Programa de Governança em Privacidade
        {printedBy ? ` · Impresso por ${printedBy}` : ""}
        {printedAt ? ` · ${printedAt}` : ""}
      </div>
    </div>
  );
}

function PrintSectionCard({
  section,
  answers,
}: {
  section: Extract<WizardStep, { kind: "section" }>;
  answers: FormAnswers;
}) {
  const sa = ((answers as any)[section.id] ?? {}) as Record<string, any>;
  const visible = section.fields.filter((f) => isFieldVisible(f, sa));
  const filled = visible.filter((f) => {
    const v = sa[f.id];
    return Array.isArray(v) ? v.length > 0 : !!v?.toString().trim();
  });
  const isComplete = filled.length === visible.length && visible.length > 0;
  const meta = SECTION_META[section.id] ?? SECTION_META.sec1;
  const Icon = meta.Icon;

  return (
    <section className="mb-5 print-section border border-gray-200 rounded-lg overflow-hidden">
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2 border-l-4 ${meta.bg} ${meta.border}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon className={`h-4 w-4 shrink-0 ${meta.color}`} />
          <h3 className="font-bold text-sm">{section.title}</h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 ${
            isComplete
              ? "bg-emerald-600 text-white"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {isComplete && <CheckCircle2 className="h-3 w-3" />}
          {filled.length} de {visible.length}
          {isComplete && " · Completo"}
        </span>
      </div>
      <div className="p-3 space-y-2 text-xs">
        {section.description && (
          <p className="text-[10px] italic text-gray-500 mb-2">{section.description}</p>
        )}
        {visible.map((f) => (
          <PrintField key={f.id} field={f} value={sa[f.id]} />
        ))}
      </div>
    </section>
  );
}

function PrintField({ field, value }: { field: FormField; value: any }) {
  const isEmpty = Array.isArray(value)
    ? value.length === 0
    : !value?.toString().trim();
  const attention = !isEmpty && isAttention(field.id, value);

  let display: React.ReactNode;
  if (isEmpty) {
    display = (
      <em className="text-gray-400">
        {field.required ? "(obrigatório, sem resposta)" : "Sem resposta"}
      </em>
    );
  } else if (Array.isArray(value)) {
    display = (
      <div className="flex flex-wrap gap-1">
        {value.map((v, i) => (
          <span
            key={i}
            className={`inline-block px-2 py-0.5 text-[10px] rounded-full font-normal ${
              v === "N/A"
                ? "bg-gray-100 text-gray-500"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {v}
          </span>
        ))}
      </div>
    );
  } else {
    display = <span className="whitespace-pre-line">{value}</span>;
  }

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-3 gap-2 pb-2 border-b border-gray-100 last:border-b-0 last:pb-0 break-inside-avoid ${
        attention ? "bg-yellow-50 -mx-2 px-2 py-2 rounded" : ""
      }`}
    >
      <div className="md:col-span-1 flex items-start gap-1.5">
        {attention ? (
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 shrink-0 mt-0.5" />
        ) : (
          <HelpCircle className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <span className="font-bold text-gray-900 leading-snug">
            {field.label}
            {field.required && (
              <span className="text-gray-400 font-normal"> *</span>
            )}
          </span>
          {field.description && (
            <div className="text-[9px] text-gray-500 italic mt-0.5">
              {field.description}
            </div>
          )}
        </div>
      </div>
      <div className="md:col-span-2 text-gray-700">{display}</div>
    </div>
  );
}
