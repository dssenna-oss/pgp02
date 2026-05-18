"use client";

// Banner sticky de alerta — aparece em qualquer página do dashboard quando
// há incidente de segurança aberto (status != ENCERRADO). Inclui os
// disparados pelo facilitador na Missão 5.
//
// Vermelho intenso pra criar pressão visual — o prazo da ANPD pra
// comunicação é "razoável" mas a Res. CD/ANPD nº 15/2024 sugere até
// 3 dias úteis. Em modo curso, são minutos.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import type { MissoesProgresso } from "@/lib/missoes-progresso";

export function IncidentAlertBanner() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [emAberto, setEmAberto] = useState(0);

  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isDpo = role === "DPO";

  useEffect(() => {
    if (isAdmin || !session?.user?.id) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/missoes-progresso", { cache: "no-store" });
        if (!res.ok) return;
        const data: MissoesProgresso = await res.json();
        if (!cancelled) setEmAberto(Number(data.incidentesEmAberto || 0));
      } catch {}
    }
    load();
    const id = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isAdmin, session?.user?.id]);

  if (isAdmin) return null;
  if (!session?.user?.companyId) return null;
  if (emAberto === 0) return null;
  // Mesmo na página de Incidentes mantemos o banner — diferente do DSR.
  // O incidente é mais urgente e a UX é melhor com o aviso visível.

  const verbo = isDpo ? "Aja AGORA" : "Avise o DPO";

  return (
    <Link
      href="/dashboard/incidentes"
      className="block bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 border-b-2 border-red-800 transition-colors animate-pulse"
    >
      <div className="flex items-center gap-3 max-w-7xl mx-auto">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div className="flex-1 text-sm">
          <strong>🚨 {emAberto} INCIDENTE{emAberto > 1 ? "S" : ""} DE SEGURANÇA EM ABERTO!</strong>
          {" "}{verbo}. Prazo da ANPD começa contando agora (Res. CD/ANPD nº 15/2024 · Art. 48 LGPD).
        </div>
        {pathname !== "/dashboard/incidentes" && (
          <ChevronRight className="h-5 w-5 shrink-0" />
        )}
      </div>
    </Link>
  );
}
