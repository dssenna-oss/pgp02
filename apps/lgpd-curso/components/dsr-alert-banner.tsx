"use client";

// Banner sticky de alerta — aparece em qualquer página do dashboard quando
// chegam DSRs disparados pelo facilitador (gameAction ainda null). Igual
// caixa de entrada de e-mail: fica visível até o DPO atender todos.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Mail, ChevronRight } from "lucide-react";
import type { MissoesProgresso } from "@/lib/missoes-progresso";

export function DsrAlertBanner() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [pendentes, setPendentes] = useState(0);

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
        if (!cancelled) setPendentes(Number(data.dsrSurpresaPendentes || 0));
      } catch {}
    }
    load();
    const id = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isAdmin, session?.user?.id]);

  // Não mostra: admin (sem company), participante sem company, sem pendentes,
  // ou já na página de DSR (lá o user vê os pedidos direto).
  if (isAdmin) return null;
  if (!session?.user?.companyId) return null;
  if (pendentes === 0) return null;
  if (pathname === "/dashboard/dsr") return null;

  // Pra papéis que não são DPO (ex: TI, Comunicação), o pedido também aparece
  // — mas só o DPO age. Mostramos o banner pra todos do grupo pra criar
  // pressão coletiva de "alguém atende essa caixa".
  const verbo = isDpo ? "atender" : "informar ao DPO";

  return (
    <Link
      href="/dashboard/dsr"
      className="block bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 border-b border-amber-700 transition-colors"
    >
      <div className="flex items-center gap-3 max-w-7xl mx-auto">
        <Mail className="h-5 w-5 shrink-0 animate-pulse" />
        <div className="flex-1 text-sm">
          <strong>📨 {pendentes} novo{pendentes > 1 ? "s" : ""} pedido{pendentes > 1 ? "s" : ""} chegou pelo canal de Direitos do Titular!</strong>
          {" "}Clique para {verbo} (prazo legal: 15 dias úteis · art. 19 LGPD).
        </div>
        <ChevronRight className="h-4 w-4 shrink-0" />
      </div>
    </Link>
  );
}
