// =============================================================================
// Montador Guiado de Documentos — Modalidade C (celular de cada participante)
// =============================================================================
// "Simular a criação de um documento" no celular SEM digitar o documento inteiro
// (a Modalidade C rejeita digitação pesada). O aprendizado mora nas DECISÕES:
// em cada tela o participante escolhe entre a cláusula CERTA e a pegadinha
// clássica, e o documento vai se MONTANDO na frente dele. No fim ele vê o
// documento completo que construiu + um placar do que acertou (com o artigo).
//
// Sem persistência: é produção pessoal, não decisão coletiva agregada no telão.
// A versão editável "pra levar" continua no Pacote de Modelos.
//
// O conteúdo jurídico é DERIVADO de material já revisado do curso:
//   - lib/aviso-secoes.ts          (as 12 seções do Aviso)
//   - lib/aviso-erros-plantados.ts (os 6 erros clássicos = as 6 decisões)

// -----------------------------------------------------------------------------
// TIPOS
// -----------------------------------------------------------------------------

export type OpcaoDecisao = {
  id: string;
  rotulo: string; // o texto do botão que o participante toca
  textoDoc: string; // a cláusula que ENTRA no documento se esta opção for escolhida
  correta: boolean;
  porque: string; // explicação mostrada no placar final
  artigo: string; // fundamento legal
};

export type Decisao = {
  id: string;
  secaoNumero: number; // qual seção do esqueleto esta decisão preenche
  pergunta: string;
  contexto?: string; // enquadramento curto acima da pergunta
  opcoes: OpcaoDecisao[]; // sempre 1 correta + 1 pegadinha (ordem embaralhada no runner)
};

// Uma seção do documento: ou é fixa (texto institucional padrão) ou é decidida
// pelo participante (aponta pra uma Decisao pelo id).
export type SecaoEsqueleto = {
  numero: number;
  titulo: string;
  textoFixo?: string; // preenchida automaticamente (não é decisão)
  decisaoId?: string; // preenchida pela escolha do participante
};

// ── Formato 2: Montar por blocos (quebra-cabeça de cláusulas) ────────────────
// Banco de cláusulas curtas: o participante escolhe quais ENTRAM no documento.
// Há intrusas (não pertencem) — e a nota conta também o que ficou de fora.
// `cartas` já vem na ordem de exibição (pré-embaralhada NA MÃO — nada de
// Math.random no render: evita mismatch de hidratação SSR/cliente).
export type CartaBloco = {
  id: string;
  texto: string;
  pertence: boolean;
  porque: string; // mostrado na correção (por que entra / por que não entra)
  artigo?: string;
};

// ── Formato 3: Caça ao erro ──────────────────────────────────────────────────
// Documento "pronto" com erros plantados em ALGUMAS seções. O participante
// marca as suspeitas; a correção separa achados, escapes e alarmes falsos.
export type SecaoCaca = {
  numero: number;
  titulo: string;
  texto: string;
  erro?: { porque: string; artigo: string }; // presente = seção errada
  notaLimpa?: string; // feedback quando marcam uma seção que está certa
};

// ── Formato 4: Ordenar as seções ─────────────────────────────────────────────
// A ordem correta é a ordem do array `itens`; `ordemInicial` é a permutação
// exibida no início (fixa, pela mesma razão anti-hidratação acima).
export type ItemOrdem = {
  id: string;
  rotulo: string;
  detalhe?: string;
};

// Formatos OPCIONAIS por documento (decisão pedagógica: cada documento ganha
// só os formatos onde aprende de verdade — nada de atividade-enchimento).
// Wizard ("montar decidindo") existe quando `decisoes` não está vazio.
export type MontadorDoc = {
  id: string;
  emoji: string;
  titulo: string;
  subtitulo: string;
  intro: string;
  esqueleto: SecaoEsqueleto[];
  decisoes: Decisao[]; // vazio = documento sem o formato "montar decidindo"
  disponivel: boolean; // false = aparece no hub como "em breve"
  blocos?: { instrucao: string; cartas: CartaBloco[] };
  cacaErro?: { contexto: string; instrucao: string; secoes: SecaoCaca[] };
  ordenar?: { instrucao: string; itens: ItemOrdem[]; ordemInicial: string[]; logica: string };
};

// Slugs de atividade ("" = o wizard "montar decidindo", na raiz do doc).
export type FormatoAtividade = "" | "blocos" | "erros" | "ordem";

// Quais formatos este documento oferece (na ordem canônica do cardápio).
export function formatosDoDoc(doc: MontadorDoc): FormatoAtividade[] {
  const f: FormatoAtividade[] = [];
  if (doc.decisoes.length > 0) f.push("");
  if (doc.blocos) f.push("blocos");
  if (doc.cacaErro) f.push("erros");
  if (doc.ordenar) f.push("ordem");
  return f;
}

// -----------------------------------------------------------------------------
// AVISO DE PRIVACIDADE
// -----------------------------------------------------------------------------
// 12 seções (template ANPD). 6 são DECISÕES (as 6 pegadinhas clássicas); as
// outras 6 vêm com texto institucional padrão (placeholders entre [colchetes],
// mesmo padrão das páginas-modelo do curso).

const AVISO_DECISOES: Decisao[] = [
  {
    id: "base-legal",
    secaoNumero: 4,
    contexto:
      "O cidadão precisa do atendimento no Posto de Saúde municipal. Ele pode mesmo RECUSAR o cadastro e ainda ser atendido?",
    pergunta: "Qual base legal o Aviso deve declarar?",
    opcoes: [
      {
        id: "correta",
        rotulo: "Execução de políticas públicas (art. 7º, III) e obrigação legal (art. 7º, II)",
        textoDoc:
          "O tratamento se dá com base na **execução de políticas públicas** " +
          "(art. 7º, III) e no **cumprimento de obrigação legal** (art. 7º, II) da " +
          "Lei nº 13.709/2018. Para dados sensíveis de saúde, aplica-se o art. 11, " +
          "II, alínea 'a' (tutela da saúde).",
        correta: true,
        porque:
          "No serviço público a regra NÃO é consentimento. O cidadão que precisa do " +
          "SUS não tem como recusar o cadastro — logo, não há livre manifestação. A " +
          "base correta é a execução de políticas públicas ou a obrigação legal.",
        artigo: "Art. 7º, II e III · Art. 11, II 'a'",
      },
      {
        id: "pegadinha",
        rotulo: "Consentimento do titular (art. 7º, I)",
        textoDoc:
          "O tratamento se dá mediante **consentimento do titular** (art. 7º, I da " +
          "Lei nº 13.709/2018).",
        correta: false,
        porque:
          "Erro clássico. Consentimento exige possibilidade REAL de recusa. Num " +
          "serviço público essencial isso não existe — usar consentimento aqui é " +
          "juridicamente frágil e cai na fiscalização da ANPD.",
        artigo: "Art. 7º, I (indevido) → correto: art. 7º, II/III",
      },
    ],
  },
  {
    id: "sensiveis",
    secaoNumero: 3,
    contexto:
      "O processo do Posto trata prontuário e dados de saúde — que são dados pessoais SENSÍVEIS.",
    pergunta: "Como o Aviso deve tratar isso na seção 'Quais dados tratamos'?",
    opcoes: [
      {
        id: "correta",
        rotulo: "Informar claramente que inclui dados pessoais sensíveis",
        textoDoc:
          "Tratamos dados de identificação, contato e atendimento — **incluindo " +
          "dados pessoais sensíveis** (dados de saúde), na medida necessária à " +
          "prestação do serviço.",
        correta: true,
        porque:
          "Transparência (art. 6º, VI) e o dever de informação sobre sensíveis " +
          "(art. 11) exigem que o titular SAIBA que dados sensíveis são tratados. " +
          "Silenciar isso é esconder o mais importante.",
        artigo: "Art. 5º, II · Art. 6º, VI · Art. 11",
      },
      {
        id: "pegadinha",
        rotulo: "Não destacar — dado é dado, evita assustar o cidadão",
        textoDoc:
          "Tratamos dados de identificação, contato e atendimento na medida " +
          "necessária à prestação do serviço.",
        correta: false,
        porque:
          "Omitir que há dados sensíveis viola a transparência. O titular tem " +
          "direito de saber justamente porque dado de saúde exige proteção reforçada.",
        artigo: "Art. 6º, VI · Art. 11 (omitido)",
      },
    ],
  },
  {
    id: "retencao",
    secaoNumero: 5,
    contexto:
      "O Inventário registra prazos específicos de guarda por finalidade (ex.: prontuário — 20 anos).",
    pergunta: "Como escrever 'por quanto tempo guardamos'?",
    opcoes: [
      {
        id: "correta",
        rotulo: "Prazo específico por finalidade",
        textoDoc:
          "Os dados são mantidos por **prazos específicos conforme a finalidade** e " +
          "a legislação aplicável (ex.: prontuários de saúde por 20 anos, conforme " +
          "normas do setor). Encerrado o prazo, os dados são eliminados ou anonimizados.",
        correta: true,
        porque:
          "A LGPD exige prazo CLARO e específico (art. 16). Prazo definido cumpre " +
          "transparência (art. 6º, VI) e necessidade (art. 6º, III).",
        artigo: "Art. 6º, III e VI · Art. 16",
      },
      {
        id: "pegadinha",
        rotulo: "'Pelo tempo necessário às finalidades'",
        textoDoc:
          "Os dados pessoais são mantidos **pelo tempo necessário** ao cumprimento " +
          "das finalidades para as quais foram coletados.",
        correta: false,
        porque:
          "Frase genérica que não diz nada ao titular. 'Pelo tempo necessário' é " +
          "vago — não cumpre transparência nem o princípio da necessidade.",
        artigo: "Art. 16 (descumprido)",
      },
    ],
  },
  {
    id: "linguagem",
    secaoNumero: 6,
    contexto:
      "O Aviso é lido pelo CIDADÃO comum, não por advogados.",
    pergunta: "Como escrever a seção 'Como protegemos seus dados'?",
    opcoes: [
      {
        id: "correta",
        rotulo: "Português claro e direto",
        textoDoc:
          "Protegemos seus dados com medidas como **controle de acesso, senhas, " +
          "backup e registro de quem acessa**. Só têm acesso os servidores que " +
          "precisam, para fazer seu trabalho.",
        correta: true,
        porque:
          "O princípio do livre acesso e da transparência (art. 6º, VI) exige " +
          "linguagem clara e ostensiva. Aviso bom é aquele que a sua mãe entende.",
        artigo: "Art. 6º, VI · Art. 9º",
      },
      {
        id: "pegadinha",
        rotulo: "Linguagem técnico-jurídica formal",
        textoDoc:
          "Outrossim, consoante o disposto no art. 46 da Lei nº 13.709/2018, mister " +
          "se faz consignar que esta instituição adota, mutatis mutandis, medidas " +
          "técnico-administrativas hábeis a obstaculizar acessos não consentâneos.",
        correta: false,
        porque:
          "'Outrossim', 'consoante', 'mutatis mutandis' afastam o cidadão da " +
          "informação. Juridiquês num Aviso é o oposto de transparência.",
        artigo: "Art. 6º, VI (violado)",
      },
    ],
  },
  {
    id: "transferencia",
    secaoNumero: 8,
    contexto:
      "Alguns sistemas usados são SaaS/cloud global (podem ter servidores fora do Brasil).",
    pergunta: "Antes de escrever sobre transferência internacional, o que fazer?",
    opcoes: [
      {
        id: "correta",
        rotulo: "Checar os operadores e sistemas antes de afirmar",
        textoDoc:
          "**Verificamos nossos operadores e sistemas.** Havendo transferência " +
          "internacional (ex.: serviços em nuvem com servidores no exterior), ela " +
          "observa as hipóteses do art. 33 e as regras da Resolução CD/ANPD nº 20/2024.",
        correta: true,
        porque:
          "Negar transferência sem checar os operadores é informar errado o titular. " +
          "Muito sistema SaaS guarda dados fora do BR sem a instituição perceber.",
        artigo: "Art. 33 · Res. CD/ANPD nº 20/2024",
      },
      {
        id: "pegadinha",
        rotulo: "Escrever direto que não fazemos — é o mais comum",
        textoDoc:
          "Não realizamos transferência internacional de dados pessoais.",
        correta: false,
        porque:
          "Afirmação cômoda e frequentemente falsa. Se um operador usa cloud global, " +
          "a transferência existe — negar sem checar é declaração incorreta.",
        artigo: "Art. 33 (afirmado sem verificar)",
      },
    ],
  },
  {
    id: "canal-dsr",
    secaoNumero: 11,
    contexto:
      "O titular precisa de um canal VIVO pra pedir acesso, correção ou exclusão dos dados.",
    pergunta: "Que canal o Aviso deve divulgar?",
    opcoes: [
      {
        id: "correta",
        rotulo: "O canal real e estruturado do Encarregado",
        textoDoc:
          "Para exercer seus direitos, procure o Encarregado (DPO) pelo canal " +
          "oficial: **[e-mail do Encarregado]** e o **formulário disponível em " +
          "[endereço do portal]**. Respondemos no prazo legal.",
        correta: true,
        porque:
          "O canal precisa estar VIVO, acessível e divulgado (art. 18, §6º). " +
          "Prometer um canal que não funciona é enganar o titular.",
        artigo: "Art. 18 · Art. 18, §6º · Art. 19, II",
      },
      {
        id: "pegadinha",
        rotulo: "Um e-mail genérico (dpo@orgao.gov.br)",
        textoDoc:
          "Para exercer seus direitos, envie e-mail para dpo@orgao.gov.br.",
        correta: false,
        porque:
          "E-mail genérico que ninguém lê não é canal. O titular precisa de um " +
          "contato real, monitorado, com prazo de resposta.",
        artigo: "Art. 18, §6º (não atendido)",
      },
    ],
  },
];

