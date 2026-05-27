// Roadmap de 90 dias — gerado AUTOMATICAMENTE a partir das fases do PGP e
// dos processos pré-cadastrados do órgão. Sem input manual do grupo —
// apenas exibe + permite baixar DOCX.
//
// Lógica: 13 semanas (~90 dias), distribuindo as 7 fases do PGP de forma
// proporcional à complexidade. Marcos referenciam os 2 processos prioritários
// do órgão (puxados de processos-vegas.ts via Inventário).

import { processosPorOrgao } from "./seeds/processos-vegas";

export type MarcoRoadmap = {
  semana: number;          // 1 a 13
  fase: string;            // "Fase 3", "Fase 4", etc.
  titulo: string;
  detalhes: string[];      // 1-3 ações específicas
  entrega: string;         // o que se espera concluir
};

// Templates do roadmap por órgão. PM e CM têm processos diferentes,
// então as ações referenciam nomes específicos.
export function gerarRoadmap90Dias(orgao: "PM" | "CM"): MarcoRoadmap[] {
  const processos = processosPorOrgao(orgao);
  const proc1 = processos[0]?.nome || "Processo 1";
  const proc2 = processos[1]?.nome || "Processo 2";

  return [
    {
      semana: 1,
      fase: "Fase 1",
      titulo: "Designação formal do Encarregado",
      detalhes: [
        "Publicar o Ato de Designação do(a) Encarregado(a) no Diário Oficial",
        "Comunicar à Alta Administração e às chefias de setores envolvidos",
        "Divulgar o canal de contato do(a) Encarregado(a) no portal da Instituição",
      ],
      entrega: "Encarregado(a) formalmente designado(a) e divulgado(a)",
    },
    {
      semana: 2,
      fase: "Fase 1",
      titulo: "Constituição do Comitê de Governança de Dados Pessoais",
      detalhes: [
        "Identificar representantes-chave (TI, Jurídico, Comunicação, áreas críticas)",
        "Publicar ato de criação do Comitê com periodicidade de reuniões",
        "Realizar a 1ª reunião — alinhamento de papéis e cronograma",
      ],
      entrega: "Comitê constituído e em operação",
    },
    {
      semana: 3,
      fase: "Fase 2",
      titulo: "Levantamento preliminar de setores e processos",
      detalhes: [
        "Mapear todos os setores que tratam dados pessoais",
        "Priorizar os processos críticos usando critérios da Res. CD/ANPD nº 2/2022",
        `Confirmar foco inicial: ${proc1} e ${proc2}`,
      ],
      entrega: "Lista priorizada de processos a serem mapeados",
    },
    {
      semana: 4,
      fase: "Fase 3",
      titulo: `Inventário do Processo 1: ${proc1}`,
      detalhes: [
        "Entrevistar dono(a) do processo e equipe operacional",
        "Mapear: titulares, dados coletados, finalidade, base legal, retenção, compartilhamentos",
        "Documentar medidas de segurança existentes",
      ],
      entrega: `Inventário do ${proc1} aprovado pelo(a) Encarregado(a)`,
    },
    {
      semana: 5,
      fase: "Fase 3",
      titulo: `Inventário do Processo 2: ${proc2}`,
      detalhes: [
        "Repetir a metodologia da semana anterior pro 2º processo prioritário",
        "Identificar lacunas de informação e atualizar com responsável do setor",
        "Consolidar Inventário no app/planilha institucional",
      ],
      entrega: `Inventário do ${proc2} aprovado pelo(a) Encarregado(a)`,
    },
    {
      semana: 6,
      fase: "Fase 3",
      titulo: "Análise de Riscos dos 2 processos prioritários",
      detalhes: [
        "Identificar riscos concretos (vazamento, uso indevido, acesso indevido)",
        "Classificar cada risco na matriz 3×3 (Probabilidade × Impacto)",
        "Definir plano de mitigação por risco com responsável",
      ],
      entrega: "Matriz de riscos aprovada + plano de mitigação inicial",
    },
    {
      semana: 7,
      fase: "Fase 4",
      titulo: "GAP Analysis — diagnóstico de conformidade",
      detalhes: [
        "Avaliar controles existentes contra requisitos da LGPD (mín. 10 controles)",
        "Classificar cada controle: ADERENTE / PARCIAL / NÃO ADERENTE",
        "Documentar justificativa por controle (transparência institucional)",
      ],
      entrega: "GAP Analysis consolidado com score de conformidade",
    },
    {
      semana: 8,
      fase: "Fase 5",
      titulo: "Plano de Ação consolidado",
      detalhes: [
        "Importar lacunas do GAP e riscos não mitigados como ações do Plano",
        "Atribuir responsável, prazo e recursos pra cada ação",
        "Priorizar por urgência × impacto",
      ],
      entrega: "Plano de Ação institucional com cronograma e responsáveis",
    },
    {
      semana: 9,
      fase: "Fase 6",
      titulo: "RIPD do processo mais crítico",
      detalhes: [
        "Elaborar Relatório de Impacto à Proteção de Dados (Art. 38 LGPD)",
        "Validar com equipe técnica e jurídica",
        "Definir medidas adicionais de mitigação se necessário",
      ],
      entrega: "RIPD aprovado e arquivado",
    },
    {
      semana: 10,
      fase: "Fase 6",
      titulo: "Gestão de Terceiros + Canal de Direitos do Titular",
      detalhes: [
        "Identificar operadores que tratam dados em nome do órgão",
        "Atualizar contratos com cláusulas LGPD ou redigir Termo Aditivo",
        "Estabelecer canal de exercício de direitos (e-mail, formulário, telefone)",
      ],
      entrega: "Contratos com operadores em conformidade + canal DSR funcionando",
    },
    {
      semana: 11,
      fase: "Fase 6",
      titulo: "Aviso de Privacidade institucional publicado",
      detalhes: [
        "Redigir Aviso com as 12 seções recomendadas pela ANPD",
        "Validar linguagem clara e acessível pro cidadão (Art. 9º LGPD)",
        "Publicar no portal e divulgar nos canais oficiais",
      ],
      entrega: "Aviso de Privacidade publicado e divulgado",
    },
    {
      semana: 12,
      fase: "Fase 7",
      titulo: "Plano de Resposta a Incidentes (PRI)",
      detalhes: [
        "Elaborar documento institucional do PRI (8 seções, ciclo NIST + LGPD)",
        "Treinar Equipe ETIR e validar fluxo de comunicação 72h ANPD",
        "Realizar simulação de incidente pra testar o plano",
      ],
      entrega: "PRI institucional aprovado e testado",
    },
    {
      semana: 13,
      fase: "Fase 7",
      titulo: "Monitoramento contínuo + revisão do programa",
      detalhes: [
        "Estabelecer indicadores de governança e periodicidade de revisão",
        "Apresentar resultados dos 90 dias ao Comitê e à Alta Gestão",
        "Definir ciclo seguinte do PGP (próximo trimestre)",
      ],
      entrega: "Programa de Governança em Privacidade em operação contínua",
    },
  ];
}
