"use client";

import { marked } from "marked";
import { useMemo } from "react";

interface Props {
  companyName: string;
  logoUrl: string | null;
  website: string | null;
  type: string;
  typeLabel: string;
  title: string;
  content: string;
  publishedAt: string | null;
  version: number;
}

/**
 * View pública de uma política — `/p/<companySlug>/<policySlug>`.
 * Sem sidebar, sem dashboard, layout limpo pra titular/cliente ler.
 *
 * Renderiza markdown via `marked`. Estilo Tailwind prose-like aplicado
 * com classes manuais (sem `@tailwindcss/typography` pra não adicionar
 * dependência).
 */
export default function PublicPolicyView({
  companyName,
  logoUrl,
  website,
  type,
  typeLabel,
  title,
  content,
  publishedAt,
  version,
}: Props) {
  const html = useMemo(() => marked.parse(content) as string, [content]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center gap-4">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={companyName}
              className="h-12 w-12 object-contain rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Documento oficial
            </p>
            <h2 className="text-base font-semibold text-gray-900">{companyName}</h2>
          </div>
          {website && (
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
          )}
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <p className="text-xs uppercase tracking-wide font-medium text-blue-700">
            {typeLabel}
          </p>
          <h1 className="text-3xl font-bold mt-1">{title}</h1>
          {publishedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Versão {version} · Publicada em{" "}
              {new Date(publishedAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>

        <article
          className="policy-article"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <footer className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-500">
          <p>
            Documento mantido por <strong>{companyName}</strong>. Para dúvidas,
            entre em contato pelos canais informados acima.
          </p>
          <p className="mt-1">
            Este documento foi gerado pelo sistema PGP — Programa de
            Governança em Privacidade.
          </p>
        </footer>
      </main>

      {/* Estilo prose aplicado direto sem @tailwindcss/typography */}
      <style jsx global>{`
        .policy-article {
          line-height: 1.7;
          color: #1f2937;
        }
        .policy-article h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 2rem 0 1rem;
          color: #111827;
        }
        .policy-article h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 2rem 0 0.75rem;
          color: #111827;
        }
        .policy-article h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1.5rem 0 0.5rem;
          color: #111827;
        }
        .policy-article h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem;
        }
        .policy-article p {
          margin: 0.75rem 0;
        }
        .policy-article ul {
          list-style: disc;
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }
        .policy-article ol {
          list-style: decimal;
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }
        .policy-article li {
          margin: 0.25rem 0;
        }
        .policy-article a {
          color: #2563eb;
          text-decoration: underline;
        }
        .policy-article strong {
          font-weight: 600;
        }
        .policy-article em {
          font-style: italic;
        }
        .policy-article code {
          background: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 0.875em;
        }
        .policy-article hr {
          margin: 2rem 0;
          border: 0;
          border-top: 1px solid #e5e7eb;
        }
        .policy-article blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #4b5563;
          font-style: italic;
        }
        .policy-article table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 0.875rem;
        }
        .policy-article th,
        .policy-article td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem 0.75rem;
          text-align: left;
        }
        .policy-article th {
          background: #f9fafb;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
