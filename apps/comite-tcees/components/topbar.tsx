"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, LogOut } from "lucide-react";
import { iniciais } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  COORDENADOR: "Coordenador",
  MEMBRO: "Membro",
};

export function Topbar({
  userName,
  role,
  unread,
}: {
  userName: string;
  role: string;
  unread: number;
}) {
  return (
    <div className="bg-white border-b sticky top-0 z-10 px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 pl-10 lg:pl-0">
        <span className="text-[11px] uppercase tracking-wide text-gray-500">Instituição</span>
        <span className="text-[13px] font-semibold text-gray-900 border rounded-lg px-3 py-1.5 bg-white">
          Tribunal de Contas do ES (TCEES)
        </span>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/dashboard/notificacoes" className="relative" title="Notificações">
          <Bell className="w-[18px] h-[18px] text-gray-600" />
          {unread > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full px-1.5 leading-4">
              {unread}
            </span>
          )}
        </Link>
        <span className="hidden sm:inline text-[12.5px] text-gray-600">
          {userName} · <b>{ROLE_LABEL[role] ?? role}</b>
        </span>
        <span className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-[13px]">
          {iniciais(userName)}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sair"
          className="text-gray-400 hover:text-gray-700"
        >
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
}
