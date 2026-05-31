/**
 * Checklist operacional de monitoramento contínuo da Fase 7.
 * Trazido do app principal (lgpd-pgp, components/fases/fase-7-content.tsx):
 * 9 seções, 47 itens. É o "o que fazer continuamente" depois de adequado.
 */

export type ChecklistItem = { id: string; label: string };
export type ChecklistSecao = { id: string; titulo: string; itens: ChecklistItem[] };

export const MONITORAMENTO_CHECKLIST: ReadonlyArray<ChecklistSecao> = [
  {
    id: "estrutura-monitoramento", titulo: "1. Estruturação do Monitoramento",
    itens: [
      { id: "definir-indicadores-chave", label: "Defina indicadores-chave de performance (KPIs) de privacidade" },
      { id: "estabelecer-metas", label: "Estabeleça metas para cada indicador" },
      { id: "criar-dashboard", label: "Crie dashboard de monitoramento de conformidade" },
      { id: "definir-periodicidade-medicao", label: "Defina periodicidade de medição (mensal, trimestral)" },
      { id: "designar-responsaveis-kpis", label: "Designe responsáveis por cada KPI" },
    ],
  },
  {
    id: "implementacao-kpis", titulo: "2. Implementação de KPIs",
    itens: [
      { id: "monitorar-tempo-resposta", label: "Monitore tempo médio de resposta a solicitações de titulares" },
      { id: "monitorar-incidentes", label: "Monitore número e severidade de incidentes de segurança" },
      { id: "acompanhar-treinamentos", label: "Acompanhe percentual de colaboradores treinados" },
      { id: "medir-conformidade-processos", label: "Meça índice de conformidade dos processos" },
      { id: "controlar-solicitacoes-titulares", label: "Controle volume de solicitações de titulares por tipo" },
      { id: "avaliar-fornecedores", label: "Avalie conformidade de fornecedores/operadores" },
    ],
  },
  {
    id: "auditorias-periodicas", titulo: "3. Auditorias Periódicas",
    itens: [
      { id: "agendar-auditorias-internas", label: "Agende auditorias internas (no mínimo anuais)" },
      { id: "definir-escopo-auditoria", label: "Defina escopo de cada auditoria" },
      { id: "preparar-checklist-auditoria", label: "Prepare checklist de auditoria baseado na LGPD" },
      { id: "realizar-auditoria", label: "Realize auditorias conforme cronograma" },
      { id: "documentar-achados", label: "Documente todos os achados e não conformidades" },
      { id: "plano-acao-auditoria", label: "Crie plano de ação para correção de não conformidades" },
      { id: "considerar-auditoria-externa", label: "Considere auditorias externas/certificações (ISO 27001, etc.)" },
    ],
  },
  {
    id: "gestao-incidentes-continua", titulo: "4. Gestão Contínua de Incidentes",
    itens: [
      { id: "manter-registro-incidentes", label: "Mantenha registro atualizado de todos os incidentes" },
      { id: "analisar-causas-raiz", label: "Analise causas raiz dos incidentes" },
      { id: "implementar-acoes-preventivas", label: "Implemente ações preventivas para evitar recorrência" },
      { id: "testar-plano-resposta", label: "Teste periodicamente o plano de resposta a incidentes" },
      { id: "atualizar-procedimentos", label: "Atualize procedimentos com base em lições aprendidas" },
    ],
  },
  {
    id: "revisao-documentacao", titulo: "5. Revisão e Atualização de Documentação",
    itens: [
      { id: "revisar-politicas-anualmente", label: "Revise todas as políticas pelo menos anualmente" },
      { id: "atualizar-inventario-dados", label: "Atualize o inventário de dados regularmente" },
      { id: "revisar-contratos-fornecedores", label: "Revise contratos com fornecedores periodicamente" },
      { id: "atualizar-avisos-privacidade", label: "Atualize avisos de privacidade quando houver mudanças" },
      { id: "versionar-mudancas", label: "Versione e documente todas as mudanças" },
    ],
  },
  {
    id: "atualizacao-legislativa", titulo: "6. Acompanhamento Legislativo e Regulatório",
    itens: [
      { id: "acompanhar-anpd", label: "Acompanhe publicações da ANPD (guias, resoluções)" },
      { id: "monitorar-jurisprudencia", label: "Monitore jurisprudência e decisões judiciais" },
      { id: "participar-eventos", label: "Participe de eventos e fóruns sobre privacidade" },
      { id: "atualizar-praticas", label: "Atualize práticas conforme novas orientações" },
      { id: "comunicar-mudancas", label: "Comunique mudanças relevantes para a organização" },
    ],
  },
  {
    id: "avaliacao-fornecedores-continua", titulo: "7. Avaliação Contínua de Fornecedores",
    itens: [
      { id: "reavaliar-fornecedores", label: "Reavalie fornecedores/operadores periodicamente" },
      { id: "auditar-operadores-criticos", label: "Audite operadores críticos" },
      { id: "verificar-incidentes-fornecedores", label: "Verifique se fornecedores tiveram incidentes de segurança" },
      { id: "atualizar-contratos-fornecedores", label: "Atualize contratos quando necessário" },
    ],
  },
  {
    id: "melhoria-continua", titulo: "8. Ciclo de Melhoria Contínua",
    itens: [
      { id: "reunioes-periodicas-governanca", label: "Realize reuniões periódicas do comitê de governança" },
      { id: "analisar-indicadores", label: "Analise indicadores e identifique oportunidades de melhoria" },
      { id: "priorizar-melhorias", label: "Priorize e implemente melhorias identificadas" },
      { id: "incorporar-melhores-praticas", label: "Incorpore melhores práticas do mercado" },
      { id: "avaliar-novas-tecnologias", label: "Avalie e implemente novas tecnologias de proteção" },
      { id: "documentar-evolucao", label: "Documente a evolução do programa de governança" },
    ],
  },
  {
    id: "relatorios-prestacao-contas", titulo: "9. Relatórios e Prestação de Contas",
    itens: [
      { id: "preparar-relatorios-periodicos", label: "Prepare relatórios periódicos para a diretoria" },
      { id: "documentar-accountability", label: "Documente evidências de accountability (prestação de contas)" },
      { id: "reportar-metricas", label: "Reporte métricas e evolução do programa" },
      { id: "apresentar-resultados-anuais", label: "Apresente resultados anuais para stakeholders" },
    ],
  },
];

export const CHECKLIST_TOTAL = MONITORAMENTO_CHECKLIST.reduce((acc, s) => acc + s.itens.length, 0); // 47
