"use client";

/**
 * Textarea com autocomplete @user — quando o usuário digita "@" abre um
 * popover com os usuários da organização. Clique/Enter insere
 * `@[Nome do Usuário](mention:userId)` no texto.
 *
 * Não regrava todo o sistema de markdown — encapsula só o textarea +
 * popover. O conteúdo final fica no `value` igual a qualquer textarea
 * (props compatíveis com forms já existentes).
 *
 * Decisões pragmáticas:
 *  - Cache dos usuários numa fetch única na montagem (sem re-fetch a
 *    cada @ pra não estressar a API; orgs típicas têm <100 users).
 *  - Filtro client-side por substring no nome ou email.
 *  - Sem hover-preview de avatar/role — só nome + email + setor.
 *  - Sem keyboard nav vertical (PageUp/Down/Tab) — Enter aceita o 1º
 *    da lista filtrada, Esc fecha. KISS pra V1.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

interface MentionableUser {
  id: string;
  name: string | null;
  email: string;
  setor: string | null;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
  /** Hint visível abaixo do campo (UX). */
  hint?: string;
  id?: string;
}

export interface MentionTextareaRef {
  focus: () => void;
}

const MentionTextarea = forwardRef<MentionTextareaRef, Props>(function MentionTextarea(
  { value, onChange, placeholder, className, rows = 4, disabled, hint, id },
  ref,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [users, setUsers] = useState<MentionableUser[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  // Posição do "@" no texto (índice em chars). Null = sem @ ativo.
  const [atStart, setAtStart] = useState<number | null>(null);
  // Filtro digitado depois do @ (sem o @).
  const [query, setQuery] = useState("");

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  // Fetch users uma vez na montagem
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/forum/usuarios");
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        setUsers(Array.isArray(json?.users) ? json.users : []);
      } catch {
        // silencioso — autocomplete simplesmente não funciona
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (atStart === null) return [];
    const q = query.toLowerCase().trim();
    const pool = q
      ? users.filter((u) => {
          const name = (u.name ?? "").toLowerCase();
          const email = u.email.toLowerCase();
          return name.includes(q) || email.includes(q);
        })
      : users;
    return pool.slice(0, 6);
  }, [atStart, query, users]);

  /** Detecta @<query> baseado na posição do cursor. */
  const updatePopoverFromTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) {
      setPopoverOpen(false);
      setAtStart(null);
      return;
    }
    const caret = ta.selectionStart ?? 0;
    const text = ta.value;
    // Volta caracteres até encontrar @ não escapado, espaço ou início.
    let i = caret - 1;
    let foundAt = -1;
    while (i >= 0) {
      const c = text[i];
      if (c === "@") {
        foundAt = i;
        break;
      }
      if (c === " " || c === "\n" || c === "\t") break;
      // Limita a 30 chars de busca pra não escanear texto inteiro
      if (caret - i > 30) break;
      i--;
    }
    if (foundAt === -1) {
      setPopoverOpen(false);
      setAtStart(null);
      setQuery("");
      return;
    }
    // Caso especial: o @ tem que estar no início OU precedido por espaço/quebra
    const before = foundAt > 0 ? text[foundAt - 1] : "";
    if (before && before !== " " && before !== "\n" && before !== "\t") {
      setPopoverOpen(false);
      setAtStart(null);
      setQuery("");
      return;
    }
    const q = text.slice(foundAt + 1, caret);
    setAtStart(foundAt);
    setQuery(q);
    setPopoverOpen(true);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
    // Pequeno delay pra garantir que selectionStart já mudou
    requestAnimationFrame(updatePopoverFromTextarea);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!popoverOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setPopoverOpen(false);
      setAtStart(null);
    } else if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      insertMention(filtered[0]);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      // Suprime nav do textarea quando popover aberto; V1 não tem
      // highlighted state, mas evita scroll inesperado.
      e.preventDefault();
    }
  }

  function insertMention(u: MentionableUser) {
    if (atStart === null) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const caret = ta.selectionStart ?? 0;
    const before = value.slice(0, atStart);
    const after = value.slice(caret);
    const label = u.name?.trim() || u.email;
    const token = `@[${label}](mention:${u.id})`;
    const newValue = `${before}${token} ${after}`;
    onChange(newValue);
    setPopoverOpen(false);
    setAtStart(null);
    setQuery("");
    // Reposiciona cursor depois do token + espaço
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      const newCaret = before.length + token.length + 1;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(newCaret, newCaret);
    });
  }

  function handleClick() {
    requestAnimationFrame(updatePopoverFromTextarea);
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onBlur={() => {
          // Pequeno delay pra permitir click no popover antes de fechar
          setTimeout(() => setPopoverOpen(false), 150);
        }}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full text-sm p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900",
          className,
        )}
      />
      {hint && !popoverOpen && (
        <p className="text-xs text-gray-500 mt-1">{hint}</p>
      )}
      {popoverOpen && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 sm:right-auto sm:min-w-[280px] sm:max-w-[400px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden">
          <div className="px-3 py-1.5 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700">
            Selecione pra mencionar (Enter aceita o 1º)
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {filtered.map((u, idx) => (
              <li key={u.id}>
                <button
                  type="button"
                  // onMouseDown pra disparar antes do onBlur do textarea
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(u);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-violet-50 dark:hover:bg-violet-950/30",
                    idx === 0 && "bg-violet-50/40 dark:bg-violet-950/20",
                  )}
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {u.name ?? u.email}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {u.email}
                    {u.setor ? ` · ${u.setor}` : ""}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {popoverOpen && filtered.length === 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 sm:min-w-[280px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg px-3 py-2 text-xs text-gray-500">
          Nenhum usuário com "{query}".
        </div>
      )}
    </div>
  );
});

export default MentionTextarea;
