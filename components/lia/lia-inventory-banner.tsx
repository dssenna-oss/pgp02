"use client";

/**
 * LiaInventoryBanner — alerta contextual em telas de processo do
 * Inventário quando a base legal usa Art. 7º IX (legítimo interesse).
 *
 * 4 estados visuais:
 *   - Não usa Art. 7º IX → não renderiza nada
 *   - Usa, mas SEM LIA cadastrada → banner âmbar "Documentar LIA"
 *   - Usa, com LIA em RASCUNHO/EM_REVISAO → banner azul "LIA em andamento"
 *   - Usa, com LIA APROVADA → banner verde "LIA aprovada (vN)"
 *   - Usa, com LIA marcada como bloqueada (Art. 11/14) → banner vermelho
 *
 * Consulta /api/lia (lista geral, filtrada server-side por papel) e
 * encontra a LIA do processo via `inventoryId`.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, FileText, Loader2 } from "lucide-react";
import { usesLegitimateInterest, type LiaDTO } from "@/lib/lia-helpers";

interface LiaInventoryBannerProps {
  inventoryId: string;
  inventoryName: string;
  legalBasis: string | null;
  legalBasisSensitive?: string | null;
}

export default function LiaInventoryBanner({
  inventoryId,
  inventoryName,
  legalBasis,
  legalBasisSensitive,
}: LiaInventoryBannerProps) {
  const usesLia =
    usesLegitimateInterest(legalBasis) ||
    usesLegitimateInterest(legalBasisSensitive);
  const [loading, setLoading] = useState(usesLia);
  const [lia, setLia] = useState<LiaDTO | null>(null);

  useEffect(() => {
    if (!usesLia) return;
    let cancelled = false;
    fetch("/api/lia", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((j) => {
        if (cancelled) return;
        const items = (j.items ?? []) as LiaDTO[];
        const found =
          items.find((l) => l.inventoryId === inventoryId && l.status !== "ARQUIVADO") ??
          items.find((l) => l.inventoryId === inventoryId) ??
          null;
        setLia(found);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [usesLia, inventoryId]);

  if (!usesLia) return null;

  if (loading) {
    return (
      <div className="rounded-lg border border-violet-200 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-900 p-3 text-sm text-violet-900 dark:text-violet-200 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Verificando situação da LIA…
      </div>
    );
  }

  // 1) Bloqueada estruturalmente — mais grave, fica antes da APROVADA
  if (lia?.blocked) {
    return (
      <div className="rounded-lg border-2 border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0 text-sm">
          <p className="font-semibold text-red-900 dark:text-red-200">
            ⚠️ LIA bloqueada — base legal precisa mudar
          </p>
          <p className="text-red-800 dark:text-red-300 mt-1">
            A LIA registrada pra este processo aponta dados sensíveis (Art. 11)
            ou de crianças/adolescentes (Art. 14). Esses casos NÃO admitem
            legítimo interesse — escolha outra base legal antes de aprovar.
          </p>
        </div>
        <Link
          href={`/dashboard/lia/${lia.id}`}
          className="flex-shrink-0 px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
        >
          Abrir LIA
        </Link>
      </div>
    );
  }

  // 2) Aprovada
  if (lia?.status === "APROVADO") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 p-3 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0 text-sm">
          <p className="font-semibold text-emerald-900 dark:text-emerald-200">
            LIA aprovada — v{lia.publishedVersionNum}
          </p>
          <p className="text-emerald-800 dark:text-emerald-300 mt-0.5 text-xs">
            Avaliação de Legítimo Interesse documentada e congelada.{" "}
            {lia.approvedAt &&
              `Aprovada em ${new Date(lia.approvedAt).toLocaleDateString("pt-BR")}.`}
          </p>
        </div>
        <Link
          href={`/dashboard/lia/${lia.id}`}
          className="flex-shrink-0 px-3 py-1.5 rounded-md border border-emerald-300 text-emerald-800 dark:border-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
        >
          Ver LIA
        </Link>
      </div>
    );
  }

  // 3) Existe mas em RASCUNHO ou EM_REVISAO
  if (lia) {
    const inReview = lia.status === "EM_REVISAO";
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-3 flex items-start gap-3">
        <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0 text-sm">
          <p className="font-semibold text-blue-900 dark:text-blue-200">
            LIA {inReview ? "em revisão pelo DPO" : "em rascunho"}
          </p>
          <p className="text-blue-800 dark:text-blue-300 mt-0.5 text-xs">
            {inReview
              ? "Aguardando aprovação. Enquanto não houver versão aprovada, o uso da base é vulnerável."
              : "Ainda não submetida. Termine de preencher e envie pra revisão do DPO."}
          </p>
        </div>
        <Link
          href={`/dashboard/lia/${lia.id}`}
          className="flex-shrink-0 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
        >
          Continuar
        </Link>
      </div>
    );
  }

  // 4) Não existe LIA — exigida pelo Art. 10 §3º
  return (
    <div className="rounded-lg border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4 flex items-start gap-3">
      <FileText className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0 text-sm">
        <p className="font-semibold text-amber-900 dark:text-amber-200">
          Esta base exige LIA documentada (Art. 10 §3º LGPD)
        </p>
        <p className="text-amber-800 dark:text-amber-300 mt-1">
          O uso de legítimo interesse (Art. 7º IX) só é defensável se você
          documentar a Avaliação de Legítimo Interesse — teste de finalidade,
          necessidade e balanceamento dos direitos do titular.
        </p>
      </div>
      <Link
        href={`/dashboard/lia?createForInventory=${encodeURIComponent(inventoryId)}&title=${encodeURIComponent(`LIA — ${inventoryName}`)}`}
        className="flex-shrink-0 px-3 py-1.5 rounded-md bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition-colors"
      >
        Criar LIA
      </Link>
    </div>
  );
}
