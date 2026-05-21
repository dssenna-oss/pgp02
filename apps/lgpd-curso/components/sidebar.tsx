"use client";

// Sidebar do curso — drawer em mobile, fixa em desktop.
// Reflete 1:1 a sidebar do app principal lgpd-pgp.vercel.app:
//   Conteúdos Didáticos → Entendendo o PGP → Fase Preliminar → Fase 1...7
// Itens "de leitura" (Conteúdos, Entendendo, Preliminar, Fase 2) abrem
// página placeholder com mensagem "apresentado pelo facilitador na aula".
// Itens "de fase com mini-app" (Fase 1, 3-7) ficam expansíveis em acordeão.

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, Database, ShieldAlert, ClipboardCheck,
  FileSearch, Building2, UserCheck, FileText, AlertTriangle, LogOut, Settings, Menu, X, CheckCircle2,
  ChevronDown, ChevronRight, Flag, Target, Library, BookOpen, Shield, BarChart3, Mic2, Eye, Projector,
} from "lucide-react";
import { Brand } from "./brand";
import { SosBotao } from "./sos-botao";
import { SenhaTurmasWidget } from "./senha-turmas-widget";
import { cn } from "@/lib/utils";
import { GUIAS } from "@/lib/guias-apoio";
import type { MissoesProgresso } from "@/lib/missoes-progresso";

type ProgressoKey = keyof MissoesProgresso;

type MiniApp = {
  href: string;
  label: string;
  missao?: string;
  icon: React.ComponentType<{ className?: string }>;
  dpoOnly?: boolean;
  // Quando true + dpoOnly: o Contribuidor VÊ o item na sidebar (com badge 👁),
  // entra em Modo Observador na tela (read-only). Sem isso, dpoOnly esconde
  // totalmente. Usado nas Fases 4-7 — Encarregado (Fase 1) NÃO é observável.
  observavel?: boolean;
  progressoKey?: ProgressoKey;
  alertaCountKey?: keyof MissoesProgresso;
};

type MenuLeitura = {
  kind: "leitura";
  href: string;
  rotulo: string;
  icon: React.ComponentType<{ className?: string }>;
  cor: string;        // border-l-* color
};

type MenuFase = {
  kind: "fase";
  id: string;
  rotulo: string;
  cor: string;
  itens: MiniApp[];
};

type MenuItem = MenuLeitura | MenuFase;

