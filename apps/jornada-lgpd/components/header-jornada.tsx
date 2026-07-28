"use client";

// Cabeçalho com a marca. Client só pelo botão "Sair" (signOut).

import Link from "next/link";
import { signOut } from "next-auth/react";
import { KeyRound, LogOut } from "lucide-react";

export function HeaderJornada({ nome, role }: { nome: string | null; role: string | null }) {
  const home = role === "ADMIN" ? "/admin" : "/jornada";
  return (
    <header className="border-b border-teal-900/20 bg-teal-800 text-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href={nome ? home : "/"} className="min-w-0">
          <span className="block text-lg font-extrabold leading-tight tracking-tight">
            Jornada LGPD
          </span>
          <span className="block text-[11px] font-medium uppercase tracking-widest text-teal-200">
            Clube do Servidor
          </span>
        </Link>
        {nome ? (
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-sm text-teal-100 sm:block">{nome}</span>
            <Link
              href="/senha"
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600 bg-teal-700/60 px-3 py-1.5 text-xs font-semibold text-teal-50 hover:bg-teal-700"
            >
              <KeyRound className="h-3.5 w-3.5" /> Senha
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600 bg-teal-700/60 px-3 py-1.5 text-xs font-semibold text-teal-50 hover:bg-teal-700"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        ) : (
          <Link
            href="/entrar"
            className="shrink-0 rounded-lg bg-white px-4 py-1.5 text-sm font-bold text-teal-800 hover:bg-teal-50"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
