// =============================================================================
// Pacote de Modelos — CURADORIA do mini app público /modelos
// =============================================================================
// Junta o conteúdo gerado do Pacote oficial (modelos-pacote-dados.ts) com a
// camada editorial: slug de rota, chip de fase da jornada, par no Montador
// (pratique/Saiba mais) e a "Versão comentada" do Kit de Minutas do
// facilitador (minutas-kit.ts), quando houver.

import { MODELOS_PACOTE_DADOS, type ModeloPacoteDados } from "./modelos-pacote-dados";
import { MINUTAS_KIT, type MinutaKit } from "./minutas-kit";

export type ModeloPacote = ModeloPacoteDados & {
  slug: string;
  fase: string; // chip: em que momento da jornada o modelo entra
  montadorDocId?: string; // par no Montador Guiado (pratique + Saiba mais)
  minuta?: MinutaKit; // 📝 versão comentada (Kit de Minutas Vol. 1/2)
};

const CURADORIA: Record<number, { slug: string; fase: string; montadorDocId?: string }> = {
  1: { slug: "ato-designacao", fase: "Fase 1" },
  2: { slug: "portaria-comite", fase: "Fase 1" },
  3: { slug: "carta-alta-gestao", fase: "Preliminar" },
  4: { slug: "roadmap-90-dias", fase: "Preliminar" },
  5: { slug: "aviso-privacidade", fase: "Fase 6", montadorDocId: "aviso-privacidade" },
  6: { slug: "pri", fase: "Fase 7", montadorDocId: "pri" },
  7: { slug: "politica-pgp", fase: "Fase 6", montadorDocId: "politica-protecao-dados" },
  8: { slug: "clausulas-contratos", fase: "Fase 6", montadorDocId: "clausulas-operadores" },
  9: { slug: "retencao-descarte", fase: "Fase 6" },
  10: { slug: "consentimento", fase: "Fase 6", montadorDocId: "termo-consentimento" },
  11: { slug: "comunicacao-anpd", fase: "Fase 7" },
  12: { slug: "comunicacao-titulares", fase: "Fase 7" },
  13: { slug: "termometro", fase: "Preliminar" },
  14: { slug: "matriz-priorizacao", fase: "Fase 2" },
  15: { slug: "ficha-processo", fase: "Fase 3", montadorDocId: "inventario-ropa" },
  16: { slug: "ficha-risco", fase: "Fase 3", montadorDocId: "analise-risco" },
  17: { slug: "gap-controles", fase: "Fase 4", montadorDocId: "checklist-gap" },
  18: { slug: "plano-acao", fase: "Fase 5", montadorDocId: "plano-acao" },
  19: { slug: "ripd", fase: "Fase 6", montadorDocId: "ripd" },
  20: { slug: "ficha-operador", fase: "Fase 6" },
  21: { slug: "registro-dsr", fase: "Fase 6", montadorDocId: "resposta-titular" },
};

export const MODELOS_PACOTE: ModeloPacote[] = MODELOS_PACOTE_DADOS.map((d) => ({
  ...d,
  ...CURADORIA[d.numero],
  minuta: MINUTAS_KIT[d.numero],
}));

export function getModeloPacote(slug: string): ModeloPacote | null {
  return MODELOS_PACOTE.find((m) => m.slug === slug) ?? null;
}

export const GRUPOS_PACOTE: { numero: 1 | 2 | 3; emoji: string; nome: string; resumo: string }[] = [
  { numero: 1, emoji: "📜", nome: "Documentos Formais", resumo: "Os atos que dão o pontapé: designação, comitê, carta e os documentos públicos essenciais." },
  { numero: 2, emoji: "🏛️", nome: "Documentos Institucionais", resumo: "As políticas e comunicações que sustentam o programa no dia a dia." },
  { numero: 3, emoji: "📋", nome: "Fichas Operacionais", resumo: "As fichas de trabalho das Fases: termômetro, priorização, inventário, riscos, GAP, plano e registros." },
];
