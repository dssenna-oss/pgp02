"use client";

/**
 * Renderiza um texto do Fórum substituindo tokens
 * `@[Nome](mention:userId)` por chips visuais. Tudo que não for menção
 * é renderizado como texto puro (com `whitespace-pre-wrap` no caller).
 *
 * Não faz parsing de markdown (negrito, itálico, etc.) — só menções.
 * O Fórum atual já mostra `<div className="whitespace-pre-wrap">`, o
 * que basta pra quebras de linha; o resto fica como input do user.
 */

import { Fragment } from "react";
import { MENTION_RE } from "@/lib/forum-mentions";

interface Props {
  content: string;
  className?: string;
}

export default function MentionText({ content, className }: Props) {
  const parts: Array<string | { uid: string; label: string }> = [];
  const re = new RegExp(MENTION_RE.source, "gi");
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIndex) {
      parts.push(content.slice(lastIndex, m.index));
    }
    parts.push({ label: m[1], uid: m[2] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (typeof p === "string") {
          return <Fragment key={i}>{p}</Fragment>;
        }
        return (
          <span
            key={i}
            className="inline-flex items-center px-1 py-0.5 rounded text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-950/40 text-[0.95em] font-medium"
            title="Usuário mencionado"
          >
            @{p.label}
          </span>
        );
      })}
    </span>
  );
}
