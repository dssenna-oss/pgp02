"use client";

import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Megaphone,
  Pin,
  Mail,
  ArrowRight,
  Reply,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FORUM_CATEGORY_LABEL,
  FORUM_CATEGORY_CLS,
  FORUM_TYPE_LABEL,
  timeAgoShort,
  type ForumPostDTO,
  type ForumCategory,
} from "@/lib/forum-types";
import ReactionBar from "./reaction-bar";
import { stripMentionMarkdown } from "@/lib/forum-mentions";

interface Props {
  post: ForumPostDTO;
  /** ID do user atual — pra mostrar "você" no autor/destinatário. */
  currentUserId: string;
  onClick: () => void;
}

/**
 * Card resumido de um post (público) ou DM, usado nas listas.
 */
export default function PostCard({ post, currentUserId, onClick }: Props) {
  const isAnnouncement = post.type === "ANNOUNCEMENT";
  const isDM = !!post.recipientId;
  const isAuthor = post.authorId === currentUserId;
  const otherParty = isDM
    ? isAuthor
      ? post.recipient
      : post.author
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left border rounded-lg p-3 transition-colors",
        "hover:bg-gray-50 dark:hover:bg-gray-900/40",
        post.read
          ? "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
          : "border-blue-300 dark:border-blue-800/60 bg-blue-50/30 dark:bg-blue-950/15",
        post.pinned && "border-l-4 border-l-amber-500",
        isAnnouncement && "border-l-4 border-l-emerald-500"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Ícone do tipo */}
        <div
          className={cn(
            "p-2 rounded-md flex-shrink-0 mt-0.5",
            isDM
              ? "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
              : isAnnouncement
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
          )}
        >
          {isDM ? (
            <Mail className="h-4 w-4" />
          ) : isAnnouncement ? (
            <Megaphone className="h-4 w-4" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3
              className={cn(
                "font-semibold text-sm leading-tight break-words",
                post.read
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-900 dark:text-white"
              )}
            >
              {post.title}
            </h3>
            {post.pinned && (
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-xs h-5"
              >
                <Pin className="h-3 w-3 mr-1" /> Fixado
              </Badge>
            )}
            {!post.read && (
              <Badge
                variant="outline"
                className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 text-xs h-5 font-bold"
              >
                Novo
              </Badge>
            )}
          </div>

          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2 break-words">
            {stripMentionMarkdown(post.content)}
          </p>

          {/* Metadata */}
          <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-gray-500 dark:text-gray-400">
            {/* Autor */}
            <span className="font-medium">
              {isDM
                ? isAuthor
                  ? `→ ${otherParty?.name ?? otherParty?.email ?? "?"}`
                  : `← ${post.author.name ?? post.author.email}`
                : post.author.name ?? post.author.email}
              {isAuthor && !isDM && (
                <span className="text-gray-400 ml-1">(você)</span>
              )}
            </span>

            <span>·</span>
            <span>{timeAgoShort(post.createdAt)}</span>

            {/* Categoria — só posts públicos */}
            {!isDM && post.category && (
              <>
                <span>·</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs h-5",
                    FORUM_CATEGORY_CLS[post.category as ForumCategory]
                  )}
                >
                  {FORUM_CATEGORY_LABEL[post.category as ForumCategory]}
                </Badge>
              </>
            )}

            {/* Tipo Comunicado */}
            {isAnnouncement && (
              <Badge
                variant="outline"
                className="text-xs h-5 bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              >
                <Megaphone className="h-3 w-3 mr-1" />
                {FORUM_TYPE_LABEL.ANNOUNCEMENT}
              </Badge>
            )}

            {/* Contagem de respostas */}
            {post.replyCount > 0 && (
              <span className="inline-flex items-center gap-1 ml-auto">
                <Reply className="h-3 w-3" />
                {post.replyCount}{" "}
                {post.replyCount === 1 ? "resposta" : "respostas"}
              </span>
            )}
          </div>

          {/* Reações — só aparecem se tem alguma OU se o user clicar no '+' */}
          {(post.reactions?.length ?? 0) > 0 && (
            <div className="mt-2.5">
              <ReactionBar
                postId={post.id}
                reactions={post.reactions ?? []}
                size="sm"
              />
            </div>
          )}
        </div>

        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}