const AVISO: MontadorDoc = {
  id: "aviso-privacidade",
  emoji: "📄",
  titulo: "Aviso de Privacidade",
  subtitulo: "A síntese pública que o cidadão lê",
  intro:
    "Você vai montar o Aviso de Privacidade da instituição decidindo cada seção " +
    "importante. Em cada tela, escolha a opção correta — cuidado com as pegadinhas " +
    "clássicas! O Aviso vai se montando com as suas escolhas.",
  disponivel: true,
  decisoes: AVISO_DECISOES,
  esqueleto: [
    {
      numero: 1,
      titulo: "Quem somos",
      textoFixo:
        "[NOME DA INSTITUIÇÃO], inscrita no CNPJ [nº], com sede em [endereço], é a " +
        "controladora dos dados pessoais tratados neste serviço.",
    },
    {
      numero: 2,
      titulo: "Encarregado pelo tratamento de dados (DPO)",
      textoFixo:
        "Encarregado(a): [nome]. Contato: [e-mail] · [telefone]. Substituto(a): [nome].",
    },
    { numero: 3, titulo: "Quais dados tratamos e por quê", decisaoId: "sensiveis" },
    { numero: 4, titulo: "Base legal do tratamento", decisaoId: "base-legal" },
    { numero: 5, titulo: "Por quanto tempo guardamos seus dados", decisaoId: "retencao" },
    { numero: 6, titulo: "Como protegemos seus dados", decisaoId: "linguagem" },
    {
      numero: 7,
      titulo: "Com quem compartilhamos",
      textoFixo:
        "Compartilhamos dados apenas com órgãos e operadores necessários à " +
        "prestação do serviço, listados em [relação de operadores], sempre com " +
        "cláusulas de proteção de dados.",
    },
    { numero: 8, titulo: "Transferência internacional", decisaoId: "transferencia" },
    {
      numero: 9,
      titulo: "Cookies e tecnologias de rastreamento",
      textoFixo:
        "Nosso portal utiliza cookies para funcionamento e melhoria do serviço. " +
        "Detalhes na nossa Política de Cookies, em [endereço].",
    },
    {
      numero: 10,
      titulo: "Decisões automatizadas",
      textoFixo:
        "[Informe se há decisão tomada apenas por sistema automatizado. Havendo, o " +
        "titular pode solicitar revisão, conforme art. 20 da LGPD.]",
    },
    { numero: 11, titulo: "Como exercer seus direitos", decisaoId: "canal-dsr" },
    {
      numero: 12,
      titulo: "Atualizações deste Aviso",
      textoFixo:
        "Este Aviso pode ser atualizado. A data da última revisão e as alterações " +
        "ficam disponíveis em [endereço]. Última revisão: [data].",
    },
  ],

  // ── Formato 2: blocos (6 pertencem + 4 intrusas, ordem pré-embaralhada) ───
  blocos: {
    instrucao:
      "Toque nas cláusulas que DEVEM entrar no Aviso de Privacidade. Cuidado: " +
      "há cláusulas intrusas no meio — e deixar de fora uma cláusula necessária " +
      "também conta.",
    cartas: [
      {
        id: "b-consentimento-auto",
        texto:
          "Ao utilizar nossos serviços, você automaticamente consente com o " +
          "tratamento de todos os seus dados.",
        pertence: false,
        porque:
          "Consentimento 'automático' não existe — precisa ser livre, informado " +
          "e inequívoco. E no serviço público a base nem costuma ser consentimento.",
        artigo: "Art. 5º, XII · Art. 8º",
      },
      {
        id: "b-controlador",
        texto:
          "O [órgão] é o controlador dos seus dados pessoais e responde pelo " +
          "tratamento realizado.",
        pertence: true,
        porque: "Identificar o controlador é o ponto de partida da transparência.",
        artigo: "Art. 9º",
      },
      {
        id: "b-prazos",
        texto:
          "Guardamos cada dado por prazo definido, conforme a finalidade e a " +
          "legislação aplicável.",
        pertence: true,
        porque: "Prazo de guarda claro e específico é exigência de transparência.",
        artigo: "Art. 6º, VI · Art. 16",
      },
      {
        id: "b-senhas-internas",
        texto:
          "As senhas dos sistemas internos devem ter no mínimo 12 caracteres e " +
          "ser trocadas a cada 90 dias.",
        pertence: false,
        porque:
          "Regra INTERNA de segurança — pertence à Política de Proteção de Dados " +
          "(documento do servidor), não ao Aviso público lido pelo cidadão.",
      },
      {
        id: "b-dpo",
        texto: "O contato do Encarregado (DPO) é: [e-mail e telefone].",
        pertence: true,
        porque: "A identidade e o contato do Encarregado devem ser públicos.",
        artigo: "Art. 41, §1º",
      },
      {
        id: "b-marketing",
        texto:
          "Poderemos compartilhar seus dados com empresas parceiras para ofertas " +
          "e publicidade.",
        pertence: false,
        porque:
          "Desvio de finalidade: dado coletado pra prestar serviço público não " +
          "vira insumo de marketing. É a pegadinha clássica do Posto de Saúde.",
        artigo: "Art. 6º, I · Art. 7º",
      },
      {
        id: "b-dados-finalidade",
        texto:
          "Tratamos seus dados para prestar os serviços públicos — e informamos " +
          "claramente quando há dados sensíveis envolvidos.",
        pertence: true,
        porque: "Quais dados + pra quê + destaque aos sensíveis: o coração do Aviso.",
        artigo: "Art. 9º · Art. 11",
      },
      {
        id: "b-maximo-dados",
        texto:
          "Coletamos o máximo de dados possível para agilizar atendimentos futuros.",
        pertence: false,
        porque:
          "O princípio da necessidade manda o contrário: só o mínimo necessário " +
          "pra finalidade. 'Pedir logo tudo' é o hábito que a LGPD veio quebrar.",
        artigo: "Art. 6º, III",
      },
      {
        id: "b-direitos",
        texto:
          "Você pode pedir acesso, correção ou eliminação dos seus dados pelo " +
          "canal oficial do Encarregado.",
        pertence: true,
        porque: "Os direitos do titular e o canal pra exercê-los são obrigatórios.",
        artigo: "Art. 18",
      },
      {
        id: "b-atualizacoes",
        texto:
          "Este Aviso é atualizado periodicamente e a versão vigente fica " +
          "disponível no portal.",
        pertence: true,
        porque: "O titular precisa saber onde acompanhar mudanças no Aviso.",
        artigo: "Art. 6º, VI",
      },
    ],
  },

  // ── Formato 3: caça ao erro (documento da Prefeitura de Vegas, 4 erros) ───
  cacaErro: {
    contexto:
      "A Prefeitura de Vegas publicou este Aviso de Privacidade no portal. " +
      "Parece pronto… mas tem 4 erros clássicos escondidos.",
    instrucao:
      "Leia cada seção e toque nas que estão ERRADAS (🚩). Depois confira — " +
      "marcar seção certa conta como alarme falso.",
    secoes: [
      {
        numero: 1,
        titulo: "Quem somos",
        texto:
          "A Prefeitura Municipal de Vegas, CNPJ 12.345.678/0001-90, com sede na " +
          "Av. Central, 100, é a controladora dos dados pessoais tratados nos " +
          "serviços municipais.",
        notaLimpa: "Controlador identificado com clareza — exatamente o que o art. 9º pede.",
      },
      {
        numero: 2,
        titulo: "Encarregado (DPO)",
        texto:
          "Encarregada: Ana Prado — encarregado@vegas.gov.br · (00) 3333-0000. " +
          "Substituto: Bruno Lima.",
        notaLimpa: "Contato completo do Encarregado, com substituto — correto.",
      },
      {
        numero: 3,
        titulo: "Quais dados tratamos e por quê",
        texto:
          "Tratamos dados de identificação, contato e atendimento — incluindo " +
          "dados pessoais sensíveis (saúde) no Posto Municipal — na medida " +
          "necessária a cada serviço.",
        notaLimpa:
          "Os dados sensíveis estão INFORMADOS, não silenciados — esta seção está certa.",
      },
      {
        numero: 4,
        titulo: "Base legal do tratamento",
        texto:
          "Todos os tratamentos são realizados mediante consentimento do titular " +
          "(art. 7º, I da LGPD), colhido no momento do atendimento.",
        erro: {
          porque:
            "Serviço público essencial não usa consentimento como base — o cidadão " +
            "não tem como recusar e continuar atendido. O correto: execução de " +
            "políticas públicas ou obrigação legal.",
          artigo: "Art. 7º, II e III · Art. 11, II 'a'",
        },
      },
      {
        numero: 5,
        titulo: "Por quanto tempo guardamos",
        texto:
          "Os dados são mantidos pelo tempo necessário ao cumprimento das " +
          "finalidades para as quais foram coletados.",
        erro: {
          porque:
            "'Pelo tempo necessário' é vago — a LGPD exige prazo claro e " +
            "específico por finalidade (ex.: prontuário, 20 anos).",
          artigo: "Art. 6º, III e VI · Art. 16",
        },
      },
      {
        numero: 6,
        titulo: "Como protegemos seus dados",
        texto:
          "Outrossim, consoante o disposto no art. 46, mister se faz consignar " +
          "que esta municipalidade adota, mutatis mutandis, medidas hábeis a " +
          "obstaculizar acessos não consentâneos aos dados sub examine.",
        erro: {
          porque:
            "Juridiquês. O Aviso é lido pelo cidadão comum — transparência exige " +
            "linguagem clara, adequada e ostensiva. 'Sua mãe entenderia?'",
          artigo: "Art. 6º, VI · Art. 9º",
        },
      },
      {
        numero: 7,
        titulo: "Com quem compartilhamos",
        texto:
          "Compartilhamos dados apenas com órgãos e operadores necessários à " +
          "prestação de cada serviço, sempre com cláusulas de proteção de dados.",
        notaLimpa: "Compartilhamento limitado ao necessário, com salvaguardas — correto.",
      },
      {
        numero: 8,
        titulo: "Transferência internacional",
        texto:
          "Verificamos nossos operadores e sistemas; havendo serviço em nuvem com " +
          "servidores no exterior, a transferência observa o art. 33 da LGPD e a " +
          "Resolução CD/ANPD nº 20/2024.",
        notaLimpa:
          "Aqui NÃO está o erro clássico ('não realizamos') — a Prefeitura checou " +
          "antes de afirmar. Correto.",
      },
      {
        numero: 9,
        titulo: "Cookies",
        texto:
          "O portal usa cookies essenciais e de medição de audiência. Detalhes e " +
          "opções na Política de Cookies.",
        notaLimpa: "Cookies informados com link pra política própria — adequado.",
      },
      {
        numero: 10,
        titulo: "Decisões automatizadas",
        texto:
          "Não tomamos decisões unicamente automatizadas. Se isso mudar, o titular " +
          "poderá solicitar revisão, conforme o art. 20 da LGPD.",
        notaLimpa: "Transparente e com a garantia do art. 20 — correto.",
      },
      {
        numero: 11,
        titulo: "Como exercer seus direitos",
        texto: "Para exercer seus direitos, envie e-mail para dpo@vegas.gov.br.",
        erro: {
          porque:
            "Canal genérico e solto: não diz prazo, não oferece alternativa " +
            "(formulário/telefone) e nem bate com o e-mail real do Encarregado da " +
            "seção 2. Canal precisa estar vivo, estruturado e divulgado.",
          artigo: "Art. 18, §6º · Art. 19, II",
        },
      },
      {
        numero: 12,
        titulo: "Atualizações deste Aviso",
        texto:
          "Última revisão: janeiro de 2026. A versão vigente fica publicada no " +
          "portal da Prefeitura.",
        notaLimpa: "Data e local de publicação informados — correto.",
      },
    ],
  },

  // ── Formato 4: ordenar (8 seções-chave; ordem correta = ordem abaixo) ─────
  ordenar: {
    instrucao:
      "Monte a espinha do Aviso: coloque as 8 seções na ordem em que devem " +
      "aparecer no documento.",
    itens: [
      { id: "o-quem", rotulo: "Quem somos", detalhe: "o órgão controlador se apresenta" },
      { id: "o-dpo", rotulo: "Encarregado (DPO)", detalhe: "a quem o titular recorre" },
      { id: "o-dados", rotulo: "Quais dados tratamos e por quê", detalhe: "o coração do Aviso" },
      { id: "o-base", rotulo: "Base legal do tratamento", detalhe: "o fundamento jurídico" },
      { id: "o-prazo", rotulo: "Por quanto tempo guardamos", detalhe: "retenção com prazo claro" },
      { id: "o-compart", rotulo: "Com quem compartilhamos", detalhe: "destinatários e salvaguardas" },
      { id: "o-direitos", rotulo: "Como exercer seus direitos", detalhe: "canal do titular" },
      { id: "o-atualiza", rotulo: "Atualizações do Aviso", detalhe: "onde acompanhar mudanças" },
    ],
    ordemInicial: [
      "o-base", "o-direitos", "o-quem", "o-prazo",
      "o-dados", "o-atualiza", "o-dpo", "o-compart",
    ],
    logica:
      "A narrativa do Aviso: o órgão se APRESENTA (quem somos, DPO) → diz O QUE " +
      "faz com os dados e POR QUÊ → FUNDAMENTA (base legal) → detalha prazos e " +
      "compartilhamentos → devolve o CONTROLE ao titular (direitos) → e fecha " +
      "dizendo onde acompanhar mudanças.",
  },
};

// -----------------------------------------------------------------------------
// POLÍTICA DE PROTEÇÃO DE DADOS (interna)
// -----------------------------------------------------------------------------
// Documento INTERNO: regras de conduta pro servidor. As 6 decisões são as
// pegadinhas de comportamento mais comuns no setor público (não de redação
// pro cidadão, como no Aviso).

