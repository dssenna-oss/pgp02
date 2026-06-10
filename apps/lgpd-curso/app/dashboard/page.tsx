import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  Database, ShieldAlert, ClipboardCheck, FileSearch,
  Building2, UserCheck, FileText, AlertTriangle, Target, PartyPopper,
} from "lucide-react";
import Link from "next/link";
import { getMissoesProgresso, type MissoesProgresso } from "@/lib/missoes-progresso";
import { MapaPgp, type FaseAtual } from "@/components/mapa-pgp";
import { turmaEmModoCards } from "@/lib/curso-permissoes";

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
  const modoCards = await turmaEmModoCards(session?.user?.companyId);

  const progresso = await getMissoesProgresso();
  const proxima = getProximaMissao(progresso, isDpoOuAdmin);
  const faseAtual = getFaseAtual(progresso, isDpoOuAdmin);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Olá, {userName}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Você está no grupo <strong>{companyName}</strong>. Boa jornada!
        </p>
      </header>

      {/* Modo Cards (Modalidade C): a home vira tela de orientação/espera — hero
          "Siga o telão" com a identidade do telão + jornada NEUTRA recolhida
          (sem "feito"/"você está aqui": Preliminar/F1/F2 acontecem AO VIVO no
          curso; status de progresso aqui geraria a sensação de "o que eu perdi?").
          Na Modalidade A, o mapa original com progresso continua valendo. */}
      {modoCards ? (
        <>
          <HeroSigaTelao />
          <JornadaCurso />
        </>
      ) : (
        <section className="mb-6">
          <MapaPgp faseAtual={faseAtual} />
        </section>
      )}

      {/* Em Modo Cards a produção é física — esconde o CTA de "missão atual"
          (que leva a telas só-leitura) pra não contradizer o "siga o telão". */}
      {!modoCards && (proxima ? (
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
      ))}

      <section className="mt-8 p-4 bg-training-50 border border-training-400 rounded-lg">
        <h2 className="text-sm font-semibold text-training-900 mb-1">
          Como funciona o curso
        </h2>
        {modoCards ? (
          <p className="text-xs text-training-900 leading-relaxed">
            <strong>Modalidade C — produção nos cards da mesa.</strong> Aqui no celular você faz só os
            <strong> toques leves</strong> (quiz, votações, termômetro) e <strong>só quando o facilitador pedir</strong>.
            O detalhamento (Inventário, Riscos…) é feito nos <strong>cards físicos</strong> com seu grupo. Acompanhe o <strong>telão</strong> — ele dá o ritmo.
          </p>
        ) : (
          <p className="text-xs text-training-900 leading-relaxed">
            Você e seu grupo vão percorrer as missões cronometradas, na ordem da sidebar.
            Cada missão termina com check-in coletivo do facilitador. Não tente pular a Missão 4a (RIPD + Terceiros + DSR) — ela alimenta a Missão 4b (Aviso de Privacidade).
            Errar é parte do aprendizado. Pergunte aos observadores do seu grupo se ficar em dúvida — eles têm o mural do grupo na mesa.
          </p>
        )}
      </section>
    </div>
  );
}

// Hero da home em Modo Cards (Modalidade C): tela de orientação/espera com a
// MESMA identidade visual da tela de espera do telão (fundo LGPD + selo +
// frase da jornada). Mata a confusão de "o que eu perdi?" logo na entrada.
function HeroSigaTelao() {
  return (
    <div
      className="relative mb-4 overflow-hidden rounded-2xl bg-slate-900 bg-cover bg-center text-center text-white"
      style={{ backgroundImage: "url('/telao-espera-fundo.webp')" }}
    >
      <div className="absolute inset-0 bg-slate-900/60" />
      <div className="relative z-10 px-5 py-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lgpd-badge-transparente.png" alt="LGPD" className="mx-auto h-16 w-auto drop-shadow-lg" />
        <p className="mt-2.5 text-2xl font-extrabold">👀 Siga o telão</p>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-white/90">
          Aguarde o facilitador. Abra cada atividade no celular{" "}
          <strong>só quando ele pedir</strong> — a produção do seu grupo é nos{" "}
          <strong>cards da mesa</strong> 🃏.
        </p>
        <p className="mt-3.5 text-[13px] italic text-white/75">
          Adequação à LGPD é uma <span className="text-[#F0997B]">jornada</span>, não um destino.
        </p>
      </div>
    </div>
  );
}

// Jornada NEUTRA (Modo Cards): o mapa das 8 etapas SEM status — nada de
// "feito" nem "você está aqui". Em Modalidade C, Preliminar/F1/F2 acontecem
// ao vivo no curso (momentos 5-7 do roteiro); marcar como "feito" faria o
// aluno achar que perdeu algo. Recolhida por padrão (<details> nativo).
const JORNADA_ETAPAS = [
  { num: "·", rotulo: "Preliminar", nome: "Sensibilização e engajamento" },
  { num: "1", rotulo: "Fase 1", nome: "Formação das equipes" },
  { num: "2", rotulo: "Fase 2", nome: "Diagnóstico inicial" },
  { num: "3", rotulo: "Fase 3", nome: "Mapeamento e Análise de Riscos" },
  { num: "4", rotulo: "Fase 4", nome: "GAP Analysis" },
  { num: "5", rotulo: "Fase 5", nome: "Plano de Ação" },
  { num: "6", rotulo: "Fase 6", nome: "Execução" },
  { num: "7", rotulo: "Fase 7", nome: "Monitoramento" },
];

function JornadaCurso() {
  return (
    <details className="mb-6 rounded-xl border border-gray-200 bg-gray-50">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-semibold text-gray-700 [&::-webkit-details-marker]:hidden">
        <span>🗺️ Nossa jornada no curso</span>
        <span className="text-gray-400">▾</span>
      </summary>
      <div className="px-4 pb-3.5">
        <p className="mb-1.5 text-xs text-gray-500">
          Vamos percorrer estas etapas juntos, no ritmo do telão. Nada aqui é tarefa sua
          agora — é só o mapa do caminho.
        </p>
        {JORNADA_ETAPAS.map((e) => (
          <div key={e.rotulo} className="flex items-center gap-2.5 border-t border-gray-100 py-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
              {e.num}
            </span>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{e.rotulo}</div>
              <div className="text-sm font-medium text-gray-700">{e.nome}</div>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
