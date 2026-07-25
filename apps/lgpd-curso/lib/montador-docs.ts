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

export type MontadorDoc = {
  id: string;
  emoji: string;
  titulo: string;
  subtitulo: string;
  intro: string;
  esqueleto: SecaoEsqueleto[];
  decisoes: Decisao[];
  disponivel: boolean; // false = aparece no hub como "em breve"
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
