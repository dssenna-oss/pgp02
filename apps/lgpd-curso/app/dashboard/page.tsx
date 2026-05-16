import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  Database, ShieldAlert, ClipboardCheck, FileSearch,
  Building2, UserCheck, FileText, AlertTriangle
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const journeyCards = [
  { href: "/dashboard/inventario", icon: Database,        title: "Inventário de Dados",     missao: "Missão 1",  desc: "Liste os dados pessoais tratados nos 2 processos do grupo." },
  { href: "/dashboard/riscos",     icon: ShieldAlert,     title: "Análise de Riscos",       missao: "Missão 2",  desc: "Identifique e classifique riscos na matriz 3×3 P×I." },
  { href: "/dashboard/gap",        icon: ClipboardCheck,  title: "GAP Analysis",            missao: "Missão 3",  desc: "Responda os 10 controles selecionados do pacote." },
  { href: "/dashboard/ripd",       icon: FileSearch,      title: "RIPD",                    missao: "Missão 4a", desc: "Relatório de Impacto à Proteção de Dados — pré-requisito do Aviso." },
  { href: "/dashboard/terceiros",  icon: Building2,       title: "Gestão de Terceiros",     missao: "Missão 4a", desc: "Liste operadores e contratos vigentes." },
  { href: "/dashboard/dsr",        icon: UserCheck,       title: "Direitos do Titular",     missao: "Missão 4a", desc: "Estruture o canal de exercício de direitos." },
  { href: "/dashboard/aviso",      icon: FileText,        title: "Aviso de Privacidade",    missao: "Missão 4b", desc: "Síntese pública — alimentada pelos 3 pré-requisitos." },
  { href: "/dashboard/incidentes", icon: AlertTriangle,   title: "Incidentes",              missao: "Missão 5",  desc: "Resposta a incidentes + Comunicação ANPD." },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name ?? "Participante";
  const companyName = session?.user?.company?.name ?? "—";

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Olá, {userName}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Você está no grupo <strong>{companyName}</strong>. Boa jornada!
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {journeyCards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group block border rounded-lg p-4 hover:border-brand-500 hover:shadow-sm transition-all bg-white"
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className="h-6 w-6 text-brand-600" />
                <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  {c.missao}
                </span>
              </div>
              <h3 className="font-medium text-sm group-hover:text-brand-700 transition-colors">
                {c.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{c.desc}</p>
            </Link>
          );
        })}
      </section>

      <section className="mt-10 p-4 bg-training-50 border border-training-400 rounded-lg">
        <h2 className="text-sm font-semibold text-training-900 mb-1">
          Como funciona o curso
        </h2>
        <p className="text-xs text-training-900 leading-relaxed">
          Você e seu grupo vão percorrer 5 missões cronometradas, na ordem da sidebar.
          Cada missão termina com check-in coletivo do facilitador. Não tente pular a Missão 4a (RIPD + Terceiros + DSR) — ela alimenta a Missão 4b (Aviso de Privacidade).
          Errar é parte do aprendizado. Pergunte aos observadores do seu grupo se ficar em dúvida — eles têm o flipchart.
        </p>
      </section>
    </div>
  );
}