const POLITICA_DECISOES: Decisao[] = [
  {
    id: "responsabilidade",
    secaoNumero: 3,
    contexto:
      "Na reunião, alguém diz: 'isso de LGPD é coisa do pessoal da informática'.",
    pergunta: "De quem é a responsabilidade pela proteção de dados?",
    opcoes: [
      {
        id: "correta",
        rotulo: "De TODOS os servidores que tratam dados, cada um no seu papel",
        textoDoc:
          "A proteção de dados pessoais é **dever de todos os agentes públicos** " +
          "desta instituição, em qualquer área que trate dados — da recepção à " +
          "direção. O Encarregado (DPO) orienta e acompanha; a TI provê os meios " +
          "técnicos; **cada servidor responde pelo que trata**.",
        correta: true,
        porque:
          "A LGPD não é 'assunto da TI': quem coleta, consulta, imprime e " +
          "compartilha dados no dia-a-dia é o servidor de cada área. A segurança " +
          "técnica ajuda, mas o vazamento mais comum é humano (papel esquecido, " +
          "tela aberta, conversa de corredor).",
        artigo: "Art. 46 · Art. 41 (papel do Encarregado)",
      },
      {
        id: "pegadinha",
        rotulo: "Da TI e do Encarregado — cada um cuida da sua especialidade",
        textoDoc:
          "A proteção de dados pessoais é responsabilidade da área de Tecnologia " +
          "da Informação e do Encarregado (DPO), que dispõem dos meios técnicos " +
          "para garantir a segurança das informações.",
        correta: false,
        porque:
          "Pegadinha clássica do setor público. Se só a TI 'cuida', o servidor se " +
          "sente autorizado a não mudar hábito nenhum — e os incidentes mais " +
          "frequentes nascem justamente do uso cotidiano, não da infraestrutura.",
        artigo: "Art. 46 (responsabilidade de quem trata)",
      },
    ],
  },
  {
    id: "minimizacao",
    secaoNumero: 4,
    contexto:
      "Um setor vai criar um formulário novo de atendimento e sugere: 'pede logo tudo — CPF, RG, filiação, religião — aí não precisa pedir de novo depois'.",
    pergunta: "Qual regra de coleta a Política deve fixar?",
    opcoes: [
      {
        id: "correta",
        rotulo: "Coletar SÓ o necessário pra finalidade do serviço",
        textoDoc:
          "A coleta de dados pessoais limita-se ao **mínimo necessário** para a " +
          "finalidade do serviço (princípio da necessidade). Formulários novos " +
          "devem justificar **cada campo**; dado que não tem finalidade declarada " +
          "não é coletado.",
        correta: true,
        porque:
          "Princípio da necessidade (art. 6º, III): tratamento limitado ao mínimo " +
          "necessário. Cada dado a mais é um risco a mais guardado — e dado " +
          "sensível (como religião) sem finalidade é ilegal, não só desnecessário.",
        artigo: "Art. 6º, III · Art. 11",
      },
      {
        id: "pegadinha",
        rotulo: "Coletar o máximo possível pra evitar retrabalho",
        textoDoc:
          "Os formulários de atendimento devem contemplar o conjunto mais amplo " +
          "possível de dados do cidadão, evitando novas solicitações futuras e " +
          "garantindo agilidade no atendimento.",
        correta: false,
        porque:
          "'Pede logo tudo' é o hábito que a LGPD veio quebrar. Dado coletado sem " +
          "finalidade é passivo: precisa ser protegido, tem prazo, gera risco de " +
          "vazamento — e coletar religião 'de brinde' viola o art. 11.",
        artigo: "Art. 6º, III (violado)",
      },
    ],
  },
  {
    id: "acesso-interno",
    secaoNumero: 5,
    contexto:
      "Um colega de OUTRO setor pede acesso ao sistema de atendimento 'pra dar uma olhada num cadastro'. Afinal, 'aqui é tudo público mesmo'.",
    pergunta: "Como a Política deve regular o acesso interno?",
    opcoes: [
      {
        id: "correta",
        rotulo: "Cada servidor acessa apenas o que precisa pro seu trabalho",
        textoDoc:
          "O acesso a dados pessoais segue a regra da **necessidade de conhecer**: " +
          "cada servidor acessa somente os dados indispensáveis às suas " +
          "atribuições. Perfis de acesso são revisados periodicamente e o acesso " +
          "é **registrado** (trilha de auditoria).",
        correta: true,
        porque:
          "Transparência pública (LAI) vale pra atos da administração — NÃO " +
          "transforma dado pessoal do cidadão em informação livre. Dentro do " +
          "órgão, vale o need-to-know: acesso além da atribuição é tratamento " +
          "irregular.",
        artigo: "Art. 46 · Art. 6º, VII e VIII",
      },
      {
        id: "pegadinha",
        rotulo: "Servidor público pode consultar — a informação é pública",
        textoDoc:
          "Por se tratar de instituição pública, os servidores têm acesso amplo " +
          "aos sistemas internos, prestigiando o princípio da publicidade e a " +
          "colaboração entre os setores.",
        correta: false,
        porque:
          "Confunde LAI com LGPD. Publicidade é dos ATOS públicos; o dado pessoal " +
          "do cidadão continua protegido. 'Dar uma olhada' em cadastro sem " +
          "atribuição é o começo de muito incidente (e de muita sindicância).",
        artigo: "Art. 46 (violado) · LAI ≠ LGPD",
      },
    ],
  },
  {
    id: "canais",
    secaoNumero: 6,
    contexto:
      "Fim de expediente, o relatório não terminou. Dá vontade de copiar a planilha com os dados no pendrive — ou mandar pro WhatsApp — e terminar em casa.",
    pergunta: "O que a Política deve dizer sobre isso?",
    opcoes: [
      {
        id: "correta",
        rotulo: "Só canais e equipamentos institucionais autorizados",
        textoDoc:
          "Dados pessoais trafegam **apenas pelos canais e equipamentos " +
          "institucionais** (rede, e-mail funcional, sistemas oficiais). É vedado " +
          "copiar dados para dispositivos pessoais, e-mail particular ou " +
          "aplicativos de mensagem **sem autorização formal** e salvaguardas " +
          "definidas pela TI.",
        correta: true,
        porque:
          "Pendrive perdido e grupo de WhatsApp são dois campeões de incidente. " +
          "Fora do ambiente institucional não há controle de acesso, backup nem " +
          "trilha — se vazar, o órgão responde (art. 46) e nem fica sabendo.",
        artigo: "Art. 46 · Art. 47",
      },
      {
        id: "pegadinha",
        rotulo: "Pode, desde que o servidor se comprometa a apagar depois",
        textoDoc:
          "O servidor pode transportar dados em dispositivos pessoais para " +
          "conclusão de trabalho remoto, comprometendo-se a excluí-los após o " +
          "uso.",
        correta: false,
        porque:
          "'Prometo que apago' não é salvaguarda. O celular pessoal é roubado, o " +
          "pendrive fica no bolso da calça, o arquivo vai pro backup automático da " +
          "nuvem pessoal — e o dado do cidadão foi junto.",
        artigo: "Art. 46/47 (sem salvaguarda)",
      },
    ],
  },
  {
    id: "incidente",
    secaoNumero: 7,
    contexto:
      "Um servidor percebe que mandou a planilha com CPFs pro destinatário ERRADO. Primeiro impulso: apagar e ficar quieto 'pra não virar alarde'.",
    pergunta: "O que a Política deve mandar fazer?",
    opcoes: [
      {
        id: "correta",
        rotulo: "Comunicar IMEDIATAMENTE o Encarregado (DPO)",
        textoDoc:
          "Todo servidor que identificar (ou suspeitar de) incidente com dados " +
          "pessoais deve **comunicar imediatamente o Encarregado**, pelo canal " +
          "definido no Plano de Resposta a Incidentes. **Comunicar não é " +
          "confissão de culpa** — é o que permite conter o dano a tempo.",
        correta: true,
        porque:
          "A ANPD tem prazo de comunicação (3 dias úteis, Res. CD/ANPD nº " +
          "15/2024) que só começa a correr direito se o Encarregado souber NA " +
          "HORA. Esconder transforma um erro contornável em infração grave.",
        artigo: "Art. 48 · Res. CD/ANPD nº 15/2024",
      },
      {
        id: "pegadinha",
        rotulo: "Tentar resolver discretamente na própria área primeiro",
        textoDoc:
          "Constatado o envio indevido, a própria área deve providenciar a " +
          "exclusão das mensagens e a regularização, evitando tumulto " +
          "desnecessário; persistindo o problema, comunica-se a chefia.",
        correta: false,
        porque:
          "O 'resolver na surdina' queima o prazo legal de comunicação à ANPD e " +
          "impede a contenção (o destinatário errado ainda está com o arquivo!). " +
          "Quando o incidente aparece — e aparece —, a omissão agrava tudo.",
        artigo: "Art. 48 (prazo perdido)",
      },
    ],
  },
  {
    id: "descarte",
    secaoNumero: 8,
    contexto:
      "A sala do arquivo vai ser esvaziada. Tem caixa de formulário antigo com CPF, endereço, dados de saúde… indo pro lixo comum.",
    pergunta: "Como a Política deve tratar o descarte?",
    opcoes: [
      {
        id: "correta",
        rotulo: "Descarte seguro: triturar papel e eliminar mídia de forma definitiva",
        textoDoc:
          "Encerrado o prazo de guarda, documentos físicos com dados pessoais são " +
          "**triturados** (ou descartados por processo equivalente) e mídias " +
          "digitais passam por **eliminação definitiva** — não basta 'excluir' ou " +
          "formatar. O descarte observa a tabela de temporalidade do órgão.",
        correta: true,
        porque:
          "O fim do tratamento também é tratamento (art. 15/16): eliminar é dever " +
          "quando a finalidade acaba. Papel no lixo comum é vazamento de custo " +
          "zero pra quem cata — e a 'lixeira do Windows' não elimina nada.",
        artigo: "Art. 15 · Art. 16 · Art. 46",
      },
      {
        id: "pegadinha",
        rotulo: "Papel usado vai pro lixo/reciclagem — arquivo digital, é só deletar",
        textoDoc:
          "Documentos sem uso corrente podem ser encaminhados à coleta comum ou " +
          "reciclagem; arquivos digitais desnecessários devem ser excluídos pelos " +
          "próprios usuários.",
        correta: false,
        porque:
          "Formulário com CPF no lixo comum é dado pessoal disponível na calçada. " +
          "E 'deletar' não elimina: o arquivo continua recuperável. Descarte sem " +
          "método é incidente anunciado.",
        artigo: "Art. 16 (eliminação) descumprido",
      },
    ],
  },
];

