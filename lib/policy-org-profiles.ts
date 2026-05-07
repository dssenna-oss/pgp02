/**
 * Perfis de organização pra Políticas Institucionais.
 *
 * Cada perfil é um conjunto de substituições pros marcadores `[...]`
 * que aparecem nos templates Fatias 1-4. Ao aplicar um perfil, os
 * marcadores genéricos (ex.: `[órgão máximo de direção]`) viram texto
 * concreto adequado ao tipo de organização (ex.: "Mesa Diretora" pra
 * Câmara, "Conselho Diretor" pra Autarquia, "Tribunal Pleno" pra TCE).
 *
 * 5 perfis suportados:
 *   - prefeitura  — Prefeitura Municipal / governo executivo municipal
 *   - camara      — Câmara Legislativa Municipal
 *   - tcontas     — Tribunal de Contas (Estadual ou Municipal)
 *   - autarquia   — Autarquia ou Fundação Pública (administração indireta)
 *   - federal     — Órgão da administração pública federal direta
 *
 * Mais 1 perfil "neutro" implícito: não aplicar nenhum (template fica
 * com os `[...]` originais — DPO substitui manualmente).
 *
 * Decisão arquitetural: o perfil é aplicado sob demanda (botão na UI),
 * não persistido em Company. Permite que diferentes políticas da mesma
 * organização tenham perfis diferentes (raro mas possível) e mantém o
 * fluxo de criação simples — sem schema novo.
 */

export type OrgProfileKey =
  | "prefeitura"
  | "camara"
  | "tcontas"
  | "autarquia"
  | "federal";

export interface OrgProfile {
  key: OrgProfileKey;
  label: string;
  description: string;
  /**
   * Substituições — chave é o trecho exato dentro de `[...]` (sem os
   * colchetes), valor é o texto que vai substituir o `[trecho]` inteiro.
   * Comparação é case-insensitive na primeira palavra significativa.
   */
  replacements: Record<string, string>;
}

