"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { policyTypeLabel } from "@/lib/policies-helpers";

interface Props {
  policyId: string;
  source: "current" | "published";
}

interface ApiResponse {
  policy: {
    id: string;
    type: string;
    title: string;
    currentContent: string;
    publishedContent: string | null;
    publishedAt: string | null;
    currentVersion: number;
  };
}

/**
 * View de impressão de uma política. Mesmo padrão do PDF do GAP:
 * layout dedicado, auto-print via `?autoprint=1`, botão pra reabrir
 * diálogo manualmente.
 */
export default function PolicyPdfView({ policyId, source }: Props) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [printed, setPrinted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [polRes, sessionRes] = await Promise.all([
          fetch(`/api/politicas/${policyId}`, { cache: "no-store" }),
          fetch("/api/auth/session"),
        ]);
        if (polRes.ok) {
          const j = await polRes.json();
          setData({ policy: j.policy });
        } else {
          const err = await polRes.json().catch(() => ({}));
          setError(err.error ?? "Erro ao carregar política");
        }
        if (sessionRes.ok) {
          const s = await sessionRes.json();
          setCompanyName(s?.user?.company?.companyName ?? "Organização");
        }
      } catch {
        setError("Erro de rede");
      }
    })();
  }, [policyId]);

  // Auto-print apenas com ?autoprint=1
  useEffect(() => {
    if (!data || printed) return;
    if (typeof window === "undefined") return;
    const autoprint = new URL(window.location.href).searchParams.get("autoprint");
    if (autoprint !== "1") return;
    const t = setTimeout(() => {
      window.print();
      setPrinted(true);
    }, 600);
    return () => clearTimeout(t);
  }, [data, printed]);

  const html = useMemo(() => {
    if (!data) return "";
    const content =
      source === "published"
        ? data.policy.publishedContent ?? data.policy.currentContent
        : data.policy.currentContent;
    return marked.parse(content) as string;
  }, [data, source]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-sm">
        {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Preparando documento...
      </div>
    );
  }

  const { policy } = data;
  const isPublished = source === "published" && policy.publishedContent;

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

      {/* Barra de controles */}
      <div className="no-print sticky top-0 z-10 border-b bg-white dark:bg-gray-950 dark:border-gray-800 p-3 flex items-center justify-between gap-2 shadow-sm">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/politicas/${policyId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
        </Button>
        <div className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
          Diálogo de impressão abre automaticamente — escolha "Salvar como PDF" no destino.
        </div>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1.5" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="pdf-page max-w-3xl mx-auto p-8 bg-white text-gray-900 dark:bg-white dark:text-gray-900">
        {/* Capa simplificada */}
        <header className="pdf-section pb-6 border-b border-gray-300 mb-6">
          <p className="text-xs uppercase tracking-widest text-blue-700 font-semibold">
            {policyTypeLabel(policy.type)}
          </p>
          <h1 className="text-3xl font-bold mt-2">{policy.title}</h1>
          <p className="text-sm text-gray-600 mt-3">
            {companyName}
            {isPublished && policy.publishedAt && (
              <>
                {" · "}Versão {policy.currentVersion}
                {" · "}Publicada em{" "}
                {new Date(policy.publishedAt).toLocaleDateString("pt-BR")}
              </>
            )}
            {!isPublished && (
              <>
                {" · "}<strong>RASCUNHO</strong> — gerado em{" "}
                {new Date().toLocaleDateString("pt-BR")}
              </>
            )}
          </p>
        </header>

        {/* Conteúdo */}
        <article
          className="policy-article"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <footer className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-500">
          <p>
            Documento gerado pelo sistema PGP — Programa de Governança em
            Privacidade.
          </p>
        </footer>
      </div>

      {/* Estilos do preview (mesma classe da view pública) */}
      <style jsx global>{`
        .policy-article { line-height: 1.7; color: #1f2937; }
        .policy-article h1 { font-size: 1.875rem; font-weight: 700; margin: 2rem 0 1rem; color: #111827; }
        .policy-article h2 { font-size: 1.5rem; font-weight: 600; margin: 2rem 0 0.75rem; color: #111827; }
        .policy-article h3 { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.5rem; color: #111827; }
        .policy-article h4 { font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.5rem; }
        .policy-article p { margin: 0.75rem 0; }
        .policy-article ul { list-style: disc; padding-left: 1.5rem; margin: 0.75rem 0; }
        .policy-article ol { list-style: decimal; padding-left: 1.5rem; margin: 0.75rem 0; }
        .policy-article li { margin: 0.25rem 0; }
        .policy-article a { color: #2563eb; text-decoration: underline; }
        .policy-article strong { font-weight: 600; }
        .policy-article em { font-style: italic; }
        .policy-article hr { margin: 2rem 0; border: 0; border-top: 1px solid #e5e7eb; }
        .policy-article blockquote { border-left: 4px solid #d1d5db; padding-left: 1rem; margin: 1rem 0; color: #4b5563; font-style: italic; }
        .policy-article table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.875rem; }
        .policy-article th, .policy-article td { border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; text-align: left; }
        .policy-article th { background: #f9fafb; font-weight: 600; }
      `}</style>
    </>
  );
}