const POLITICA: MontadorDoc = {
  id: "politica-protecao-dados",
  emoji: "🛡️",
  titulo: "Política de Proteção de Dados",
  subtitulo: "As regras internas pro servidor seguir",
  intro:
    "Agora o documento é INTERNO: as regras que valem pra todo servidor da " +
    "instituição. Em cada tela, escolha a regra certa — as pegadinhas aqui são " +
    "os maus hábitos mais comuns do dia-a-dia do serviço público.",
  disponivel: true,
  decisoes: POLITICA_DECISOES,
  esqueleto: [
    {
      numero: 1,
      titulo: "Objetivo e abrangência",
      textoFixo:
        "Esta Política estabelece as diretrizes de proteção de dados pessoais no " +
        "âmbito de [NOME DA INSTITUIÇÃO], aplicando-se a todos os servidores, " +
        "estagiários, terceirizados e colaboradores que tratem dados pessoais em " +
        "razão de suas atividades.",
    },
    {
      numero: 2,
      titulo: "Definições",
      textoFixo:
        "Aplicam-se as definições do art. 5º da Lei nº 13.709/2018 (LGPD): dado " +
        "pessoal, dado pessoal sensível, tratamento, controlador, operador, " +
        "encarregado, entre outras.",
    },
    { numero: 3, titulo: "Responsabilidades", decisaoId: "responsabilidade" },
    { numero: 4, titulo: "Coleta e uso de dados", decisaoId: "minimizacao" },
    { numero: 5, titulo: "Acesso às informações", decisaoId: "acesso-interno" },
    { numero: 6, titulo: "Canais e equipamentos", decisaoId: "canais" },
    { numero: 7, titulo: "Incidentes com dados pessoais", decisaoId: "incidente" },
    { numero: 8, titulo: "Guarda e descarte", decisaoId: "descarte" },
    {
      numero: 9,
      titulo: "Capacitação",
      textoFixo:
        "A instituição promove capacitação periódica em proteção de dados para " +
        "todos os servidores, com apoio do Encarregado (DPO).",
    },
    {
      numero: 10,
      titulo: "Descumprimento",
      textoFixo:
        "O descumprimento desta Política sujeita o agente às medidas " +
        "administrativas e disciplinares cabíveis, sem prejuízo das " +
        "responsabilidades civis e penais.",
    },
    {
      numero: 11,
      titulo: "Vigência e revisão",
      textoFixo:
        "Esta Política entra em vigor na data de sua publicação e é revisada a " +
        "cada [periodicidade] ou quando houver mudança relevante. Última revisão: " +
        "[data].",
    },
  ],

  // ── Formato 2: blocos (6 pertencem + 4 intrusas, ordem pré-embaralhada) ───
  blocos: {
    instrucao:
      "Toque nas regras que DEVEM entrar na Política de Proteção de Dados " +
      "(documento INTERNO, pro servidor). Cuidado com as intrusas — e regra boa " +
      "esquecida de fora também conta.",
    cartas: [
      {
        id: "b-acesso-amplo",
        texto:
          "Por se tratar de órgão público, todos os servidores têm acesso amplo " +
          "aos sistemas internos.",
        pertence: false,
        porque:
          "Confunde LAI com LGPD: publicidade vale pros ATOS públicos, não pro " +
          "dado pessoal do cidadão. A regra interna é o need-to-know.",
        artigo: "Art. 46",
      },
      {
        id: "b-dever-todos",
        texto:
          "Proteger dados pessoais é dever de todo servidor, em qualquer área — " +
          "não é assunto só da TI.",
        pertence: true,
        porque: "O incidente mais comum é humano; a responsabilidade é de quem trata.",
        artigo: "Art. 46",
      },
      {
        id: "b-minimo",
        texto:
          "Formulários novos devem justificar cada dado coletado — só o mínimo " +
          "necessário à finalidade.",
        pertence: true,
        porque: "Princípio da necessidade na prática do dia-a-dia.",
        artigo: "Art. 6º, III",
      },
      {
        id: "b-explica-cidadao",
        texto:
          "Este documento explica ao CIDADÃO, em linguagem simples, como o órgão " +
          "trata os dados dele.",
        pertence: false,
        porque:
          "Essa é a função do AVISO DE PRIVACIDADE (documento público). A " +
          "Política é interna: regras de conduta pro servidor. Dois documentos, " +
          "dois públicos.",
        artigo: "Art. 9º (Aviso) × Art. 46 (Política)",
      },
      {
        id: "b-need-to-know",
        texto:
          "Cada servidor acessa somente os dados necessários às suas atribuições, " +
          "com acesso registrado.",
        pertence: true,
        porque: "Need-to-know + trilha de auditoria: o par que evita o 'dar uma olhada'.",
        artigo: "Art. 46 · Art. 6º, VII e VIII",
      },
      {
        id: "b-incidente-discreto",
        texto:
          "Incidentes devem ser resolvidos discretamente pela própria área, " +
          "evitando alarde desnecessário.",
        pertence: false,
        porque:
          "Resolver 'na surdina' queima o prazo de comunicação à ANPD (3 dias " +
          "úteis) e impede a contenção. Incidente se comunica IMEDIATAMENTE ao DPO.",
        artigo: "Art. 48 · Res. CD/ANPD nº 15/2024",
      },
      {
        id: "b-canais",
        texto:
          "Dados pessoais trafegam apenas por canais e equipamentos " +
          "institucionais autorizados.",
        pertence: true,
        porque: "Fora do ambiente institucional não há controle, backup nem trilha.",
        artigo: "Art. 46 · Art. 47",
      },
      {
        id: "b-pendrive",
        texto:
          "O servidor pode copiar dados pro pendrive pessoal, desde que se " +
          "comprometa a apagar depois.",
        pertence: false,
        porque:
          "'Prometo que apago' não é salvaguarda — pendrive perdido é campeão de " +
          "incidente. Trabalho remoto usa canal institucional autorizado.",
        artigo: "Art. 46/47",
      },
      {
        id: "b-comunicar-dpo",
        texto:
          "Suspeitou de incidente com dados? Comunique imediatamente o " +
          "Encarregado (DPO) — comunicar não é confissão de culpa.",
        pertence: true,
        porque: "Comunicação imediata é o que permite conter o dano e cumprir prazos.",
        artigo: "Art. 48",
      },
      {
        id: "b-descarte",
        texto:
          "No descarte, papel com dados pessoais é triturado e mídia digital " +
          "passa por eliminação definitiva.",
        pertence: true,
        porque: "O fim do tratamento também é tratamento — descarte sem método é vazamento.",
        artigo: "Art. 15 · Art. 16",
      },
    ],
  },

  // ── Formato 3: caça ao erro (Política da Prefeitura de Vegas, 4 erros) ────
  cacaErro: {
    contexto:
      "A Prefeitura de Vegas aprovou esta Política de Proteção de Dados pros " +
      "servidores. Tem 4 regras erradas escondidas no meio das certas.",
    instrucao:
      "Leia cada seção e toque nas que estão ERRADAS (🚩). Depois confira — " +
      "marcar seção certa conta como alarme falso.",
    secoes: [
      {
        numero: 1,
        titulo: "Objetivo e abrangência",
        texto:
          "Esta Política estabelece as diretrizes de proteção de dados pessoais " +
          "na Prefeitura de Vegas e se aplica a servidores, estagiários e " +
          "terceirizados que tratem dados pessoais.",
        notaLimpa: "Escopo claro, alcançando todo mundo que trata dados — correto.",
      },
      {
        numero: 2,
        titulo: "Definições",
        texto:
          "Aplicam-se as definições do art. 5º da LGPD: dado pessoal, dado " +
          "sensível, tratamento, controlador, operador e encarregado.",
        notaLimpa: "Ancorar as definições no art. 5º é a prática correta.",
      },
      {
        numero: 3,
        titulo: "Responsabilidades",
        texto:
          "A proteção de dados pessoais é responsabilidade da Diretoria de " +
          "Tecnologia da Informação e do Encarregado, que dispõem dos meios " +
          "técnicos adequados.",
        erro: {
          porque:
            "'LGPD é assunto da TI' é a pegadinha clássica. Quem coleta, consulta " +
            "e imprime dados é o servidor de cada área — a responsabilidade é de " +
            "TODOS, cada um no seu papel.",
          artigo: "Art. 46 · Art. 41",
        },
      },
      {
        numero: 4,
        titulo: "Coleta e uso de dados",
        texto:
          "A coleta limita-se ao mínimo necessário pra finalidade de cada " +
          "serviço; formulários novos justificam cada campo solicitado.",
        notaLimpa: "Minimização aplicada na prática — esta seção está certa.",
      },
      {
        numero: 5,
        titulo: "Acesso às informações",
        texto:
          "Prestigiando o princípio da publicidade, os servidores têm acesso " +
          "amplo aos sistemas, favorecendo a colaboração entre os setores.",
        erro: {
          porque:
            "Publicidade (LAI) vale pros atos da administração — não libera dado " +
            "pessoal do cidadão pra 'dar uma olhada'. A regra é need-to-know com " +
            "acesso registrado.",
          artigo: "Art. 46 (LAI ≠ LGPD)",
        },
      },
      {
        numero: 6,
        titulo: "Canais e equipamentos",
        texto:
          "Para concluir trabalho em casa, o servidor pode copiar dados pra " +
          "dispositivos pessoais, comprometendo-se a excluí-los após o uso.",
        erro: {
          porque:
            "'Prometo que apago' não é salvaguarda: o pendrive some, o arquivo " +
            "sobe pro backup da nuvem pessoal. Dados trafegam só por canais " +
            "institucionais autorizados.",
          artigo: "Art. 46 · Art. 47",
        },
      },
      {
        numero: 7,
        titulo: "Incidentes com dados pessoais",
        texto:
          "Todo servidor que identificar ou suspeitar de incidente deve comunicar " +
          "imediatamente o Encarregado (DPO). Comunicar não é confissão de culpa.",
        notaLimpa:
          "Comunicação imediata ao DPO é exatamente a regra certa (prazo ANPD: 3 " +
          "dias úteis).",
      },
      {
        numero: 8,
        titulo: "Guarda e descarte",
        texto:
          "Documentos sem uso corrente podem ir pra coleta comum ou reciclagem; " +
          "arquivos digitais desnecessários são excluídos pelos próprios usuários.",
        erro: {
          porque:
            "Papel com CPF no lixo comum é vazamento de custo zero — e 'deletar' " +
            "não elimina. Descarte seguro: triturar papel e eliminação definitiva " +
            "de mídia.",
          artigo: "Art. 15 · Art. 16",
        },
      },
      {
        numero: 9,
        titulo: "Capacitação",
        texto:
          "A Prefeitura promove capacitação periódica em proteção de dados, com " +
          "apoio do Encarregado.",
        notaLimpa: "Capacitação contínua — correto.",
      },
      {
        numero: 10,
        titulo: "Descumprimento",
        texto:
          "O descumprimento sujeita o agente às medidas administrativas e " +
          "disciplinares cabíveis.",
        notaLimpa: "Consequência disciplinar prevista — correto.",
      },
      {
        numero: 11,
        titulo: "Vigência e revisão",
        texto:
          "Esta Política vigora a partir da publicação e é revisada anualmente " +
          "ou quando houver mudança relevante.",
        notaLimpa: "Revisão periódica definida — correto.",
      },
    ],
  },

  // ── Formato 4: ordenar (8 seções-chave; ordem correta = ordem abaixo) ─────
  ordenar: {
    instrucao:
      "Monte a espinha da Política: coloque as 8 seções na ordem em que devem " +
      "aparecer no documento.",
    itens: [
      { id: "p-objetivo", rotulo: "Objetivo e abrangência", detalhe: "pra que serve e quem alcança" },
      { id: "p-resp", rotulo: "Responsabilidades", detalhe: "dever de todos, papéis do DPO e da TI" },
      { id: "p-coleta", rotulo: "Coleta e uso de dados", detalhe: "mínimo necessário" },
      { id: "p-acesso", rotulo: "Acesso às informações", detalhe: "need-to-know + registro" },
      { id: "p-canais", rotulo: "Canais e equipamentos", detalhe: "só os institucionais" },
      { id: "p-incidentes", rotulo: "Incidentes", detalhe: "comunicar o DPO imediatamente" },
      { id: "p-descarte", rotulo: "Guarda e descarte", detalhe: "triturar / eliminação definitiva" },
      { id: "p-sancao", rotulo: "Descumprimento e vigência", detalhe: "consequências e revisão" },
    ],
    ordemInicial: [
      "p-incidentes", "p-coleta", "p-sancao", "p-resp",
      "p-descarte", "p-objetivo", "p-canais", "p-acesso",
    ],
    logica:
      "A Política segue o CICLO DE VIDA do dado dentro do órgão: primeiro o " +
      "geral (objetivo, quem responde) → depois o dado entra (coleta) → circula " +
      "(acesso, canais) → dá problema (incidente) → e sai (descarte). Fecha com " +
      "enforcement: o que acontece com quem descumpre.",
  },
};

// -----------------------------------------------------------------------------
// RIPD — Relatório de Impacto (decidir + caça ao erro)
// -----------------------------------------------------------------------------
// Seções = as 8 oficiais do módulo RIPD do curso (lib/ripd-secoes.ts).
// "Ordenar as 8 seções" já existe no Modo Atividade — aqui não duplica.

