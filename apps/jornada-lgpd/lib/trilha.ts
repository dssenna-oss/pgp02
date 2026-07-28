// A trilha da Jornada — as etapas do PGP como "prateleiras" de documentos.
// Ordem oficial: Preliminar → Fases 1 a 7. Os modelos vêm da curadoria do
// Pacote (lib/modelos-pacote.ts, campo `fase`).

import { MODELOS_PACOTE, type ModeloPacote } from "@/lib/modelos-pacote";

export type EtapaTrilha = {
  id: string;
  rotulo: string;
  resumo: string;
  modelos: ModeloPacote[];
};

const ORDEM: { id: string; fase: string; rotulo: string; resumo: string }[] = [
  { id: "preliminar", fase: "Preliminar", rotulo: "Preliminar — Engajar", resumo: "Medir o ponto de partida e trazer a alta gestão pra jornada." },
  { id: "fase-1", fase: "Fase 1", rotulo: "Fase 1 — Formalizar", resumo: "Designar o Encarregado e instituir o Comitê." },
  { id: "fase-2", fase: "Fase 2", rotulo: "Fase 2 — Priorizar", resumo: "Escolher por onde começar, com os critérios da ANPD." },
  { id: "fase-3", fase: "Fase 3", rotulo: "Fase 3 — Mapear", resumo: "Inventariar processos e analisar riscos." },
  { id: "fase-4", fase: "Fase 4", rotulo: "Fase 4 — Diagnosticar", resumo: "Avaliar os controles existentes (GAP)." },
  { id: "fase-5", fase: "Fase 5", rotulo: "Fase 5 — Planejar", resumo: "Transformar lacunas em plano de ação." },
  { id: "fase-6", fase: "Fase 6", rotulo: "Fase 6 — Executar", resumo: "Os documentos que a instituição publica e usa no dia a dia." },
  { id: "fase-7", fase: "Fase 7", rotulo: "Fase 7 — Monitorar", resumo: "Estar pronto pro incidente antes de ele acontecer." },
];

export const TRILHA: EtapaTrilha[] = ORDEM.map((e) => ({
  id: e.id,
  rotulo: e.rotulo,
  resumo: e.resumo,
  modelos: MODELOS_PACOTE.filter((m) => m.fase === e.fase),
}));
