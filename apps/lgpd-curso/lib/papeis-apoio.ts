// Setores de apoio que o DPO pode acionar na tramitação multi-setor.
// Mesma lista usada em Riscos (PAPEIS_DE_APOIO_VALIDOS) — os valores batem
// com o campo `papel` dos participantes.

export type PapelApoio = { id: string; label: string; emoji: string };

export const PAPEIS_APOIO: PapelApoio[] = [
  { id: "TI", label: "TI / Tecnologia", emoji: "💻" },
  { id: "PROCURADORIA", label: "Jurídico / Procuradoria", emoji: "⚖️" },
  { id: "ADMINISTRATIVO", label: "Administrativo / Contratos", emoji: "📋" },
  { id: "COMUNICACAO", label: "Comunicação", emoji: "📢" },
];

export const PAPEIS_APOIO_IDS = PAPEIS_APOIO.map((p) => p.id);

export function labelPapelApoio(id: string | null | undefined): string {
  if (!id) return "—";
  return PAPEIS_APOIO.find((p) => p.id === id)?.label ?? id;
}
