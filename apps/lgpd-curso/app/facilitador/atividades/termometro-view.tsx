"use client";

// Panorama da turma no Termômetro (INDIVIDUAL), em 2 leituras:
//   👤 PERFIL DA TURMA — quanto as pessoas conhecem a LGPD (calibra o ritmo
//      do curso logo no Momento 3: quantos nunca tinham ouvido falar?)
//   🏛️ PANORAMA DAS INSTITUIÇÕES — em que etapa da jornada os órgãos reais
//      estão (médias início→fim + salto + distribuição por faixa).
// É anônimo de propósito: cada participante avaliou a si e ao próprio órgão;
// o valor pedagógico é o panorama coletivo, nunca o nome de cada um. Usada no
// painel do facilitador (compacta) e no cartaz de projeção (`grande=true`).

import { Thermometer, ArrowRight } from "lucide-react";
import type {
  TurmaTermometro,
  BlocoTurmaTermometro,
  DistribuicaoFaixa,
  FaixaTermometro,
} from "@/lib/termometro-perguntas";
import { FAIXAS_TERMOMETRO, FAIXAS_PESSOAIS, faixaDe } from "@/lib/termometro-perguntas";

function corFaixa(cor: string): { bg: string; border: string; text: string; num: string; bar: string } {
  switch (cor) {
    case "emerald": return { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", num: "text-emerald-800", bar: "bg-emerald-500" };
    case "blue":    return { bg: "bg-blue-50",    border: "border-blue-300",    text: "text-blue-700",    num: "text-blue-800",    bar: "bg-blue-500"    };
    case "amber":   return { bg: "bg-amber-50",   border: "border-amber-300",   text: "text-amber-700",   num: "text-amber-800",   bar: "bg-amber-500"   };
    case "orange":  return { bg: "bg-orange-50",  border: "border-orange-300",  text: "text-orange-700",  num: "text-orange-800",  bar: "bg-orange-500"  };
    default:        return { bg: "bg-gray-50",    border: "border-gray-200",    text: "text-gray-500",    num: "text-gray-700",    bar: "bg-gray-400"    };
  }
}

// Rótulos curtos pras barras do histograma (institucionais + pessoais).
const ROTULO_CURTO: Record<string, string> = {
  avancada: "Avançada",
  estabelecida: "Estabelecida",
  desenvolvimento: "Em desenvolv.",
  inicial: "Inicial",
  partida: "Partida",
  multiplicador: "Multiplicador",
  dominio: "Bom domínio",
  construcao: "Em construção",
  despertar: "Conhec. inicial",
  primeiro_contato: "1º contato",
};

// Um medidor de média (número grande + faixa qualitativa da escala dada).
function Medidor({
  titulo,
  score,
  faixas,
  grande,
}: {
  titulo: string;
  score: number | null;
  faixas: FaixaTermometro[];
  grande: boolean;
}) {
  if (score === null) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-center flex-1">
        <p className={`font-semibold uppercase tracking-wide text-gray-400 ${grande ? "text-sm" : "text-[10px]"} mb-1`}>{titulo}</p>
        <p className={`text-gray-300 font-bold ${grande ? "text-4xl" : "text-2xl"}`}>—</p>
        <p className={`${grande ? "text-sm" : "text-xs"} text-gray-400 mt-1`}>aguardando</p>
      </div>
    );
  }
  const faixa = faixaDe(score, faixas);
  const c = corFaixa(faixa.cor);
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} ${grande ? "p-4" : "p-3"} text-center flex-1`}>
      <p className={`font-semibold uppercase tracking-wide ${c.text} ${grande ? "text-sm" : "text-[10px]"} mb-1`}>{titulo}</p>
      <p className={`font-extrabold ${c.num} leading-none ${grande ? "text-5xl" : "text-3xl"}`}>
        {score}<span className={`font-normal ${grande ? "text-2xl" : "text-base"}`}>/100</span>
      </p>
      <p className={`${c.text} mt-1 ${grande ? "text-base" : "text-xs"}`}>{faixa.label}</p>
    </div>
  );
}

// Histograma da distribuição por faixa (da mais alta pra mais baixa).
function Distribuicao({ titulo, dist, grande }: { titulo: string; dist: DistribuicaoFaixa[]; grande: boolean }) {
  const total = dist.reduce((s, d) => s + d.n, 0);
  const max = Math.max(1, ...dist.map((d) => d.n));
  const linhas = [...dist].reverse(); // melhor faixa no topo
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className={`font-bold text-gray-700 text-center mb-2 ${grande ? "text-lg" : "text-sm"}`}>{titulo}</p>
      {total === 0 ? (
        <p className={`text-center text-gray-400 py-4 ${grande ? "text-base" : "text-xs"}`}>ninguém ainda</p>
      ) : (
        <div className={`space-y-1.5 ${grande ? "space-y-2.5" : ""}`}>
          {linhas.map((d) => {
            const c = corFaixa(d.cor);
            const pct = Math.round((d.n / max) * 100);
            return (
              <div key={d.faixaId} className="flex items-center gap-2">
                <span className={`shrink-0 text-right text-gray-600 ${grande ? "text-sm w-32" : "text-[10px] w-20"}`}>
                  {ROTULO_CURTO[d.faixaId] ?? d.label}
                </span>
                <div className={`flex-1 rounded bg-gray-100 overflow-hidden ${grande ? "h-6" : "h-4"}`}>
                  <div
                    className={`h-full ${c.bar} ${d.n > 0 ? "" : "opacity-0"} transition-all`}
                    style={{ width: `${d.n > 0 ? Math.max(pct, 8) : 0}%` }}
                  />
                </div>
                <span className={`shrink-0 text-right font-bold ${c.num} ${grande ? "text-base w-6" : "text-xs w-4"}`}>
                  {d.n}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Uma das 2 leituras (Perfil da turma OU Panorama das instituições):
// médias início→fim + salto médio + distribuições.
function BlocoView({
  titulo,
  saltoLabel,
  bloco,
  faixas,
  comAmbos,
  temFim,
  grande,
}: {
  titulo: string;
  saltoLabel: string;
  bloco: BlocoTurmaTermometro;
  faixas: FaixaTermometro[];
  comAmbos: number;
  temFim: boolean;
  grande: boolean;
}) {
  return (
    <div className="rounded-xl border-2 border-indigo-100 bg-white p-4">
      <p className={`text-center font-bold text-indigo-900 mb-3 ${grande ? "text-2xl" : "text-base"}`}>
        {titulo}
      </p>
      <div className="flex items-stretch gap-2 sm:gap-3">
        <Medidor titulo="Início do curso" score={bloco.mediaInicio} faixas={faixas} grande={grande} />
        <div className="flex items-center text-indigo-300 shrink-0">
          <ArrowRight className={grande ? "h-8 w-8" : "h-5 w-5"} />
        </div>
        <Medidor titulo="Final do curso" score={bloco.mediaFim} faixas={faixas} grande={grande} />
      </div>

      {temFim && bloco.saltoMedio !== null && (
        <div className="mt-3 rounded-lg border-2 border-amber-400 bg-amber-50 p-3 text-center">
          <p className={`font-bold uppercase tracking-wide text-amber-800 ${grande ? "text-sm" : "text-[10px]"}`}>
            {saltoLabel}
          </p>
          <p className={`font-extrabold text-amber-900 leading-none mt-0.5 ${grande ? "text-4xl" : "text-2xl"}`}>
            {bloco.saltoMedio > 0 ? "+" : ""}{bloco.saltoMedio} pontos
          </p>
          <p className={`text-amber-700 mt-1 ${grande ? "text-base" : "text-xs"}`}>
            entre os {comAmbos} que responderam início e fim
          </p>
        </div>
      )}

      <div className={`mt-3 grid gap-3 ${temFim ? "sm:grid-cols-2" : "grid-cols-1"}`}>
        <Distribuicao titulo="No início" dist={bloco.distInicio} grande={grande} />
        {temFim && <Distribuicao titulo="No final" dist={bloco.distFim} grande={grande} />}
      </div>
    </div>
  );
}

export function TermometroView({ turma, grande = false }: { turma: TurmaTermometro; grande?: boolean }) {
  const nada = turma.preenchidosInicio === 0 && turma.preenchidosFim === 0;
  if (nada) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
        <Thermometer className="mx-auto h-10 w-10 text-gray-300 mb-3" />
        <p className={grande ? "text-xl" : "text-base"}>Nenhum participante preencheu o Termômetro ainda.</p>
        <p className={`mt-1 ${grande ? "text-lg" : "text-sm"} text-gray-400`}>
          Cada um acessa em <strong>Fase Preliminar → Termômetro</strong> e responde sobre si e sobre o próprio órgão.
        </p>
      </div>
    );
  }

  const temFim = turma.preenchidosFim > 0;

  return (
    <div className={grande ? "space-y-6" : "space-y-4"}>
      <BlocoView
        titulo="👤 Perfil da turma — conhecimento sobre a LGPD"
        saltoLabel="Salto médio de conhecimento"
        bloco={turma.pessoal}
        faixas={FAIXAS_PESSOAIS}
        comAmbos={turma.comAmbos}
        temFim={temFim}
        grande={grande}
      />

      <BlocoView
        titulo="🏛️ Panorama das instituições — etapas da jornada"
        saltoLabel="Salto médio das instituições"
        bloco={turma.instituicao}
        faixas={FAIXAS_TERMOMETRO}
        comAmbos={turma.comAmbos}
        temFim={temFim}
        grande={grande}
      />

      <p className={`text-center text-gray-400 ${grande ? "text-base" : "text-xs"}`}>
        Cada participante avaliou a si e ao próprio órgão · {turma.preenchidosInicio} de{" "}
        {turma.totalParticipantes} preencheram o início{temFim ? ` · ${turma.preenchidosFim} com o final` : ""}
      </p>
    </div>
  );
}
