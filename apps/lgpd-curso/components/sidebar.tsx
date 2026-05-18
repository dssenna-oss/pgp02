"use client";

// Sidebar do curso — drawer em mobile, fixa em desktop.
// Mini-apps agrupados em Fases (3, 4, 5, 6, 7) com expand/collapse.
// Inspirada no app principal (LGPD - PGP) mas mais enxuta — só 5 fases que
// têm mini-app no curso.

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, Database, ShieldAlert, ClipboardCheck,
  FileSearch, Building2, UserCheck, FileText, AlertTriangle, LogOut, Settings, Menu, X, CheckCircle2,
  ChevronDown, ChevronRight, Flag, Target,
} from "lucide-react";
import { Brand } from "./brand";
import { SosBotao } from "./sos-botao";
import { cn } from "@/lib/utils";
import type { MissoesProgresso } from "@/lib/missoes-progresso";

type ProgressoKey = keyof MissoesProgresso;

type MiniApp = {
  href: string;
  label: string;
  missao?: string;
  icon: React.ComponentType<{ className?: string }>;
  dpoOnly?: boolean;
  progressoKey?: ProgressoKey;
  // Quando definido, lê esse valor numérico do MissoesProgresso e mostra
  // um badge vermelho com a contagem (ex: "DSR Surpresa: 2 pedidos novos").
  alertaCountKey?: keyof MissoesProgresso;
};

type Fase = {
  id: string; // pra localStorage do estado expandido
  rotulo: string; // "Fase 3 — Mapeamento & Riscos"
  cor: string; // bordinha colorida
  itens: MiniApp[];
};

const FASES: Fase[] = [
  {
    id: "fase-1",
    rotulo: "Fase 1 — Governança",
    cor: "border-l-violet-400",
    itens: [
      { href: "/dashboard/encarregado", label: "Encarregado (DPO)", icon: UserCheck, dpoOnly: true },
    ],
  },
  {
    id: "fase-3",
    rotulo: "Fase 3 — Mapeamento & Riscos",
    cor: "border-l-blue-400",
    itens: [
      { href: "/dashboard/inventario", label: "Inventário",        missao: "M1", icon: Database,    progressoKey: "m1" },
      { href: "/dashboard/riscos",     label: "Análise de Riscos", missao: "M2", icon: ShieldAlert, progressoKey: "m2" },
    ],
  },
  {
    id: "fase-4",
    rotulo: "Fase 4 — GAP Analysis",
    cor: "border-l-amber-400",
    itens: [
      { href: "/dashboard/gap", label: "GAP Analysis", missao: "M3", icon: ClipboardCheck, progressoKey: "m3", dpoOnly: true },
    ],
  },
  {
    id: "fase-5",
    rotulo: "Fase 5 — Programa de Governança em Privacidade",
    cor: "border-l-emerald-400",
    itens: [
      { href: "/dashboard/plano-acao", label: "Plano de Ação", icon: Target, progressoKey: "plano_acao", dpoOnly: true },
    ],
  },
  {
    id: "fase-6",
    rotulo: "Fase 6 — Execução",
    cor: "border-l-purple-400",
    itens: [
      { href: "/dashboard/ripd",      label: "RIPD",                 missao: "M4a", icon: FileSearch, progressoKey: "m4a_ripd",      dpoOnly: true },
      { href: "/dashboard/dsr",       label: "Direitos do Titular",  missao: "M4a", icon: UserCheck,  progressoKey: "m4a_dsr",       dpoOnly: true, alertaCountKey: "dsrSurpresaPendentes" },
      { href: "/dashboard/terceiros", label: "Gestão de Terceiros",  missao: "M4a", icon: Building2,  progressoKey: "m4a_terceiros", dpoOnly: true },
      { href: "/dashboard/aviso",     label: "Aviso de Privacidade", missao: "M4b", icon: FileText,   progressoKey: "m4b",           dpoOnly: true },
    ],
  },
  {
    id: "fase-7",
    rotulo: "Fase 7 — Monitoramento",
    cor: "border-l-red-400",
    itens: [
      { href: "/dashboard/incidentes", label: "Incidentes", missao: "M5", icon: AlertTriangle, progressoKey: "m5", dpoOnly: true, alertaCountKey: "incidentesEmAberto" },
    ],
  },
];

const adminItems: MiniApp[] = [
  { href: "/facilitador",       label: "Painel do Facilitador", icon: LayoutDashboard },
  { href: "/admin/criar-turma", label: "Criar turma",           icon: Settings },
  { href: "/admin/pacote-gap",  label: "Pacote GAP por turma",  icon: ClipboardCheck },
];

