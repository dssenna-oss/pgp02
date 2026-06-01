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
    <div className="min-h-screen flex flex-col">
      {/* Banner institucional full-width — foto da fachada do TCE-ES com faixa azul por cima */}
      <div
        className="relative h-[150px] bg-tcees bg-cover flex items-end shrink-0"
        style={{ backgroundImage: "url('/tcees-topo.jpg')", backgroundPosition: "center 35%" }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, rgba(28,85,152,.82) 0%, rgba(28,85,152,.42) 55%, rgba(28,85,152,.05) 100%)" }}
          aria-hidden
        />
        <div className="relative px-6 pb-4 pl-14 lg:pl-6 text-white">
          <div className="text-[20px] font-extrabold drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
            🏛️ Tribunal de Contas do Estado do Espírito Santo
          </div>
          <div className="text-[12px] mt-0.5 text-blue-50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            ⊕ Portal · Comitê Executivo de Proteção de Dados Pessoais
          </div>
        </div>
      </div>

      {/* Linha: menu lateral + conteúdo */}
      <div className="flex flex-1 min-h-0">
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
    </div>
  );
}
