"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Send,
  Pin,
  PinOff,
  Trash2,
  Megaphone,
  Mail,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FORUM_CATEGORY_LABEL,
  FORUM_CATEGORY_CLS,
  timeAgoShort,
  type ForumPostDTO,
  type ForumCategory,
} from "@/lib/forum-types";
import ReactionBar from "./reaction-bar";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  postId: string | null;
  currentUserId: string;
  isDPO: boolean;
  onChanged: () => Promise<void>;
}

/**
 * Modal com o detalhe completo de um post + respostas + caixa de
 * resposta. Usado tanto pra posts públicos como pra DMs.
 */
export default function PostDetailDialog({
  open,
  onOpenChange,
  postId,
  currentUserId,
  isDPO,
  onChanged,
}: Props) {
  const [post, setPost] = useState<ForumPostDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !postId) {
      setPost(null);
      setReplyContent("");
      return;
    }
    void loadPost();
  }, [open, postId]);

  const loadPost = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/forum/${postId}`);
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        toast.error(j.error ?? "Erro ao carregar");
        onOpenChange(false);
        return;
      }
      const j = await r.json();
      setPost(j.post);
    } catch {
      toast.error("Erro de rede");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!postId) return;
    const c = replyContent.trim();
    if (!c) return;
    setSending(true);
    try {
      const r = await fetch(`/api/forum/${postId}/respostas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: c }),
      });
      const j = await r.json();
      if (!r.ok) {
        toast.error(j.error ?? "Erro ao responder");
        return;
      }
      setReplyContent("");
      await loadPost();
      await onChanged();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setSending(false);
    }
  };

  const handlePin = async (pinned: boolean) => {
    if (!postId) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/forum/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        toast.error(j.error ?? "Erro");
        return;
      }
      toast.success(pinned ? "Post fixado" : "Post desfixado");
      await loadPost();
      await onChanged();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!postId || !post) return;
    if (!confirm(`Excluir "${post.title}"?`)) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/forum/${postId}`, { method: "DELETE" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        toast.error(j.error ?? "Erro ao excluir");
        return;
      }
      toast.success("Post excluído");
      onOpenChange(false);
      await onChanged();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setBusy(false);
    }
  };

  const isAuthor = post?.authorId === currentUserId;
  const isDM = !!post?.recipientId;
  const isAnnouncement = post?.type === "ANNOUNCEMENT";
  const canDelete = isAuthor || isDPO;
  const canPin = !isDM && isDPO;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap pr-6">
            {isDM ? (
              <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            ) : isAnnouncement ? (
              <Megaphone className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            )}
            <span className="break-words">{post?.title ?? "Carregando…"}</span>
            {post?.pinned && (
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
              >
                <Pin className="h-3 w-3 mr-1" /> Fixado
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : post ? (
          <div className="space-y-4">
            {/* Header com metadados */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">
                {post.author.name ?? post.author.email}
                {isAuthor && (
                  <span className="text-gray-400 ml-1">(você)</span>
                )}
              </span>
              <span>·</span>
              <span>{timeAgoShort(post.createdAt)}</span>
              {!isDM && post.category && (
                <>
                  <span>·</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      FORUM_CATEGORY_CLS[post.category as ForumCategory]
                    )}
                  >
                    {FORUM_CATEGORY_LABEL[post.category as ForumCategory]}
                  </Badge>
                </>
              )}
              {isDM && post.recipient && (
                <>
                  <span>·</span>
                  <span>
                    {isAuthor ? "→ Pra " : "← De "}
                    <strong>
                      {isAuthor
                        ? post.recipient.name ?? post.recipient.email
                        : post.author.name ?? post.author.email}
                    </strong>
                  </span>
                </>
              )}
            </div>

            {/* Conteúdo */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
                {post.content}
              </p>
            </div>

            {/* Reações — sempre renderiza (com botão '+' se vazio) */}
            <ReactionBar
              postId={post.id}
              reactions={post.reactions ?? []}
              size="md"
              onChange={(next) =>
                setPost((cur) => (cur ? { ...cur, reactions: next } : cur))
              }
            />

            {/* Ações de moderação */}
            {(canPin || canDelete) && (
              <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-200 dark:border-gray-800">
                {canPin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePin(!post.pinned)}
                    disabled={busy}
                  >
                    {post.pinned ? (
                      <>
                        <PinOff className="h-3.5 w-3.5 mr-1.5" /> Desfixar
                      </>
                    ) : (
                      <>
                        <Pin className="h-3.5 w-3.5 mr-1.5" /> Fixar no topo
                      </>
                    )}
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400"
                    onClick={handleDelete}
                    disabled={busy}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
                  </Button>
                )}
              </div>
            )}

            {/* Respostas */}
            <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                {post.replyCount === 0
                  ? "Sem respostas ainda"
                  : `${post.replyCount} ${
                      post.replyCount === 1 ? "resposta" : "respostas"
                    }`}
              </h4>
              {post.replies?.map((reply) => (
                <div
                  key={reply.id}
                  className="border-l-2 border-gray-200 dark:border-gray-800 pl-3 py-1"
                >
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                    <strong>
                      {reply.author.name ?? reply.author.email}
                    </strong>
                    {reply.authorId === currentUserId && (
                      <span className="text-gray-400 ml-1">(você)</span>
                    )}
                    <span className="mx-1">·</span>
                    <span>{timeAgoShort(reply.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                    {reply.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Caixa de resposta */}
            <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-800">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Escreva sua resposta..."
                rows={3}
                maxLength={5000}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleReply}
                  disabled={sending || replyContent.trim().length === 0}
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  {sending ? "Enviando..." : "Responder"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
