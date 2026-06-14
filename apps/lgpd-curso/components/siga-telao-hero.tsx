// Hero "👀 Siga o telão" (Modalidade C): mesma identidade visual da tela de
// espera do telão (fundo LGPD + selo + frase da jornada).
//
//   • COM `acoes`  → é o HUB da home: mostra os atalhos Quiz/Termômetro
//     (esmaecidos/🔒 enquanto o facilitador não libera). É pra onde o aluno
//     volta pra tocar o que o facilitador anunciar.
//   • SEM `acoes`  → landing LIMPA "acompanhe pelo telão": NENHUM botão. Usada
//     quando o celular espelha um conteúdo SÓ-TELÃO (sem página própria), pra
//     não deixar nenhuma ação clicável competindo com a faixa do telão.

import Link from "next/link";

type Acoes = {
  turmaSlug: string | null;
  quizLiberado: boolean;
  termometroLiberado: boolean;
};

const pillLiberado =
  "inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 shadow-lg hover:bg-indigo-50";
const pillTravado =
  "inline-flex items-center gap-2 rounded-full bg-white/25 px-5 py-2.5 text-sm font-bold text-white/60 ring-1 ring-white/30 cursor-not-allowed";

export function SigaTelaoHero({ acoes }: { acoes?: Acoes }) {
  const algumTravado = acoes ? !acoes.quizLiberado || !acoes.termometroLiberado : false;
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
        {/* Atalhos (Quiz/Termômetro) só no HUB da home. Na landing só-telão
            (acoes ausente) eles NÃO aparecem — tela neutra de espera. */}
        {acoes && (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {acoes.turmaSlug &&
                (acoes.quizLiberado ? (
                  <Link href={`/quiz/${acoes.turmaSlug}`} className={pillLiberado}>
                    📱 Quiz Diagnóstico
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    title="O facilitador ainda não liberou o Quiz"
                    className={pillTravado}
                  >
                    🔒 Quiz Diagnóstico
                  </span>
                ))}
              {acoes.termometroLiberado ? (
                <Link href="/dashboard/fase-preliminar/termometro" className={pillLiberado}>
                  🌡️ Termômetro
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  title="O facilitador ainda não liberou o Termômetro"
                  className={pillTravado}
                >
                  🔒 Termômetro
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-white/60">
              {algumTravado
                ? "🔒 abre quando o facilitador liberar"
                : "(toque só quando o facilitador pedir)"}
            </p>
          </>
        )}
        <p className="mt-3.5 text-[13px] italic text-white/75">
          Adequação à LGPD é uma <span className="text-[#F0997B]">jornada</span>, não um destino.
        </p>
      </div>
    </div>
  );
}