const PROFILES_DATA: OrgProfile[] = [
  // ────────────────────────────────────────────────────────────────────
  // Prefeitura Municipal
  // ────────────────────────────────────────────────────────────────────
  {
    key: "prefeitura",
    label: "Prefeitura Municipal",
    description:
      "Governo executivo municipal — autarquias e fundações municipais devem usar o perfil 'Autarquia / Fundação'.",
    replacements: {
      "órgão máximo de direção":
        "Comitê Municipal de Privacidade e Proteção de Dados",
      "autoridade executiva": "Prefeito Municipal",
      "unidade responsável por capacitação":
        "Secretaria Municipal de Administração / Departamento de Recursos Humanos",
      "administração / instituição / empresa": "Prefeitura Municipal",
      "descrever natureza jurídica: autarquia / fundação / órgão municipal / empresa de economia mista / etc.":
        "ente da administração pública municipal direta",
      "citar lei/decreto/lei orgânica/estatuto que define as competências":
        "Lei Orgânica do Município, Constituição Federal e legislação infraconstitucional aplicável aos municípios",
      "descrever infraestrutura: \"infraestrutura tecnológica da Administração Pública Federal\" / \"data center próprio com certificação X\" / \"provedor de nuvem com nível adequado de proteção\"":
        "infraestrutura tecnológica municipal própria e/ou em provedores de nuvem com adequado nível de segurança contratados pela Prefeitura",
      "ex.: Secretaria de Administração / Ministério apoiador":
        "Secretaria Municipal de Administração",
      "Adapte conforme infraestrutura: \"A {{empresa_nome_curto}}, como demais órgãos da Administração Pública Federal, utiliza-se dos serviços do portal Gov.br…\" OU \"A {{empresa_nome_curto}} utiliza ferramentas próprias de análise…\"":
        "A Prefeitura Municipal utiliza ferramentas próprias de análise estatística e/ou recursos do governo digital",
      "descrever o canal: \"a Plataforma Fala.BR\" / \"o e-mail do Encarregado\" / \"o formulário disponível em <link>\"":
        "o e-mail do Encarregado, formulário disponível no portal municipal ou Ouvidoria-Geral do Município",
      "Acrescentar: leis orgânicas, estatutos e atos normativos próprios da {{empresa_nome_curto}}":
        "Lei Orgânica do Município, Plano Diretor, Código de Posturas e demais atos normativos municipais",
      "Acrescentar: leis orgânicas, estatutos próprios": "Lei Orgânica do Município e demais atos normativos municipais",
      "Descrever brevemente o serviço, sua finalidade, fontes de dados, regularidade de atualização e formas de acesso. Exemplo:":
        "Descreva aqui o serviço da Prefeitura — ex.: portal do cidadão, sistema de protocolo, e-SIC, transparência ativa.",
      "Para órgãos públicos federais: \"Fica eleito o foro da Justiça Federal da Seção Judiciária de Brasília/DF para dirimir controvérsias decorrentes deste Termo.\" | Para municipais/estaduais: \"Foro da comarca de {{cidade}}/{{estado}}, com renúncia a qualquer outro, por mais privilegiado que seja.\"":
        "Foro da comarca de {{cidade}}/{{estado}}, com renúncia a qualquer outro, por mais privilegiado que seja",
      "Ouvidoria / SIC: indicar canal específico, se houver":
        "Ouvidoria-Geral do Município (canal e e-mail conforme portal municipal)",
      "via Google Analytics ou ferramenta similar":
        "via ferramenta de análise estatística adotada pela Prefeitura",
      "Caso utilize Google Analytics, mantenha a tabela abaixo. Caso use outra ferramenta — Matomo, Plausible, etc. — substitua pelos cookies correspondentes.":
        "Configure os cookies analíticos conforme a ferramenta efetivamente adotada pela Prefeitura.",
      "Adicionar outras redes sociais utilizadas: Instagram, LinkedIn, X/Twitter, etc.":
        "Adicione redes sociais oficiais usadas pelos canais da Prefeitura (Instagram, Facebook, X/Twitter, etc.)",
    },
  },

  // ────────────────────────────────────────────────────────────────────
  // Câmara Legislativa Municipal
  // ────────────────────────────────────────────────────────────────────
  {
    key: "camara",
    label: "Câmara Municipal",
    description:
      "Órgão legislativo municipal. Para Assembleias Legislativas estaduais, ajuste manualmente foro e referências legais.",
    replacements: {
      "órgão máximo de direção": "Mesa Diretora",
      "autoridade executiva": "Presidente da Câmara Municipal",
      "unidade responsável por capacitação":
        "Diretoria Administrativa da Câmara / Escola Legislativa",
      "administração / instituição / empresa": "Câmara Municipal",
      "descrever natureza jurídica: autarquia / fundação / órgão municipal / empresa de economia mista / etc.":
        "órgão legislativo do Poder Municipal",
      "citar lei/decreto/lei orgânica/estatuto que define as competências":
        "Lei Orgânica do Município, Regimento Interno da Câmara e Constituição Federal",
      "descrever infraestrutura: \"infraestrutura tecnológica da Administração Pública Federal\" / \"data center próprio com certificação X\" / \"provedor de nuvem com nível adequado de proteção\"":
        "infraestrutura tecnológica própria da Câmara e/ou em provedores de nuvem contratados, conforme padrões de segurança aplicáveis",
      "ex.: Secretaria de Administração / Ministério apoiador":
        "Diretoria Administrativa da Câmara",
      "Adapte conforme infraestrutura: \"A {{empresa_nome_curto}}, como demais órgãos da Administração Pública Federal, utiliza-se dos serviços do portal Gov.br…\" OU \"A {{empresa_nome_curto}} utiliza ferramentas próprias de análise…\"":
        "A Câmara Municipal utiliza ferramentas próprias de análise estatística e/ou recursos disponibilizados pela Administração Municipal",
      "descrever o canal: \"a Plataforma Fala.BR\" / \"o e-mail do Encarregado\" / \"o formulário disponível em <link>\"":
        "o e-mail do Encarregado ou Ouvidoria da Câmara",
      "Acrescentar: leis orgânicas, estatutos e atos normativos próprios da {{empresa_nome_curto}}":
        "Lei Orgânica do Município, Regimento Interno da Câmara e Resoluções da Mesa Diretora",
      "Acrescentar: leis orgânicas, estatutos próprios": "Lei Orgânica do Município e Regimento Interno da Câmara",
      "Descrever brevemente o serviço, sua finalidade, fontes de dados, regularidade de atualização e formas de acesso. Exemplo:":
        "Descreva aqui o portal legislativo da Câmara — ex.: publicações de proposições, projetos de lei, sessões plenárias, prestação de contas dos vereadores.",
      "Para órgãos públicos federais: \"Fica eleito o foro da Justiça Federal da Seção Judiciária de Brasília/DF para dirimir controvérsias decorrentes deste Termo.\" | Para municipais/estaduais: \"Foro da comarca de {{cidade}}/{{estado}}, com renúncia a qualquer outro, por mais privilegiado que seja.\"":
        "Foro da comarca de {{cidade}}/{{estado}}, com renúncia a qualquer outro, por mais privilegiado que seja",
      "Ouvidoria / SIC: indicar canal específico, se houver":
        "Ouvidoria da Câmara Municipal e e-SIC (Serviço de Informação ao Cidadão)",
      "via Google Analytics ou ferramenta similar":
        "via ferramenta de análise estatística adotada pela Câmara",
      "Caso utilize Google Analytics, mantenha a tabela abaixo. Caso use outra ferramenta — Matomo, Plausible, etc. — substitua pelos cookies correspondentes.":
        "Configure os cookies analíticos conforme a ferramenta efetivamente adotada pelo portal legislativo.",
      "Adicionar outras redes sociais utilizadas: Instagram, LinkedIn, X/Twitter, etc.":
        "Adicione canais oficiais da Câmara (TV Câmara, Instagram, Facebook, YouTube institucional, etc.)",
    },
  },

  // ────────────────────────────────────────────────────────────────────
  // Tribunal de Contas
  // ────────────────────────────────────────────────────────────────────
  {
    key: "tcontas",
    label: "Tribunal de Contas",
    description:
      "Tribunal de Contas estadual, da União ou dos Municípios. Órgão de controle externo.",
    replacements: {
      "órgão máximo de direção": "Tribunal Pleno",
      "autoridade executiva": "Presidente do Tribunal de Contas",
      "unidade responsável por capacitação":
        "Escola de Contas Públicas / Coordenadoria de Gestão de Pessoas",
      "administração / instituição / empresa": "Tribunal de Contas",
      "descrever natureza jurídica: autarquia / fundação / órgão municipal / empresa de economia mista / etc.":
        "órgão de controle externo, integrante da estrutura constitucional, com autonomia administrativa, financeira e funcional",
      "citar lei/decreto/lei orgânica/estatuto que define as competências":
        "Constituição Federal, Lei Orgânica do Tribunal e Regimento Interno",
      "descrever infraestrutura: \"infraestrutura tecnológica da Administração Pública Federal\" / \"data center próprio com certificação X\" / \"provedor de nuvem com nível adequado de proteção\"":
        "infraestrutura tecnológica própria do Tribunal, com data center institucional ou em nuvem governamental, conforme padrões de segurança da informação aplicáveis a órgãos de controle",
      "ex.: Secretaria de Administração / Ministério apoiador":
        "Secretaria-Geral de Administração do Tribunal",
      "Adapte conforme infraestrutura: \"A {{empresa_nome_curto}}, como demais órgãos da Administração Pública Federal, utiliza-se dos serviços do portal Gov.br…\" OU \"A {{empresa_nome_curto}} utiliza ferramentas próprias de análise…\"":
        "O Tribunal de Contas utiliza ferramentas próprias de análise estatística e/ou recursos do governo digital, conforme convênios e contratos vigentes",
      "descrever o canal: \"a Plataforma Fala.BR\" / \"o e-mail do Encarregado\" / \"o formulário disponível em <link>\"":
        "o e-mail do Encarregado, Ouvidoria do Tribunal ou Plataforma Fala.BR",
      "Acrescentar: leis orgânicas, estatutos e atos normativos próprios da {{empresa_nome_curto}}":
        "Lei Orgânica do Tribunal, Regimento Interno e Resoluções do Tribunal Pleno",
      "Acrescentar: leis orgânicas, estatutos próprios": "Lei Orgânica do Tribunal de Contas e Regimento Interno",
      "Descrever brevemente o serviço, sua finalidade, fontes de dados, regularidade de atualização e formas de acesso. Exemplo:":
        "Descreva aqui o portal do Tribunal — ex.: publicação de julgamentos, processos de contas, fiscalizações, jurisprudência, transparência institucional.",
      "Para órgãos públicos federais: \"Fica eleito o foro da Justiça Federal da Seção Judiciária de Brasília/DF para dirimir controvérsias decorrentes deste Termo.\" | Para municipais/estaduais: \"Foro da comarca de {{cidade}}/{{estado}}, com renúncia a qualquer outro, por mais privilegiado que seja.\"":
        "Foro da comarca de {{cidade}}/{{estado}}, com renúncia a qualquer outro, por mais privilegiado que seja",
      "Ouvidoria / SIC: indicar canal específico, se houver":
        "Ouvidoria do Tribunal de Contas e Serviço de Informação ao Cidadão (SIC)",
      "via Google Analytics ou ferramenta similar":
        "via ferramenta de análise estatística adotada pelo Tribunal",
      "Caso utilize Google Analytics, mantenha a tabela abaixo. Caso use outra ferramenta — Matomo, Plausible, etc. — substitua pelos cookies correspondentes.":
        "Configure os cookies analíticos conforme a ferramenta efetivamente adotada pelo portal do Tribunal.",
      "Adicionar outras redes sociais utilizadas: Instagram, LinkedIn, X/Twitter, etc.":
        "Adicione canais oficiais do Tribunal (LinkedIn institucional, Instagram, YouTube institucional, etc.)",
    },
  },

  // ────────────────────────────────────────────────────────────────────
  // Autarquia / Fundação Pública
  // ────────────────────────────────────────────────────────────────────
  {
    key: "autarquia",
    label: "Autarquia / Fundação Pública",
    description:
      "Administração pública indireta. Inclui agências reguladoras, fundações públicas, autarquias federais/estaduais/municipais e universidades públicas.",
    replacements: {
      "órgão máximo de direção": "Conselho Diretor / Conselho Superior",
      "autoridade executiva": "Diretor-Presidente / Reitor / Presidente",
      "unidade responsável por capacitação":
        "Coordenação-Geral de Administração / Departamento de Recursos Humanos / Escola de Governo",
      "administração / instituição / empresa": "{{empresa_nome_curto}}",
      "descrever natureza jurídica: autarquia / fundação / órgão municipal / empresa de economia mista / etc.":
        "autarquia/fundação pública integrante da administração pública indireta, dotada de autonomia administrativa, financeira e técnica",
      "citar lei/decreto/lei orgânica/estatuto que define as competências":
        "Lei de criação, Estatuto, Regimento Interno e legislação setorial aplicável",
      "descrever infraestrutura: \"infraestrutura tecnológica da Administração Pública Federal\" / \"data center próprio com certificação X\" / \"provedor de nuvem com nível adequado de proteção\"":
        "infraestrutura tecnológica própria, conforme padrões de segurança aplicáveis a entidades da administração pública indireta",
      "ex.: Secretaria de Administração / Ministério apoiador":
        "ministério/secretaria supervisora",
      "Adapte conforme infraestrutura: \"A {{empresa_nome_curto}}, como demais órgãos da Administração Pública Federal, utiliza-se dos serviços do portal Gov.br…\" OU \"A {{empresa_nome_curto}} utiliza ferramentas próprias de análise…\"":
        "A {{empresa_nome_curto}} utiliza ferramentas próprias de análise estatística e/ou recursos do governo digital",
      "descrever o canal: \"a Plataforma Fala.BR\" / \"o e-mail do Encarregado\" / \"o formulário disponível em <link>\"":
        "a Plataforma Fala.BR (para órgãos federais), o e-mail do Encarregado ou Ouvidoria institucional",
      "Acrescentar: leis orgânicas, estatutos e atos normativos próprios da {{empresa_nome_curto}}":
        "Lei de criação, Estatuto, Regimento Interno e atos normativos da {{empresa_nome_curto}}",
      "Acrescentar: leis orgânicas, estatutos próprios": "Lei de criação, Estatuto e atos normativos próprios",
      "Descrever brevemente o serviço, sua finalidade, fontes de dados, regularidade de atualização e formas de acesso. Exemplo:":
        "Descreva aqui o portal institucional — ex.: serviços ao cidadão, consultas públicas, sistemas de protocolo, transparência ativa.",
      "Para órgãos públicos federais: \"Fica eleito o foro da Justiça Federal da Seção Judiciária de Brasília/DF para dirimir controvérsias decorrentes deste Termo.\" | Para municipais/estaduais: \"Foro da comarca de {{cidade}}/{{estado}}, com renúncia a qualquer outro, por mais privilegiado que seja.\"":
        "Foro da Justiça Federal da Seção Judiciária com jurisdição sobre a sede da {{empresa_nome_curto}} (em caso de ente federal) ou comarca de {{cidade}}/{{estado}} (em caso de ente estadual ou municipal)",
      "Ouvidoria / SIC: indicar canal específico, se houver":
        "Ouvidoria institucional e Serviço de Informação ao Cidadão (SIC)",
      "via Google Analytics ou ferramenta similar":
        "via ferramenta de análise estatística adotada pela {{empresa_nome_curto}}",
      "Caso utilize Google Analytics, mantenha a tabela abaixo. Caso use outra ferramenta — Matomo, Plausible, etc. — substitua pelos cookies correspondentes.":
        "Configure os cookies analíticos conforme a ferramenta efetivamente adotada pelo portal institucional.",
      "Adicionar outras redes sociais utilizadas: Instagram, LinkedIn, X/Twitter, etc.":
        "Adicione canais oficiais da instituição (LinkedIn, Instagram, YouTube, etc.)",
    },
  },

  // ────────────────────────────────────────────────────────────────────
  // Órgão Federal (administração direta)
  // ────────────────────────────────────────────────────────────────────
  {
    key: "federal",
    label: "Órgão Federal (Ministério/Secretaria)",
    description:
      "Administração pública federal direta — ministérios, secretarias federais, órgãos colegiados. Para autarquias federais, prefira o perfil 'Autarquia / Fundação'.",
    replacements: {
      "órgão máximo de direção":
        "Comitê de Privacidade e Proteção de Dados Pessoais",
      "autoridade executiva": "Ministro de Estado / Secretário-Executivo",
      "unidade responsável por capacitação":
        "Coordenação-Geral de Administração / Escola Nacional de Administração Pública (ENAP)",
      "administração / instituição / empresa": "{{empresa_nome_curto}}",
      "descrever natureza jurídica: autarquia / fundação / órgão municipal / empresa de economia mista / etc.":
        "órgão da administração pública federal direta",
      "citar lei/decreto/lei orgânica/estatuto que define as competências":
        "Constituição Federal, Lei nº [...] de criação/organização do órgão e Decreto regimental",
      "descrever infraestrutura: \"infraestrutura tecnológica da Administração Pública Federal\" / \"data center próprio com certificação X\" / \"provedor de nuvem com nível adequado de proteção\"":
        "infraestrutura tecnológica da Administração Pública Federal, conforme padrões de segurança aplicáveis e disposições da Política Nacional de Segurança da Informação (Decreto nº 9.637/2018)",
      "ex.: Secretaria de Administração / Ministério apoiador":
        "Ministério/Secretaria-Executiva supervisora",
      "Adapte conforme infraestrutura: \"A {{empresa_nome_curto}}, como demais órgãos da Administração Pública Federal, utiliza-se dos serviços do portal Gov.br…\" OU \"A {{empresa_nome_curto}} utiliza ferramentas próprias de análise…\"":
        "A {{empresa_nome_curto}}, como demais órgãos da Administração Pública Federal, utiliza-se dos serviços do portal Gov.br para disponibilizar o seu sítio institucional",
      "descrever o canal: \"a Plataforma Fala.BR\" / \"o e-mail do Encarregado\" / \"o formulário disponível em <link>\"":
        "a Plataforma Fala.BR (Plataforma Integrada de Ouvidoria e Acesso à Informação)",
      "Acrescentar: leis orgânicas, estatutos e atos normativos próprios da {{empresa_nome_curto}}":
        "Lei de criação, Decreto regimental e atos normativos próprios da {{empresa_nome_curto}}",
      "Acrescentar: leis orgânicas, estatutos próprios": "Lei de criação e Decreto regimental",
      "Descrever brevemente o serviço, sua finalidade, fontes de dados, regularidade de atualização e formas de acesso. Exemplo:":
        "Descreva aqui o portal Gov.br institucional — ex.: serviços ao cidadão, formulários, consultas públicas, transparência ativa, dados abertos.",
      "Para órgãos públicos federais: \"Fica eleito o foro da Justiça Federal da Seção Judiciária de Brasília/DF para dirimir controvérsias decorrentes deste Termo.\" | Para municipais/estaduais: \"Foro da comarca de {{cidade}}/{{estado}}, com renúncia a qualquer outro, por mais privilegiado que seja.\"":
        "Fica eleito o foro da Justiça Federal da Seção Judiciária de Brasília/DF para dirimir controvérsias decorrentes deste Termo",
      "Ouvidoria / SIC: indicar canal específico, se houver":
        "Plataforma Fala.BR e Serviço de Informação ao Cidadão (SIC)",
      "via Google Analytics ou ferramenta similar":
        "via Google Analytics, integrado ao Gov.br",
      "Caso utilize Google Analytics, mantenha a tabela abaixo. Caso use outra ferramenta — Matomo, Plausible, etc. — substitua pelos cookies correspondentes.":
        "A Administração Pública Federal utiliza Google Analytics integrado ao Gov.br para gerar relatórios estatísticos. Os dados são anonimizados antes do processamento.",
      "Adicionar outras redes sociais utilizadas: Instagram, LinkedIn, X/Twitter, etc.":
        "Adicione canais oficiais do órgão integrados ao Gov.br (Instagram, LinkedIn, YouTube institucional, X/Twitter, etc.)",
    },
  },
];

