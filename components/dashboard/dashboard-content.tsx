
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import {
  FileText,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Users,
  Calendar,
  TrendingUp,
  Download,
  Plus,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import { isDPO } from "@/lib/auth-helpers";
import { motion } from "framer-motion";
import Link from "next/link";
import ProximasEtapasCard from "@/components/dashboard/proximas-etapas-card";

interface DashboardContentProps {
  session: any;
}

export default function DashboardContent({ session }: DashboardContentProps) {
  const [stats, setStats] = useState({
    dataInventories: 0,
    riskAssessments: 0,
    gapAnswered: 0,
    actionPlans: 0,
    documents: 0,
    incidents: 0
  });

  const [loading, setLoading] = useState(true);
  const [inventarioPending, setInventarioPending] = useState<number>(0);
  const userIsDPO = isDPO(session?.user?.role);

  // Buscar estatísticas reais da API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Conta inventários pedindo ação (só pra DPO mostrar o banner; pra contribuidor
  // o badge da sidebar já alerta sobre os DEVOLVIDOs).
  useEffect(() => {
    if (!userIsDPO) return;
    const fetchPending = async () => {
      try {
        const r = await fetch("/api/inventario/pending-count", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        setInventarioPending(j.count ?? 0);
      } catch {
        // silencioso
      }
    };
    fetchPending();
    const id = setInterval(fetchPending, 60000);
    return () => clearInterval(id);
  }, [userIsDPO]);

  const quickActions = [
    {
      title: "Novo Inventário de Dados",
      description: "Registrar novos dados pessoais",
      href: "/dashboard/inventario",
      icon: <FileText className="h-5 w-5" />,
      color: "bg-blue-500"
    },
    {
      title: "Análise de Risco",
      description: "Avaliar riscos de privacidade",
      href: "/dashboard/riscos",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "bg-orange-500"
    },
    // GAP Analysis: link removido até a Sessão 3 do Checkpoint 9
    // recriar `/dashboard/gap-analysis`. Cartão de stats abaixo continua
    // aparecendo (mostra # de controles respondidos) mas sem href.
    {
      title: "Gerar RIPD",
      description: "Criar relatório de impacto",
      href: "/dashboard/ripd",
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "bg-purple-500"
    }
  ];

  const recentActivities = [
    {
      title: "Inventário CRM atualizado",
      time: "2 horas atrás",
      type: "inventario"
    },
    {
      title: "Análise de risco - Backup de dados",
      time: "1 dia atrás",
      type: "risco"
    },
    {
      title: "Política de privacidade gerada",
      time: "2 dias atrás",
      type: "documento"
    }
  ];

  return (
    <DashboardLayout session={session}>
      <div className="space-y-8">
        {/* Vídeo de Apresentação */}
        <div className="w-full rounded-lg overflow-hidden shadow-lg bg-black">
          <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/1j_cWrHrEAw?modestbranding=1&rel=0"
              title="PGP - Dashboard"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Bem-vindo de volta, {session?.user?.name || "usuário"}!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert('Função de relatório será implementada em breve')}
            >
              <Download className="h-4 w-4 mr-2" />
              Relatório
            </Button>
          </div>
        </div>

        {/* Próximas etapas (CP28) — substitui Painel de Retomada antigo.
            Card prescritivo: regras de workflow + recomendações do Diagnóstico.
            DPO e Contribuidor recebem listas distintas via engine no servidor. */}
        <ProximasEtapasCard />

        {/* Banner: Inventários aguardando revisão (só DPO, só quando há pendentes) */}
        {userIsDPO && inventarioPending > 0 && (
          <Link
            href="/dashboard/inventario"
            className="block rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30 p-4 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <ClipboardList className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                    {inventarioPending}{" "}
                    {inventarioPending === 1
                      ? "inventário aguardando sua revisão"
                      : "inventários aguardando sua revisão"}
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200/90 mt-0.5">
                    Mapeamento(s) submetido(s) pelo Contribuidor — clique pra
                    abrir, iniciar revisão e aprovar ou devolver.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            </div>
          </Link>
        )}

        {/* Stats Cards */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Carregando estatísticas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Inventários de Dados
                  </CardTitle>
                  <FileText className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.dataInventories}</div>
                  <p className="text-xs text-muted-foreground">
                    Serviços mapeados
                  </p>
                </CardContent>
              </Card>
            </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Análises de Risco
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.riskAssessments}</div>
                <p className="text-xs text-muted-foreground">
                  Riscos avaliados
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  GAP Analysis
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.gapAnswered}<span className="text-sm font-normal text-muted-foreground"> / 119</span></div>
                <p className="text-xs text-muted-foreground">
                  Controles respondidos
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Planos de Ação
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.actionPlans}</div>
                <p className="text-xs text-muted-foreground">
                  Ações planejadas
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Documentos
                </CardTitle>
                <Users className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.documents}</div>
                <p className="text-xs text-muted-foreground">
                  Docs gerados
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Incidentes
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.incidents}</div>
                <p className="text-xs text-muted-foreground">
                  Em aberto
                </p>
              </CardContent>
            </Card>
          </motion.div>
          </div>
        )}

        {/* Quick Actions and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                      <div className={`${action.color} p-2 rounded-lg text-white`}>
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {action.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Atividades Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Nenhuma atividade recente
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
