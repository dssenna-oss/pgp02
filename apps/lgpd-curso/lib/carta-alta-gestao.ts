// Carta para a Alta Gestão — prática da FASE PRELIMINAR.
// 5 campos curtos com TEMPLATES INSTITUCIONAIS auto-preenchidos. Grupo
// pode aceitar como está ou personalizar com a realidade da Instituição.
// Gera DOCX formal pra impressão e assinatura.
//
// Decisão pedagógica (2026-05-25, pós 1º curso): templates auto-preenchidos
// economizam ~5min por grupo. No debrief, facilitador explica que cada órgão
// adapta com a justificativa real — esse é o esqueleto defensável.

export type CartaAltaGestaoData = {
  destinatario: string;
  justificativa: string;
  riscosNaoFazer: string;
  pedido: string;
  assinatura: string;
};

export type CartaAltaGestaoSalva = CartaAltaGestaoData & {
  finalizadaEm: string | null; // null = rascunho
  atualizadoEm: string;
};

// Templates por órgão — PM e CM têm endereçamento e foco institucional
// distintos. Grupo escolhe automaticamente pelo orgao da company.
export type ContextoCarta = {
  orgao: "PM" | "CM";
  cidade: string;          // ex: "Vegas"
  nomeOrgao: string;       // ex: "Prefeitura Municipal de Vegas" ou "Câmara Municipal de Vegas"
  dpoName: string | null;
};

export function gerarCartaAutoPreenchida(ctx: ContextoCarta): CartaAltaGestaoData {
  const destinatario =
    ctx.orgao === "PM"
      ? `Excelentíssimo(a) Senhor(a) Prefeito(a) Municipal de ${ctx.cidade}`
      : `Excelentíssimo(a) Senhor(a) Presidente da Câmara Municipal de ${ctx.cidade}`;

  const justificativa =
    `A Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD) está em ` +
    `vigor desde setembro de 2020 e é plenamente aplicável aos órgãos da Administração ` +
    `Pública direta e indireta, conforme art. 1º e Capítulo IV da própria Lei. ` +
    `${ctx.nomeOrgao} trata, no exercício de suas atribuições legais, ` +
    `volume expressivo de dados pessoais de cidadãos, servidores e fornecedores — ` +
    `incluindo dados sensíveis (saúde, opinião política, dados de crianças e adolescentes). ` +
    `A adequação à LGPD deixou de ser opção e tornou-se obrigação institucional, com ` +
    `responsabilização direta do(a) gestor(a) máximo(a) do órgão em caso de descumprimento.`;

  const riscosNaoFazer =
    `O não-cumprimento expõe o órgão e seus dirigentes a riscos institucionais relevantes:\n\n` +
    `1. Sanções administrativas pela Autoridade Nacional de Proteção de Dados (ANPD), ` +
    `incluindo advertências, publicização da infração e multas que podem chegar a 2% do ` +
    `faturamento (no setor público, repercussão na imagem institucional e auditorias).\n\n` +
    `2. Responsabilização civil em caso de incidente de segurança envolvendo dados ` +
    `pessoais de cidadãos atendidos pelo órgão (Art. 42 da LGPD), com possibilidade de ` +
    `indenizações por dano moral coletivo e individual.\n\n` +
    `3. Repercussão midiática e perda de confiança da população — em uma era em que a ` +
    `proteção de dados é tema sensível para a opinião pública, qualquer falha repercute ` +
    `negativamente na credibilidade da gestão.\n\n` +
    `4. Apontamentos em auditorias do Tribunal de Contas e Ministério Público, que vêm ` +
    `incluindo a conformidade com a LGPD como item de fiscalização rotineira.`;

  const pedido =
    `Em razão do exposto, solicitamos formalmente o apoio institucional de Vossa Excelência ` +
    `para a implementação do Programa de Governança em Privacidade (PGP) ` +
    `de ${ctx.nomeOrgao}, especificamente nos seguintes pontos:\n\n` +
    `a) Designação formal do(a) Encarregado(a) pelo Tratamento de Dados Pessoais (DPO) ` +
    `por meio de ato oficial, conforme exige o Art. 41 da LGPD;\n\n` +
    `b) Constituição do Comitê de Governança de Dados Pessoais, com representação das ` +
    `áreas-chave da Instituição (Tecnologia, Jurídico, Comunicação e setores que tratam ` +
    `dados sensíveis);\n\n` +
    `c) Alocação de recursos humanos e orçamentários minimamente compatíveis com a ` +
    `complexidade dos tratamentos realizados pelo órgão;\n\n` +
    `d) Inclusão da adequação à LGPD como pauta recorrente das reuniões de gestão, ` +
    `com cobrança periódica de avanços junto ao Encarregado designado.\n\n` +
    `Comprometemo-nos a apresentar, no prazo de 30 (trinta) dias após o início ` +
    `formal dos trabalhos, o cronograma detalhado de implementação do PGP e a ` +
    `lista priorizada de processos a serem mapeados.`;

  const assinatura = ctx.dpoName
    ? `Respeitosamente,\n\n${ctx.dpoName}\nEncarregado(a) pelo Tratamento de Dados Pessoais`
    : `Respeitosamente,\n\n_______________________________\nEncarregado(a) pelo Tratamento de Dados Pessoais\n(a designar formalmente)`;

  return {
    destinatario,
    justificativa,
    riscosNaoFazer,
    pedido,
    assinatura,
  };
}