const RIPD: MontadorDoc = {
  id: "ripd",
  emoji: "📋",
  titulo: "RIPD — Relatório de Impacto",
  subtitulo: "O documento que a ANPD pede no alto risco",
  intro:
    "Quando o tratamento é de ALTO RISCO (lembra da regra 1+1? um critério " +
    "geral + um específico), nasce a obrigação de fazer o RIPD — sem esperar a " +
    "ANPD pedir. Monte um RIPD de verdade decidindo as seções críticas: a " +
    "diferença entre um relatório útil e um 'RIPD de fachada'.",
  disponivel: true,
  decisoes: [
    {
      id: "descricao",
      secaoNumero: 2,
      contexto:
        "O RIPD é do prontuário eletrônico do Posto de Saúde — dados sensíveis de milhares de pacientes.",
      pergunta: "Como descrever o tratamento?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Fluxo completo: o que coleta, onde guarda, quem acessa, quando descarta",
          textoDoc:
            "O sistema coleta **identificação, contato e dados de saúde** dos " +
            "pacientes no atendimento; armazena em servidor [local/nuvem]; " +
            "acessam profissionais de saúde autorizados; envia ao e-SUS " +
            "(Ministério da Saúde); descarta conforme prazo de guarda de " +
            "prontuário (20 anos).",
          correta: true,
          porque:
            "Sem descrever o fluxo real (coleta → uso → guarda → compartilhamento " +
            "→ descarte), não dá pra enxergar onde mora o risco. Descrição boa é " +
            "mapa, não resumo.",
          artigo: "Art. 38, § único",
        },
        {
          id: "pegadinha",
          rotulo: "Descrição resumida — 'diversos dados para finalidades administrativas'",
          textoDoc:
            "O sistema trata diversos dados pessoais para finalidades " +
            "administrativas e de gestão da unidade de saúde.",
          correta: false,
          porque:
            "Descrição genérica esconde exatamente o que o RIPD existe pra " +
            "mostrar. 'Diversos dados' num posto de saúde = dados sensíveis — e " +
            "isso precisa estar dito.",
          artigo: "Art. 38, § único (descumprido)",
        },
      ],
    },
    {
      id: "necessidade",
      secaoNumero: 3,
      pergunta: "Como justificar a necessidade e proporcionalidade?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Justificar POR QUE cada categoria de dado é necessária à finalidade",
          textoDoc:
            "Cada categoria de dado se justifica pela finalidade assistencial: " +
            "identificação (vincular o prontuário ao paciente certo), dados " +
            "clínicos (continuidade do cuidado), contato (resultados e " +
            "remarcações). **Dados sem vínculo com a finalidade não são coletados.**",
          correta: true,
          porque:
            "Proporcionalidade se demonstra dado a dado. Se alguma categoria não " +
            "se justifica, o RIPD é o momento de cortá-la.",
          artigo: "Art. 6º, III",
        },
        {
          id: "pegadinha",
          rotulo: "'Todos os dados coletados podem ser úteis no futuro'",
          textoDoc:
            "A coleta ampla se justifica pela possibilidade de uso futuro dos " +
            "dados em novas políticas de saúde e projetos da gestão.",
          correta: false,
          porque:
            "'Pode ser útil no futuro' é o oposto de necessidade — finalidade tem " +
            "que ser determinada ANTES da coleta, não descoberta depois.",
          artigo: "Art. 6º, I e III",
        },
      ],
    },
    {
      id: "riscos",
      secaoNumero: 4,
      contexto: "A parte mais importante — e a mais maquiada nos RIPDs de fachada.",
      pergunta: "Como registrar a análise de riscos?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Riscos CONCRETOS, com probabilidade × impacto",
          textoDoc:
            "Riscos identificados: **acesso indevido ao prontuário** por servidor " +
            "sem atribuição (probabilidade média × impacto alto = ALTO); " +
            "**vazamento em compartilhamento** com sistemas externos (média × " +
            "alto = ALTO); **perda de disponibilidade** em falha do servidor " +
            "(baixa × médio = MÉDIO). Cada risco liga a uma medida da seção 5.",
          correta: true,
          porque:
            "Risco de verdade tem nome, cenário e severidade (a matriz 3×3 que " +
            "você já usou na Fase 3). É isso que a seção 4 existe pra mostrar.",
          artigo: "Art. 38 · matriz P×I da Fase 3",
        },
        {
          id: "pegadinha",
          rotulo: "'Não foram identificados riscos relevantes'",
          textoDoc:
            "Após análise criteriosa, não foram identificados riscos relevantes " +
            "aos direitos e liberdades dos titulares.",
          correta: false,
          porque:
            "Prontuário de milhares de pacientes SEM risco relevante? Isso é o " +
            "atestado do RIPD de fachada — feito pra constar, não pra proteger. " +
            "Alto risco foi justamente o motivo de o RIPD existir.",
          artigo: "Art. 38 (esvaziado)",
        },
      ],
    },
    {
      id: "medidas",
      secaoNumero: 5,
      pergunta: "Como registrar as medidas e salvaguardas?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Uma medida específica PRA CADA risco, com responsável",
          textoDoc:
            "Para o acesso indevido: **perfis por função + trilha de auditoria** " +
            "(responsável: TI, prazo 60 dias). Para o vazamento em " +
            "compartilhamento: **cláusulas LGPD e criptografia no envio** " +
            "(responsável: TI + Jurídico). Para a indisponibilidade: **backup " +
            "diário testado** (responsável: TI).",
          correta: true,
          porque:
            "Medida boa espelha o risco da seção 4, com dono e prazo. Sem isso, o " +
            "RIPD não vira plano — vira promessa.",
          artigo: "Art. 46 · Art. 38",
        },
        {
          id: "pegadinha",
          rotulo: "'Adotamos as melhores práticas de mercado'",
          textoDoc:
            "A instituição adota as melhores práticas de mercado em segurança da " +
            "informação, garantindo a proteção integral dos dados.",
          correta: false,
          porque:
            "Frase que serve pra qualquer órgão do país = frase que não diz nada. " +
            "'Melhores práticas' sem dizer QUAIS, pra QUAL risco e de QUEM é a " +
            "tarefa não protege ninguém.",
          artigo: "Art. 46 (vago)",
        },
      ],
    },
    {
      id: "conclusao",
      secaoNumero: 8,
      pergunta: "Como fechar a conclusão do RIPD?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Veredito honesto do risco residual + o que ainda falta",
          textoDoc:
            "Com as medidas implantadas, o risco residual é **MÉDIO e aceitável " +
            "temporariamente**, condicionado ao cumprimento do plano (60-90 " +
            "dias). Reavaliação após a implantação e a cada mudança relevante no " +
            "tratamento.",
          correta: true,
          porque:
            "A conclusão honesta admite o que falta e agenda a reavaliação. RIPD " +
            "é fotografia + compromisso, não certificado de perfeição.",
          artigo: "Art. 38",
        },
        {
          id: "pegadinha",
          rotulo: "'Conclui-se que o tratamento está plenamente em conformidade'",
          textoDoc:
            "Conclui-se que o tratamento encontra-se plenamente em conformidade " +
            "com a LGPD, nada havendo a providenciar.",
          correta: false,
          porque:
            "Conclusão-carimbo. Se nada há a providenciar, por que o tratamento é " +
            "de alto risco? Fiscalização lê essa frase como confissão de que o " +
            "RIPD foi feito pra constar.",
          artigo: "Art. 38 (esvaziado)",
        },
      ],
    },
  ],
  esqueleto: [
    {
      numero: 1,
      titulo: "Identificação do agente de tratamento e Encarregado",
      textoFixo:
        "Controlador: [NOME DA INSTITUIÇÃO], CNPJ [nº]. Encarregado(a): [nome], " +
        "[e-mail e telefone]. Elaborado com participação do Encarregado e das " +
        "áreas envolvidas.",
    },
    { numero: 2, titulo: "Descrição do tratamento", decisaoId: "descricao" },
    { numero: 3, titulo: "Necessidade e proporcionalidade", decisaoId: "necessidade" },
    {
      numero: 4,
      titulo: "Análise de riscos aos direitos e liberdades dos titulares",
      decisaoId: "riscos",
    },
    { numero: 5, titulo: "Medidas e salvaguardas", decisaoId: "medidas" },
    {
      numero: 6,
      titulo: "Direitos dos titulares — exercício efetivo",
      textoFixo:
        "O titular exerce seus direitos pelo canal do Encarregado ([e-mail/" +
        "formulário]), com resposta no prazo legal. Este tratamento não impõe " +
        "barreiras ao exercício de direitos.",
    },
    {
      numero: 7,
      titulo: "Compartilhamentos e transferências internacionais",
      textoFixo:
        "Compartilhamentos: [listar — ex.: e-SUS/Ministério da Saúde, por " +
        "obrigação legal]. Transferência internacional: verificada junto aos " +
        "operadores; havendo, observa o art. 33.",
    },
    { numero: 8, titulo: "Conclusão — risco residual aceitável?", decisaoId: "conclusao" },
  ],
  cacaErro: {
    contexto:
      "A Prefeitura de Vegas 'concluiu' o RIPD do prontuário eletrônico do " +
      "Posto de Saúde. Cheiro de RIPD de fachada no ar: 4 erros escondidos.",
    instrucao:
      "Leia cada seção e toque nas que estão ERRADAS (🚩). Dica: procure " +
      "contradições entre as seções.",
    secoes: [
      {
        numero: 1,
        titulo: "Identificação",
        texto:
          "Controlador: Prefeitura Municipal de Vegas. Encarregada: Ana Prado " +
          "(encarregado@vegas.gov.br). Elaborado pela Secretaria de Saúde com " +
          "participação da Encarregada.",
        notaLimpa: "Identificação completa, com o Encarregado participando — correto.",
      },
      {
        numero: 2,
        titulo: "Descrição do tratamento",
        texto:
          "O sistema de prontuário eletrônico trata diversos dados pessoais " +
          "para finalidades administrativas e de gestão da unidade.",
        erro: {
          porque:
            "Descrição genérica que esconde o essencial: são dados SENSÍVEIS de " +
            "saúde, de milhares de pacientes, com envio ao e-SUS. O RIPD existe " +
            "pra mostrar o fluxo — não pra resumi-lo até sumir.",
          artigo: "Art. 38, § único",
        },
      },
      {
        numero: 3,
        titulo: "Necessidade e proporcionalidade",
        texto:
          "Cada categoria se justifica pela finalidade assistencial: " +
          "identificação (prontuário correto), dados clínicos (continuidade do " +
          "cuidado), contato (remarcações). O envio ao e-SUS decorre de " +
          "obrigação legal.",
        notaLimpa: "Justificativa dado a dado, com base legal do envio — correto.",
      },
      {
        numero: 4,
        titulo: "Análise de riscos",
        texto:
          "Após análise criteriosa, não foram identificados riscos relevantes " +
          "aos direitos e liberdades dos titulares.",
        erro: {
          porque:
            "Prontuário de milhares de pacientes 'sem riscos relevantes' é o " +
            "selo do RIPD de fachada. Se não houvesse risco, não haveria RIPD — " +
            "alto risco é o pressuposto do documento.",
          artigo: "Art. 38",
        },
      },
      {
        numero: 5,
        titulo: "Medidas e salvaguardas",
        texto:
          "A instituição adota as melhores práticas de mercado em segurança da " +
          "informação, garantindo proteção integral aos dados tratados.",
        erro: {
          porque:
            "'Melhores práticas de mercado' sem dizer quais, pra qual risco e " +
            "com que responsável é frase de encher página. Medida sem dono e " +
            "sem prazo não sai do papel.",
          artigo: "Art. 46 (vago)",
        },
      },
      {
        numero: 6,
        titulo: "Direitos dos titulares",
        texto:
          "O paciente exerce seus direitos pelo canal da Encarregada " +
          "(encarregado@vegas.gov.br), com resposta em até 15 dias úteis.",
        notaLimpa: "Canal real + prazo — exercício efetivo garantido. Correto.",
      },
      {
        numero: 7,
        titulo: "Compartilhamentos e transferências",
        texto:
          "O tratamento não envolve compartilhamento de dados com nenhum " +
          "órgão ou entidade externa.",
        erro: {
          porque:
            "Contradição interna: a seção 3 diz que há envio ao e-SUS " +
            "(Ministério da Saúde)! Negar compartilhamento sem checar — ou pra " +
            "'simplificar' — torna o RIPD todo suspeito.",
          artigo: "Art. 38 · Art. 33 (não verificado)",
        },
      },
      {
        numero: 8,
        titulo: "Conclusão",
        texto:
          "O risco residual é MÉDIO e aceitável temporariamente, condicionado " +
          "ao plano de medidas (60-90 dias), com reavaliação após a implantação.",
        notaLimpa:
          "Conclusão honesta: admite risco residual e agenda reavaliação — é " +
          "assim que se fecha um RIPD de verdade.",
      },
    ],
  },
};

// -----------------------------------------------------------------------------
// PRI — Plano de Resposta a Incidentes (decidir + ordenar)
// -----------------------------------------------------------------------------
// Seções = as 8 oficiais do módulo PRI do curso (lib/pri-secoes.ts).

const PRI: MontadorDoc = {
  id: "pri",
  emoji: "🚨",
  titulo: "PRI — Plano de Resposta a Incidentes",
  subtitulo: "O plano pro dia em que dá errado",
  intro:
    "Incidente com dados pessoais não é 'se' — é 'quando'. O PRI é o plano que " +
    "a instituição segue no dia do caos: quem faz o quê, em que ordem, e os " +
    "prazos que não podem estourar. Monte o seu decidindo as seções críticas.",
  disponivel: true,
  decisoes: [
    {
      id: "severidade",
      secaoNumero: 3,
      pergunta: "Como classificar a severidade dos incidentes?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Por dados afetados, volume e impacto ao titular",
          textoDoc:
            "Incidentes são classificados por **tipo de dado** (sensível pesa " +
            "mais), **volume de titulares** e **impacto potencial** (dano " +
            "material, discriminação, fraude). Faixas: BAIXA · MÉDIA · ALTA · " +
            "CRÍTICA — a faixa define quem aciona e os prazos.",
          correta: true,
          porque:
            "É a severidade que decide se a ANPD e os titulares serão " +
            "comunicados. Sem régua clara, na hora do sufoco cada um mede de um " +
            "jeito.",
          artigo: "Art. 48, §1º · Res. CD/ANPD nº 15/2024",
        },
        {
          id: "pegadinha",
          rotulo: "Tratar todo incidente do mesmo jeito, por precaução",
          textoDoc:
            "Todo incidente, independentemente de natureza ou volume, seguirá o " +
            "mesmo fluxo completo de resposta.",
          correta: false,
          porque:
            "Parece prudente, mas trava a resposta: o pendrive com 3 cadastros e " +
            "o vazamento de 50 mil prontuários não podem disputar a mesma fila. " +
            "Sem triagem, o grave espera o trivial.",
          artigo: "Res. CD/ANPD nº 15/2024 (risco relevante)",
        },
      ],
    },
    {
      id: "deteccao",
      secaoNumero: 4,
      contexto: "Um servidor percebeu algo estranho. E agora?",
      pergunta: "Como funciona a detecção e notificação interna?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Qualquer servidor comunica o Encarregado IMEDIATAMENTE, por canal direto",
          textoDoc:
            "**Qualquer servidor** que identificar ou suspeitar de incidente " +
            "comunica **imediatamente o Encarregado** pelo canal direto " +
            "[telefone/e-mail do plantão]. Comunicar não é confissão de culpa — " +
            "o relógio dos prazos legais começa a correr na ciência do fato.",
          correta: true,
          porque:
            "O prazo de 3 dias úteis pra ANPD só é cumprível se o DPO souber NA " +
            "HORA. Canal direto e cultura de 'comunicar sem medo' são o coração " +
            "do plano.",
          artigo: "Art. 48 · Res. CD/ANPD nº 15/2024",
        },
        {
          id: "pegadinha",
          rotulo: "Abrir chamado comum de TI e aguardar a triagem",
          textoDoc:
            "Suspeitas de incidente devem ser registradas no sistema de chamados " +
            "de TI, que fará a triagem conforme a fila de atendimento semanal.",
          correta: false,
          porque:
            "Na fila semanal de chamados, o prazo da ANPD morre antes da " +
            "triagem. Incidente de dados não é impressora quebrada.",
          artigo: "Art. 48 (prazo inviabilizado)",
        },
      ],
    },
    {
      id: "contencao",
      secaoNumero: 5,
      contexto: "O vazamento está acontecendo AGORA.",
      pergunta: "Qual a regra de contenção?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Conter isolando e revogando acessos — PRESERVANDO evidências",
          textoDoc:
            "Contenção imediata: **isolar** o sistema afetado, **revogar** " +
            "credenciais comprometidas, **bloquear** o canal de vazamento — " +
            "sempre **preservando evidências** (logs, imagens de disco) pra " +
            "investigação e prestação de contas.",
          correta: true,
          porque:
            "Conter sem destruir evidência. Os logs são a prova do que houve, do " +
            "alcance e da diligência da instituição — a ANPD vai perguntar.",
          artigo: "Art. 48, §2º · Art. 46",
        },
        {
          id: "pegadinha",
          rotulo: "Desligar e formatar tudo imediatamente",
          textoDoc:
            "Constatado o incidente, os equipamentos envolvidos devem ser " +
            "imediatamente desligados e formatados, eliminando o vetor de ataque.",
          correta: false,
          porque:
            "Formatar = destruir a prova. Sem logs não dá pra saber o que vazou, " +
            "de quem, nem demonstrar diligência à ANPD — o remédio vira segundo " +
            "incidente.",
          artigo: "Art. 48, §2º (prestação de contas impossível)",
        },
      ],
    },
    {
      id: "comunicacao",
      secaoNumero: 6,
      pergunta: "Quando comunicar a ANPD e os titulares?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Risco relevante → ANPD em 3 dias úteis + titulares em linguagem clara",
          textoDoc:
            "Incidente com **risco ou dano relevante** aos titulares: comunicar " +
            "a **ANPD em até 3 dias úteis** da ciência (Res. CD/ANPD nº 15/2024) " +
            "e os **titulares afetados** em linguagem clara — o que houve, quais " +
            "dados, o que a instituição está fazendo e o que o titular pode fazer.",
          correta: true,
          porque:
            "O prazo corre da CIÊNCIA do incidente, não da conclusão da " +
            "investigação. Comunica-se o que se sabe, complementa-se depois.",
          artigo: "Art. 48 · Res. CD/ANPD nº 15/2024",
        },
        {
          id: "pegadinha",
          rotulo: "Comunicar apenas se o caso chegar à imprensa",
          textoDoc:
            "A comunicação externa será avaliada caso o incidente ganhe " +
            "repercussão pública, preservando-se a imagem institucional.",
          correta: false,
          porque:
            "Esconder até a imprensa descobrir transforma infração sanável em " +
            "agravante. A obrigação nasce do risco ao TITULAR, não da manchete.",
          artigo: "Art. 48 (descumprido)",
        },
      ],
    },
    {
      id: "registro",
      secaoNumero: 7,
      pergunta: "O que registrar?",
      opcoes: [
        {
          id: "correta",
          rotulo: "TODOS os incidentes — até os que não exigem comunicação",
          textoDoc:
            "**Todo incidente é registrado** (data, natureza, dados afetados, " +
            "medidas, desfecho), inclusive os de baixa severidade que não exigem " +
            "comunicação à ANPD. O registro fica com o Encarregado por, no " +
            "mínimo, 5 anos.",
          correta: true,
          porque:
            "O registro interno é obrigatório MESMO quando a comunicação não é. " +
            "É ele que mostra padrões (o mesmo erro 3 vezes = problema " +
            "sistêmico) e prova diligência.",
          artigo: "Res. CD/ANPD nº 15/2024, art. 5º · Art. 37",
        },
        {
          id: "pegadinha",
          rotulo: "Registrar só os incidentes graves",
          textoDoc:
            "Serão documentados os incidentes classificados como graves; os " +
            "demais serão tratados informalmente pelas áreas.",
          correta: false,
          porque:
            "Os 'pequenos' incidentes informais são o ensaio geral do grande. " +
            "Sem registro, ninguém vê o padrão — e a ANPD pode pedir o registro " +
            "de QUALQUER incidente.",
          artigo: "Res. CD/ANPD nº 15/2024 (registro obrigatório)",
        },
      ],
    },
  ],
  esqueleto: [
    {
      numero: 1,
      titulo: "Objetivo, escopo e base legal",
      textoFixo:
        "Este Plano define a resposta de [NOME DA INSTITUIÇÃO] a incidentes de " +
        "segurança com dados pessoais, em cumprimento aos arts. 46 a 48 da LGPD " +
        "e à Resolução CD/ANPD nº 15/2024.",
    },
    {
      numero: 2,
      titulo: "Equipe de Resposta a Incidentes (ETIR)",
      textoFixo:
        "Composição: Encarregado (coordenação) + TI + Jurídico/Procuradoria + " +
        "Comunicação + gestor da área afetada. Acionamento em até 4 horas da " +
        "notificação interna. Contatos no Anexo [X].",
    },
    { numero: 3, titulo: "Classificação de severidade", decisaoId: "severidade" },
    { numero: 4, titulo: "Detecção e notificação interna", decisaoId: "deteccao" },
    { numero: 5, titulo: "Contenção, erradicação e recuperação", decisaoId: "contencao" },
    { numero: 6, titulo: "Comunicação à ANPD e aos titulares", decisaoId: "comunicacao" },
    { numero: 7, titulo: "Registro e documentação do incidente", decisaoId: "registro" },
    {
      numero: 8,
      titulo: "Lições aprendidas e melhoria contínua",
      textoFixo:
        "Após cada incidente ALTA/CRÍTICA: reunião de lições aprendidas em até " +
        "15 dias, revisão das medidas e atualização deste Plano. Revisão geral " +
        "anual.",
    },
  ],
  ordenar: {
    instrucao:
      "O vazamento aconteceu. Coloque os 8 passos da resposta na ordem certa — " +
      "na crise, a ordem é metade do plano.",
    itens: [
      { id: "pr-detectar", rotulo: "Detectar a suspeita", detalhe: "algo estranho aconteceu" },
      { id: "pr-dpo", rotulo: "Comunicar imediatamente o Encarregado", detalhe: "o relógio legal começa a correr" },
      { id: "pr-conter", rotulo: "Conter o dano", detalhe: "isolar, revogar acessos — preservando evidências" },
      { id: "pr-avaliar", rotulo: "Avaliar severidade e afetados", detalhe: "quais dados, quantos titulares" },
      { id: "pr-anpd", rotulo: "Comunicar a ANPD em até 3 dias úteis", detalhe: "se houver risco relevante" },
      { id: "pr-titulares", rotulo: "Comunicar os titulares afetados", detalhe: "linguagem clara, sem juridiquês" },
      { id: "pr-erradicar", rotulo: "Erradicar a causa e recuperar", detalhe: "corrigir, restaurar do backup" },
      { id: "pr-registrar", rotulo: "Registrar tudo e extrair lições", detalhe: "relatório + melhoria do plano" },
    ],
    ordemInicial: [
      "pr-anpd", "pr-titulares", "pr-detectar", "pr-registrar",
      "pr-conter", "pr-avaliar", "pr-dpo", "pr-erradicar",
    ],
    logica:
      "Primeiro ESTANCAR (DPO avisado + contenção), depois MEDIR (severidade), " +
      "depois COMUNICAR quem precisa saber dentro do prazo — e só então " +
      "reconstruir e aprender. Repare: a comunicação NÃO espera a solução " +
      "completa; o prazo da ANPD corre desde a ciência do incidente.",
  },
};

