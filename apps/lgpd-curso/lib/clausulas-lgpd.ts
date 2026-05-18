// Catálogo de cláusulas LGPD pra contratos com Operadores.
//
// Baseado nos documentos do Acervo do user:
//   - Cláusula Controlador x Operador (robusta).docx
//   - Contrato Controlador x Operador (simples).docx
//
// Cada cláusula tem 3 atributos pedagógicos:
//   essencial      — sempre vai (mesmo no nível BAIXO)
//   simples        — vai no nível MÉDIO + BAIXO
//   robusta        — só no nível ALTO (ou opcional em MÉDIO)
//
// Sugestão por nível de risco:
//   BAIXO   → essenciais (3 cláusulas) — contratos cadastrais simples
//   MÉDIO   → essenciais + simples (~7) — equivalente à minuta simples
//   ALTO    → todas as 12 — equivalente à minuta robusta
//
// As Cláusulas com `transferenciaInternacional=true` aparecem com badge especial.

export type ClausulaLgpd = {
  id: string;
  titulo: string;
  resumo: string; // 1 linha — exibido na lista
  textoCompleto: string; // vai no DOCX
  nivel: "essencial" | "simples" | "robusta";
  transferenciaInternacional?: boolean;
  recomendadaPara?: Array<"ADITIVO_NECESSARIO" | "CONTRATO_NOVO_CLAUSULAS" | "RENOVACAO_ADITIVAR" | "CONTRATO_NOVO_ALTO_RISCO">;
};