const MENU: MenuItem[] = [
  // Itens "de leitura" — apresentados pelo facilitador, sem ação do participante.
  { kind: "leitura", href: "/dashboard/conteudos-didaticos", rotulo: "📚 Conteúdos Didáticos",  icon: Library,  cor: "border-l-slate-300" },
  { kind: "leitura", href: "/dashboard/entendendo-pgp",      rotulo: "📚 Entendendo o PGP",     icon: BookOpen, cor: "border-l-slate-300" },
  { kind: "leitura", href: "/dashboard/fase-preliminar",     rotulo: "🚩 Fase Preliminar",      icon: Shield,   cor: "border-l-slate-300" },

  // Fase 1 — tem mini-app Encarregado.
  {
    kind: "fase",
    id: "fase-1",
    rotulo: "Fase 1 — Formação das equipes",
    cor: "border-l-violet-400",
    itens: [
      { href: "/dashboard/encarregado", label: "Encarregado (DPO)", icon: UserCheck, dpoOnly: true },
    ],
  },

  // Fase 2 — só conteúdo de leitura (não tem mini-app no curso).
  { kind: "leitura", href: "/dashboard/fase-2", rotulo: "🚩 Fase 2 — Diagnóstico inicial", icon: BarChart3, cor: "border-l-slate-300" },

  // Fase 3-7 — mini-apps do jogo.
  {
    kind: "fase",
    id: "fase-3",
    rotulo: "Fase 3 — Mapeamento e Análise de Riscos",
    cor: "border-l-blue-400",
    itens: [
      { href: "/dashboard/inventario", label: "Inventário",        missao: "M1", icon: Database,    progressoKey: "m1" },
      { href: "/dashboard/riscos",     label: "Análise de Riscos", missao: "M2", icon: ShieldAlert, progressoKey: "m2" },
    ],
  },
  {
    kind: "fase",
    id: "fase-4",
    rotulo: "Fase 4 — GAP Analysis",
    cor: "border-l-amber-400",
    itens: [
      { href: "/dashboard/gap", label: "GAP Analysis", missao: "M3", icon: ClipboardCheck, progressoKey: "m3", dpoOnly: true, observavel: true },
    ],
  },
  {
    kind: "fase",
    id: "fase-5",
    rotulo: "Fase 5 — Plano de Ação",
    cor: "border-l-emerald-400",
    itens: [
      { href: "/dashboard/plano-acao", label: "Plano de Ação", icon: Target, progressoKey: "plano_acao", dpoOnly: true, observavel: true },
    ],
  },
  {
    kind: "fase",
    id: "fase-6",
    rotulo: "Fase 6 — Execução",
    cor: "border-l-purple-400",
    itens: [
      { href: "/dashboard/ripd",      label: "RIPD",                 missao: "M4a", icon: FileSearch, progressoKey: "m4a_ripd",      dpoOnly: true, observavel: true },
      { href: "/dashboard/dsr",       label: "Direitos do Titular",  missao: "M4a", icon: UserCheck,  progressoKey: "m4a_dsr",       dpoOnly: true, observavel: true, alertaCountKey: "dsrSurpresaPendentes" },
      { href: "/dashboard/terceiros", label: "Gestão de Terceiros",  missao: "M4a", icon: Building2,  progressoKey: "m4a_terceiros", dpoOnly: true, observavel: true },
      { href: "/dashboard/aviso",     label: "Aviso de Privacidade", missao: "M4b", icon: FileText,   progressoKey: "m4b",           dpoOnly: true, observavel: true },
    ],
  },
  {
    kind: "fase",
    id: "fase-7",
    rotulo: "Fase 7 — Monitoramento",
    cor: "border-l-red-400",
    itens: [
      { href: "/dashboard/incidentes", label: "Incidentes", missao: "M5", icon: AlertTriangle, progressoKey: "m5", dpoOnly: true, observavel: true, alertaCountKey: "incidentesEmAberto" },
      { href: "/dashboard/pri", label: "Documento do PRI", icon: FileText, dpoOnly: true, observavel: true },
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
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  // Enquanto o status da sessão é "loading", ainda não se sabe o papel —
  // não renderizar nenhum menu pra não piscar o menu errado (participante)
  // antes de confirmar que é o facilitador.
  const sessaoPronta = status === "authenticated";
  const isAdmin = role === "ADMIN";
  const isDpoOuAdmin = role === "DPO" || role === "ADMIN";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [progresso, setProgresso] = useState<MissoesProgresso | null>(null);
  const [faseExpandida, setFaseExpandida] = useState<string | null>(null);
  const [hidratado, setHidratado] = useState(false);

  function closeMobile() { setMobileOpen(false); }

  // Identifica a Fase do item ativo — abre ela automaticamente se a página mudar.
  const faseDoItemAtivo = useMemo(() => {
    for (const item of MENU) {
      if (item.kind === "fase" && item.itens.some((i) => i.href === pathname)) return item.id;
    }
    return null;
  }, [pathname]);

  useEffect(() => {
    let inicial: string | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXPANDIDA);
      if (saved) inicial = saved;
    } catch {}
    if (faseDoItemAtivo) inicial = faseDoItemAtivo;
    setFaseExpandida(inicial);
    setHidratado(true);
    try { localStorage.removeItem("curso-sidebar-fases-expandidas"); } catch {}
  }, [faseDoItemAtivo]);

  useEffect(() => {
    if (!hidratado) return;
    try {
      if (faseExpandida) localStorage.setItem(STORAGE_KEY_EXPANDIDA, faseExpandida);
      else localStorage.removeItem(STORAGE_KEY_EXPANDIDA);
    } catch {}
  }, [faseExpandida, hidratado]);

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
    setFaseExpandida((atual) => (atual === id ? null : id));
  }

  return (
    <>
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
          {!sessaoPronta && (
            <div className="px-3 py-3 text-xs text-gray-400">Carregando menu…</div>
          )}
          {sessaoPronta && !isAdmin && (
            <>
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

              {MENU.map((item) => {
                if (item.kind === "leitura") {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobile}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors min-h-[40px] border-l-4",
                        item.cor,
                        active
                          ? "bg-brand-50 text-brand-700 font-medium"
                          : "text-gray-700 hover:bg-gray-100",
                      )}
                      title="Apresentado pelo facilitador na aula"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-gray-500" />
                      <span className="flex-1 text-[13px] leading-tight">{item.rotulo}</span>
                      <Mic2 className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-label="Apresentado pelo facilitador" />
                    </Link>
                  );
                }

                // kind === "fase"
                // Contribuidor: vê itens abertos + itens dpoOnly marcados como
                // `observavel` (Fases 4-7, em Modo Observador read-only).
                // Itens dpoOnly não-observáveis (ex: Encarregado) ficam escondidos.
                const itensVisiveis = item.itens.filter((i) => {
                  if (!i.dpoOnly) return true;
                  if (isDpoOuAdmin) return true;
                  return i.observavel === true;
                });
                if (itensVisiveis.length === 0) return null;

                const aberta = faseExpandida === item.id;
                const itensFeitos = itensVisiveis.filter(
                  (i) => i.progressoKey && progresso ? progresso[i.progressoKey] : false,
                ).length;
                const todasFeitas = itensFeitos === itensVisiveis.length && itensVisiveis.length > 0;
                const alertasFase = itensVisiveis.reduce((acc, i) => {
                  if (i.alertaCountKey && progresso) {
                    return acc + Number(progresso[i.alertaCountKey] || 0);
                  }
                  return acc;
                }, 0);

                return (
                  <div key={item.id} className="mt-1">
                    <button
                      type="button"
                      onClick={() => toggleFase(item.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors min-h-[40px] border-l-4",
                        item.cor,
                        "text-gray-800 hover:bg-gray-100 font-medium",
                      )}
                      aria-expanded={aberta}
                    >
                      <Flag className="h-4 w-4 shrink-0 text-gray-500" />
                      <span className="flex-1 text-left text-[13px] leading-tight">{item.rotulo}</span>
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
                        {itensVisiveis.map((mini) => {
                          const active = pathname === mini.href;
                          const Icon = mini.icon;
                          const feito = mini.progressoKey && progresso ? progresso[mini.progressoKey] : false;
                          const alertaCount = mini.alertaCountKey && progresso
                            ? Number(progresso[mini.alertaCountKey] || 0)
                            : 0;
                          return (
                            <Link
                              key={mini.href}
                              href={mini.href}
                              onClick={closeMobile}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors min-h-[40px]",
                                active
                                  ? "bg-brand-50 text-brand-700 font-medium"
                                  : "text-gray-700 hover:bg-gray-100",
                              )}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="flex-1 text-[13px]">{mini.label}</span>
                              {/* Badge 👁 — Contribuidor vê este item em Modo Observador (read-only) */}
                              {mini.dpoOnly && mini.observavel && !isDpoOuAdmin && (
                                <Eye
                                  className="h-3.5 w-3.5 shrink-0 text-amber-500"
                                  aria-label="Modo Observador — só leitura"
                                />
                              )}
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
                              {mini.missao && (
                                <span className="text-[9px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded">
                                  {mini.missao}
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

          {sessaoPronta && isAdmin && (
            <div>
              <div className="px-3 pb-1 text-[10px] uppercase font-semibold text-gray-500">
                Facilitador
              </div>
              {adminItems.map((adminItem) => {
                const active = pathname === adminItem.href;
                const Icon = adminItem.icon;
                return (
                  <Link
                    key={adminItem.href}
                    href={adminItem.href}
                    onClick={closeMobile}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-md text-sm transition-colors min-h-[44px]",
                      active
                        ? "bg-training-100 text-training-900 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{adminItem.label}</span>
                  </Link>
                );
              })}

              {/* Guias de apoio — telas de projeção pra ajudar os grupos nas
                  missões sem ir de mesa em mesa. */}
              <div className="mt-3 px-3 pb-1 text-[10px] uppercase font-semibold text-gray-500 flex items-center gap-1">
                <Projector className="h-3 w-3" /> Guias de apoio
              </div>
              {GUIAS.map((g) => {
                const href = `/facilitador/guias/${g.slug}`;
                const active = pathname === href;
                return (
                  <Link
                    key={g.slug}
                    href={href}
                    onClick={closeMobile}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors min-h-[40px] border-l-4 border-l-slate-300",
                      active
                        ? "bg-brand-50 text-brand-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    <BookOpen className="h-4 w-4 shrink-0 text-gray-500" />
                    <span className="flex-1 text-[13px] leading-tight">{g.titulo}</span>
                    <span className="text-[9px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded shrink-0">
                      {g.missao.replace("Missão ", "M")}
                    </span>
                  </Link>
                );
              })}

              <SenhaTurmasWidget />
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
