// Helpers de apresentação das Tarefas.
// Os rótulos de status/prioridade reaproveitam STATUS_ACAO / PRIORIDADE_ACAO
// (lib/comite-ui) — aqui mora só o cálculo de urgência do prazo.

export type PrazoInfo = { texto: string; cls: string; atrasada: boolean };

/** Texto + cor da situação do prazo de uma tarefa (compara só a data, ignora hora). */
export function prazoInfo(prazoISO: string | null, status: string): PrazoInfo {
  if (status === "CONCLUIDA") return { texto: "concluída", cls: "text-emerald-600", atrasada: false };
  if (!prazoISO) return { texto: "sem prazo", cls: "text-gray-400", atrasada: false };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(`${prazoISO}T00:00:00`);
  const dias = Math.round((prazo.getTime() - hoje.getTime()) / 86400000);

  if (dias < 0) return { texto: `atrasada há ${Math.abs(dias)} dia${Math.abs(dias) > 1 ? "s" : ""}`, cls: "text-red-600 font-semibold", atrasada: true };
  if (dias === 0) return { texto: "vence hoje", cls: "text-amber-600 font-semibold", atrasada: false };
  if (dias === 1) return { texto: "vence amanhã", cls: "text-amber-600", atrasada: false };
  if (dias <= 3) return { texto: `vence em ${dias} dias`, cls: "text-amber-600", atrasada: false };
  return { texto: `vence em ${dias} dias`, cls: "text-gray-500", atrasada: false };
}

/** "YYYY-MM-DD" → "DD/MM/AAAA" (vazio = "—"). */
export function prazoBR(prazoISO: string | null): string {
  if (!prazoISO) return "—";
  const [a, m, d] = prazoISO.split("-");
  return `${d}/${m}/${a}`;
}
