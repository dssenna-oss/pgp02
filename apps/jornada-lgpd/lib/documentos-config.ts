// Perguntas ESPECÍFICAS de cada documento (o que o Perfil não cobre).
// E2 cobre os 6 Documentos Formais; os demais ganham config na E3 — sem
// config, o documento ainda é preenchido com o Perfil (regras globais).
//
// `alvoPrefixo` = início do texto interno do [PLACEHOLDER] que a resposta
// preenche. `sequencial` cobre tokens repetidos posicionais (ex.: [NOME] na
// Portaria — I é o DPO do Perfil, II-VI vêm das perguntas, na ordem).

export type PerguntaDoc = {
  id: string;
  label: string;
  dica?: string;
  tipo: "texto" | "textarea";
  alvoPrefixo?: string; // ausente quando a resposta entra só via `sequencial`
};

export type ConfigDoc = {
  numero: number;
  perguntas: PerguntaDoc[];
  sequencial?: { token: string; ordem: ("@dpoNome" | string)[] };
};

export const CONFIG_DOCS: ConfigDoc[] = [
  {
    numero: 1, // Ato de Designação
    perguntas: [
      { id: "numeroAto", label: "Número do ato", dica: "Ex.: 03/2026", tipo: "texto", alvoPrefixo: "NÚMERO/AAAA" },
      { id: "justificativa", label: "Justificativa da escolha do Encarregado", dica: "Perfil técnico-jurídico, autonomia, acesso à alta administração…", tipo: "textarea", alvoPrefixo: "JUSTIFICATIVA DA ESCOLHA" },
    ],
  },
  {
    numero: 2, // Portaria do Comitê
    perguntas: [
      { id: "numeroPortaria", label: "Número da portaria", dica: "Ex.: 12/2026", tipo: "texto", alvoPrefixo: "NÚMERO/AAAA" },
      { id: "membroTI", label: "Membro — Tecnologia da Informação (TI)", tipo: "texto" },
      { id: "membroJuridico", label: "Membro — área Jurídica / Procuradoria", tipo: "texto" },
      { id: "membroRH", label: "Membro — Gestão de Pessoas (RH)", tipo: "texto" },
      { id: "membroComunicacao", label: "Membro — Comunicação", tipo: "texto" },
      { id: "membroProcessos", label: "Membro — áreas donas dos processos críticos", dica: "Ex.: Saúde, Tributário, Assistência Social", tipo: "texto" },
      { id: "periodicidade", label: "Periodicidade das reuniões", dica: "Ex.: trimestralmente", tipo: "texto", alvoPrefixo: "PERIODICIDADE" },
    ],
    sequencial: {
      token: "[NOME]",
      ordem: ["@dpoNome", "membroTI", "membroJuridico", "membroRH", "membroComunicacao", "membroProcessos"],
    },
  },
  {
    numero: 3, // Carta à Alta Gestão — sai pronta só com o Perfil
    perguntas: [],
  },
  {
    numero: 4, // Roadmap de 90 dias
    perguntas: [
      { id: "responsavel", label: "Responsável pelas entregas do cronograma", dica: "Ex.: Encarregado(a) + Comitê de Privacidade — preenche a coluna \"responsável\" das 13 semanas", tipo: "texto", alvoPrefixo: "a definir" },
    ],
  },
  {
    numero: 5, // Aviso de Privacidade
    perguntas: [
      { id: "finalidades", label: "Principais finalidades do tratamento", dica: "Ex.: prestação de serviços públicos, atendimento ao cidadão, cumprimento de obrigações legais", tipo: "textarea", alvoPrefixo: "FINALIDADES" },
      { id: "listaDados", label: "Quais dados a instituição trata", dica: "Ex.: dados cadastrais (nome, CPF), de contato (e-mail, telefone) e, em serviços de saúde, dados sensíveis", tipo: "textarea", alvoPrefixo: "LISTA" },
      { id: "prazoAtendimento", label: "Prazo de guarda — dados de atendimento", dica: "Ex.: 5 anos", tipo: "texto", alvoPrefixo: "X anos" },
      { id: "prazoSaude", label: "Prazo de guarda — dados de saúde", dica: "Ex.: 20 anos", tipo: "texto", alvoPrefixo: "Y anos" },
      { id: "prazoDemais", label: "Prazo de guarda — demais dados", dica: "Ex.: 5 anos", tipo: "texto", alvoPrefixo: "Z anos" },
    ],
  },
  {
    numero: 6, // Documento do PRI
    perguntas: [
      { id: "canal", label: "Canal interno pra reportar incidentes", dica: "Ex.: e-mail dpo@instituicao.gov.br + telefone (00) 0000-0000", tipo: "texto", alvoPrefixo: "CANAL" },
      { id: "contato24h", label: "Contato de emergência 24h da equipe de resposta", dica: "Nome · e-mail · celular", tipo: "texto", alvoPrefixo: "NOME · E-MAIL · CELULAR 24h" },
    ],
  },
];

export function getConfigDoc(numero: number): ConfigDoc | null {
  return CONFIG_DOCS.find((c) => c.numero === numero) ?? null;
}
