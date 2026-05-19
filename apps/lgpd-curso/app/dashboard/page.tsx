import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  Database, ShieldAlert, ClipboardCheck, FileSearch,
  Building2, UserCheck, FileText, AlertTriangle, Target, PartyPopper,
} from "lucide-react";
import Link from "next/link";
import { getMissoesProgresso, type MissoesProgresso } from "@/lib/missoes-progresso";
import { MapaPgp, type FaseAtual } from "@/components/mapa-pgp";

export const dynamic = "force-dynamic";

type MissaoOrdem = {
  key: keyof MissoesProgresso;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  emoji: string;
  rotulo: string;       // "Missão 1"
  titulo: string;       // "Inventário de Dados"
  desc: string;
  dpoOnly?: boolean;
};

const MISSOES_ORDEM: MissaoOrdem[] = [
  { key: "m1",            href: "/dashboard/inventario",  icon: Database,       emoji: "📦", rotulo: "Missão 1",  titulo: "Inventário de Dados",     desc: "Liste os dados pessoais tratados nos 2 processos do grupo." },
  { key: "m2",            href: "/dashboard/riscos",      icon: ShieldAlert,    emoji: "⚠️", rotulo: "Missão 2",  titulo: "Análise de Riscos",       desc: "Identifique e classifique riscos na matriz 3×3 P×I." },
  { key: "m3",            href: "/dashboard/gap",         icon: ClipboardCheck, emoji: "📋", rotulo: "Missão 3",  titulo: "GAP Analysis",            desc: "Responda os 10 controles selecionados do pacote.",                       dpoOnly: true },
  { key: "plano_acao",    href: "/dashboard/plano-acao",  icon: Target,         emoji: "🎯", rotulo: "Plano de Ação", titulo: "Plano de Ação",       desc: "Consolide o que veio de Riscos e GAP em ações com responsável e prazo.", dpoOnly: true },
  { key: "m4a_ripd",      href: "/dashboard/ripd",        icon: FileSearch,     emoji: "🔍", rotulo: "Missão 4a", titulo: "RIPD",                    desc: "Relatório de Impacto à Proteção de Dados — pré-requisito do Aviso.",     dpoOnly: true },
  { key: "m4a_terceiros", href: "/dashboard/terceiros",   icon: Building2,      emoji: "🏢", rotulo: "Missão 4a", titulo: "Gestão de Terceiros",     desc: "Liste operadores e contratos vigentes.",                                 dpoOnly: true },
  { key: "m4a_dsr",       href: "/dashboard/dsr",         icon: UserCheck,      emoji: "👤", rotulo: "Missão 4a", titulo: "Direitos do Titular",     desc: "Estruture o canal de exercício de direitos.",                            dpoOnly: true },
  { key: "m4b",           href: "/dashboard/aviso",       icon: FileText,       emoji: "📄", rotulo: "Missão 4b", titulo: "Aviso de Privacidade",    desc: "Síntese pública — alimentada pelos 3 pré-requisitos da Missão 4a.",      dpoOnly: true },
  { key: "m5",            href: "/dashboard/incidentes",  icon: AlertTriangle,  emoji: "🚨", rotulo: "Missão 5",  titulo: "Incidentes",              desc: "Resposta a incidentes + Comunicação ANPD.",                              dpoOnly: true },
];

function getProximaMissao(progresso: MissoesProgresso, isDpoOuAdmin: boolean): MissaoOrdem | null {
  for (const m of MISSOES_ORDEM) {
    if (m.dpoOnly && !isDpoOuAdmin) continue;
    if (!progresso[m.key]) return m;
  }
  return null;
}

// Mapa: Fase do PGP → quais missões precisam estar feitas pra fase ter sido cumprida.
// Fases 1 e 2 são contexto pré-curso (entram no Mapa como "feito antes").
// Fase 3 = Mapeamento (m1 + m2); Fase 4 = GAP (m3); Fase 5 = Plano (plano_acao);
// Fase 6 = Execução (m4a_* + m4b); Fase 7 = Monitoramento (m5).
function getFaseAtual(progresso: MissoesProgresso, isDpoOuAdmin: boolean): FaseAtual {
  if (!progresso.m1 || !progresso.m2) return "f3";
  if (isDpoOuAdmin && !progresso.m3) return "f4";
  if (isDpoOuAdmin && !progresso.plano_acao) return "f5";
  if (isDpoOuAdmin && (!progresso.m4a_ripd || !progresso.m4a_terceiros || !progresso.m4a_dsr || !progresso.m4b)) return "f6";
  if (isDpoOuAdmin && !progresso.m5) return "f7";
  return "concluido";
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name ?? "Participante";
  const companyName = session?.user?.company?.name ?? "—";
  const role = session?.user?.role;
  const isDpoOuAdmin = role === "DPO" || role === "ADMIN";

  const progresso = await getMissoesProgresso();
  const proxima = getProximaMissao(progresso, isDpoOuAdmin);
  const faseAtual = getFaseAtual(progresso, isDpoOuAdmin);

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Olá, {userName}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Você está no grupo <strong>{companyName}</strong>. Boa jornada!
        </p>
      </header>

      <section className="mb-6">
        <MapaPgp faseAtual={faseAtual} />
      </section>

      {proxima ? (
        <Link
          href={proxima.href}
          className="block bg-emerald-600 hover:bg-emerald-700 transition-colors text-white rounded-lg p-5 mt-2 shadow-md"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">Sua missão atual</div>
              <div className="text-lg sm:text-xl font-bold mt-1 truncate">
                {proxima.emoji} {proxima.rotulo} — {proxima.titulo}
              </div>
              <div className="text-sm opacity-90 mt-1 line-clamp-2">{proxima.desc}</div>
            </div>
            <div className="text-3xl shrink-0">→</div>
          </div>
        </Link>
      ) : (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-5 mt-2 shadow-sm">
          <div className="flex items-center gap-3">
            <PartyPopper className="h-7 w-7 text-amber-700 shrink-0" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Parabéns!</div>
              <div className="text-lg font-bold text-amber-900 mt-0.5">Seu grupo fechou todas as missões</div>
              <div className="text-sm text-amber-800 mt-0.5">Aguarde o facilitador conduzir o debrief final.</div>
            </div>
          </div>
        </div>
      )}

      <section className="mt-8 p-4 bg-training-50 border border-training-400 rounded-lg">
        <h2 className="text-sm font-semibold text-training-900 mb-1">
          Como funciona o curso
        </h2>
        <p className="text-xs text-training-900 leading-relaxed">
          Você e seu grupo vão percorrer as missões cronometradas, na ordem da sidebar.
          Cada missão termina com check-in coletivo do facilitador. Não tente pular a Missão 4a (RIPD + Terceiros + DSR) — ela alimenta a Missão 4b (Aviso de Privacidade).
          Errar é parte do aprendizado. Pergunte aos observadores do seu grupo se ficar em dúvida — eles têm o mural do grupo na mesa.
        </p>
      </section>
    </div>
  );
}
