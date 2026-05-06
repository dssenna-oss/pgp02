"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, AlertCircle, AlertTriangle } from "lucide-react";
import {
  type LiaData,
  type LiaDTO,
  liaIsBlocked,
} from "@/lib/lia-helpers";
import { LIA_TEMPLATE, type LiaQuestion } from "@/lib/lia-templates";

interface Props {
  liaId: string;
  source: "current" | "published";
}

/**
 * View de impressão da LIA (Checkpoint 21 / Fatia 2).
 *
 * Layout dedicado, sem DashboardLayout. Auto-print via `?autoprint=1`.
 * Renderiza as 3 etapas estruturadas com 1 pergunta por bloco.
 */
export default function LiaPdfView({ liaId, source }: Props) {
  const [lia, setLia] = useState<LiaDTO | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [printed, setPrinted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [lRes, sessionRes] = await Promise.all([
          fetch(`/api/lia/${liaId}`, { cache: "no-store" }),
          fetch("/api/auth/session"),
        ]);
        if (lRes.ok) {
          const j = await lRes.json();
          setLia(j.lia);
        } else {
          const err = await lRes.json().catch(() => ({}));
          setError(err.error ?? "Erro ao carregar LIA");
        }
        if (sessionRes.ok) {
          const s = await sessionRes.json();
          setCompanyName(s?.user?.company?.companyName ?? "Organização");
        }
      } catch {
        setError("Erro de rede");
      }
    })();
  }, [liaId]);

  useEffect(() => {
    if (!lia || printed) return;
    if (typeof window === "undefined") return;
    const ap = new URL(window.location.href).searchParams.get("autoprint");
    if (ap !== "1") return;
    const t = setTimeout(() => {
      window.print();
      setPrinted(true);
    }, 600);
    return () => clearTimeout(t);
  }, [lia, printed]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-sm">
        {error}
      </div>
    );
  }
  if (!lia) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Preparando documento…
      </div>
    );
  }

  const data: LiaData | null =
    source === "published" ? lia.publishedContent ?? null : lia.data;

  const isPublishedView = source === "published" && lia.publishedContent;
  const blocked = data ? liaIsBlocked(data) : false;

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-12 gap-3">
        <AlertCircle className="h-10 w-10 text-amber-500" />
        <p className="font-semibold">Esta LIA ainda não tem versão aprovada.</p>
        <p className="text-sm text-muted-foreground max-w-md">
          Pra exportar o rascunho atual, acesse a tela de PDF com{" "}
          <code>?source=current</code>.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/lia/${liaId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .pdf-page { padding: 0 !important; max-width: none !important; }
          .pdf-section { break-inside: avoid; page-break-inside: avoid; }
        }
        @page { size: A4; margin: 1.5cm; }
      `}</style>

      <div className="no-print sticky top-0 z-10 border-b bg-white dark:bg-gray-950 dark:border-gray-800 p-3 flex items-center justify-between gap-2 shadow-sm">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/lia/${liaId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
        </Button>
        <Button onClick={() => window.print()} size="sm">
          <Printer className="h-4 w-4 mr-1.5" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="pdf-page max-w-4xl mx-auto px-8 py-10 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <header className="text-center pb-6 mb-6 border-b-2 border-gray-300">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
            Lei nº 13.709/2018 (LGPD) — Art. 10 §3º · Art. 7º IX
          </p>
          <h1 className="text-2xl font-bold mb-2">
            Avaliação de Legítimo Interesse (LIA)
          </h1>
          <h2 className="text-xl font-semibold mb-3 text-violet-700 dark:text-violet-300">
            {lia.title}
          </h2>
          {lia.inventory?.serviceName && (
            <p className="text-sm italic text-gray-600 dark:text-gray-400 mb-4">
              Processo: {lia.inventory.serviceName}
            </p>
          )}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm max-w-2xl mx-auto pt-2 border-t border-gray-200 dark:border-gray-700">
            <MetaRow label="Organização" value={companyName} />
            <MetaRow
              label="Versão"
              value={
                isPublishedView
                  ? `v${lia.publishedVersionNum ?? "?"}${
                      lia.publishedAt
                        ? ` (publicada ${new Date(lia.publishedAt).toLocaleDateString("pt-BR")})`
                        : ""
                    }`
                  : "Rascunho atual (não publicada)"
              }
            />
            <MetaRow label="Status" value={statusLabel(lia.status)} />
            <MetaRow
              label="Aprovador"
              value={lia.approvedBy?.name ?? lia.approvedBy?.email ?? "—"}
            />
            <MetaRow
              label="Documento gerado em"
              value={new Date().toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
          </div>
        </header>

        {blocked && (
          <div className="pdf-section mb-6 rounded-lg border-2 border-red-300 bg-red-50 p-4 text-red-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  ⚠️ Esta avaliação indica bloqueio estrutural
                </p>
                <p className="text-sm mt-1">
                  O tratamento envolve dados sensíveis (Art. 11) ou de
                  crianças/adolescentes (Art. 14). Legítimo interesse não se
                  aplica — a base legal precisa ser revisada antes de prosseguir.
                </p>
              </div>
            </div>
          </div>
        )}

        {LIA_TEMPLATE.map((sec, i) => (
          <section key={sec.key} className="pdf-section mb-8">
            <h3 className="text-lg font-bold mb-1 text-violet-900 dark:text-violet-200">
              Etapa {i + 1}: {sec.title}
            </h3>
            <p className="text-xs italic text-gray-600 dark:text-gray-400 mb-3">
              {sec.subtitle}
            </p>

            <div className="space-y-3">
              {sec.questions.map((q) => (
                <QuestionView key={q.path} q={q} data={data} />
              ))}
            </div>
          </section>
        ))}

        {/* Decisão final destacada */}
        {data.s3.decisaoFinal && (
          <section className="pdf-section mb-6">
            <div
              className={`rounded-lg border-2 p-4 text-center ${
                data.s3.decisaoFinal === "prevalece"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-red-300 bg-red-50 text-red-900"
              }`}
            >
              <p className="text-base font-bold">
                {data.s3.decisaoFinal === "prevalece"
                  ? "✓ Decisão: o legítimo interesse prevalece"
                  : "✕ Decisão: o legítimo interesse NÃO prevalece"}
              </p>
            </div>
          </section>
        )}

        <footer className="border-t-2 border-gray-300 pt-4 mt-8 text-center text-xs text-gray-500">
          <p>
            Documento gerado automaticamente pelo PGP em{" "}
            {new Date().toLocaleDateString("pt-BR")} · {companyName}
          </p>
        </footer>
      </div>
    </>
  );
}

// ============================================================
// Helpers
// ============================================================

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-2">
      <span className="font-semibold text-gray-700 dark:text-gray-300">
        {label}:
      </span>
      <span className="text-gray-900 dark:text-gray-100 text-right">
        {value}
      </span>
    </p>
  );
}

function statusLabel(s: string): string {
  switch (s) {
    case "RASCUNHO":   return "Rascunho";
    case "EM_REVISAO": return "Em revisão";
    case "APROVADO":   return "Aprovada";
    case "ARQUIVADO":  return "Arquivada";
    default:           return s;
  }
}

function QuestionView({ q, data }: { q: LiaQuestion; data: LiaData }) {
  const value = getValue(data, q.path);
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
        {q.label.replace(/^🚨\s*/, "")}
      </p>
      {renderAnswer(q, value)}
    </div>
  );
}

function renderAnswer(q: LiaQuestion, value: unknown): React.ReactElement {
  if (q.type === "textarea") {
    const text = typeof value === "string" ? value.trim() : "";
    return text ? (
      <p className="text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100">
        {text}
      </p>
    ) : (
      <p className="text-sm italic text-gray-400">—</p>
    );
  }
  if (q.type === "radio") {
    if (value == null || value === "") {
      return <p className="text-sm italic text-gray-400">— (não respondido)</p>;
    }
    const opt = q.options?.find((o) => o.value === String(value));
    return (
      <p
        className={`text-sm font-medium ${
          opt?.tone === "danger"
            ? "text-red-700"
            : opt?.tone === "warning"
            ? "text-amber-700"
            : opt?.tone === "ok"
            ? "text-emerald-700"
            : "text-gray-900"
        }`}
      >
        → {opt?.label ?? String(value)}
      </p>
    );
  }
  if (q.type === "checkbox-group") {
    const obj = (value as Record<string, boolean>) ?? {};
    const items = q.checkboxes ?? [];
    return (
      <ul className="text-sm space-y-0.5">
        {items.map((cb) => (
          <li
            key={cb.key}
            className={`${obj[cb.key] ? "text-gray-900" : "text-gray-400"}`}
          >
            {obj[cb.key] ? "✓" : "○"} {cb.label}
          </li>
        ))}
      </ul>
    );
  }
  return <></>;
}

function getValue(data: LiaData, path: string): unknown {
  const parts = path.split(".");
  let cur: any = data;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
