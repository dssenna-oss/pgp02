// ⚖️ Tribunal da ANPD — página PÚBLICA de preparação (antes do julgamento).
// Conteúdo resumido: art. 52 (caput + dosimetria do §1º) e as Resoluções
// CD/ANPD nº 1/2021, 4/2023 e 15/2024. DELIBERADAMENTE sem o §3º — a
// revelação (multa não se aplica a órgão público) é o clímax do debrief.

import { VoltarAhaSlides } from "@/components/voltar-ahaslides";

const SANCOES: { nome: string; oque: string }[] = [
  { nome: "I · Advertência", oque: "com indicação de prazo pra adotar medidas corretivas" },
  { nome: "II · Multa simples", oque: "de até 2% do faturamento, limitada a R$ 50 milhões por infração" },
  { nome: "III · Multa diária", oque: "observado o limite total da multa simples" },
  { nome: "IV · Publicização da infração", oque: "a infração vira pública, após apurada e confirmada" },
  { nome: "V · Bloqueio dos dados", oque: "os dados da infração ficam bloqueados até a regularização" },
  { nome: "VI · Eliminação dos dados", oque: "os dados da infração são eliminados" },
  { nome: "X · Suspensão do banco de dados", oque: "parcial, por até 6 meses (prorrogável)" },
  { nome: "XI · Suspensão do tratamento", oque: "da atividade relacionada à infração, por até 6 meses (prorrogável)" },
  { nome: "XII · Proibição", oque: "parcial ou total do exercício de atividades de tratamento" },
];

const DOSIMETRIA: string[] = [
  "A gravidade e a natureza da infração e dos dados afetados",
  "A boa-fé do infrator",
  "A vantagem que ele obteve (ou tentou obter)",
  "A condição econômica do infrator e a reincidência",
  "A cooperação com a autoridade",
  "A adoção reiterada de políticas de boas práticas e governança",
  "A adoção de MEDIDAS CORRETIVAS após o incidente",
  "A proporcionalidade entre a falta e a sanção",
];

const RESOLUCOES = [
  {
    ref: "Resolução CD/ANPD nº 1/2021",
    titulo: "Como a ANPD fiscaliza",
    texto:
      "Regulamenta o processo de fiscalização e o processo administrativo " +
      "sancionador: a ANPD monitora, orienta e atua preventivamente ANTES de " +
      "punir — mas, aberto o processo, o investigado é notificado, apresenta " +
      "defesa e pode recorrer. É o rito que o nosso julgamento simula.",
  },
  {
    ref: "Resolução CD/ANPD nº 4/2023",
    titulo: "Como a sanção é calculada (dosimetria)",
    texto:
      "Define a metodologia: a infração é classificada (leve, média ou grave), " +
      "e a pena parte de um valor-base ajustado pelos atenuantes e agravantes " +
      "do art. 52, §1º. Traduzindo: quem coopera, tem boas práticas e corrige " +
      "a causa responde MUITO mais leve do que quem esconde.",
  },
  {
    ref: "Resolução CD/ANPD nº 15/2024",
    titulo: "Comunicação de incidentes",
    texto:
      "Incidente com risco ou dano relevante aos titulares deve ser comunicado " +
      "à ANPD em até 3 DIAS ÚTEIS da ciência — e aos titulares afetados. " +
      "Comunicar no prazo, com transparência, pesa a favor na dosimetria. " +
      "Guarde isso: vai aparecer no julgamento.",
  },
];

export default function TribunalPreparacaoPage() {
  return (
    <div className="pagina-embed min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Encerramento do curso
          </p>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold text-gray-900">
            ⚖️ Tribunal da ANPD
            <span className="inline-flex shrink-0 items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              Prepare-se
            </span>
          </h1>
          <p className="mt-2 leading-relaxed text-gray-600">
            Daqui a pouco, <strong>você julga</strong>: a Prefeitura de Vegas
            responde pelo vazamento do pendrive com 2.312 prontuários (o caso do
            jogo Dia D). Duas bancas sustentam — acusação e defesa — e o
            plenário inteiro vota a sanção. Esta página é a sua preparação de 5
            minutos: leia e chegue afiado(a).
          </p>
        </header>

        {/* Art. 52 — sanções */}
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-indigo-700">
            ⚖️ Art. 52 — as sanções que a ANPD pode aplicar
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Da mais leve à mais dura (resumo do caput):
          </p>
          <ul className="mt-3 space-y-2">
            {SANCOES.map((s) => (
              <li key={s.nome} className="rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm">
                <strong className="text-indigo-800">{s.nome}</strong>{" "}
                <span className="text-gray-700">— {s.oque}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Dosimetria */}
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">
            🧮 Art. 52, §1º — o que pesa na dose da pena
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            A sanção não é sorteio: o conselho pondera, entre outros,
          </p>
          <ul className="mt-3 space-y-1.5">
            {DOSIMETRIA.map((d) => (
              <li key={d} className="flex gap-2 text-sm leading-relaxed text-gray-800">
                <span className="shrink-0 text-indigo-500">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Resoluções */}
        <section className="mt-5 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">
            📜 As três Resoluções que regem o jogo (de verdade)
          </h2>
          {RESOLUCOES.map((r) => (
            <div key={r.ref} className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-bold text-indigo-700">{r.ref}</p>
              <h3 className="mt-0.5 font-semibold text-gray-900">{r.titulo}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{r.texto}</p>
            </div>
          ))}
        </section>

        <p className="mt-5 rounded-xl border-l-4 border-l-amber-400 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          💡 Dica de conselheiro(a): antes de votar, pergunte-se — <em>o que a
          Prefeitura fez ANTES do incidente? E DEPOIS?</em> A resposta às duas
          perguntas costuma decidir o julgamento.
        </p>

        <footer className="mt-8 text-center text-[11px] text-gray-400">
          Material didático resumido — o texto integral está na Lei nº
          13.709/2018 e nas Resoluções CD/ANPD.
        </footer>
      </div>
      <VoltarAhaSlides />
    </div>
  );
}