const STORAGE_KEY_EXPANDIDA = "curso-sidebar-fase-expandida";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isDpoOuAdmin = role === "DPO" || role === "ADMIN";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [progresso, setProgresso] = useState<MissoesProgresso | null>(null);
  // Modo acordeão: só 1 fase expandida por vez (ou nenhuma).
  const [faseExpandida, setFaseExpandida] = useState<string | null>(null);
  const [hidratado, setHidratado] = useState(false);

  function closeMobile() { setMobileOpen(false); }

  // Identifica a Fase do item ativo — abre ela automaticamente se a página mudar.
  const faseDoItemAtivo = useMemo(() => {
    for (const f of FASES) {
      if (f.itens.some((i) => i.href === pathname)) return f.id;
    }
    return null;
  }, [pathname]);

  // Carrega fase expandida do localStorage no mount.
  // Se a página tá num item de fase, prioriza essa (mesmo se localStorage tinha outra).
  useEffect(() => {
    let inicial: string | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXPANDIDA);
      if (saved) inicial = saved;
    } catch {}
    if (faseDoItemAtivo) inicial = faseDoItemAtivo;
    setFaseExpandida(inicial);
    setHidratado(true);
    // limpa chave antiga (modo multi-expansão) pra não acumular lixo
    try { localStorage.removeItem("curso-sidebar-fases-expandidas"); } catch {}
  }, [faseDoItemAtivo]);

  // Persiste sempre que muda (após hidratação)
  useEffect(() => {
    if (!hidratado) return;
    try {
      if (faseExpandida) localStorage.setItem(STORAGE_KEY_EXPANDIDA, faseExpandida);
      else localStorage.removeItem(STORAGE_KEY_EXPANDIDA);
    } catch {}
  }, [faseExpandida, hidratado]);

  // Polling do progresso a cada 10s — só pra participantes
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

  function toggleFase(id: string) {
    // Acordeão: clicar na fase aberta fecha; clicar em outra abre só ela
    setFaseExpandida((atual) => (atual === id ? null : id));
  }

  return (
    <>
      {/* Topbar mobile */}
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

      {/* Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={closeMobile} />
      )}

      <aside
        className={cn(
          "bg-gray-50 flex flex-col border-r",
          "lg:w-64 lg:static lg:translate-x-0",
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform",
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
          {!isAdmin && (
            <>
              {/* Início */}
              <Link
                href="/dashboard"
                onClick={closeMobile}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-md text-sm transition-colors min-h-[44px]",
                  pathname === "/dashboard"
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span className="flex-1">Início</span>
              </Link>

              {/* Fases agrupadas */}
              {FASES.map((fase) => {
                // Filtra dpoOnly se Contribuidor
                const itensVisiveis = fase.itens.filter((i) => !i.dpoOnly || isDpoOuAdmin);
                if (itensVisiveis.length === 0) return null;

                const aberta = faseExpandida === fase.id;
                const itensFeitos = itensVisiveis.filter(
                  (i) => i.progressoKey && progresso ? progresso[i.progressoKey] : false,
                ).length;
                const todasFeitas = itensFeitos === itensVisiveis.length && itensVisiveis.length > 0;
                // Soma alertas pendentes de todos os sub-itens — mostra badge na
                // própria linha da Fase pra ficar visível mesmo com acordeão fechado.
                const alertasFase = itensVisiveis.reduce((acc, i) => {
                  if (i.alertaCountKey && progresso) {
                    return acc + Number(progresso[i.alertaCountKey] || 0);
                  }
                  return acc;
                }, 0);

                return (
                  <div key={fase.id} className="mt-1">
                    <button
                      type="button"
                      onClick={() => toggleFase(fase.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors min-h-[40px] border-l-4",
                        fase.cor,
                        "text-gray-800 hover:bg-gray-100 font-medium",
                      )}
                      aria-expanded={aberta}
                    >
                      <Flag className="h-4 w-4 shrink-0 text-gray-500" />
                      <span className="flex-1 text-left text-[13px] leading-tight">{fase.rotulo}</span>
                      {alertasFase > 0 && (
                        <span
                          className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-full animate-pulse min-w-[18px] text-center"
                          title={`${alertasFase} pedido(s) novo(s) nesta fase`}
                        >
                          {alertasFase}
                        </span>
                      )}
                      {todasFeitas && alertasFase === 0 && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-label="Fase concluída" />
                      )}
                      <span className="text-[10px] text-gray-500 tabular-nums">
                        {itensFeitos}/{itensVisiveis.length}
                      </span>
                      {aberta ? <ChevronDown className="h-3.5 w-3.5 text-gray-500" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-500" />}
                    </button>

                    {aberta && (
                      <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-200 pl-2">
                        {itensVisiveis.map((item) => {
                          const active = pathname === item.href;
                          const Icon = item.icon;
                          const feito = item.progressoKey && progresso ? progresso[item.progressoKey] : false;
                          const alertaCount = item.alertaCountKey && progresso
                            ? Number(progresso[item.alertaCountKey] || 0)
                            : 0;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={closeMobile}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors min-h-[40px]",
                                active
                                  ? "bg-brand-50 text-brand-700 font-medium"
                                  : "text-gray-700 hover:bg-gray-100",
                              )}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="flex-1 text-[13px]">{item.label}</span>
                              {alertaCount > 0 && (
                                <span
                                  className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-full animate-pulse min-w-[18px] text-center"
                                  title={`${alertaCount} pedido(s) novo(s) chegaram pelo canal`}
                                >
                                  {alertaCount}
                                </span>
                              )}
                              {feito && alertaCount === 0 && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-label="Concluído" />
                              )}
                              {item.missao && (
                                <span className="text-[9px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded">
                                  {item.missao}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

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