// -----------------------------------------------------------------------------
// CLÁUSULAS LGPD COM OPERADORES (blocos + caça ao erro)
// -----------------------------------------------------------------------------

const CLAUSULAS: MontadorDoc = {
  id: "clausulas-operadores",
  emoji: "🤝",
  titulo: "Cláusulas LGPD com Operadores",
  subtitulo: "O contrato com quem trata dados em seu nome",
  intro: "",
  disponivel: true,
  decisoes: [],
  esqueleto: [],
  blocos: {
    instrucao:
      "A Prefeitura vai contratar uma empresa que tratará dados pessoais em " +
      "nome dela (um operador). Toque nas cláusulas que DEVEM entrar no " +
      "contrato — e deixe as intrusas de fora.",
    cartas: [
      {
        id: "cl-uso-proprio",
        texto:
          "A contratada poderá utilizar os dados para aprimorar seus próprios " +
          "produtos e serviços.",
        pertence: false,
        porque:
          "Operador trata dados SÓ conforme as instruções do controlador. Usar " +
          "pra fim próprio é desvio — nesse momento a empresa vira controladora " +
          "irregular.",
        artigo: "Art. 39 · Art. 42",
      },
      {
        id: "cl-instrucoes",
        texto:
          "A contratada tratará os dados exclusivamente conforme as instruções " +
          "e finalidades definidas pelo órgão contratante.",
        pertence: true,
        porque: "A cláusula-mãe da relação controlador × operador.",
        artigo: "Art. 39",
      },
      {
        id: "cl-incidente-prazo",
        texto:
          "A contratada comunicará ao órgão qualquer incidente com dados em até " +
          "24 horas da ciência.",
        pertence: true,
        porque:
          "O prazo da ANPD (3 dias úteis) é do CONTROLADOR — se o operador " +
          "demorar a avisar, o órgão estoura o prazo sem nem saber do incidente.",
        artigo: "Art. 48 · Res. CD/ANPD nº 15/2024",
      },
      {
        id: "cl-isencao",
        texto:
          "O órgão contratante fica isento de qualquer responsabilidade por " +
          "incidentes causados pela contratada.",
        pertence: false,
        porque:
          "Cláusula de enfeite: perante a LGPD e o titular, a responsabilidade " +
          "não se transfere por contrato. O controlador responde — o contrato " +
          "regula o regresso, não apaga o dever.",
        artigo: "Art. 42",
      },
      {
        id: "cl-seguranca",
        texto:
          "A contratada manterá medidas de segurança técnicas e administrativas " +
          "compatíveis com o art. 46 da LGPD, detalhadas no anexo técnico.",
        pertence: true,
        porque: "Segurança com referência concreta (anexo), não promessa genérica.",
        artigo: "Art. 46 · Art. 47",
      },
      {
        id: "cl-subcontratar",
        texto:
          "A contratada poderá subcontratar terceiros para o tratamento, sem " +
          "necessidade de comunicação ao órgão.",
        pertence: false,
        porque:
          "Subcontratação às cegas: o dado do cidadão passa de mão em mão sem o " +
          "controlador saber quem trata. Suboperador exige anuência e as mesmas " +
          "obrigações.",
        artigo: "Art. 39 (cadeia de tratamento)",
      },
      {
        id: "cl-confidencialidade",
        texto:
          "A equipe da contratada com acesso aos dados assinará termo de " +
          "confidencialidade e será treinada em proteção de dados.",
        pertence: true,
        porque: "Pessoas, não só sistemas: quem toca no dado assume o dever.",
        artigo: "Art. 46",
      },
      {
        id: "cl-retencao-eterna",
        texto:
          "Encerrado o contrato, a contratada poderá manter cópia dos dados por " +
          "prazo indeterminado, para fins de backup.",
        pertence: false,
        porque:
          "'Backup eterno' = tratamento sem fim após o término. Fim de contrato " +
          "= devolver e eliminar, com comprovação. Exceção só por obrigação " +
          "legal, com prazo.",
        artigo: "Art. 15 · Art. 16",
      },
      {
        id: "cl-devolucao",
        texto:
          "Ao término do contrato, a contratada devolverá os dados e eliminará " +
          "as cópias, comprovando a eliminação por escrito.",
        pertence: true,
        porque: "O ciclo fecha com comprovação — não com confiança.",
        artigo: "Art. 16",
      },
      {
        id: "cl-auditoria",
        texto:
          "O órgão poderá auditar o cumprimento destas cláusulas, mediante " +
          "aviso prévio razoável.",
        pertence: true,
        porque: "Confiar é bom; poder verificar é cláusula.",
        artigo: "Art. 39 (instruções verificáveis)",
      },
    ],
  },
  cacaErro: {
    contexto:
      "Chegou a minuta do contrato do OuviTech (sistema de ouvidoria em nuvem) " +
      "pra Prefeitura de Vegas assinar. O jurídico do fornecedor caprichou… nos " +
      "interesses do fornecedor. 4 cláusulas erradas.",
    instrucao: "Toque nas cláusulas que NÃO podem ser assinadas como estão (🚩).",
    secoes: [
      {
        numero: 1,
        titulo: "Cláusula 1ª — Objeto e instruções",
        texto:
          "O OuviTech tratará os dados pessoais exclusivamente para operar a " +
          "ouvidoria municipal, conforme as instruções documentadas da " +
          "Prefeitura.",
        notaLimpa: "Operador seguindo instruções do controlador — a base certa.",
      },
      {
        numero: 2,
        titulo: "Cláusula 2ª — Finalidades",
        texto:
          "O OuviTech poderá ajustar as finalidades de tratamento conforme sua " +
          "conveniência técnica e evolução do produto.",
        erro: {
          porque:
            "Quem define finalidade é o CONTROLADOR (a Prefeitura). Operador que " +
            "'ajusta finalidades' virou controlador sem mandato — e o dado do " +
            "cidadão foi junto.",
          artigo: "Art. 39 · Art. 5º, VI e VII",
        },
      },
      {
        numero: 3,
        titulo: "Cláusula 3ª — Segurança",
        texto:
          "O OuviTech manterá criptografia em trânsito e em repouso, controle " +
          "de acesso por perfil e registro de logs, conforme anexo técnico.",
        notaLimpa: "Medidas concretas e verificáveis — cláusula boa.",
      },
      {
        numero: 4,
        titulo: "Cláusula 4ª — Incidentes",
        texto:
          "Eventuais incidentes de segurança serão comunicados à Prefeitura em " +
          "até 30 dias, após conclusão da apuração interna do OuviTech.",
        erro: {
          porque:
            "Em 30 dias o prazo da Prefeitura com a ANPD (3 dias úteis!) morreu " +
            "dez vezes. O operador avisa PRIMEIRO (24-48h), apura-se junto — " +
            "comunicação não espera a apuração terminar.",
          artigo: "Art. 48 · Res. CD/ANPD nº 15/2024",
        },
      },
      {
        numero: 5,
        titulo: "Cláusula 5ª — Subcontratação",
        texto:
          "O OuviTech poderá contratar terceiros de sua confiança para etapas " +
          "do processamento, dispensada comunicação à Prefeitura.",
        erro: {
          porque:
            "Suboperador sem anuência = a Prefeitura não sabe QUEM trata o dado " +
            "do cidadão, nem ONDE (cloud de quem?). Cadeia de tratamento exige " +
            "transparência e as mesmas obrigações contratuais.",
          artigo: "Art. 39",
        },
      },
      {
        numero: 6,
        titulo: "Cláusula 6ª — Confidencialidade",
        texto:
          "A equipe do OuviTech com acesso aos dados firma termo de " +
          "confidencialidade, mantido mesmo após o desligamento do empregado.",
        notaLimpa: "Confidencialidade que sobrevive ao vínculo — correto.",
      },
      {
        numero: 7,
        titulo: "Cláusula 7ª — Término do contrato",
        texto:
          "Encerrado o contrato, o OuviTech manterá os dados arquivados por " +
          "prazo indeterminado, como cortesia de backup à Administração.",
        erro: {
          porque:
            "'Cortesia' que é tratamento sem base legal após o fim do contrato. " +
            "Término = devolução + eliminação comprovada; guarda além disso só " +
            "por obrigação legal, com prazo determinado.",
          artigo: "Art. 15 · Art. 16",
        },
      },
      {
        numero: 8,
        titulo: "Cláusula 8ª — Auditoria",
        texto:
          "A Prefeitura poderá verificar o cumprimento das obrigações de " +
          "proteção de dados, mediante aviso prévio de 10 dias.",
        notaLimpa: "Direito de auditar preservado — correto.",
      },
    ],
  },
};

// -----------------------------------------------------------------------------
// TERMO DE CONSENTIMENTO (decidir + caça ao erro)
// -----------------------------------------------------------------------------