export const CATALOGO_CLAUSULAS: ClausulaLgpd[] = [
  // === ESSENCIAIS — 3 cláusulas mínimas ===
  {
    id: "objeto",
    titulo: "Objeto do Anexo de Proteção de Dados",
    resumo: "Define que o Operador tratará dados apenas conforme instruções do Controlador.",
    nivel: "essencial",
    textoCompleto:
      "O Objeto do presente Anexo é estabelecer os termos e condições aplicáveis ao Tratamento, pelo " +
      "CONTRATADO, dos Dados Pessoais controlados pela CONTRATANTE e compartilhados para fins de execução " +
      "do Contrato.\n\n" +
      "Toda e qualquer atividade de Tratamento deve atender às finalidades deste Contrato e ser realizada " +
      "em conformidade com a Lei nº 13.709/2018 (LGPD). O CONTRATADO deverá realizar as atividades de " +
      "Tratamento estritamente de acordo com as orientações da CONTRATANTE.\n\n" +
      "A duração do Tratamento deverá respeitar o objeto contratual, bem como o disposto na legislação aplicável.",
  },
  {
    id: "seguranca",
    titulo: "Medidas Técnicas e Administrativas de Segurança",
    resumo: "Operador adota controles de segurança (criptografia, controle de acesso, logs) pra proteger os dados.",
    nivel: "essencial",
    textoCompleto:
      "O CONTRATADO declara e garante possuir medidas técnicas e administrativas aptas a proteger os Dados " +
      "Pessoais tratados, capazes de garantir a integridade, disponibilidade e confidencialidade das " +
      "informações, incluindo: (i) mecanismos de autenticação de acesso (com autenticação dupla quando " +
      "aplicável); (ii) anonimização, pseudonimização e/ou encriptação dos Dados Pessoais; (iii) recursos " +
      "que permitam restauração rápida do acesso aos Dados Pessoais em caso de Incidente; e (iv) processo " +
      "de verificação contínua da implementação das medidas técnicas e organizacionais.\n\n" +
      "O CONTRATADO restringirá o acesso aos Dados Pessoais mediante definição de pessoas habilitadas e " +
      "responsáveis pelo Tratamento, responsabilizando-se pela confidencialidade.",
  },
  {
    id: "incidentes",
    titulo: "Notificação de Incidentes de Segurança",
    resumo: "Operador notifica o Controlador em até 24h sobre qualquer incidente envolvendo dados pessoais.",
    nivel: "essencial",
    textoCompleto:
      "Na ocorrência de qualquer Incidente ou suspeita de Incidente que envolva os Dados Pessoais tratados, " +
      "o CONTRATADO deverá notificar imediatamente a CONTRATANTE, com tolerância máxima de 1 (um) dia " +
      "corrido, por meio de canal específico definido pelas Partes, contendo, no mínimo:\n\n" +
      "(i) data e hora do Incidente;\n" +
      "(ii) data e hora da ciência pelo CONTRATADO;\n" +
      "(iii) relação dos tipos de Dados Pessoais afetados;\n" +
      "(iv) número de usuários afetados (volumetria) e, se possível, a relação desses indivíduos;\n" +
      "(v) dados de contato do Encarregado do CONTRATADO;\n" +
      "(vi) descrição das possíveis consequências do Incidente; e\n" +
      "(vii) medidas que estão sendo tomadas para a mitigação dos riscos.\n\n" +
      "Caso as informações não estejam disponíveis no momento da notificação inicial, o CONTRATADO " +
      "deverá complementá-las posteriormente, sem demora justificada.",
  },

  // === SIMPLES — adicionadas no nível MÉDIO ===
  {
    id: "compartilhamento",
    titulo: "Compartilhamento e Subcontratação",
    resumo: "Operador só repassa dados a terceiros com autorização escrita e contrato de mesmo nível de proteção.",
    nivel: "simples",
    textoCompleto:
      "Na hipótese de compartilhamento ou transferência de Dados Pessoais a Terceiros (incluindo " +
      "subcontratados, agentes autorizados e afiliados), o CONTRATADO deverá:\n\n" +
      "(i) obter autorização prévia e por escrito da CONTRATANTE;\n" +
      "(ii) garantir, mediante contrato escrito, que tais Terceiros se obriguem a manter os mesmos níveis " +
      "e padrões de proteção e medidas de segurança estabelecidos neste Anexo e na LGPD;\n" +
      "(iii) responsabilizar-se integralmente por todas as ações e omissões realizadas pelo Terceiro, " +
      "como se as tivesse realizado, eximindo a CONTRATANTE de qualquer responsabilidade.",
  },
  {
    id: "direitos-titular",
    titulo: "Cooperação no Atendimento aos Direitos dos Titulares",
    resumo: "Operador ajuda o Controlador a atender pedidos do titular (acesso, correção, exclusão...) em prazo curto.",
    nivel: "simples",
    textoCompleto:
      "Caberá ao CONTRATADO, sempre que necessário e solicitado pela CONTRATANTE, auxiliar no atendimento " +
      "das requisições realizadas por Titulares ou por autoridade competente (ANPD), incluindo:\n\n" +
      "(i) confirmação da existência do Tratamento;\n" +
      "(ii) acesso aos Dados Pessoais tratados;\n" +
      "(iii) correção de Dados Pessoais incompletos, inexatos ou desatualizados;\n" +
      "(iv) anonimização, bloqueio ou eliminação de Dados Pessoais desnecessários, excessivos ou tratados " +
      "em desconformidade com a LGPD;\n" +
      "(v) portabilidade dos Dados Pessoais;\n" +
      "(vi) informação sobre as entidades públicas e privadas com as quais foi realizado o compartilhamento.\n\n" +
      "O CONTRATADO atenderá as solicitações no prazo máximo de 2 (dois) dias corridos a contar da " +
      "comunicação pela CONTRATANTE, justificando os motivos em caso de demora.",
  },
  {
    id: "termino",
    titulo: "Término do Tratamento — Eliminação ou Devolução",
    resumo: "Após o fim do contrato, Operador devolve ou elimina todos os dados em prazo definido.",
    nivel: "simples",
    textoCompleto:
      "Após a expiração ou rescisão do Contrato, o CONTRATADO eliminará ou devolverá à CONTRATANTE os " +
      "materiais contendo Dados Pessoais que lhe foram disponibilizados, inclusive eventuais cópias " +
      "existentes, conforme instruções e prazo informados pela CONTRATANTE.\n\n" +
      "Ressalvam-se as hipóteses de manutenção dos Dados Pessoais em decorrência de obrigação legal e/ou " +
      "regulatória, situação na qual o CONTRATADO passará a ser Controlador em relação ao Tratamento dos " +
      "Dados Pessoais exclusivamente para tal finalidade.",
  },
  {
    id: "confidencialidade",
    titulo: "Confidencialidade dos Dados Pessoais",
    resumo: "Operador e seus funcionários assinam termo de confidencialidade — obrigação se mantém após o fim do contrato.",
    nivel: "simples",
    textoCompleto:
      "O CONTRATADO declara que toda a sua equipe, prepostos, contratados e quaisquer terceiros que tenham " +
      "acesso aos Dados Pessoais no curso da prestação dos serviços estão vinculados a obrigação contratual " +
      "de confidencialidade.\n\n" +
      "A obrigação de confidencialidade subsiste após a extinção do presente Contrato, por prazo indefinido, " +
      "ressalvadas as hipóteses legais que autorizem a quebra do sigilo.",
  },

  // === ROBUSTAS — só no nível ALTO ===
  {
    id: "transferencia-internacional",
    titulo: "Transferência Internacional de Dados Pessoais",
    resumo: "Operador só transfere dados pra fora do Brasil com autorização escrita e nas hipóteses do art. 33 LGPD.",
    nivel: "robusta",
    transferenciaInternacional: true,
    textoCompleto:
      "O CONTRATADO poderá, mediante autorização prévia e por escrito da CONTRATANTE, disponibilizar ou " +
      "transferir Dados Pessoais a qualquer outra jurisdição ou a Terceiros sediados no exterior, " +
      "exclusivamente quando se tratar de medida prevista no objeto do Contrato.\n\n" +
      "Na hipótese de ser permitida a transferência:\n\n" +
      "(i) o CONTRATADO deverá tomar todas as medidas necessárias para assegurar, em boa-fé, que a " +
      "transferência esteja em conformidade com a LGPD, incluindo a observância de regras vinculantes " +
      "aprovadas pela Autoridade Nacional de Proteção de Dados (ANPD);\n\n" +
      "(ii) caso o país de destino não possua nível adequado de proteção conforme determinações da ANPD, " +
      "o CONTRATADO deverá, previamente à transferência, estabelecer em conjunto com a CONTRATANTE qual " +
      "mecanismo será utilizado para garantir a legalidade da transferência (cláusulas-padrão, normas " +
      "corporativas globais, selos/certificações, ou outras hipóteses do art. 33 da LGPD);\n\n" +
      "(iii) o CONTRATADO assumirá toda a responsabilidade relacionada com a transferência, bem como " +
      "deverá tomar todas as medidas necessárias para assegurar a conformidade com a LGPD.",
  },
  {
    id: "auditoria",
    titulo: "Auditoria, Self-Assessment e Due Diligence",
    resumo: "Operador permite que o Controlador faça auditorias e responde formulários de avaliação.",
    nivel: "robusta",
    textoCompleto:
      "O CONTRATADO se compromete a:\n\n" +
      "(i) preencher todo e qualquer material solicitado pela CONTRATANTE relacionado aos padrões de " +
      "segurança aplicáveis (self-assessment), responsabilizando-se pela veracidade das informações " +
      "declaradas;\n\n" +
      "(ii) receber a CONTRATANTE em diligências e entrevistas a serem realizadas com a finalidade de " +
      "averiguação das medidas de segurança aplicadas (due-diligence), inclusive nas dependências físicas " +
      "do CONTRATADO onde ocorre o Tratamento;\n\n" +
      "(iii) responder prontamente solicitações de revisão dos procedimentos de self-assessment e/ou " +
      "due diligence, fazendo-se disponível para receber representantes da CONTRATANTE para entrevistas " +
      "e visitas aos estabelecimentos.",
  },
  {
    id: "registro-acessos",
    titulo: "Registro Detalhado de Acessos e Operações",
    resumo: "Operador mantém logs detalhados de quem acessou, quando e o que foi feito com cada dado pessoal.",
    nivel: "robusta",
    textoCompleto:
      "O CONTRATADO manterá inventário detalhado dos acessos aos Dados Pessoais e dos registros de conexão " +
      "e acesso a aplicações, contendo:\n\n" +
      "(i) o momento (data e hora) do acesso;\n" +
      "(ii) a duração da sessão;\n" +
      "(iii) a identidade do funcionário ou do responsável pelo acesso;\n" +
      "(iv) o registro acessado.\n\n" +
      "Tais registros deverão estar disponíveis para auditoria da CONTRATANTE e da ANPD, inclusive quando " +
      "o acesso é feito para cumprimento de obrigações legais ou determinações de autoridade competente.\n\n" +
      "Adicionalmente, o CONTRATADO registrará as atividades que envolvam o compartilhamento de Dados " +
      "Pessoais com Terceiros ou a transferência internacional, indicando o país e a organização de destino.",
  },
  {
    id: "responsabilidade-multa",
    titulo: "Responsabilidade e Multa por Descumprimento",
    resumo: "Operador responde por danos causados aos titulares + multa contratual em caso de violação grave da LGPD.",
    nivel: "robusta",
    textoCompleto:
      "O CONTRATADO defenderá e manterá a CONTRATANTE integralmente isenta de quaisquer responsabilidades " +
      "ou reivindicações dos Titulares de Dados Pessoais, com base em eventual irregularidade ou Tratamento " +
      "em desacordo com as instruções fornecidas pela CONTRATANTE, ou descumprimento deste Anexo, " +
      "inclusive com relação aos Incidentes.\n\n" +
      "Caso sejam ajuizadas ações pelos Titulares contra a CONTRATANTE, ou recebidas notificações de órgãos " +
      "públicos (incluindo a ANPD, MP, Procon e equivalentes) com base no uso indevido de Dados Pessoais " +
      "decorrente de falha do CONTRATADO, este deverá intervir no processo, reivindicar a condição de " +
      "demandado e requerer a exclusão da CONTRATANTE. Em caso de condenação da CONTRATANTE, o CONTRATADO " +
      "deverá ressarci-la pelo valor principal pago, perdas e danos (incluindo lucros cessantes) e todas " +
      "as despesas envolvidas.\n\n" +
      "Multa contratual: caso o CONTRATADO comprometa a segurança, confidencialidade ou integridade das " +
      "informações compartilhadas, fica sujeito à multa não compensatória equivalente ao valor total do " +
      "Contrato (ou valor pago até o momento do descumprimento, o que for maior), além de despesas " +
      "processuais e multas aplicadas pelas autoridades competentes.",
  },
  {
    id: "encarregado-operador",
    titulo: "Designação de Encarregado pelo Operador",
    resumo: "Operador designa um Encarregado (DPO) próprio como canal de comunicação com Controlador, titulares e ANPD.",
    nivel: "robusta",
    textoCompleto:
      "O CONTRATADO declara que designou pessoa responsável (Encarregado/DPO) para atuar como canal de " +
      "comunicação entre o próprio CONTRATADO, a CONTRATANTE, os Titulares de Dados Pessoais e a Autoridade " +
      "Nacional de Proteção de Dados (ANPD), nos termos do art. 41 da LGPD.\n\n" +
      "Os dados de contato do Encarregado do CONTRATADO são:\n\n" +
      "Nome: [.]\n" +
      "E-mail: [.]\n" +
      "Telefone: [.]\n\n" +
      "Qualquer alteração nos dados acima deve ser comunicada à CONTRATANTE no prazo de 5 (cinco) dias " +
      "úteis após a mudança.",
  },
  {
    id: "dados-sensiveis",
    titulo: "Cláusula Especial — Tratamento de Dados Pessoais Sensíveis",
    resumo: "Quando há dados sensíveis (saúde, biométricos, étnico-raciais, etc), proteções adicionais aplicam.",
    nivel: "robusta",
    textoCompleto:
      "O CONTRATADO reconhece que os Dados Pessoais Sensíveis estão sujeitos a maior rigor legal (art. 5º, " +
      "II e art. 11 da LGPD) e, portanto, exigem maior proteção técnica e organizacional.\n\n" +
      "Quando o CONTRATADO realizar operações de Tratamento de Dados Pessoais Sensíveis (sobre origem " +
      "racial/étnica, convicção religiosa, opinião política, filiação a sindicato ou organização religiosa/" +
      "filosófica/política, dados referentes à saúde, vida sexual, dados genéticos ou biométricos vinculados " +
      "a pessoa natural identificada), deverá garantir adicionalmente:\n\n" +
      "(i) encriptação obrigatória em trânsito e em repouso;\n" +
      "(ii) controle de acesso restrito ao mínimo necessário (princípio da necessidade — art. 6º, III LGPD);\n" +
      "(iii) registro circunstanciado de cada acesso (auditoria detalhada);\n" +
      "(iv) processo formal de revisão semestral das permissões de acesso;\n" +
      "(v) impossibilidade de subcontratação sem autorização específica e por escrito da CONTRATANTE para " +
      "cada operação envolvendo dados sensíveis.\n\n" +
      "O CONTRATADO concorda em realizar o Tratamento de Dados Pessoais Sensíveis apenas quando estritamente " +
      "necessário para cumprir as disposições contratuais.",
  },
];

