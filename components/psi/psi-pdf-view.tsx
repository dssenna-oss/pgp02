"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import {
  type PsiData,
  type PsiDTO,
  PSI_SECTION_LABELS,
} from "@/lib/psi-helpers";
import { TEXTAREA_FIELDS, CONTROL_LABELS } from "@/lib/psi-diff";

interface Props {
  psiId: string;
  source: "current" | "published";
}

export default function PsiPdfView({ psiId, source }: Props) {
  const [psi, setPsi] = useState<PsiDTO | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [printed, setPrinted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, sessionRes] = await Promise.all([
          fetch(`/api/psi/${psiId}`, { cache: "no-store" }),
          fetch("/api/auth/session"),
        ]);
        if (pRes.ok) {
          const j = await pRes.json();
          setPsi(j.psi);
        } else {
          const err = await pRes.json().catch(() => ({}));
          setError(err.error ?? "Erro ao carregar PSI");
        }
        if (sessionRes.ok) {
          const s = await sessionRes.json();
          setCompanyName(s?.user?.company?.companyName ?? "Organização");
        }
      } catch {
        setError("Erro de rede");
      }
    })();
  }, [psiId]);

  useEffect(() => {
    if (!psi || printed) return;
    if (typeof window === "undefined") return;
    const ap = new URL(window.location.href).searchParams.get("autoprint");
    if (ap !== "1") return;
    const t = setTimeout(() => {
      window.print();
      setPrinted(true);
    }, 600);
    return () => clearTimeout(t);
  }, [psi, printed]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-sm">
        {error}
      </div>
    );
  }
  if (!psi) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Preparando documento…
      </div>
    );
  }

  const data: PsiData | null =
    source === "published" ? psi.publishedContent ?? null : psi.data;

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-12 gap-3">
        <AlertCircle className="h-10 w-10 text-amber-500" />
        <p className="font-semibold">Esta PSI ainda não tem versão aprovada.</p>
        <p className="text-sm text-muted-foreground max-w-md">
          Pra exportar o rascunho atual, acesse com <code>?source=current</code>.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/psi/${psiId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-900 min-h-screen pdf-root">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .pdf-root { padding: 0 !important; }
          .pdf-page { box-shadow: none !important; max-width: 100% !important; }
        }
        .pdf-root { padding: 24px; }
        .pdf-page {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px 48px;
        }
        .pdf-page h1 { font-size: 22px; font-weight: 700; margin: 24px 0 8px; }
        .pdf-page h2 { font-size: 17px; font-weight: 600; margin: 16px 0 6px; color: #0e7490; }
        .pdf-page h3 { font-size: 14px; font-weight: 600; margin: 10px 0 4px; }
        .pdf-page p { font-size: 13px; line-height: 1.55; margin: 6px 0; white-space: pre-wrap; }
        .pdf-page table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; }
        .pdf-page td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; vertical-align: top; }
        .ctrl-on { background: #ecfdf5; }
        .ctrl-off { background: #fef3c7; }
      `}</style>

      <div className="no-print max-w-4xl mx-auto mb-4 flex justify-between items-center">
        <Link href={`/dashboard/psi/${psiId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao editor
          </Button>
        </Link>
        <Button onClick={() => window.print()} size="sm">
          Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="pdf-page shadow-lg">
        {/* Capa */}
        <div style={{ textAlign: "center", padding: "40px 0", borderBottom: "2px solid #0e7490" }}>
          <h1 style={{ fontSize: 26, marginBottom: 8 }}>POLÍTICA DE SEGURANÇA DA INFORMAÇÃO</h1>
          <p style={{ fontSize: 18, fontWeight: 600 }}>{psi.title}</p>
          <p style={{ fontSize: 15 }}>{companyName}</p>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 12 }}>
            {psi.publishedVersionNum
              ? `Versão ${psi.publishedVersionNum} · ${psi.status}`
              : `Status: ${psi.status}`}
          </p>
          {psi.publishedAt && (
            <p style={{ fontSize: 12, color: "#6b7280" }}>
              Publicada em {new Date(psi.publishedAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>

        {/* Cabeçalho */}
        <h1>Cabeçalho</h1>
        {data.header.vigencia && (
          <>
            <h3>Vigência</h3>
            <p>{data.header.vigencia}</p>
          </>
        )}
        {data.header.aplicabilidade && (
          <>
            <h3>Aplicabilidade</h3>
            <p>{data.header.aplicabilidade}</p>
          </>
        )}
        {data.header.frequenciaRevisao && (
          <>
            <h3>Frequência de revisão</h3>
            <p>{data.header.frequenciaRevisao}</p>
          </>
        )}

        {/* 7 seções */}
        {PSI_SECTION_LABELS.map((meta, idx) => {
          const sectionData = (data as any)[meta.key] ?? {};
          const controles = sectionData.controles ?? {};
          const fields = TEXTAREA_FIELDS[meta.key] ?? [];
          const ctrlMap = CONTROL_LABELS[meta.key] ?? {};
          return (
            <div key={meta.key} style={{ pageBreakInside: "avoid" }}>
              <h1>
                {idx + 1}. {meta.icon} {meta.label}
              </h1>
              {fields.map((f) => {
                const val = String(sectionData[f.key] ?? "").trim();
                if (!val) return null;
                return (
                  <div key={f.key}>
                    <h3>{f.label}</h3>
                    {val.split(/\n+/).filter(Boolean).map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                );
              })}
              <h3>Controles aplicados</h3>
              <table>
                <tbody>
                  {Object.entries(ctrlMap).map(([key, label]) => {
                    const checked = Boolean(controles[key]);
                    return (
                      <tr key={key} className={checked ? "ctrl-on" : "ctrl-off"}>
                        <td>{label}</td>
                        <td style={{ width: 110, fontWeight: 600 }}>
                          {checked ? "✓ Aplicado" : "✗ Pendente"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: 32 }}>
          Documento gerado pelo Programa de Governança em Privacidade (PGP) —
          LGPD Art. 50 + ISO/IEC 27001/27002 + NIST CSF
        </p>
      </div>
    </div>
  );
}
