"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Users,
  FileText,
  TrendingUp,
  BarChart3,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  RefreshCw,
} from "lucide-react";

const ADMIN_EMAILS = ["admin@pgp.com", "alexandrekassis@gmail.com"];

interface Stats {
  totalConversations: number;
  totalMessages: number;
  totalFeedbacks: number;
  totalFiles: number;
  positiveFeedbacks: number;
  negativeFeedbacks: number;
  satisfactionRate: number;
  sentimentCounts: Record<string, number>;
  messagesByDay: Record<string, number>;
  topPages: { page: string; count: number }[];
}

interface Conversation {
  id: string;
  title: string;
  mode: string;
  updatedAt: string;
  user: { name: string; email: string };
  _count: { messages: number };
}

interface Feedback {
  id: string;
  rating: string;
  comment: string | null;
  createdAt: string;
  message: {
    content: string;
    conversation: {
      user: { name: string; email: string };
    };
  };
}

interface Quota {
  id: string;
  userId: string;
  dailyMessages: number;
  monthlyMessages: number;
  maxDailyMessages: number;
  maxMonthlyMessages: number;
  user: { name: string; email: string };
}

export default function AdminChatbotPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingQuota, setEditingQuota] = useState<string | null>(null);
  const [quotaValues, setQuotaValues] = useState<Record<string, number>>({});

  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    loadData();
  }, [status, isAdmin, activeTab, page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/chatbot?view=${activeTab}&page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        if (activeTab === "stats") {
          setStats(data);
        } else if (activeTab === "conversations") {
          setConversations(data.conversations);
          setTotalPages(data.pagination.totalPages);
        } else if (activeTab === "feedbacks") {
          setFeedbacks(data.feedbacks);
          setTotalPages(data.pagination.totalPages);
        } else if (activeTab === "quotas") {
          setQuotas(data.quotas);
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuota = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/chatbot", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          maxDailyMessages: quotaValues[`${userId}-daily`],
          maxMonthlyMessages: quotaValues[`${userId}-monthly`],
        }),
      });
      if (res.ok) {
        setEditingQuota(null);
        loadData();
      }
    } catch (error) {
      console.error("Erro ao atualizar quota:", error);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return <Smile className="h-4 w-4 text-green-500" />;
      case "negative": return <Frown className="h-4 w-4 text-red-500" />;
      case "frustrated": return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "confused": return <HelpCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Meh className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Painel do Chatbot</h1>
            <p className="text-muted-foreground">Gerencie e monitore o Detetive da Privacidade</p>
          </div>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            <TabsTrigger value="conversations">Conversas</TabsTrigger>
            <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
            <TabsTrigger value="quotas">Cotas</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            {stats && (
              <>
                {/* Cards de resumo */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalConversations}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalMessages}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Arquivos Enviados</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalFiles}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Taxa de Satisfação</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.satisfactionRate}%</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.positiveFeedbacks} <ThumbsUp className="inline h-3 w-3 text-green-500" /> / {stats.negativeFeedbacks} <ThumbsDown className="inline h-3 w-3 text-red-500" />
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Análise de sentimentos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Análise de Sentimentos</CardTitle>
                    <CardDescription>Distribuição de sentimentos detectados nas mensagens</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-4">
                      {["positive", "neutral", "negative", "frustrated", "confused"].map((s) => (
                        <div key={s} className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-center mb-2">{getSentimentIcon(s)}</div>
                          <div className="text-lg font-bold">{stats.sentimentCounts[s] || 0}</div>
                          <div className="text-xs text-muted-foreground capitalize">{s}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Páginas mais acessadas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Páginas Mais Acessadas</CardTitle>
                    <CardDescription>Onde os usuários mais usam o chatbot</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.topPages.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="font-medium">{p.page || "N/A"}</span>
                          <span className="text-sm text-muted-foreground">{p.count} mensagens</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="conversations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversas Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <div key={conv.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{conv.title || "Sem título"}</h4>
                          <p className="text-sm text-muted-foreground">
                            {conv.user?.name || conv.user?.email || "Usuário anônimo"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs ${conv.mode === "technical" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                            {conv.mode === "technical" ? "Técnico" : "Simples"}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {conv._count.messages} mensagens
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Última atualização: {formatDate(conv.updatedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">Página {page} de {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="feedbacks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feedbacks dos Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {feedbacks.map((fb) => (
                    <div key={fb.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {fb.rating === "like" ? (
                            <ThumbsUp className="h-5 w-5 text-green-500" />
                          ) : (
                            <ThumbsDown className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-medium">
                            {fb.message?.conversation?.user?.name || "Usuário"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(fb.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {fb.message?.content?.slice(0, 200)}...
                      </p>
                      {fb.comment && (
                        <p className="text-sm mt-2 italic">
                          Comentário: "{fb.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">Página {page} de {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="quotas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cotas de Usuários</CardTitle>
                <CardDescription>Gerencie os limites de uso do chatbot por usuário</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quotas.map((q) => (
                    <div key={q.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{q.user?.name || "Usuário"}</h4>
                          <p className="text-sm text-muted-foreground">{q.user?.email}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (editingQuota === q.userId) {
                              updateQuota(q.userId);
                            } else {
                              setEditingQuota(q.userId);
                              setQuotaValues({
                                [`${q.userId}-daily`]: q.maxDailyMessages,
                                [`${q.userId}-monthly`]: q.maxMonthlyMessages,
                              });
                            }
                          }}
                        >
                          {editingQuota === q.userId ? (
                            <><Save className="h-4 w-4 mr-1" /> Salvar</>
                          ) : (
                            "Editar Limites"
                          )}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Mensagens Diárias</Label>
                          {editingQuota === q.userId ? (
                            <Input
                              type="number"
                              value={quotaValues[`${q.userId}-daily`] || q.maxDailyMessages}
                              onChange={(e) => setQuotaValues(v => ({ ...v, [`${q.userId}-daily`]: parseInt(e.target.value) }))}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm">
                              <span className="font-medium">{q.dailyMessages}</span> / {q.maxDailyMessages}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs">Mensagens Mensais</Label>
                          {editingQuota === q.userId ? (
                            <Input
                              type="number"
                              value={quotaValues[`${q.userId}-monthly`] || q.maxMonthlyMessages}
                              onChange={(e) => setQuotaValues(v => ({ ...v, [`${q.userId}-monthly`]: parseInt(e.target.value) }))}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm">
                              <span className="font-medium">{q.monthlyMessages}</span> / {q.maxMonthlyMessages}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">Página {page} de {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
