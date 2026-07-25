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

export type MontadorDoc = {
  id: string;
  emoji: string;
  titulo: string;
  subtitulo: string;
  intro: string;
  esqueleto: SecaoEsqueleto[];
  decisoes: Decisao[];
  disponivel: boolean; // false = aparece no hub como "em breve"
  blocos: { instrucao: string; cartas: CartaBloco[] };
  cacaErro: { contexto: string; instrucao: string; secoes: SecaoCaca[] };
  ordenar: { instrucao: string; itens: ItemOrdem[]; ordemInicial: string[]; logica: string };
};

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
// CATÁLOGO + HELPERS
// -----------------------------------------------------------------------------

export const MONTADOR_DOCS: MontadorDoc[] = [AVISO, POLITICA];

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
