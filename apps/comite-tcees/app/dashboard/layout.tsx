import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const unread = await prisma.notificacao.count({ where: { lida: false } }).catch(() => 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar userName={session.user.name} role={session.user.role} unread={unread} />
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-amber-200 text-amber-800 text-[12.5px] px-6 py-2.5 flex gap-2 items-center">
          ⚠️
          <span>
            <b>Dados reais do Plano de Trabalho do TCEES (2026-2027).</b> Acompanhamento do Comitê
            Executivo de Proteção de Dados Pessoais — Portaria Normativa nº 22/2026.
          </span>
        </div>
        <main className="px-6 py-6 pb-16 w-full max-w-[1180px]">{children}</main>
      </div>
    </div>
  );
}