const CONSENTIMENTO: MontadorDoc = {
  id: "termo-consentimento",
  emoji: "✍️",
  titulo: "Termo de Consentimento",
  subtitulo: "Quando (e como) pedir o sim do titular",
  intro:
    "O documento mais usado ERRADO do Brasil. No setor público, consentimento " +
    "é a exceção — a maior lição deste termo é saber QUANDO ele cabe. E quando " +
    "cabe, precisa ser livre, informado, específico e revogável. Monte um " +
    "termo válido decidindo cada ponto.",
  disponivel: true,
  decisoes: [
    {
      id: "quando",
      secaoNumero: 1,
      contexto:
        "A escola municipal quer divulgar fotos dos alunos nas redes sociais oficiais.",
      pergunta: "Cabe consentimento aqui?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Sim — divulgação de fotos é opcional, há escolha REAL",
          textoDoc:
            "Este termo aplica-se **exclusivamente à divulgação de imagens** do " +
            "aluno nas redes oficiais da escola — atividade **opcional**, sem " +
            "qualquer efeito sobre a matrícula ou o acesso ao ensino. Para os " +
            "serviços essenciais, a base legal é a execução de políticas " +
            "públicas (art. 7º, III), que não depende de consentimento.",
          correta: true,
          porque:
            "Consentimento cabe quando o titular pode dizer NÃO sem perder o " +
            "serviço. Divulgar foto é opcional; matricular e ensinar, não — cada " +
            "coisa com sua base.",
          artigo: "Art. 5º, XII · Art. 7º, I e III",
        },
        {
          id: "pegadinha",
          rotulo: "Pedir consentimento pra TUDO, por segurança jurídica",
          textoDoc:
            "Este termo autoriza o tratamento de todos os dados do aluno para " +
            "matrícula, ensino, merenda, transporte e divulgação institucional.",
          correta: false,
          porque:
            "Consentimento desnecessário é fragilidade, não segurança: se a base " +
            "da matrícula fosse consentimento, o pai poderia revogar — e aí? " +
            "Cancela a matrícula? Base errada quebra o serviço.",
          artigo: "Art. 7º, III (base correta ignorada)",
        },
      ],
    },
    {
      id: "finalidade",
      secaoNumero: 3,
      pergunta: "Como descrever a finalidade?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Específica: o quê, onde e até quando",
          textoDoc:
            "Finalidade: divulgação de **fotos de eventos escolares** (festas, " +
            "feiras, formaturas) **nas redes oficiais da escola** [@perfis], " +
            "durante o ano letivo de [ano]. Qualquer outro uso exigirá novo " +
            "consentimento.",
          correta: true,
          porque:
            "Consentimento vale pra finalidade DETERMINADA. 'Pra este fim, neste " +
            "canal, até esta data' — fora disso, pede-se de novo.",
          artigo: "Art. 8º, §4º",
        },
        {
          id: "pegadinha",
          rotulo: "Ampla: 'finalidades institucionais presentes e futuras'",
          textoDoc:
            "As imagens poderão ser utilizadas para quaisquer finalidades " +
            "institucionais, presentes e futuras, a critério da administração.",
          correta: false,
          porque:
            "Autorização genérica é NULA por definição legal — o §4º do art. 8º " +
            "diz isso com todas as letras.",
          artigo: "Art. 8º, §4º (nulidade)",
        },
      ],
    },
    {
      id: "forma",
      secaoNumero: 4,
      pergunta: "Como colher a manifestação?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Ato ATIVO e destacado — assinatura própria só pra isso",
          textoDoc:
            "A autorização é colhida em **campo próprio e destacado**, com " +
            "assinatura específica — **separada** dos documentos de matrícula. A " +
            "ausência de assinatura significa NÃO, sem qualquer prejuízo ao aluno.",
          correta: true,
          porque:
            "Manifestação livre e INEQUÍVOCA: o sim precisa ser um ato, não um " +
            "silêncio nem uma carona na matrícula. Cláusula destacada é " +
            "exigência literal da lei.",
          artigo: "Art. 8º, §1º · Art. 5º, XII",
        },
        {
          id: "pegadinha",
          rotulo: "Embutir na matrícula: 'ao assinar, o responsável já autoriza'",
          textoDoc:
            "Ao assinar o requerimento de matrícula, o responsável autoriza " +
            "automaticamente o uso das imagens do aluno.",
          correta: false,
          porque:
            "O 'casadinho': pra matricular (obrigatório) o pai 'aceita' a foto " +
            "(opcional). Consentimento pego no embrulho não é livre — é pedágio.",
          artigo: "Art. 8º, §3º (vício de consentimento)",
        },
      ],
    },
    {
      id: "revogacao",
      secaoNumero: 5,
      pergunta: "E se o responsável mudar de ideia?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Revogável a qualquer tempo, por procedimento gratuito e simples",
          textoDoc:
            "O responsável pode **revogar esta autorização a qualquer tempo**, " +
            "por pedido simples e gratuito na secretaria ou pelo e-mail " +
            "[contato]. Revogada, a escola deixa de publicar novas imagens e " +
            "remove as publicações indicadas, no prazo de [X] dias.",
          correta: true,
          porque:
            "Revogação é direito expresso — e precisa ser tão fácil quanto foi " +
            "consentir. Termo sem porta de saída não é consentimento, é armadilha.",
          artigo: "Art. 8º, §5º · Art. 18, IX",
        },
        {
          id: "pegadinha",
          rotulo: "Irrevogável durante o ano letivo",
          textoDoc:
            "Esta autorização é válida e irrevogável durante todo o ano letivo, " +
            "dada a natureza do planejamento pedagógico.",
          correta: false,
          porque:
            "Consentimento irrevogável não existe na LGPD — a revogação 'a " +
            "qualquer momento' é da essência do instituto.",
          artigo: "Art. 8º, §5º (violado)",
        },
      ],
    },
    {
      id: "crianca",
      secaoNumero: 6,
      contexto: "Os titulares das fotos são crianças e adolescentes.",
      pergunta: "Quem consente?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Pelo menos UM dos pais ou o responsável legal, de forma específica",
          textoDoc:
            "Tratando-se de criança, o consentimento é dado de forma " +
            "**específica e em destaque por pelo menos um dos pais ou " +
            "responsável legal** (art. 14, §1º). O melhor interesse da criança " +
            "prevalece sobre qualquer conveniência de divulgação.",
          correta: true,
          porque:
            "Dado de criança tem regime reforçado: consentimento específico e " +
            "destacado do responsável, sempre no melhor interesse dela.",
          artigo: "Art. 14, §1º",
        },
        {
          id: "pegadinha",
          rotulo: "O próprio aluno, se tiver mais de 12 anos",
          textoDoc:
            "Alunos maiores de 12 anos poderão autorizar diretamente o uso de " +
            "sua imagem, dispensada a manifestação dos pais.",
          correta: false,
          porque:
            "A LGPD exige consentimento do responsável pra CRIANÇA (até 12). Pra " +
            "adolescente, o regime segue protetivo — 'dispensar os pais' por " +
            "regra da escola não se sustenta; o melhor interesse rege tudo.",
          artigo: "Art. 14, caput e §1º",
        },
      ],
    },
  ],
  esqueleto: [
    { numero: 1, titulo: "Quando este termo se aplica", decisaoId: "quando" },
    {
      numero: 2,
      titulo: "Identificação",
      textoFixo:
        "Instituição: [ESCOLA/ÓRGÃO], CNPJ [nº]. Atividade: divulgação de " +
        "imagens em [canais]. Responsável legal: [nome], pelo(a) aluno(a) [nome].",
    },
    { numero: 3, titulo: "Finalidade", decisaoId: "finalidade" },
    { numero: 4, titulo: "Forma da manifestação", decisaoId: "forma" },
    { numero: 5, titulo: "Revogação", decisaoId: "revogacao" },
    { numero: 6, titulo: "Crianças e adolescentes", decisaoId: "crianca" },
  ],
  cacaErro: {
    contexto:
      "A Escola Municipal de Vegas mandou este termo de autorização de imagem " +
      "pros pais assinarem. Tem 4 vícios clássicos de consentimento.",
    instrucao: "Toque nas cláusulas viciadas (🚩) — as que invalidam o consentimento.",
    secoes: [
      {
        numero: 1,
        titulo: "Identificação",
        texto:
          "Escola Municipal de Vegas. Autorização de uso de imagem do(a) " +
          "aluno(a) [nome], firmada pelo responsável legal [nome].",
        notaLimpa: "Identifica atividade, aluno e responsável legal — correto.",
      },
      {
        numero: 2,
        titulo: "Vinculação à matrícula",
        texto:
          "A assinatura desta autorização é condição para a efetivação da " +
          "matrícula do aluno no ano letivo.",
        erro: {
          porque:
            "O 'casadinho': condicionar a MATRÍCULA (serviço essencial, direito " +
            "da criança) à autorização de FOTO (opcional) elimina a liberdade do " +
            "consentimento. Quem não pode dizer não, não consente.",
          artigo: "Art. 8º, §3º · Art. 5º, XII",
        },
      },
      {
        numero: 3,
        titulo: "Finalidade",
        texto:
          "As imagens poderão ser utilizadas para quaisquer finalidades " +
          "institucionais presentes e futuras, a critério da direção.",
        erro: {
          porque:
            "Autorização genérica ('quaisquer finalidades futuras') é NULA — " +
            "art. 8º, §4º, com todas as letras. Finalidade tem que ser " +
            "específica: quais fotos, onde, até quando.",
          artigo: "Art. 8º, §4º",
        },
      },
      {
        numero: 4,
        titulo: "Canais de divulgação",
        texto:
          "A divulgação ocorrerá exclusivamente nos perfis oficiais da escola " +
          "(@escolavegas) e no mural interno, durante o ano letivo de 2026.",
        notaLimpa: "Canais e período determinados — especificidade correta.",
      },
      {
        numero: 5,
        titulo: "Revogação",
        texto:
          "Dada a natureza do planejamento pedagógico, esta autorização é " +
          "irrevogável durante o ano letivo.",
        erro: {
          porque:
            "Consentimento irrevogável não existe: a revogação a qualquer " +
            "momento é da essência (art. 8º, §5º). O planejamento da escola não " +
            "revoga a lei.",
          artigo: "Art. 8º, §5º · Art. 18, IX",
        },
      },
      {
        numero: 6,
        titulo: "Silêncio",
        texto:
          "Caso o responsável não se manifeste em 5 dias úteis, a autorização " +
          "será considerada concedida.",
        erro: {
          porque:
            "Silêncio NÃO é consentimento. A manifestação precisa ser ativa e " +
            "inequívoca — 'quem cala consente' morreu com a LGPD.",
          artigo: "Art. 5º, XII · Art. 8º",
        },
      },
      {
        numero: 7,
        titulo: "Responsável legal",
        texto:
          "A autorização é firmada de forma específica e destacada por pelo " +
          "menos um dos pais ou responsável legal (art. 14, §1º da LGPD).",
        notaLimpa: "Regime da criança respeitado — consentimento parental específico.",
      },
      {
        numero: 8,
        titulo: "Sem prejuízo",
        texto:
          "A não autorização não acarreta qualquer prejuízo ao aluno, que " +
          "participará normalmente de todas as atividades (apenas sem aparecer " +
          "nas publicações).",
        notaLimpa:
          "A prova da liberdade: dizer não custa nada. É isso que torna o sim " +
          "válido.",
      },
    ],
  },
};

// -----------------------------------------------------------------------------
// POLÍTICA DE COOKIES (blocos + caça ao erro)
// -----------------------------------------------------------------------------

const COOKIES: MontadorDoc = {
  id: "politica-cookies",
  emoji: "🍪",
  titulo: "Política de Cookies",
  subtitulo: "O aviso do portal sobre rastreamento",
  intro: "",
  disponivel: true,
  decisoes: [],
  esqueleto: [],
  blocos: {
    instrucao:
      "Monte a Política de Cookies do portal tocando nas cláusulas que DEVEM " +
      "entrar. O Guia da ANPD sobre cookies é a régua — cuidado com as intrusas.",
    cartas: [
      {
        id: "ck-navegando",
        texto:
          "Ao continuar navegando neste portal, você concorda com o uso de " +
          "todos os cookies.",
        pertence: false,
        porque:
          "A pegadinha nº 1 da internet brasileira: continuar navegando NÃO é " +
          "manifestação inequívoca. Cookies não-essenciais exigem consentimento " +
          "ATIVO — clique, não inércia.",
        artigo: "Art. 5º, XII · Guia ANPD Cookies (2023)",
      },
      {
        id: "ck-oque",
        texto:
          "Cookies são pequenos arquivos gravados no seu dispositivo pra " +
          "lembrar preferências e medir o uso do portal.",
        pertence: true,
        porque: "Explicar o que é, em português — transparência começa aqui.",
        artigo: "Art. 6º, VI · Art. 9º",
      },
      {
        id: "ck-categorias",
        texto:
          "Usamos três categorias: necessários (funcionamento), estatísticos " +
          "(medição de audiência) e de terceiros (mapas e vídeos incorporados).",
        pertence: true,
        porque: "Categorizar é o que permite consentir por tipo, não no atacado.",
        artigo: "Guia ANPD Cookies",
      },
      {
        id: "ck-essenciais",
        texto:
          "Cookies estritamente necessários ao funcionamento dispensam " +
          "consentimento — sem eles o portal não opera.",
        pertence: true,
        porque:
          "Os essenciais se apoiam em outra base legal (legítimo interesse/" +
          "execução do serviço) — informar sim, pedir permissão não.",
        artigo: "Guia ANPD Cookies",
      },
      {
        id: "ck-preativado",
        texto:
          "Os cookies de estatística e publicidade vêm ativados por padrão, " +
          "para melhorar sua experiência desde o primeiro acesso.",
        pertence: false,
        porque:
          "Pré-ativado = consentiu por você. Não-essenciais só DEPOIS do sim — " +
          "opt-in, nunca opt-out.",
        artigo: "Art. 8º · Guia ANPD Cookies",
      },
      {
        id: "ck-painel",
        texto:
          "Você pode revisar e mudar suas escolhas a qualquer momento no painel " +
          "'Preferências de Cookies', no rodapé do portal.",
        pertence: true,
        porque: "Revogar precisa ser tão fácil quanto aceitar — painel sempre à mão.",
        artigo: "Art. 8º, §5º · Art. 18, IX",
      },
      {
        id: "ck-vender",
        texto:
          "Os dados de navegação poderão ser comercializados com parceiros para " +
          "ofertas personalizadas.",
        pertence: false,
        porque:
          "Órgão público vendendo dado de navegação do cidadão? Desvio de " +
          "finalidade e quebra de confiança — não entra nem com consentimento.",
        artigo: "Art. 6º, I · Art. 7º, §5º",
      },
      {
        id: "ck-prazos",
        texto:
          "Cada cookie tem prazo de expiração informado na tabela desta " +
          "política (sessão · 30 dias · 12 meses).",
        pertence: true,
        porque: "Retenção declarada vale também pros cookies — prazo é transparência.",
        artigo: "Art. 6º, VI · Art. 16",
      },
      {
        id: "ck-firewall",
        texto:
          "O firewall do servidor web deve ser atualizado trimestralmente pela " +
          "equipe de infraestrutura.",
        pertence: false,
        porque:
          "Regra interna de TI — não é comunicação ao cidadão. Pertence às " +
          "normas de segurança da instituição, não à Política de Cookies.",
      },
      {
        id: "ck-terceiros",
        texto:
          "Serviços incorporados (mapas, vídeos) podem gravar cookies próprios " +
          "— listamos quais são e pra que servem.",
        pertence: true,
        porque:
          "Cookies de terceiros são os mais invisíveis — listar é o mínimo de " +
          "transparência.",
        artigo: "Art. 6º, VI · Guia ANPD Cookies",
      },
    ],
  },
  cacaErro: {
    contexto:
      "O portal da Prefeitura de Vegas estreou banner e política de cookies. O " +
      "estagiário copiou de um site gringo de 2015 — 4 erros no ar.",
    instrucao: "Toque nos trechos que violam a LGPD e o Guia da ANPD (🚩).",
    secoes: [
      {
        numero: 1,
        titulo: "O banner",
        texto:
          "\"🍪 Este portal usa cookies. AO CONTINUAR NAVEGANDO, VOCÊ CONCORDA " +
          "com todos os cookies. [Entendi]\"",
        erro: {
          porque:
            "Dose dupla: 'continuar navegando = concordar' (inércia não é " +
            "consentimento) e botão único 'Entendi' (sem opção de recusar ou " +
            "escolher). O banner correto oferece aceitar, recusar e preferências " +
            "— com o mesmo destaque.",
          artigo: "Art. 5º, XII · Guia ANPD Cookies",
        },
      },
      {
        numero: 2,
        titulo: "O que são cookies",
        texto:
          "Cookies são pequenos arquivos gravados no seu navegador pra lembrar " +
          "preferências (como o tamanho da letra) e medir visitas às páginas.",
        notaLimpa: "Explicação simples e honesta — correto.",
      },
      {
        numero: 3,
        titulo: "Categorias",
        texto:
          "Necessários (login e segurança) · Estatísticos (contagem de visitas) " +
          "· Terceiros (mapa da cidade e vídeos incorporados).",
        notaLimpa: "Categorias claras, permitindo escolha por tipo — correto.",
      },
      {
        numero: 4,
        titulo: "Ativação padrão",
        texto:
          "Para sua comodidade, todas as categorias vêm pré-ativadas no " +
          "primeiro acesso.",
        erro: {
          porque:
            "Não-essenciais pré-ativados = opt-out disfarçado de comodidade. A " +
            "regra é opt-in: nada de estatística ou terceiros antes do clique " +
            "no sim.",
          artigo: "Art. 8º · Guia ANPD Cookies",
        },
      },
      {
        numero: 5,
        titulo: "Essenciais",
        texto:
          "Os cookies estritamente necessários (sessão de login, segurança " +
          "antifraude) permanecem ativos independentemente de consentimento, " +
          "pois sem eles o portal não funciona.",
        notaLimpa:
          "Essenciais dispensam consentimento mesmo — a base é outra. Se você " +
          "marcou, caiu no alarme falso clássico.",
      },
      {
        numero: 6,
        titulo: "Como recusar",
        texto:
          "Para desativar cookies, protocole ofício ao Setor de TI da " +
          "Prefeitura, com resposta em até 10 dias úteis.",
        erro: {
          porque:
            "Recusar tem que ser tão fácil quanto aceitar — um clique no " +
            "painel, não um protocolo. Fricção deliberada na recusa é padrão " +
            "manipulativo (dark pattern).",
          artigo: "Art. 8º, §5º · Guia ANPD Cookies",
        },
      },
      {
        numero: 7,
        titulo: "Ferramentas de medição",
        texto:
          "Não utilizamos cookies de rastreamento. As visitas são medidas pelo " +
          "Google Analytics, que grava identificadores no seu navegador.",
        erro: {
          porque:
            "Contradição na mesma frase: 'não rastreamos' + Google Analytics " +
            "gravando identificador É cookie de rastreamento (e de terceiro, " +
            "com dados podendo sair do país). Negar o que se faz é a pior " +
            "violação de transparência.",
          artigo: "Art. 6º, VI · Art. 33",
        },
      },
      {
        numero: 8,
        titulo: "Prazos",
        texto:
          "Tabela de expiração: sessão (ao fechar o navegador) · preferências " +
          "(30 dias) · estatísticos (12 meses).",
        notaLimpa: "Prazos declarados por cookie — retenção transparente.",
      },
    ],
  },
};

