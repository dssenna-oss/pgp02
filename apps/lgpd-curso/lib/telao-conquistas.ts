// Motor de conquistas do Telão — selinhos que os grupos ganham AO VIVO.
// Tudo é DERIVADO dos KPIs/timeline que a API painel-facilitador já devolve:
// sem tabela nova, sem schema novo. Importante porque o curso pode rodar a
// qualquer momento.

export type ConquistaDef = {
  id: string;
  emoji: string;
  nome: string;
  descricao: string;
  // Se true, só o PRIMEIRO grupo a cumprir o critério ganha (ex.: Pioneiros).
  primeiro?: boolean;
};

export const CONQUISTAS: ConquistaDef[] = [
  { id: "pioneiros",   emoji: "🚀", nome: "Pioneiros",                 descricao: "1º grupo a aprovar o Inventário", primeiro: true },
  { id: "inventario",  emoji: "✅", nome: "Inventário fechado",        descricao: "Aprovou os 2 processos" },
  { id: "riscos",      emoji: "🎯", nome: "Riscos no mapa",            descricao: "Mapeou e aprovou os riscos" },
  { id: "olho",        emoji: "🔍", nome: "Olho clínico",              descricao: "Detectou uma pegadinha no Aviso" },
  { id: "olho_total",  emoji: "🏆", nome: "Olho Clínico Total",         descricao: "Detectou as 8 pegadinhas no Caça às Pegadinhas" },
  { id: "aviso",       emoji: "📢", nome: "Aviso no ar",               descricao: "Publicou o Aviso de Privacidade" },
  { id: "incidente",   emoji: "⚡", nome: "Incidente sob controle",    descricao: "Comunicou o incidente à ANPD" },
  { id: "ajuda",       emoji: "🤝", nome: "Pediu ajuda na hora certa", descricao: "Usou o apoio entre setores no GAP" },
  { id: "chegada",     emoji: "🏁", nome: "Linha de chegada",          descricao: "Completou as 5 missões" },
];

// Estado mínimo de um grupo que o motor precisa pra avaliar as conquistas.
export type GrupoEstadoConquista = {
  grupoId: string;
  numero: number;
  rotulo: string; // ex.: "G2 · Câmara"
  timeline: { id: string; status: string }[];
  avisoErrosReportados: unknown[];
  kpis: {
    incidentes: { comunicadosAnpd: number };
    gap: { apoiosPendentes: number };
  };
  // Score do quiz "Caça às Pegadinhas" (Encerramento). Olho Clínico Total
  // requer detectou todas as 8 (score === total).
  olhoClinico?: {
    finalizado: boolean;
    score: number;
    total: number;
  };
};

// Uma conquista já conquistada — registro persistido (localStorage).
export type ConquistaGanha = {
  conquistaId: string;
  grupoId: string;
  numero: number;
  rotulo: string;
  ts: number; // quando foi detectada (Date.now); silenciosa = 1
};

function missaoConcluida(g: GrupoEstadoConquista, missaoId: string): boolean {
  return g.timeline.some((b) => b.id === missaoId && b.status === "DONE");
}

function cumpre(def: ConquistaDef, g: GrupoEstadoConquista): boolean {
  switch (def.id) {
    case "pioneiros":
    case "inventario":
      return missaoConcluida(g, "m1");
    case "riscos":
      return missaoConcluida(g, "m2");
    case "olho":
      return (g.avisoErrosReportados?.length || 0) >= 1;
    case "olho_total":
      return !!g.olhoClinico?.finalizado && g.olhoClinico.score >= (g.olhoClinico.total || 8);
    case "aviso":
      return missaoConcluida(g, "m4b");
    case "incidente":
      return (g.kpis.incidentes.comunicadosAnpd || 0) >= 1;
    case "ajuda":
      return (g.kpis.gap.apoiosPendentes || 0) >= 1;
    case "chegada":
      return missaoConcluida(g, "m6");
    default:
      return false;
  }
}

// Avalia os grupos contra o histórico de conquistas e devolve o histórico
// atualizado + as conquistas novas desta rodada.
// `silencioso` = primeira avaliação após carregar a tela: registra as
// conquistas já cumpridas SEM marcá-las como "AGORA!" (ts antigo), pra não
// estourar o destaque de tudo de uma vez ao abrir o Telão no meio do curso.
export function avaliarConquistas(
  grupos: GrupoEstadoConquista[],
  ganhas: ConquistaGanha[],
  silencioso = false,
): { ganhas: ConquistaGanha[]; novas: ConquistaGanha[] } {
  const jaTem = new Set(ganhas.map((c) => `${c.conquistaId}|${c.grupoId}`));
  const primeiroJaDado = new Set(ganhas.map((c) => c.conquistaId));
  const novas: ConquistaGanha[] = [];

  for (const g of grupos) {
    for (const def of CONQUISTAS) {
      if (jaTem.has(`${def.id}|${g.grupoId}`)) continue;
      if (!cumpre(def, g)) continue;
      if (def.primeiro && primeiroJaDado.has(def.id)) continue;

      novas.push({
        conquistaId: def.id,
        grupoId: g.grupoId,
        numero: g.numero,
        rotulo: g.rotulo,
        ts: silencioso ? 1 : Date.now(),
      });
      jaTem.add(`${def.id}|${g.grupoId}`);
      if (def.primeiro) primeiroJaDado.add(def.id);
    }
  }

  return { ganhas: [...ganhas, ...novas], novas };
}
