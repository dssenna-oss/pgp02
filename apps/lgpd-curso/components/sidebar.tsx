"use client";

// Sidebar do curso — drawer em mobile, fixa em desktop.
// 8 mini-apps na ordem da jornada PGP.

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, Database, ShieldAlert, ClipboardCheck,
  FileSearch, Building2, UserCheck, FileText, AlertTriangle, LogOut, Settings, Menu, X, CheckCircle2,
} from "lucide-react";
import { Brand } from "./brand";
import { SosBotao } from "./sos-botao";
import { cn } from "@/lib/utils";
import type { MissoesProgresso } from "@/lib/missoes-progresso";

type ProgressoKey = keyof MissoesProgresso;

type NavItem = {
  href: string;
  label: string;
  missao?: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  dpoOnly?: boolean; // mini-apps que só DPO acessa (Contribuidor não vê)
  progressoKey?: ProgressoKey; // qual flag do progresso indica "feito"
};

const navItems: NavItem[] = [
  { href: "/dashboard",            label: "Início",                                   icon: LayoutDashboard },
  { href: "/dashboard/inventario", label: "Inventário",                missao: "M1",  icon: Database,        progressoKey: "m1" },
  { href: "/dashboard/riscos",     label: "Análise de Riscos",         missao: "M2",  icon: ShieldAlert,     progressoKey: "m2" },
  { href: "/dashboard/gap",        label: "GAP Analysis",              missao: "M3",  icon: ClipboardCheck,  progressoKey: "m3",            dpoOnly: true },
  { href: "/dashboard/ripd",       label: "RIPD",                      missao: "M4a", icon: FileSearch,      progressoKey: "m4a_ripd",      dpoOnly: true },
  { href: "/dashboard/terceiros",  label: "Gestão de Terceiros",       missao: "M4a", icon: Building2,       progressoKey: "m4a_terceiros", dpoOnly: true },
  { href: "/dashboard/dsr",        label: "Direitos do Titular",       missao: "M4a", icon: UserCheck,       progressoKey: "m4a_dsr",       dpoOnly: true },
  { href: "/dashboard/aviso",      label: "Aviso de Privacidade",      missao: "M4b", icon: FileText,        progressoKey: "m4b",           dpoOnly: true },
  { href: "/dashboard/incidentes", label: "Incidentes",                missao: "M5",  icon: AlertTriangle,   progressoKey: "m5",            dpoOnly: true },
];

const adminItems: NavItem[] = [
  { href: "/facilitador",          label: "Painel do Facilitador",     icon: LayoutDashboard, adminOnly: true },
  { href: "/admin/criar-turma",    label: "Criar turma",               icon: Settings,         adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isDpoOuAdmin = role === "DPO" || role === "ADMIN";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [progresso, setProgresso] = useState<MissoesProgresso | null>(null);

  function closeMobile() { setMobileOpen(false); }

  // Polling do progresso a cada 10s pra atualizar ticks ✓ — só pra participantes,
  // admin não tem grupo (companyId null), endpoint retorna vazio.
  useEffect(() => {
    if (isAdmin || !session?.user?.id) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/missoes-progresso", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setProgresso(data);
      } catch {}
    }
    load();
    const id = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isAdmin, session?.user?.id]);

  return (
    <>
      {/* Topbar mobile com botão hambúrguer */}
      <div className="lg:hidden flex items-center justify-between border-b bg-gray-50 px-3 py-2">
        <Brand compact />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="h-11 w-11 flex items-center justify-center rounded hover:bg-gray-200"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Overlay quando drawer aberto */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          "bg-gray-50 flex flex-col border-r",
          "lg:w-60 lg:static lg:translate-x-0", // Desktop: fixa
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform", // Mobile: drawer
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:transform-none"
        )}
      >
        <div className="px-4 py-4 border-b flex items-center justify-between">
          <Brand />
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Fechar menu"
            className="lg:hidden h-10 w-10 flex items-center justify-center rounded hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {/* Itens de participante — escondidos pro admin (ele não tem grupo,
              clicar daria 500 por companyId ausente).
              Mini-apps dpoOnly também escondidos pra Contribuidor (M3-M5). */}
          {!isAdmin && navItems
            .filter((item) => !item.dpoOnly || isDpoOuAdmin)
            .map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            const feito = item.progressoKey && progresso ? progresso[item.progressoKey] : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-md text-sm transition-colors min-h-[44px]",
                  active
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {feito && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-label="Missão concluída" />
                )}
                {item.missao && (
                  <span className="text-[10px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded">
                    {item.missao}
                  </span>
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <div>
              <div className="px-3 pb-1 text-[10px] uppercase font-semibold text-gray-500">
                Facilitador
              </div>
              {adminItems.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-md text-sm transition-colors min-h-[44px]",
                      active
                        ? "bg-training-100 text-training-900 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="border-t p-2">
          {/* SOS — só pra participantes (admin não tem grupo) */}
          {!isAdmin && session?.user?.companyId && <SosBotao />}
          {session?.user && (
            <div className="px-3 py-2 text-xs text-gray-600">
              <div className="font-medium truncate">{session.user.name}</div>
              <div className="text-[10px] text-gray-500 truncate">{session.user.email}</div>
              {session.user.company?.name && (
                <div className="text-[10px] text-gray-500 truncate mt-0.5">
                  {session.user.company.name}
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full mt-1 flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors min-h-[44px]"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
