"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3, Calendar, CalendarDays, Users, FileText, FolderOpen,
  Scale, Bell, TrendingUp, Menu, X, Boxes, ShieldAlert, ClipboardCheck,
  ListChecks, FileCheck2, Activity,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Visão geral", icon: BarChart3 },
  { href: "/dashboard/calendario", label: "Calendário", icon: Calendar },
  { href: "/dashboard/plano", label: "Plano de Trabalho", icon: CalendarDays },
  { href: "/dashboard/membros", label: "Membros do Comitê", icon: Users },
  { href: "/dashboard/reunioes", label: "Reuniões & Atas", icon: FileText },
  { href: "/dashboard/documentos", label: "Documentos", icon: FolderOpen },
  { href: "/dashboard/consultas", label: "Consulta prévia", icon: Scale },
  { href: "/dashboard/notificacoes", label: "Notificações", icon: Bell },
  { href: "/dashboard/indicadores", label: "Indicadores & Relatório", icon: TrendingUp },
];

function NavContent({ pathname, onNav }: { pathname: string; onNav?: () => void }) {
  return (
    <>
      <div className="px-4 py-4 border-b border-white/10">
        <Brand light />
      </div>
      <nav className="flex-1 overflow-auto p-2.5">
        <div className="px-2.5 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Comitê &amp; Plano de Trabalho
        </div>
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNav}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13.5px] mb-0.5 transition-colors",
                active
                  ? "bg-brand-500 text-white font-semibold"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {label}
            </Link>
          );
        })}

        <div className="px-2.5 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Programa — Fases do PGP
        </div>
        {(() => {
          const href = "/dashboard/inventario";
          const active = pathname.startsWith(href);
          return (
            <Link
              href={href}
              onClick={onNav}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13.5px] mb-0.5 transition-colors",
                active ? "bg-brand-500 text-white font-semibold" : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <Boxes className="w-[18px] h-[18px] shrink-0" /> Inventário <span className="text-[10px] text-slate-400 font-normal">· Fase 3</span>
            </Link>
          );
        })()}
        {[
          { icon: ShieldAlert, label: "Análise de Riscos", fase: "Fase 3" },
          { icon: ClipboardCheck, label: "GAP Analysis", fase: "Fase 4" },
          { icon: ListChecks, label: "Plano de Ação", fase: "Fase 5" },
          { icon: FileCheck2, label: "Execução", fase: "Fase 6" },
          { icon: Activity, label: "Monitoramento", fase: "Fase 7" },
        ].map(({ icon: Icon, label, fase }) => (
          <span key={label} className="flex items-center gap-2.5 px-2.5 py-2.5 text-[13.5px] text-slate-500 cursor-default">
            <Icon className="w-[18px] h-[18px] shrink-0" /> {label}
            <span className="text-[10px] text-slate-400 font-normal">· {fase}</span>
            <span className="text-[10px] text-slate-600 ml-auto">em breve</span>
          </span>
        ))}
      </nav>
      <div className="px-4 py-3 text-[11px] text-slate-500 border-t border-white/10">
        Biênio 2026-2027 · Portaria 22/2026
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-[248px] shrink-0 flex-col bg-navy text-slate-300 sticky top-0 h-screen">
        <NavContent pathname={pathname} />
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="lg:hidden fixed top-3 left-3 z-30 bg-navy text-white p-2 rounded-lg shadow"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative w-[260px] flex flex-col bg-navy text-slate-300 h-full">
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="absolute top-3 right-3 text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
            <NavContent pathname={pathname} onNav={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
