"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, AlertCircle } from "lucide-react";
import {
  RIPD_SECTIONS,
  getFieldValue,
} from "@/components/ripd/ripd-section-fields";
import type { RipdData, RipdDTO } from "@/lib/ripd-helpers";

interface Props {
  ripdId: string;
  source: "current" | "published";
}

/**
 * View de impressão do RIPD (Checkpoint 13 / F4).
 *
 * Layout dedicado, sem DashboardLayout. Auto-print via `?autoprint=1`.
 * Renderiza as 8 seções estruturadas (não usa markdown como Políticas).
 */
export default function RipdPdfView({ ripdId, source }: Props) {
  const [ripd, setRipd] = useState<RipdDTO | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [printed, setPrinted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [rRes, sessionRes] = await Promise.all([
          fetch(`/api/ripd/${ripdId}`, { cache: "no-store" }),
          fetch("/api/auth/session"),
        ]);
        if (rRes.ok) {
          const j = await rRes.json();
          setRipd(j.ripd);
        } else {
          const err = await rRes.json().catch(() => ({}));
          setError(err.error ?? "Erro ao carregar RIPD");
        }
        if (sessionRes.ok) {
          const s = await sessionRes.json();
          setCompanyName(s?.user?.company?.companyName ?? "Organização");
        }
      } catch {
        setError("Erro de rede");
      }
    })();
  }, [ripdId]);

  useEffect(() => {
    if (!ripd || printed) return;
    if (typeof window === "undefined") return;
    const ap = new URL(window.location.href).searchParams.get("autoprint");
    if (ap !== "1") return;
    const t = setTimeout(() => {
      window.print();
      setPrinted(true);
    }, 600);
    return () => clearTimeout(t);
  }, [ripd, printed]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-sm">
        {error}
      </div>
    );
  }
  if (!ripd) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Preparando documento…
      </div>
    );
  }

  const data: RipdData | null =
    source === "published"
      ? (ripd.publishedContent ?? null)
      : ripd.data;

  const isPublishedView = source === "published" && ripd.publishedContent;

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-12 gap-3">
        <AlertCircle className="h-10 w-10 text-amber-500" />
        <p className="font-semibold">Este RIPD ainda não tem versão aprovada.</p>
        <p className="text-sm text-muted-foreground max-w-md">
          Pra exportar o rascunho atual, acesse a tela de PDF com{" "}
          <code>?source=current</code>.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/ripd/${ripdId}`}>
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

      {/* Barra de controles (oculta na impressão) */}
      <div className="no-print sticky top-0 z-10 border-b bg-white dark:bg-gray-950 dark:border-gray-800 p-3 flex items-center justify-between gap-2 shadow-sm">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/ripd/${ripdId}`}>
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
        {/* Capa */}
        <header className="text-center pb-6 mb-6 border-b-2 border-gray-300">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
            Lei nº 13.709/2018 (LGPD)
          </p>
          <h1 className="text-2xl font-bold mb-2">
            Relatório de Impacto à Proteção de Dados Pessoais (RIPD)
          </h1>
          <h2 className="text-xl font-semibold mb-3 text-blue-700 dark:text-blue-300">
            {ripd.title}
          </h2>
          {ripd.inventory?.serviceName && (
            <p className="text-sm italic text-gray-600 dark:text-gray-400 mb-4">
              Processo: {ripd.inventory.serviceName}
            </p>
          )}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm max-w-2xl mx-auto pt-2 border-t border-gray-200 dark:border-gray-700">
            <MetaRow label="Organização" value={companyName} />
            <MetaRow
              label="Versão"
              value={
                isPublishedView
                  ? `v${ripd.publishedVersionNum ?? "?"}${
                      ripd.publishedAt
                        ? ` (publicada ${new Date(ripd.publishedAt).toLocaleDateString("pt-BR")})`
                        : ""
                    }`
                  : "Rascunho atual (não publicado)"
              }
            />
            <MetaRow label="Status" value={statusLabel(ripd.status)} />
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

        {/* Seções */}
        {RIPD_SECTIONS.map((sec) => (
          <section key={sec.key} className="pdf-section mb-8">
            <h3 className="text-lg font-bold mb-1 text-blue-900 dark:text-blue-200">
              {sec.number}. {sec.title}
            </h3>
            {sec.intro && (
              <p className="text-xs italic text-gray-600 dark:text-gray-400 mb-3">
                {sec.intro}
              </p>
            )}

            {/* Listas anexas */}
            {sec.hasList === "risks" && (
              <RisksTable risks={data.s6.risks} />
            )}
            {sec.hasList === "existingControls" && (
              <>
                <ControlsTable controls={data.s7.existingControls} />
                <ActionsTable actions={data.s7.plannedActions} />
              </>
            )}

            {/* Campos */}
            <div className="space-y-3">
              {sec.fields.map((f) => {
                const v = getFieldValue(data, f.path).trim();
                return (
                  <div key={f.path}>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                      {f.label}
                    </p>
                    {v ? (
                      <p className="text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                        {v}
                      </p>
                    ) : (
                      <p className="text-sm italic text-gray-400">—</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Rodapé */}
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
    case "APROVADO":   return "Aprovado";
    case "ARQUIVADO":  return "Arquivado";
    default:           return s;
  }
}

function RisksTable({ risks }: { risks: RipdData["s6"]["risks"] }) {
  if (risks.length === 0) {
    return (
      <p className="text-sm italic text-gray-500 mb-3">
        Nenhum risco identificado pra este processo.
      </p>
    );
  }
  return (
    <table className="w-full text-xs border-collapse mb-4 pdf-section">
      <thead>
        <tr className="bg-gray-100 dark:bg-gray-800">
          <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-left">Código</th>
          <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-left">Risco</th>
          <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-left">Severidade</th>
          <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-left">Status</th>
          <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-left">Descrição</th>
        </tr>
      </thead>
      <tbody>
        {risks.map((r) => (
          <tr key={r.code}>
            <td className="border border-gray-300 dark:border-gray-700 p-1.5 font-mono">
              {r.code}
            </td>
            <td className="border border-gray-300 dark:border-gray-700 p-1.5">
              {r.label}
            </td>
            <td className="border border-gray-300 dark:border-gray-700 p-1.5">
              {r.severityLevel || "—"}
            </td>
            <td className="border border-gray-300 dark:border-gray-700 p-1.5">
              {r.status}
            </td>
            <td className="border border-gray-300 dark:border-gray-700 p-1.5">
              {r.description || "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ControlsTable({
  controls,
}: {
  controls: RipdData["s7"]["existingControls"];
}) {
  return (
    <div className="mb-4 pdf-section">
      <p className="text-sm font-semibold mb-1.5">
        Controles aderentes do GAP ({controls.length})
      </p>
      {controls.length === 0 ? (
        <p className="text-sm italic text-gray-500 mb-2">
          Nenhum controle marcado como aderente no GAP Analysis.
        </p>
      ) : (
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-left w-20">Código</th>
              <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-left">Controle</th>
              <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-left">Cenário atual</th>
            </tr>
          </thead>
          <tbody>
            {controls.map((c) => (
              <tr key={c.code}>
                <td className="border border-gray-300 dark:border-gray-700 p-1.5 font-mono">
                  {c.code}
                </td>
                <td className="border border-gray-300 dark:border-gray-700 p-1.5">
                  {c.label}
                </td>
                <td className="border border-gray-300 dark:border-gray-700 p-1.5">
                  {c.cenarioAtual || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ActionsTable({
  actions,
}: {
  actions: RipdData["s7"]["plannedActions"];
}) {
  return (
    <div className="mb-4 pdf-section">
      <p className="text-sm font-semibold mb-1.5">
        Ações planejadas no Plano de Ação ({actions.length})
      </p>
      {actions.length === 0 ? (
        <p className="text-sm italic text-gray-500 mb-2">
          Nenhuma ação aberta ligada a este processo.
        </p>
      ) : (
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-left">Ação</th>
              <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-left w-32">Status</th>
              <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-left w-24">Prioridade</th>
              <th className="border border-gray-300 dark:border-gray-700 p-1.5 text-left w-24">Prazo</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.id}>
                <td className="border border-gray-300 dark:border-gray-700 p-1.5">
                  {a.title}
                </td>
                <td className="border border-gray-300 dark:border-gray-700 p-1.5">
                  {a.status}
                </td>
                <td className="border border-gray-300 dark:border-gray-700 p-1.5">
                  {a.priority}
                </td>
                <td className="border border-gray-300 dark:border-gray-700 p-1.5">
                  {a.dueDate
                    ? new Date(a.dueDate).toLocaleDateString("pt-BR")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