// Sugere as cláusulas iniciais baseado no nível de risco do operador.
// O DPO pode ajustar a seleção depois.
export function clausulasSugeridasPorRisco(nivelRisco: string | null | undefined): string[] {
  if (nivelRisco === "ALTO") {
    return CATALOGO_CLAUSULAS.map((c) => c.id);
  }
  if (nivelRisco === "MEDIO") {
    return CATALOGO_CLAUSULAS
      .filter((c) => c.nivel === "essencial" || c.nivel === "simples")
      .map((c) => c.id);
  }
  // BAIXO ou null → só essenciais
  return CATALOGO_CLAUSULAS.filter((c) => c.nivel === "essencial").map((c) => c.id);
}

// Wrapper do DOCX gerado — define se é "Aditamento" ou "Anexo de Contrato Novo".
export function tituloDocumentoPorTipo(tipoOperacao: string | null | undefined): {
  cabecalho: string;
  isAditamento: boolean;
  preambulo: string;
} {
  switch (tipoOperacao) {
    case "ADITIVO_NECESSARIO":
      return {
        cabecalho: "ADITAMENTO DE TRATAMENTO DE DADOS PESSOAIS",
        isAditamento: true,
        preambulo:
          "Aditamento ao contrato existente, celebrado pelas Partes em data anterior à vigência da Lei nº " +
          "13.709/2018 (LGPD), com o propósito de complementar o Contrato a fim de reger os termos e " +
          "condições aplicáveis para o Tratamento de Dados Pessoais.",
      };
    case "RENOVACAO_ADITIVAR":
      return {
        cabecalho: "ANEXO DE PROTEÇÃO DE DADOS PESSOAIS (Renovação Contratual)",
        isAditamento: true,
        preambulo:
          "Anexo à renovação do contrato celebrado entre as Partes, incluindo as disposições sobre proteção " +
          "de Dados Pessoais a que as Partes estarão sujeitas conforme a Lei nº 13.709/2018 (LGPD).",
      };
    case "CONTRATO_NOVO_CLAUSULAS":
    case "CONTRATO_NOVO_ALTO_RISCO":
    default:
      return {
        cabecalho: "ANEXO DE PROTEÇÃO DE DADOS PESSOAIS",
        isAditamento: false,
        preambulo:
          "Anexo integrante e indissociável do Contrato celebrado entre as Partes, com o propósito de " +
          "reger os termos e condições aplicáveis para o Tratamento de Dados Pessoais, nos termos da Lei " +
          "nº 13.709/2018 (LGPD).",
      };
  }
}
