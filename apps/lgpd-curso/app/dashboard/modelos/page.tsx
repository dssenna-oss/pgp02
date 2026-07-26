// 📦 Pacote de Modelos — hub DENTRO do app (celular do participante logado).
// É o hrefAluno do conteúdo "pacote-modelos" do Telão Comandado: quando o
// facilitador projeta o Pacote, o celular em Modo Cards espelha pra cá.
// Rota liberada pro ADMIN no middleware (ADMIN_DASHBOARD_PERMITIDO).

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ListaModelos } from "@/components/modelos/lista-modelos";

export default function HubModelosDashboardPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-900"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <header className="mb-4 mt-2">
        <h1 className="text-xl font-bold text-gray-900">📦 Pacote de Modelos</h1>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">
          Os 21 modelos do curso, prontos pra ler, copiar e adaptar — com exemplo preenchido.
        </p>
      </header>
      <ListaModelos base="/dashboard/modelos" />
    </div>
  );
}
