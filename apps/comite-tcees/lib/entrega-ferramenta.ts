/**
 * Etapa 3 — Costura entregas ↔ ferramentas.
 *
 * Dada uma entrega do Plano de Trabalho, devolve a ferramenta do app que a
 * executa (href + rótulo). É o fio condutor da proposta: cada entrega aponta
 * para onde, dentro do próprio painel, ela é realizada.
 *
 * Heurística por palavra-chave no título (ordem importa: regras mais
 * específicas primeiro). Sem schema novo — `Entrega.ferramentaHref` existe,
 * mas calculamos ao vivo para refletir entregas criadas depois pelo usuário.
 * Retorna null quando a entrega é institucional/manual (ex.: protocolo na
 * SEGOV, edição de ato normativo) e não tem ferramenta correspondente.
 */

export type FerramentaEntrega = { href: string; label: string };

type Regra = { termos: string[]; href: string; label: string };

// Avaliadas em ordem; a primeira que casar vence.
const REGRAS: Regra[] = [
  { termos: ["ripd"], href: "/dashboard/execucao", label: "RIPD na Central de Instrumentos" },
  { termos: ["gap analysis", "gap"], href: "/dashboard/gap", label: "GAP Analysis" },
  { termos: ["análise de risco", "analise de risco", "matriz", "risco"], href: "/dashboard/riscos", label: "Análise de Riscos" },
  { termos: ["inventário", "inventario", "idp"], href: "/dashboard/inventario", label: "Inventário de Dados" },
  { termos: ["aviso de privacidade", "cookies", "cláusula", "clausula", "termo de confidencialidade", "política de privacidade", "politica de privacidade", "termo de uso"], href: "/dashboard/execucao", label: "Central de Instrumentos" },
  { termos: ["plano de ação", "plano de acao", "adequação contratual", "adequacao contratual", "adequação", "adequacao"], href: "/dashboard/plano-acao", label: "Plano de Ação" },
  { termos: ["auditoria", "incidente"], href: "/dashboard/incidentes", label: "Monitoramento" },
  { termos: ["indicador", "indicadores", "painel de indicadores", "relatório", "relatorio", "métric", "metric"], href: "/dashboard/indicadores", label: "Indicadores & Relatório" },
  { termos: ["consulta prévia", "consulta previa"], href: "/dashboard/consultas", label: "Consulta prévia" },
  { termos: ["reunião", "reuniao"], href: "/dashboard/reunioes", label: "Reuniões & Atas" },
  { termos: ["capacitaç", "capacitac", "trilha", "treinamento", "enfoc", "curso", "workshop", "campanha", "sensibiliz", "engajamento"], href: "/dashboard/plano", label: "Cultura & Capacitação (Eixo D)" },
  { termos: ["pgp", "política interna", "politica interna", "ato normativo", "resolução", "resolucao", "portaria", "homologação", "homologac", "submissão", "submissao", "aprovação", "aprovacao", "equipe de proteção", "equipe de protecao"], href: "/dashboard/documentos", label: "Documentos do Comitê" },
];

export function ferramentaDaEntrega(titulo: string): FerramentaEntrega | null {
  const t = titulo.toLowerCase();
  for (const r of REGRAS) {
    if (r.termos.some((termo) => t.includes(termo))) {
      return { href: r.href, label: r.label };
    }
  }
  return null;
}