// -----------------------------------------------------------------------------
// RESPOSTA AO TITULAR — DSR (decidir + ordenar)
// -----------------------------------------------------------------------------

const DSR: MontadorDoc = {
  id: "resposta-titular",
  emoji: "📨",
  titulo: "Resposta ao Titular (DSR)",
  subtitulo: "A carta-resposta a quem pede seus dados",
  intro:
    "Um cidadão escreveu: 'quero saber quais dados vocês têm sobre mim'. A " +
    "resposta a esse pedido é um documento — com prazo, forma e pegadinhas " +
    "próprias. Monte a resposta certa decidindo cada ponto.",
  disponivel: true,
  decisoes: [
    {
      id: "identidade",
      secaoNumero: 2,
      contexto: "E se quem pediu não for quem diz ser?",
      pergunta: "O que fazer ANTES de responder?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Validar a identidade do solicitante por meio proporcional",
          textoDoc:
            "Antes de qualquer entrega, a identidade do solicitante é " +
            "confirmada por meio **proporcional** (documento com foto no balcão, " +
            "login gov.br, ou confirmação por dados de contato já cadastrados). " +
            "Pedido por terceiro exige procuração específica.",
          correta: true,
          porque:
            "Entregar os dados ao solicitante errado é INCIDENTE — o pedido de " +
            "acesso é o golpe favorito do estelionatário. Validar primeiro " +
            "protege o próprio titular.",
          artigo: "Art. 18 · Art. 46",
        },
        {
          id: "pegadinha",
          rotulo: "Responder rápido, sem burocratizar",
          textoDoc:
            "Em atenção à celeridade, os dados serão enviados ao e-mail " +
            "informado no próprio pedido, dispensadas conferências adicionais.",
          correta: false,
          porque:
            "O e-mail 'informado no pedido' pode ser de qualquer um. " +
            "Agilidade que entrega o CPF do cidadão pro golpista não é " +
            "eficiência — é vazamento com protocolo.",
          artigo: "Art. 46 (segurança ignorada)",
        },
      ],
    },
    {
      id: "conteudo",
      secaoNumero: 3,
      pergunta: "O que entregar na resposta?",
      opcoes: [
        {
          id: "correta",
          rotulo: "O que foi pedido, em linguagem clara e organizada",
          textoDoc:
            "A resposta traz **exatamente o que foi solicitado** (ex.: quais " +
            "dados o órgão trata, finalidades e compartilhamentos), em " +
            "**linguagem clara**, organizada por sistema/finalidade — não um " +
            "despejo técnico de banco de dados.",
          correta: true,
          porque:
            "Responder é comunicar, não descarregar. O relatório críptico do " +
            "sistema, sem tradução, descumpre o direito na prática.",
          artigo: "Art. 18 · Art. 19 · Art. 9º",
        },
        {
          id: "pegadinha",
          rotulo: "Exportar o dump bruto do sistema — completo e técnico",
          textoDoc:
            "Segue anexa a exportação integral das tabelas do sistema " +
            "(usr_tbl_2019.csv, 47 colunas), conforme solicitado.",
          correta: false,
          porque:
            "47 colunas com nomes de sistema não informam nada ao cidadão comum " +
            "— e ainda podem vazar dados de TERCEIROS misturados nas tabelas.",
          artigo: "Art. 9º (clareza) · Art. 46",
        },
      ],
    },
    {
      id: "prazo",
      secaoNumero: 4,
      pergunta: "Qual o prazo e formato da resposta?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Imediato simplificado OU completo em até 15 dias úteis",
          textoDoc:
            "Confirmação de tratamento e acesso: em **formato simplificado, " +
            "imediatamente**, ou por **declaração completa em até 15 dias " +
            "úteis** do requerimento (art. 19, II) — o prazo que este órgão " +
            "adota e monitora.",
          correta: true,
          porque:
            "É o prazo que o curso crava: 15 dias úteis pra resposta completa. " +
            "Registre a data do pedido — o relógio corre dela.",
          artigo: "Art. 19, II",
        },
        {
          id: "pegadinha",
          rotulo: "20 dias prorrogáveis por mais 10, como na LAI",
          textoDoc:
            "A resposta será fornecida em até 20 dias, prorrogáveis por mais 10 " +
            "mediante justificativa, nos termos da Lei de Acesso à Informação.",
          correta: false,
          porque:
            "Misturou as leis! 20+10 é LAI (informação pública). Pedido de " +
            "DADOS PESSOAIS é LGPD: 15 dias úteis. Usar o rito errado atrasa e " +
            "descumpre.",
          artigo: "Art. 19, II (LGPD ≠ LAI)",
        },
      ],
    },
    {
      id: "custo",
      secaoNumero: 5,
      pergunta: "Quanto custa pro titular?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Nada — o exercício de direitos é gratuito",
          textoDoc:
            "O exercício dos direitos do titular é **gratuito** — inclusive a " +
            "emissão de cópia eletrônica dos dados.",
          correta: true,
          porque: "Gratuidade expressa na lei. Cobrar é barreira ilegal ao direito.",
          artigo: "Art. 18, §5º",
        },
        {
          id: "pegadinha",
          rotulo: "Taxa administrativa de emissão (R$ 50)",
          textoDoc:
            "A emissão do relatório de dados está sujeita à taxa administrativa " +
            "de R$ 50,00, recolhida por guia própria.",
          correta: false,
          porque:
            "Taxa pra exercer direito da LGPD é cobrança sem amparo — a " +
            "gratuidade é expressa.",
          artigo: "Art. 18, §5º (violado)",
        },
      ],
    },
    {
      id: "negativa",
      secaoNumero: 6,
      contexto: "Nem todo pedido pode ser atendido (ex.: eliminação de dado que o órgão é obrigado a guardar).",
      pergunta: "E quando NÃO for possível atender?",
      opcoes: [
        {
          id: "correta",
          rotulo: "Responder MESMO ASSIM: as razões, a base legal e os caminhos",
          textoDoc:
            "Quando o pedido não puder ser atendido (ex.: eliminação de dados " +
            "sob **obrigação legal de guarda**, art. 16, I), o órgão responde no " +
            "prazo **indicando as razões de fato e de direito**, o que É " +
            "possível fazer, e que o titular pode se dirigir à ANPD.",
          correta: true,
          porque:
            "Negar sem responder é a pior resposta. A lei manda explicar a " +
            "razão da recusa — silêncio administrativo aqui é infração.",
          artigo: "Art. 18, §4º · Art. 16, I",
        },
        {
          id: "pegadinha",
          rotulo: "Arquivar sem resposta — o silêncio já comunica",
          textoDoc:
            "Pedidos juridicamente inviáveis serão arquivados, dispensada " +
            "resposta formal ao requerente.",
          correta: false,
          porque:
            "O cidadão fica no vácuo e vai reclamar direto na ANPD — com razão. " +
            "Toda negativa merece resposta fundamentada no prazo.",
          artigo: "Art. 18, §4º (descumprido)",
        },
      ],
    },
  ],
  esqueleto: [
    {
      numero: 1,
      titulo: "Registro do pedido",
      textoFixo:
        "Pedido nº [protocolo], recebido em [data] pelo canal [balcão/e-mail/" +
        "formulário]. Titular: [nome]. Direito exercido: [acesso/correção/" +
        "eliminação/portabilidade].",
    },
    { numero: 2, titulo: "Verificação de identidade", decisaoId: "identidade" },
    { numero: 3, titulo: "Conteúdo da resposta", decisaoId: "conteudo" },
    { numero: 4, titulo: "Prazo e formato", decisaoId: "prazo" },
    { numero: 5, titulo: "Custo", decisaoId: "custo" },
    { numero: 6, titulo: "Quando não for possível atender", decisaoId: "negativa" },
  ],
  ordenar: {
    instrucao:
      "Chegou um pedido de acesso aos dados. Coloque os 7 passos do " +
      "atendimento na ordem certa.",
    itens: [
      { id: "ds-receber", rotulo: "Receber e protocolar o pedido", detalhe: "canal oficial, data registrada" },
      { id: "ds-validar", rotulo: "Validar a identidade do solicitante", detalhe: "antes de qualquer entrega" },
      { id: "ds-confirmar", rotulo: "Confirmar se o órgão trata dados dele", detalhe: "existe tratamento?" },
      { id: "ds-localizar", rotulo: "Localizar os dados nos sistemas e setores", detalhe: "com apoio do Inventário" },
      { id: "ds-preparar", rotulo: "Preparar a resposta em linguagem clara", detalhe: "traduzir, não despejar" },
      { id: "ds-responder", rotulo: "Responder dentro do prazo", detalhe: "15 dias úteis (art. 19, II)" },
      { id: "ds-registrar", rotulo: "Registrar o atendimento no histórico", detalhe: "protocolo fechado" },
    ],
    ordemInicial: [
      "ds-preparar", "ds-localizar", "ds-registrar", "ds-receber",
      "ds-responder", "ds-validar", "ds-confirmar",
    ],
    logica:
      "O fluxo protege os dois lados: protocolo e IDENTIDADE antes de tudo " +
      "(entregar dados à pessoa errada é incidente!), depois localizar com o " +
      "Inventário como mapa, traduzir pra linguagem de gente e responder com o " +
      "relógio dos 15 dias úteis correndo desde o protocolo. O registro final " +
      "é o que prova o atendimento.",
  },
};

// -----------------------------------------------------------------------------
// CATÁLOGO + HELPERS
// -----------------------------------------------------------------------------

export const MONTADOR_DOCS: MontadorDoc[] = [
  AVISO,
  POLITICA,
  RIPD,
  PRI,
  CLAUSULAS,
  CONSENTIMENTO,
  COOKIES,
  DSR,
];

export function getMontadorDoc(id: string): MontadorDoc | undefined {
  return MONTADOR_DOCS.find((d) => d.id === id);
}

// Monta o markdown final do documento a partir das escolhas do participante.
// `escolhas`: { [decisaoId]: opcaoId }. Seções sem escolha entram com um aviso.
export function montarDocumento(
  doc: MontadorDoc,
  escolhas: Record<string, string>,
): string {
  const linhas: string[] = [`# ${doc.titulo}`, ""];
  for (const sec of doc.esqueleto) {
    linhas.push(`## ${sec.numero}. ${sec.titulo}`, "");
    if (sec.textoFixo) {
      linhas.push(sec.textoFixo, "");
      continue;
    }
    if (sec.decisaoId) {
      const decisao = doc.decisoes.find((d) => d.id === sec.decisaoId);
      const escolhaId = escolhas[sec.decisaoId];
      const opcao = decisao?.opcoes.find((o) => o.id === escolhaId);
      linhas.push(opcao ? opcao.textoDoc : "_[seção ainda não decidida]_", "");
    }
  }
  return linhas.join("\n");
}

// Placar: quantas decisões o participante acertou.
export function pontuar(
  doc: MontadorDoc,
  escolhas: Record<string, string>,
): { acertos: number; total: number } {
  let acertos = 0;
  for (const d of doc.decisoes) {
    const op = d.opcoes.find((o) => o.id === escolhas[d.id]);
    if (op?.correta) acertos++;
  }
  return { acertos, total: doc.decisoes.length };
}
