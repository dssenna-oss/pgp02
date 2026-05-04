
"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Shield,
  ShieldAlert,
  Menu,
  FileText,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Users,
  Settings,
  Building2,
  ClipboardList,
  BookOpen,
  Bell,
  LogOut,
  Home,
  Library,
  ListChecks,
  MessagesSquare,
  Scale,
  Activity,
  Target,
  FileText as FileTextIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { roleLabel, isDPO } from "@/lib/auth-helpers";
import { onSidebarRefresh } from "@/lib/sidebar-events";

/** Nome do produto (brand fixo, igual em todas as organizações). */
const APP_BRAND = "LGPD - PGP";

interface DashboardLayoutProps {
  children: React.ReactNode;
  session?: any;
}

export default function DashboardLayout({ children, session }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  /**
   * Quantidade de tarefas atrasadas + vencendo hoje. Alimenta o badge
   * do link "Minhas Tarefas" na sidebar. Atualiza a cada 60s pra refletir
   * mudanças sem o user precisar recarregar.
   */
  const [taskAlerts, setTaskAlerts] = useState<number | null>(null);
  /**
   * Quantidade total de itens não-lidos no Fórum (posts públicos + DMs).
   * Atualiza a cada 30s — tempo de tolerância pra "tempo real" sem
   * sobrecarregar o servidor.
   */
  const [forumUnread, setForumUnread] = useState<number | null>(null);

  // Busca o logo da empresa
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch("/api/company/logo");
        if (response.ok) {
          const data = await response.json();
          setCompanyLogo(data.logoUrl || null);
        }
      } catch (error) {
        console.error("Erro ao buscar logo:", error);
      }
    };

    fetchLogo();
  }, []);

  // Polling dos contadores (tarefas urgentes + fórum não-lidos).
  // Cada um tem seu próprio intervalo, mas ambos são re-buscados também
  // quando as telas filhas disparam `notifySidebarRefresh()` (ex: ao
  // criar/excluir uma tarefa ou post, o badge atualiza imediatamente).
  useEffect(() => {
    let active = true;
    const fetchAlerts = async () => {
      try {
        const r = await fetch("/api/tarefas/contadores", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (!active) return;
        setTaskAlerts((j.atrasadas ?? 0) + (j.vencendoHoje ?? 0));
      } catch {
        // silencioso — badge fica oculto
      }
    };
    const fetchForumUnread = async () => {
      try {
        const r = await fetch("/api/forum", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (!active) return;
        setForumUnread(j.stats?.totalUnread ?? 0);
      } catch {
        // silencioso
      }
    };
    const refreshAll = () => {
      void fetchAlerts();
      void fetchForumUnread();
    };

    refreshAll();
    const taskId = setInterval(fetchAlerts, 60000);
    const forumId = setInterval(fetchForumUnread, 30000);
    const offEvent = onSidebarRefresh(refreshAll);
    return () => {
      active = false;
      clearInterval(taskId);
      clearInterval(forumId);
      offEvent();
    };
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Empresa", href: "/dashboard/empresa", icon: Building2 },
    { 
      name: "📚 Conteúdos Didáticos", 
      description: "📖 Material Educativo e Recursos",
      href: "/dashboard/conteudos-didaticos", 
      icon: Library
    },
    { 
      name: "📚 Entendendo o PGP", 
      description: "📝 Conceitos e Fundamentos",
      href: "/dashboard/entendendo-pgp", 
      icon: BookOpen
    },
    { 
      name: "🚩 Fase Preliminar", 
      description: "📝 Sensibilização e Engajamento",
      href: "/dashboard/fase-preliminar", 
      icon: Shield
    },
    { 
      name: "🚩 Fase 1", 
      description: "📝 Formação das Equipes",
      href: "/dashboard/fase-1", 
      icon: Users
    },
    { 
      name: "🚩 Fase 2", 
      description: "📝 Diagnóstico Inicial",
      href: "/dashboard/fase-2", 
      icon: BarChart3
    },
    { 
      name: "🚩 Fase 3", 
      description: "📝 Mapeamento e Análise de Riscos",
      href: "/dashboard/fase-3", 
      icon: FileText
    },
    { 
      name: "🚩 Fase 4", 
      description: "📝 GAP Analysis",
      href: "/dashboard/fase-4", 
      icon: BarChart3
    },
    { 
      name: "🚩 Fase 5", 
      description: "📝 Plano de Ação",
      href: "/dashboard/fase-5", 
      icon: CheckCircle2
    },
    { 
      name: "🚩 Fase 6", 
      description: "📝 Execução",
      href: "/dashboard/fase-6", 
      icon: BookOpen
    },
    { 
      name: "🚩 Fase 7", 
      description: "📝 Monitoramento",
      href: "/dashboard/fase-7", 
      icon: Bell
    },
    { name: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
    {
      name: "Fórum e Mensagens",
      description: "Comunicação entre todos da organização",
      href: "/dashboard/forum",
      icon: MessagesSquare,
    },
    {
      name: "Minhas Tarefas",
      description: "Caderno pessoal de planejamento",
      href: "/dashboard/tarefas",
      icon: ListChecks,
    },
    {
      name: "Análise de Riscos",
      description: "Riscos LGPD por processo",
      href: "/dashboard/riscos",
      icon: ShieldAlert,
      dpoOnly: true,
    },
    {
      name: "GAP Analysis",
      description: "Diagnóstico macro de adequação à LGPD",
      href: "/dashboard/gap-analysis",
      icon: ClipboardList,
      dpoOnly: true,
    },
    {
      name: "Diagnóstico de Privacidade",
      description: "Visão executiva consolidada (score + recomendações)",
      href: "/dashboard/diagnostico",
      icon: Activity,
      dpoOnly: true,
    },
    {
      name: "Plano de Ação",
      description: "Ações institucionais com responsável e prazo",
      href: "/dashboard/plano-acao",
      icon: Target,
      // Visível também pra Contribuidor (vê só ações onde é responsável)
    },
    {
      name: "Políticas",
      description: "Aviso de privacidade, termos, cookies e outras",
      href: "/dashboard/politicas",
      icon: FileTextIcon,
      dpoOnly: true,
    },
    {
      name: "Bases Legais",
      description: "Visão consolidada por processo",
      href: "/dashboard/bases-legais",
      icon: Scale,
      dpoOnly: true,
    },
    {
      name: "Contribuidores",
      description: "Gerenciar usuários da organização",
      href: "/dashboard/contribuidores",
      icon: Users,
      dpoOnly: true,
    },
    { name: "Painel Chatbot", href: "/dashboard/admin/chatbot", icon: BarChart3, adminOnly: true },
  ];

  const Sidebar = ({ mobile = false }) => (
    <div className={cn("flex flex-col h-full bg-white dark:bg-gray-800", mobile ? "w-full" : "w-64")}>
      {/* Brand (fixo) + nome da organização (dinâmico) */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {companyLogo ? (
          <div className="relative h-8 w-8 flex-shrink-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={companyLogo}
              alt="Logo da organização"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <Shield className="h-8 w-8 text-blue-600 flex-shrink-0" />
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-lg font-bold text-gray-900 dark:text-white truncate leading-tight">
            {APP_BRAND}
          </span>
          {session?.user?.company?.companyName && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight">
              {session.user.company.companyName}
            </span>
          )}
        </div>
      </div>

      {/* User info — nome do usuário + papel (em vez do nome da org duplicado) */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {session?.user?.name || "Usuário"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {roleLabel(session?.user?.role)}
            </p>
          </div>
        </div>
        {/* Atalho pro painel super admin. Flag `isSuperAdmin` é calculada
            server-side no JWT callback (lib/auth.ts) — usar via session
            evita mismatch de hidratação (process.env só existe no server). */}
        {session?.user?.isSuperAdmin && (
          <Link
            href="/sysadmin"
            className="mt-3 flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-900/40 text-xs font-medium text-amber-800 dark:text-amber-300 transition-colors"
            onClick={() => mobile && setSidebarOpen(false)}
          >
            <Shield className="h-3.5 w-3.5" />
            Painel Super Admin
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 bg-white dark:bg-gray-800 overflow-y-auto">
        {navigation
          .filter((item) => {
            // Filtrar itens admin (sistema CMS — só super admin antigo)
            if ((item as any).adminOnly) {
              const adminEmails = ["admin@pgp.com", "alexandrekassis@gmail.com"];
              return adminEmails.includes(session?.user?.email || "");
            }
            // Itens dpoOnly: visíveis pra qualquer DPO da org
            if ((item as any).dpoOnly) {
              return isDPO(session?.user?.role);
            }
            return true;
          })
          .map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-start gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              onClick={() => mobile && setSidebarOpen(false)}
            >
              <item.icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate flex items-center gap-1.5">
                  {item.name}
                  {/* Badge de tarefas urgentes (atrasadas + vencendo hoje).
                      Só aparece em "Minhas Tarefas" quando há ≥1 alerta. */}
                  {item.href === "/dashboard/tarefas" &&
                    taskAlerts !== null &&
                    taskAlerts > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex-shrink-0">
                        {taskAlerts}
                      </span>
                    )}
                  {/* Badge de não-lidos do Fórum (posts públicos + DMs). */}
                  {item.href === "/dashboard/forum" &&
                    forumUnread !== null &&
                    forumUnread > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex-shrink-0">
                        {forumUnread}
                      </span>
                    )}
                </span>
                {item.description && (
                  <span className={cn(
                    "text-xs truncate mt-0.5",
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400"
                  )}>
                    {item.description}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => signOut()}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 shadow-sm relative z-20">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="lg:hidden fixed top-4 left-4 z-40"
            size="icon"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 ml-12">
              {companyLogo ? (
                <div className="relative h-6 w-6 flex-shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={companyLogo}
                    alt="Logo da organização"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <Shield className="h-6 w-6 text-blue-600 flex-shrink-0" />
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-gray-900 dark:text-white truncate leading-tight">
                  {APP_BRAND}
                </span>
                {session?.user?.company?.companyName && (
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                    {session.user.company.companyName}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
