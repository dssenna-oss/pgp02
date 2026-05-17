// Layout compartilhado entre /dashboard, /admin e /facilitador
// — sidebar com botão Sair em todas as rotas autenticadas.

import { Sidebar } from "@/components/sidebar";
import { PhaseSkipProvider } from "@/components/phase-skip-provider";

export function AuthedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-50px)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">{children}</main>
      <PhaseSkipProvider />
    </div>
  );
}
