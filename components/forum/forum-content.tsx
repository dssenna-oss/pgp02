"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Mail,
  Plus,
  Send,
  Search,
  Filter,
  MessagesSquare,
} from "lucide-react";
import { toast } from "sonner";
import { isDPO } from "@/lib/auth-helpers";
import { notifySidebarRefresh } from "@/lib/sidebar-events";
import { useAdaptivePolling } from "@/lib/use-adaptive-polling";
import {
  FORUM_CATEGORY_LABEL,
  type ForumPostDTO,
  type ForumStats,
} from "@/lib/forum-types";
import PostCard from "./post-card";
import PostDetailDialog from "./post-detail-dialog";
import NewPostDialog from "./new-post-dialog";
import NewMessageDialog from "./new-message-dialog";

interface Props {
  session: any;
}

// Polling adaptativo (2026-05-11): substitui o intervalo fixo de 30s
// por ritmo que varia conforme estado da aba. Latência percebida cai
// de ~15s média (30s polling) pra ~2.5s média quando o user está
// olhando a tela. Pausa quando aba escondida — economiza bateria
// em mobile e evita gastar função-segundos em background.
const POLL_ACTIVE_MS = 5_000;
const POLL_INACTIVE_MS = 30_000;

export default function ForumContent({ session }: Props) {
  const currentUserId = session?.user?.id ?? "";
  const userIsDPO = isDPO(session?.user?.role);

  const [activeTab, setActiveTab] = useState<"forum" | "mensagens">("forum");
  const [posts, setPosts] = useState<ForumPostDTO[]>([]);
  const [messages, setMessages] = useState<ForumPostDTO[]>([]);
  const [stats, setStats] = useState<ForumStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros (só públicos)
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modais
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newMsgOpen, setNewMsgOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const url = new URL("/api/forum", window.location.origin);
      if (categoryFilter !== "all") url.searchParams.set("category", categoryFilter);
      const r = await fetch(url.toString(), { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        setPosts(j.posts ?? []);
        setStats(j.stats ?? null);
      }
    } catch {
      // silencioso
    }
  }, [categoryFilter]);

  const fetchMessages = useCallback(async () => {
    try {
      const r = await fetch("/api/forum/mensagens", { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        setMessages(j.messages ?? []);
      }
    } catch {
      // silencioso
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPosts(), fetchMessages()]);
    setLoading(false);
    // Avisa a sidebar pra atualizar o badge na hora (sem esperar polling)
    notifySidebarRefresh();
  }, [fetchPosts, fetchMessages]);

  // Fetch inicial no mount
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Polling adaptativo: 5s aba ativa, 30s aba sem foco, pausa quando
  // escondida + refetch imediato quando volta. Substitui o setInterval
  // fixo de 30s anterior. Decisão arquitetural pragmática em vez de
  // WebSocket/SSE (que não funcionam bem em Vercel serverless sem
  // pub/sub externo como Pusher/Redis).
  useAdaptivePolling(refresh, {
    activeMs: POLL_ACTIVE_MS,
    inactiveMs: POLL_INACTIVE_MS,
    refetchOnFocus: true,
  });

  // Filtro por search (em memória — quantidade pequena por org)
  const filteredPosts = posts.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      (p.author.name ?? p.author.email).toLowerCase().includes(q)
    );
  });

  const filteredMessages = messages.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      (m.author.name ?? m.author.email).toLowerCase().includes(q) ||
      (m.recipient?.name ?? m.recipient?.email ?? "")
        .toLowerCase()
        .includes(q)
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2.5 mt-1 flex-shrink-0">
            <MessagesSquare className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Fórum e Mensagens
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
              Comunicação entre todos da organização. Posts são vistos por
              todos; mensagens diretas são privadas (1-pra-1).
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setNewMsgOpen(true)}
            className="flex-1 sm:flex-initial"
          >
            <Send className="h-4 w-4 mr-1.5" />
            Mensagem
          </Button>
          <Button
            onClick={() => setNewPostOpen(true)}
            className="flex-1 sm:flex-initial"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Novo Post
          </Button>
        </div>
      </div>

      {/* Filtros (só visível na aba Fórum) */}
      {activeTab === "forum" && (
        <Card>
          <CardContent className="p-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar no fórum..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                <SelectItem value="GERAL">{FORUM_CATEGORY_LABEL.GERAL}</SelectItem>
                <SelectItem value="INVENTARIO">
                  {FORUM_CATEGORY_LABEL.INVENTARIO}
                </SelectItem>
                <SelectItem value="RISCOS">
                  {FORUM_CATEGORY_LABEL.RISCOS}
                </SelectItem>
                <SelectItem value="BASES_LEGAIS">
                  {FORUM_CATEGORY_LABEL.BASES_LEGAIS}
                </SelectItem>
                <SelectItem value="DUVIDA">
                  {FORUM_CATEGORY_LABEL.DUVIDA}
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Filtro só search na aba Mensagens */}
      {activeTab === "mensagens" && (
        <Card>
          <CardContent className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar mensagens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "forum" | "mensagens")}
      >
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="forum">
            <MessageSquare className="h-4 w-4 mr-2" />
            Fórum
            {stats && stats.unreadPublic > 0 && (
              <Badge className="ml-1.5 h-5 px-1.5 bg-red-500 text-white hover:bg-red-500">
                {stats.unreadPublic}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="mensagens">
            <Mail className="h-4 w-4 mr-2" />
            Mensagens
            {stats && stats.unreadDMs > 0 && (
              <Badge className="ml-1.5 h-5 px-1.5 bg-red-500 text-white hover:bg-red-500">
                {stats.unreadDMs}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Aba Fórum */}
        <TabsContent value="forum" className="space-y-2 mt-4">
          {loading && posts.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-500">
              Carregando...
            </p>
          ) : filteredPosts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center space-y-3">
                <MessageSquare className="h-10 w-10 text-gray-400 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {search || categoryFilter !== "all"
                    ? "Nenhum post encontrado"
                    : "Sem posts ainda"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  {search || categoryFilter !== "all"
                    ? "Tente outro termo ou categoria."
                    : "Comece criando o primeiro post pra abrir uma discussão na organização."}
                </p>
                {!search && categoryFilter === "all" && (
                  <Button onClick={() => setNewPostOpen(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Criar primeiro post
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                currentUserId={currentUserId}
                onClick={() => setDetailId(p.id)}
              />
            ))
          )}
        </TabsContent>

        {/* Aba Mensagens */}
        <TabsContent value="mensagens" className="space-y-2 mt-4">
          {loading && messages.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-500">
              Carregando...
            </p>
          ) : filteredMessages.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center space-y-3">
                <Mail className="h-10 w-10 text-gray-400 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {search ? "Nenhuma mensagem encontrada" : "Sem mensagens ainda"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  {search
                    ? "Tente outro termo."
                    : "Mensagens diretas são conversas privadas 1-pra-1 com outros usuários da organização."}
                </p>
                {!search && (
                  <Button onClick={() => setNewMsgOpen(true)}>
                    <Send className="h-4 w-4 mr-1.5" />
                    Enviar primeira mensagem
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((m) => (
              <PostCard
                key={m.id}
                post={m}
                currentUserId={currentUserId}
                onClick={() => setDetailId(m.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <NewPostDialog
        open={newPostOpen}
        onOpenChange={setNewPostOpen}
        isDPO={userIsDPO}
        onSaved={refresh}
      />
      <NewMessageDialog
        open={newMsgOpen}
        onOpenChange={setNewMsgOpen}
        onSaved={refresh}
      />
      <PostDetailDialog
        open={detailId !== null}
        onOpenChange={(v) => !v && setDetailId(null)}
        postId={detailId}
        currentUserId={currentUserId}
        isDPO={userIsDPO}
        onChanged={refresh}
      />
    </div>
  );
}
