import Link from "next/link";
import { Mic2, ArrowLeft } from "lucide-react";
import { BaseLegalCard } from "@/components/base-legal-card";

// Componente reutilizável pras páginas de leitura — conteúdo apresentado
// pelo facilitador no início da aula. Não é mini-app interativo: é só uma
// "âncora visível" na sidebar pra refletir a estrutura do app principal
// (Conteúdos Didáticos, Entendendo o PGP, Fase Preliminar, Fase 2).

export function ApresentacaoFacilitadorPage({
  titulo,
  subtitulo,
  topicos,
  duracaoMin,
  faseKey,
}: {
  titulo: string;
  subtitulo: string;
  topicos: { titulo: string; descricao: string }[];
  duracaoMin: number;
  faseKey?: string;
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar pra Início
      </Link>

      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider mb-3">
          <Mic2 className="h-3.5 w-3.5" />
          Apresentado pelo facilitador
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        <p className="text-sm text-gray-500 mt-1">{subtitulo}</p>
      </header>

      <section className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-amber-900 mb-1">
          Este conteúdo é apresentado em sala pelo facilitador
        </h2>
        <p className="text-sm text-amber-900 leading-relaxed">
          Você não precisa fazer nada aqui agora — o facilitador vai conduzir essa parte com a turma inteira nos primeiros <strong>~{duracaoMin} minutos</strong> antes de os jogos começarem. Use esta página depois pra revisar.
        </p>
      </section>

      {faseKey && <BaseLegalCard faseKey={faseKey} />}

      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          O que será visto
        </h3>
        <div className="space-y-3">
          {topicos.map((t, i) => (
            <div key={i} className="border rounded-lg p-4 bg-white">
              <div className="text-[11px] font-bold text-gray-400 mb-1">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h4 className="font-medium text-sm text-gray-900">{t.titulo}</h4>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{t.descricao}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-xs text-slate-600 leading-relaxed">
          💡 No app principal <strong>LGPD - PGP</strong> (usado pelo DPO da sua instituição no dia-a-dia), esta mesma seção existe com conteúdo completo, vídeos e referências legais. Aqui no curso prático mantemos só a estrutura pra você entender onde se encaixa.
        </p>
      </section>
    </div>
  );
}
