// Layout compartilhado entre /dashboard, /admin e /facilitador
// — sidebar com botão Sair em todas as rotas autenticadas.

import { Sidebar } from "@/components/sidebar";
import { PhaseSkipProvider } from "@/components/phase-skip-provider";
import { DsrAlertBanner } from "@/components/dsr-alert-banner";
import { IncidentAlertBanner } from "@/components/incident-alert-banner";
import { Heartbeat } from "@/components/heartbeat";

export function AuthedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-50px)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-white flex flex-col">
        {/* Incidente é mais urgente — fica acima do banner DSR */}
        <IncidentAlertBanner />
        <DsrAlertBanner />
        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </main>
      <PhaseSkipProvider />
      {/* Heartbeat invisível — POST /api/curso/heartbeat a cada 30s pra
          atualizar lastSeenAt. Painel do Facilitador usa pra mostrar
          papéis ativos por grupo. */}
      <Heartbeat />
    </div>
  );
}
