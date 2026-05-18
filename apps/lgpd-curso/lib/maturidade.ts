// Cálculo do score de Maturidade do PGP do grupo (0-100).
// Ponderação pedagógica — dá mais peso ao que é central da jornada.

export type KpisGrupo = {
  inventario: { total: number; aprovados: number; submetidos: number; devolvidos: number };
  riscos: { total: number; aprovados: number; submetidos: number };
  gap: {
    respondidos: number;
    aderentes: number;
    parciais: number;
    apoiosPendentes?: number;
    score: number;
    setoresApoio?: Record<string, number>;
  };
  ripds: { total: number; aprovados: number };
  terceiros: { total: number; comClausula: number };
  dsr: { total: number };
  aviso: { status: "PUBLICADO" | "RASCUNHO" | null; publicSlug: string | null };
  incidentes: { total: number; comunicadosAnpd: number; comunicadosTitular: number };
};

export function calcularMaturidade(k: KpisGrupo): number {
  // Pilares ponderados (somam 100):
  //   Governança institucional (Política do PGP) — implícita, 0 aqui · 10
  //   Inventário (precisa estar APROVADO pelos 2 processos) · 25
  //   GAP — score direto · 20
  //   Aviso publicado · 15
  //   RIPDs aprovados · 10
  //   Riscos identificados · 10
  //   Gestão Terceiros · 5
  //   Canal DSR · 5
  //   = 100

  let score = 10; // governança institucional baseline

  // Inventário (25): 100% se 2 aprovados, 50% se 1 aprovado, 25% se algum submetido
  const invAprovadosFator =
    k.inventario.aprovados >= 2 ? 1 :
    k.inventario.aprovados === 1 ? 0.5 :
    k.inventario.submetidos > 0 ? 0.25 : 0;
  score += 25 * invAprovadosFator;

  // GAP (20): score direto
  score += 20 * (k.gap.score / 100);

  // Aviso (15): publicado=1, rascunho=0.3
  score += 15 * (k.aviso.status === "PUBLICADO" ? 1 : k.aviso.status === "RASCUNHO" ? 0.3 : 0);

  // RIPDs (10): cada aprovado vale 5pts até 2
  score += Math.min(10, k.ripds.aprovados * 5);

  // Riscos (10): cada um vale 3pts até 4 riscos
  score += Math.min(10, k.riscos.total * 3);

  // Terceiros (5): cada um com cláusula vale 2.5pts até 2
  score += Math.min(5, k.terceiros.comClausula * 2.5);

  // DSR (5): basta ter 1 cadastrado pra ganhar 3, 2+ ganha 5
  score += k.dsr.total >= 2 ? 5 : k.dsr.total === 1 ? 3 : 0;

  return Math.round(Math.min(100, score));
}

export function nivelMaturidade(score: number): {
  label: string;
  cor: string;
  emoji: string;
} {
  if (score >= 80) return { label: "Excelência", cor: "emerald", emoji: "🥇" };
  if (score >= 60) return { label: "Consolidado", cor: "blue", emoji: "🥈" };
  if (score >= 40) return { label: "Em construção", cor: "amber", emoji: "🥉" };
  if (score >= 20) return { label: "Inicial", cor: "orange", emoji: "🟧" };
  return { label: "Não iniciado", cor: "gray", emoji: "⬜" };
}