export const ORG_PROFILES: Readonly<OrgProfile[]> = PROFILES_DATA;

export function getOrgProfile(key: OrgProfileKey): OrgProfile | null {
  return PROFILES_DATA.find((p) => p.key === key) ?? null;
}

/**
 * Aplica um perfil ao conteúdo: substitui cada `[trecho]` cuja chave
 * (sem colchetes) bate exatamente com uma entrada do `replacements`.
 *
 * Os marcadores nos templates aparecem como `\`[texto]\`` (em código
 * inline markdown) ou `[texto]` simples — tratamos os 2 formatos.
 *
 * Idempotente: se rodar 2x com o mesmo perfil, a 2ª execução não faz
 * nada (texto já foi substituído na 1ª e não bate mais com `[trecho]`).
 */
export function applyOrgProfile(
  content: string,
  profile: OrgProfile,
): { content: string; replacementsCount: number } {
  let out = content;
  let count = 0;
  for (const [marker, replacement] of Object.entries(profile.replacements)) {
    // Tenta substituir com crases (preferível, pois o template usa `[...]`)
    const withTicks = `\`[${marker}]\``;
    if (out.includes(withTicks)) {
      out = out.split(withTicks).join(replacement);
      count++;
      continue;
    }
    // Fallback: sem crases — alguns templates podem ter [...] simples
    const plain = `[${marker}]`;
    if (out.includes(plain)) {
      out = out.split(plain).join(replacement);
      count++;
    }
  }
  return { content: out, replacementsCount: count };
}

/**
 * Verifica se o conteúdo tem ALGUM marcador `[...]` ou `\`[...]\`` que
 * algum dos perfis substituiria. UI usa pra mostrar/esconder o botão
 * "Aplicar perfil de órgão".
 */
export function hasOrgProfileMarkers(content: string): boolean {
  for (const profile of PROFILES_DATA) {
    for (const marker of Object.keys(profile.replacements)) {
      if (content.includes(`\`[${marker}]\``) || content.includes(`[${marker}]`)) {
        return true;
      }
    }
  }
  return false;
}
