import { LayoutGrid } from "lucide-react";

// Banner exibido pros participantes quando a turma está em MODO CARDS
// (Modalidade C). Explica que a tela está em visualização e a produção é
// física, nos cards da mesa. Diferente do Modo Observador (que é por papel),
// este vale pra TODOS — inclusive o DPO.
export function ModoCardsBanner() {
  return (
    <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-200">
      <LayoutGrid className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
      <div className="text-sm text-indigo-900 leading-relaxed">
        <strong>🃏 Modalidade C — atividade nos cards físicos.</strong> Esta tela está em{" "}
        <strong>modo de visualização</strong>: vocês podem ver a estrutura e a jornada da fase,
        mas a produção é feita nos <strong>cards da mesa</strong>, não aqui. O facilitador conduz
        pelo telão. (As atividades de celular — Termômetro, Quiz e Caça às Pegadinhas — seguem ativas.)
      </div>
    </div>
  );
}
