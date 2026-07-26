// =============================================================================
// Jogos da LGPD — hub público /jogos (pacote Colatina)
// =============================================================================
// 5 jogos standalone: Dia D (crise com relógio) · Chat do Titular (conversa
// simulada) · Detetive na Repartição (caça-dados na cena) · Ligue os Pares ·
// Sprint 60s. Mesmo contrato do montador: público, sem login, sem banco,
// embutível em apresentação (um link por slide).
//
// Embaralhamentos SEMPRE pré-fixados na mão (nada de Math.random no render
// inicial — evita mismatch de hidratação). Timers/aleatoriedade só depois de
// montado no cliente.

// -----------------------------------------------------------------------------
// CATÁLOGO DO HUB
// -----------------------------------------------------------------------------

export type JogoMeta = {
  id: string;
  emoji: string;
  titulo: string;
  subtitulo: string;
  // Momento do curso em que o jogo entra (chip nos cartões e páginas).
  fase: string;
};

// Ordem = a sequência didática do curso (aprovada pelo facilitador):
// abertura → fundamentos (Dia 1) → Fase 6 → Fase 7.
export const JOGOS: JogoMeta[] = [
  {
    id: "detetive",
    emoji: "🕵️",
    titulo: "Detetive na Repartição",
    subtitulo: "Ache os vazamentos escondidos na cena",
    fase: "Abertura",
  },
  {
    id: "pares",
    emoji: "🔗",
    titulo: "Ligue os Pares",
    subtitulo: "Cenário ↔ base legal · dado ↔ categoria · quem é quem",
    fase: "Fundamentos · Dia 1",
  },
  {
    id: "sprint",
    emoji: "⚡",
    titulo: "Sprint 60 segundos",
    subtitulo: "Sensível ou comum? Contra o relógio",
    fase: "Fundamentos · Dia 1",
  },
  {
    id: "chat-titular",
    emoji: "💬",
    titulo: "Chat do Titular",
    subtitulo: "Acalme a Dona Marta e atenda direito",
    fase: "Fase 6",
  },
  {
    id: "dia-d",
    emoji: "🚒",
    titulo: "Dia D — O Vazamento",
    subtitulo: "7 decisões com o relógio da ANPD correndo",
    fase: "Fase 7",
  },
];

// -----------------------------------------------------------------------------
// 🚒 DIA D — simulador de incidente (cenas com relógio)
// -----------------------------------------------------------------------------
// Pontos: 2 = decisão certa · 1 = remediável · 0 = desastre.
// Horas: quanto do prazo da ANPD (72h úteis, a contar da ciência) a escolha
// queima. Opções pré-embaralhadas.

export type OpcaoCena = {
  id: string;
  rotulo: string;
  pontos: 0 | 1 | 2;
  horas: number;
  reacao: string; // o que acontece em seguida
};

export type CenaDiaD = {
  id: string;
  momento: string; // carimbo narrativo ("Sexta, 17h05")
  texto: string;
  opcoes: OpcaoCena[];
};

export const DIA_D_PRAZO_HORAS = 72; // 3 dias úteis (Res. CD/ANPD nº 15/2024)

export const DIA_D_CENAS: CenaDiaD[] = [
  {
    id: "c1",
    momento: "Sexta, 17h05",
    texto:
      "O estagiário do Posto de Saúde chega pálido: o pendrive com os exames " +
      "de ~2.300 pacientes — que ele levava entre as unidades — ficou no " +
      "ônibus. Sem criptografia. O que você faz PRIMEIRO?",
    opcoes: [
      {
        id: "c1-esperar",
        rotulo: "Esperar até segunda — vai que o pendrive aparece no achados e perdidos",
        pontos: 0,
        horas: 60,
        reacao:
          "O fim de semana inteiro queimado. O prazo da ANPD corre da CIÊNCIA " +
          "do incidente — e a ciência foi sexta às 17h05. Você acabou de gastar " +
          "60 das suas 72 horas na esperança.",
      },
      {
        id: "c1-dpo",
        rotulo: "Comunicar a Encarregada (DPO) imediatamente, ainda que seja sexta à noite",
        pontos: 2,
        horas: 1,
        reacao:
          "Certo. A DPO aciona o Plano de Resposta na hora. Comunicar não é " +
          "confissão de culpa — é o que permite agir a tempo. O relógio corre, " +
          "mas você está À FRENTE dele.",
      },
      {
        id: "c1-sozinho",
        rotulo: "Mandar o estagiário voltar à rodoviária e procurar, sem alarde",
        pontos: 1,
        horas: 12,
        reacao:
          "Meia noite de busca inútil — e a DPO só soube no sábado de manhã. " +
          "Procurar não é errado; esconder enquanto procura, sim. 12 horas " +
          "perdidas.",
      },
    ],
  },
  {
    id: "c2",
    momento: "Ainda na sexta, à noite",
    texto:
      "A DPO pergunta: 'O que EXATAMENTE tinha no pendrive?' Ninguém sabe ao " +
      "certo. O computador do estagiário tem os arquivos que ele copiou. " +
      "Próximo passo?",
    opcoes: [
      {
        id: "c2-formatar",
        rotulo: "Formatar o computador do estagiário — elimina o problema na origem",
        pontos: 0,
        horas: 8,
        reacao:
          "Você acabou de destruir a ÚNICA evidência do que vazou. Agora nem " +
          "dá pra saber quem avisar, nem provar diligência à ANPD. Contenção " +
          "não é apagar rastro — é preservá-lo.",
      },
      {
        id: "c2-escopo",
        rotulo: "Levantar o escopo exato pelos logs e preservar as evidências",
        pontos: 2,
        horas: 3,
        reacao:
          "Em 3 horas vocês sabem: 2.312 pacientes, exames de jan-jun, inclui " +
          "menores de idade. Doeu ler, mas agora a resposta tem alvo — e os " +
          "logs provam o cuidado da instituição.",
      },
      {
        id: "c2-nota",
        rotulo: "Publicar nota no site pedindo desculpas gerais, antes de saber o escopo",
        pontos: 1,
        horas: 6,
        reacao:
          "Transparência às pressas: a nota vaga assustou todo mundo e não " +
          "informou ninguém. Comunicar é dever — mas com CONTEÚDO: o quê, " +
          "quem, o que fazer. Primeiro o escopo.",
      },
    ],
  },
  {
    id: "c3",
    momento: "Sábado, 9h",
    texto:
      "Escopo na mesa: 2.312 pacientes, dados de saúde, inclui crianças. A " +
      "equipe discute: isso exige comunicar ANPD e titulares?",
    opcoes: [
      {
        id: "c3-relevante",
        rotulo: "Sim — dado sensível em volume, com risco relevante: aciona o fluxo",
        pontos: 2,
        horas: 1,
        reacao:
          "Exato. Dado de saúde + 2.312 pessoas + menores = risco relevante " +
          "aos titulares na régua da Res. 15/2024. O fluxo de comunicação " +
          "começa AGORA, com 71h ainda no relógio.",
      },
      {
        id: "c3-numeros",
        rotulo: "'São só exames — ninguém entende aqueles números mesmo'",
        pontos: 0,
        horas: 24,
        reacao:
          "Um dia inteiro de negação. Exame identifica doença, gravidez, uso " +
          "de medicação — é exatamente o que chantagista e golpista adoram. " +
          "Minimizar o dano alheio é o primeiro passo pro dano próprio.",
      },
      {
        id: "c3-esperar-midia",
        rotulo: "Aguardar: se não virar notícia, tratamos internamente",
        pontos: 0,
        horas: 30,
        reacao:
          "A obrigação nasce do RISCO AO TITULAR, não da manchete. Esperar a " +
          "imprensa é transformar infração sanável em agravante — e lá se " +
          "foram 30 horas.",
      },
    ],
  },
  {
    id: "c4",
    momento: "Sábado, 14h",
    texto:
      "Um vereador liga no celular do secretário: 'Soube do vazamento. Me " +
      "manda a lista dos afetados no zap, quero fiscalizar de perto.' Como " +
      "responder?",
    opcoes: [
      {
        id: "c4-lista",
        rotulo: "Enviar a lista — transparência com o poder legislativo",
        pontos: 0,
        horas: 4,
        reacao:
          "Você acabou de causar um SEGUNDO vazamento — dados de saúde de " +
          "2.312 pessoas no WhatsApp de um celular pessoal. Fiscalizar não " +
          "exige dado pessoal; exige informação institucional.",
      },
      {
        id: "c4-oficial",
        rotulo: "Canal oficial: apuração em curso, informações institucionais sim, dados pessoais não",
        pontos: 2,
        horas: 2,
        reacao:
          "Resposta de gente grande: o vereador recebe o relato do incidente e " +
          "das providências pelo canal oficial — sem nenhum dado pessoal. " +
          "Transparência e proteção não brigam.",
      },
      {
        id: "c4-negar",
        rotulo: "Negar que houve qualquer incidente, por ora",
        pontos: 0,
        horas: 6,
        reacao:
          "Mentir pra quem fiscaliza é plantar a CPI de segunda-feira. Quando " +
          "a verdade aparecer (e ela aparece), a negativa vira o centro do " +
          "escândalo.",
      },
    ],
  },
  {
    id: "c5",
    momento: "Domingo, 10h",
    texto:
      "Hora da ANPD. A procuradoria pondera: 'A apuração ainda não terminou — " +
      "melhor esperar o relatório completo pra comunicar?' Decida.",
    opcoes: [
      {
        id: "c5-comunicar",
        rotulo: "Comunicar JÁ com o que se sabe — e complementar depois",
        pontos: 2,
        horas: 4,
        reacao:
          "É assim que funciona: a comunicação inicial vai com o que se sabe " +
          "(escopo, medidas, contato do DPO) e o complemento vem depois. Prazo " +
          "cumprido com folga — a ANPD nota diligência, não desespero.",
      },
      {
        id: "c5-relatorio",
        rotulo: "Esperar o relatório completo — comunicar só uma vez, direito",
        pontos: 0,
        horas: 48,
        reacao:
          "O relatório 'completo' ficou pronto quarta-feira — 48h a mais, " +
          "prazo estourado. Perfeccionismo aqui é infração: a norma admite " +
          "comunicação complementar justamente pra ninguém esperar.",
      },
      {
        id: "c5-nao",
        rotulo: "Não comunicar — 'quem procura a ANPD é quem se incrimina'",
        pontos: 0,
        horas: 24,
        reacao:
          "A ANPD recebe DENÚNCIAS — de titular, de imprensa, de vereador. " +
          "Quando ela chega sem você ter comunicado, a multa vem com o " +
          "agravante da omissão.",
      },
    ],
  },
  {
    id: "c6",
    momento: "Domingo, 16h",
    texto:
      "Agora os 2.312 titulares. A equipe de comunicação propõe três " +
      "caminhos. Qual aprovar?",
    opcoes: [
      {
        id: "c6-claro",
        rotulo: "Carta/SMS em linguagem clara: o que houve, quais dados, o que estamos fazendo, o que VOCÊ pode fazer",
        pontos: 2,
        horas: 4,
        reacao:
          "Comunicação que protege: cada titular sabe o que aconteceu e como " +
          "se defender (desconfiar de ligações, não passar códigos, canal do " +
          "DPO). Respeito gera confiança até na crise.",
      },
      {
        id: "c6-edital",
        rotulo: "Nota no Diário Oficial em linguagem técnico-jurídica",
        pontos: 1,
        horas: 3,
        reacao:
          "Publicou onde ninguém lê, escrito como ninguém fala. Formalmente " +
          "existe comunicação; materialmente, os 2.312 continuam sem saber. A " +
          "ANPD avalia a EFETIVIDADE.",
      },
      {
        id: "c6-procurar",
        rotulo: "Informar só quem procurar o Posto — evita pânico",
        pontos: 0,
        horas: 3,
        reacao:
          "Quem não sabe do vazamento não sabe que precisa procurar. O " +
          "'evitar pânico' na prática é 'manter todo mundo vulnerável ao " +
          "golpe'.",
      },
    ],
  },
  {
    id: "c7",
    momento: "Semana seguinte",
    texto:
      "Crise contida: ANPD comunicada, titulares avisados, pendrive nunca " +
      "apareceu. Como fechar o ciclo?",
    opcoes: [
      {
        id: "c7-bode",
        rotulo: "Desligar o estagiário e dar o caso por encerrado",
        pontos: 0,
        horas: 0,
        reacao:
          "O estagiário seguia o processo que EXISTIA — pendrive sem " +
          "criptografia era o padrão da casa. Trocar a pessoa e manter o " +
          "processo é agendar a reprise.",
      },
      {
        id: "c7-licoes",
        rotulo: "Registrar tudo, rodar lições aprendidas e atacar a causa (fim do pendrive no fluxo)",
        pontos: 2,
        horas: 0,
        reacao:
          "Fechamento de verdade: registro completo (a ANPD pode pedir), PRI " +
          "atualizado, e a causa-raiz eliminada — transferência criptografada " +
          "entre unidades. O incidente virou vacina.",
      },
      {
        id: "c7-memorando",
        rotulo: "Publicar memorando proibindo pendrives e seguir em frente",
        pontos: 1,
        horas: 0,
        reacao:
          "Proibiu o sintoma sem criar a alternativa: os exames ainda precisam " +
          "viajar. Sem o canal seguro, amanhã alguém 'dá um jeitinho' — e o " +
          "jeitinho é o próximo incidente.",
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// 💬 CHAT DO TITULAR — conversa simulada (DSR na prática)
// -----------------------------------------------------------------------------
// Temperatura da conversa: começa 8 (fervendo). Boa escolha esfria, ruim
// esquenta. Termina com a avaliação da Dona Marta.

export type OpcaoChat = {
  id: string;
  texto: string; // o que VOCÊ responde
  delta: number; // efeito na temperatura (negativo = acalma)
  boa: boolean;
  reacaoDela: string; // resposta da Dona Marta
  nota: string; // lição da jogada
};

export type TurnoChat = {
  id: string;
  dela: string[]; // mensagens dela neste turno
  opcoes: OpcaoChat[]; // pré-embaralhadas
};

export const CHAT_TEMP_INICIAL = 8;

export const CHAT_TURNOS: TurnoChat[] = [
  {
    id: "t1",
    dela: [
      "BOA TARDE. QUERO QUE APAGUEM TUDO QUE VOCÊS TÊM SOBRE MIM. TUDO!!",
      "E não me venham com enrolação que eu conheço meus direitos!!!",
    ],
    opcoes: [
      {
        id: "t1-protocolo",
        texto: "A senhora precisa protocolar por escrito no setor competente, no horário de expediente.",
        delta: 2,
        boa: false,
        reacaoDela: "SETOR COMPETENTE?? Eu TÔ falando com a prefeitura AGORA! Empurra-empurra é isso!",
        nota:
          "Resposta-balcão: tecnicamente existe protocolo, mas começar por " +
          "burocracia em vez de acolhimento só joga gasolina.",
      },
      {
        id: "t1-acolher",
        texto:
          "Boa tarde, Dona Marta! Eu vou te ajudar com isso, sim. Pra fazer certinho, me conta: o que aconteceu?",
        delta: -2,
        boa: true,
        reacaoDela: "Hunf. Até que enfim alguém educado. Pois te conto: me ligaram aplicando GOLPE!",
        nota:
          "Acolher primeiro, processar depois. O titular irritado quase sempre " +
          "tem um motivo real — descubra o motivo antes do formulário.",
      },
      {
        id: "t1-nao-pode",
        texto: "A senhora não pode apagar tudo — é lei. Os dados públicos são obrigatórios.",
        delta: 2,
        boa: false,
        reacaoDela: "COMO ASSIM NÃO POSSO?! A LGPD diz que POSSO! Vou na ANPD, no Procon e na RÁDIO!",
        nota:
          "Até é verdade que nem tudo se apaga — mas abrir a conversa pelo NÃO, " +
          "sem ouvir o caso, transforma atendimento em queda de braço.",
      },
    ],
  },
  {
    id: "t2",
    dela: [
      "Me ligaram sabendo meu nome completo, meu CPF e até o posto onde eu consulto!",
      "Só pode ter vazado DAÍ. Por isso quero tudo apagado!",
    ],
    opcoes: [
      {
        id: "t2-seguro",
        texto: "Impossível, nosso sistema é muito seguro. Deve ter vazado de outro lugar.",
        delta: 2,
        boa: false,
        reacaoDela: "Ah, IMPOSSÍVEL, é? E o senhor garante COMO? Tá me chamando de mentirosa?",
        nota:
          "'Impossível' é a palavra proibida da segurança. Suspeita de " +
          "vazamento relatada por titular é INDÍCIO — se registra e se apura, " +
          "não se rebate.",
      },
      {
        id: "t2-serio",
        texto:
          "Isso é sério e eu agradeço por avisar. Vou registrar como possível incidente pra nossa Encarregada apurar — e já cuidamos do seu pedido também.",
        delta: -2,
        boa: true,
        reacaoDela: "Assim que se fala! Apura mesmo, porque golpe em cima de gente aposentada é covardia.",
        nota:
          "Relato de titular pode ser a primeira detecção de um incidente real " +
          "(art. 48). Registrar a suspeita É o procedimento — e ainda acalma: " +
          "ela foi levada a sério.",
      },
      {
        id: "t2-operadora",
        texto: "Então a senhora tem que reclamar com a operadora de telefone, não com a gente.",
        delta: 1,
        boa: false,
        reacaoDela: "Empurrando de novo?! O golpista sabia do MEU POSTO DE SAÚDE, moço!",
        nota:
          "O detalhe do posto de saúde é exatamente o que aponta pro órgão. " +
          "Encaminhar pra fora antes de apurar dentro é fechar os olhos pro " +
          "indício.",
      },
    ],
  },
  {
    id: "t3",
    dela: ["Tá. E o que o senhor precisa de mim pra apagar minhas coisas?"],
    opcoes: [
      {
        id: "t3-zap",
        texto: "Me manda uma foto do seu RG e a senha do seu gov.br aqui pelo chat que eu resolvo.",
        delta: 2,
        boa: false,
        reacaoDela: "SENHA?! O golpista pediu a MESMA COISA! Vocês são tudo iguais!!",
        nota:
          "NUNCA se pede senha — e ela percebeu na hora. Verificação de " +
          "identidade usa canais e meios oficiais, jamais credenciais do " +
          "titular.",
      },
      {
        id: "t3-explicar",
        texto:
          "Preciso confirmar sua identidade — justamente pra proteger a senhora: seus dados não podem sair pra outra pessoa. Pode ser com documento no balcão ou pelo login gov.br no nosso portal (sem me passar senha).",
        delta: -1,
        boa: true,
        reacaoDela: "Faz sentido... depois do golpe eu tô desconfiada de tudo mesmo. Vou aí segunda com meu documento.",
        nota:
          "Explicar o PORQUÊ da verificação transforma 'burocracia' em " +
          "'cuidado'. Entregar dados ao solicitante errado seria um segundo " +
          "incidente.",
      },
      {
        id: "t3-dispensar",
        texto: "Não precisa de nada, a senhora tá nervosa — eu já apago tudo aqui.",
        delta: 0,
        boa: false,
        reacaoDela: "Ué... nem confirmar quem eu sou? E se fosse o golpista ligando no meu lugar?",
        nota:
          "ELA enxergou o risco que você ignorou. Pular a verificação pra " +
          "agradar é gentileza que vaza dado.",
      },
    ],
  },
  {
    id: "t4",
    dela: ["E aí, consegue apagar TUDO? Cadastro, consulta, receita, tudo?"],
    opcoes: [
      {
        id: "t4-transparente",
        texto:
          "Vou ser transparente: o que a lei manda guardar — como o prontuário, por 20 anos — a gente não pode apagar. Mas contatos desnecessários, cadastros antigos e usos indevidos, sim. Te mando a lista exata do que dá e do que não dá, com o motivo de cada um.",
        delta: -2,
        boa: true,
        reacaoDela: "Olha... prefiro assim, sabendo o quê e o porquê, do que promessa furada.",
        nota:
          "Eliminação (art. 18, VI) convive com as exceções do art. 16 " +
          "(obrigação legal). Dizer o não-com-motivo constrói mais confiança " +
          "que o sim-de-mentira.",
      },
      {
        id: "t4-prometer",
        texto: "Pode deixar, vou apagar tudinho, some tudo do sistema!",
        delta: -1,
        boa: false,
        reacaoDela: "Ótimo!! ... (semana que vem, quando o prontuário continuar lá, ela volta 3x mais brava)",
        nota:
          "Prometeu o impossível: prontuário tem guarda legal de 20 anos. A " +
          "promessa furada de hoje é a reclamação na ANPD de amanhã.",
      },
      {
        id: "t4-nada",
        texto: "Não dá pra apagar nada, órgão público não apaga dados.",
        delta: 2,
        boa: false,
        reacaoDela: "NADA?! Então a LGPD é só enfeite pra vocês?!",
        nota:
          "O outro extremo: generalizar o 'não'. Cadastro obsoleto, contato " +
          "desnecessário e uso indevido PODEM e DEVEM ser eliminados.",
      },
    ],
  },
  {
    id: "t5",
    dela: ["E isso demora quanto? Porque eu conheço vocês: 'aguarde' e nunca mais..."],
    opcoes: [
      {
        id: "t5-prazo",
        texto:
          "Prazo de 15 dias úteis, Dona Marta — e a senhora leva o número de protocolo pra acompanhar. Se eu terminar antes, aviso.",
        delta: -1,
        boa: true,
        reacaoDela: "Protocolo eu quero, sim. Anotei aqui na agenda: 15 dias úteis.",
        nota:
          "Prazo objetivo (art. 19, II — o padrão do curso) + protocolo = " +
          "expectativa administrada. Ela sabe o quê e quando cobrar.",
      },
      {
        id: "t5-quando-der",
        texto: "Ah, assim que der. Estamos com pouca equipe...",
        delta: 2,
        boa: false,
        reacaoDela: "'Assim que der' é NUNCA. Vou é reclamar na ouvidoria e na ANPD de uma vez.",
        nota:
          "Sem prazo, o titular assume o pior — e a ANPD dá razão a ele: o " +
          "prazo legal existe justamente contra o 'assim que der'.",
      },
      {
        id: "t5-tres-meses",
        texto: "Uns 90 dias, por causa dos trâmites internos.",
        delta: 1,
        boa: false,
        reacaoDela: "NOVENTA DIAS pra apagar um cadastro? Nem reforma de calçada demora tanto!",
        nota:
          "Inventar prazo folgado 'pra garantir' é descumprir a lei com " +
          "agenda: o prazo é de 15 dias úteis.",
      },
    ],
  },
  {
    id: "t6",
    dela: ["Última coisa: e o GOLPE? Eu faço o quê se ligarem de novo?"],
    opcoes: [
      {
        id: "t6-orientar",
        texto:
          "Anota aí: não passe código, senha nem confirme dados por telefone; desligue e ligue de volta pelo número oficial; registre boletim de ocorrência; e qualquer novidade, fale com nossa Encarregada — vou te passar o contato.",
        delta: -2,
        boa: true,
        reacaoDela: "Vou anotar tudinho e avisar as amigas do grupo da igreja, que tão caindo nesses golpes.",
        nota:
          "Orientação prática fecha o ciclo do cuidado — e cada titular " +
          "orientado vira multiplicador. Dona Marta acabou de virar aliada.",
      },
      {
        id: "t6-nao-nosso",
        texto: "Golpe de telefone não é conosco, é caso de polícia.",
        delta: 2,
        boa: false,
        reacaoDela: "Tá bom então. Levei golpe POR CAUSA de dado que só vocês tinham, mas 'não é com vocês'...",
        nota:
          "Formalmente o crime é da polícia; o CUIDADO com o titular é do " +
          "órgão. 'Não é conosco' apaga toda a boa vontade construída.",
      },
      {
        id: "t6-culpa",
        texto: "A senhora que não devia atender número desconhecido, né...",
        delta: 2,
        boa: false,
        reacaoDela: "AH, A CULPA É MINHA AGORA?! Tenha santa paciência!!",
        nota:
          "Culpar a vítima: o golpe funcionou porque o golpista TINHA os " +
          "dados. A responsabilidade pela proteção é de quem trata.",
      },
    ],
  },
  {
    id: "t7",
    dela: ["Tá certo então. Ficamos combinados como?"],
    opcoes: [
      {
        id: "t7-resumo",
        texto:
          "Resumo: segunda a senhora vem com documento; eu abro seu pedido com protocolo; resposta em até 15 dias úteis com a lista do que foi eliminado e do que a lei manda guardar; e a suspeita de vazamento já está registrada com a Encarregada. Obrigado por avisar a gente, Dona Marta!",
        delta: -1,
        boa: true,
        reacaoDela: "Combinado! Olha... começou mal, mas o senhor me atendeu direitinho. Boa tarde!",
        nota:
          "Fechamento com resumo do combinado: datas, protocolo, próximos " +
          "passos. O que começou aos berros termina em confiança — isso é DSR " +
          "bem feito.",
      },
      {
        id: "t7-tchau",
        texto: "É isso aí. Qualquer coisa a senhora liga. Boa tarde.",
        delta: 1,
        boa: false,
        reacaoDela: "'Qualquer coisa'... tá, tá. Vamos ver se sai mesmo. Boa tarde.",
        nota:
          "Sem resumo, cada um sai com um combinado diferente na cabeça — e a " +
          "diferença vira reclamação. Fechamento é parte do atendimento.",
      },
      {
        id: "t7-sumir",
        texto: "Combinados que a senhora aguarda o contato do setor responsável. Protocolo sai depois.",
        delta: 2,
        boa: false,
        reacaoDela: "SETOR RESPONSÁVEL de novo?! A gente voltou pra ESTACA ZERO?!",
        nota:
          "Terminar devolvendo ela pra fila anônima desfaz a conversa inteira. " +
          "Quem atendeu fecha — com nome, protocolo e prazo.",
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// 🕵️ DETETIVE NA REPARTIÇÃO — caça aos vazamentos na cena
// -----------------------------------------------------------------------------
// A cena é a ilustração /jogos/detetive-cena.webp (16:9). Cada vazamento é um
// retângulo em COORDENADAS PERCENTUAIS (x, y, w, h sobre a imagem) — mapeadas
// manualmente sobre a arte gerada. Tocar dentro = achou.

export type Vazamento = {
  id: string;
  nome: string;
  x: number; // % da largura (canto esquerdo)
  y: number; // % da altura (canto superior)
  w: number; // % largura
  h: number; // % altura
  porque: string;
  artigo?: string;
};

export const DETETIVE_CENA_IMG = "/jogos/detetive-cena.webp";

export const DETETIVE_VAZAMENTOS: Vazamento[] = [
  {
    id: "postit",
    nome: "Senha no post-it do monitor",
    x: 4.5, y: 39, w: 10, h: 16,
    porque:
      "A senha colada no monitor anula qualquer controle de acesso — quem " +
      "passa pelo balcão entra no sistema como se fosse o servidor.",
    artigo: "Art. 46",
  },
  {
    id: "tela-aberta",
    nome: "Tela desbloqueada com ficha aberta (cadeira vazia)",
    x: 29, y: 34, w: 15, h: 21,
    porque:
      "Sessão aberta com dados pessoais na tela e ninguém na cadeira: " +
      "qualquer pessoa lê, fotografa ou altera. Bloquear a tela ao levantar " +
      "(Win+L) é o hábito nº 1.",
    artigo: "Art. 46",
  },
  {
    id: "mural",
    nome: "Mural com fotos e dados de pessoas",
    x: 46.5, y: 17, w: 23, h: 27,
    porque:
      "Mural público com foto e informações de cidadãos/servidores é " +
      "divulgação sem finalidade nem base — dado pessoal não é decoração.",
    artigo: "Art. 6º, I",
  },
  {
    id: "lixeira",
    nome: "Lixeira com documentos INTEIROS",
    x: 42, y: 63, w: 18, h: 30,
    porque:
      "Documento com dado pessoal no lixo comum, sem triturar, é vazamento de " +
      "custo zero — basta catar. Descarte seguro tritura.",
    artigo: "Art. 16 · Art. 46",
  },
  {
    id: "celular",
    nome: "Celular desbloqueado esquecido na mesa",
    x: 58, y: 49, w: 8, h: 13,
    porque:
      "Celular funcional destravado dá acesso a e-mail, grupos e sistemas do " +
      "órgão. Esquecido na mesa, é uma credencial ambulante.",
    artigo: "Art. 46",
  },
  {
    id: "cracha",
    nome: "Crachá esquecido na mesa",
    x: 66.5, y: 51, w: 9.5, h: 19,
    porque:
      "Crachá abandonado = identidade e acesso físico à disposição de quem " +
      "pegar primeiro.",
    artigo: "Art. 46",
  },
  {
    id: "chave-porta",
    nome: "Sala de arquivo aberta com a chave na porta",
    x: 84, y: 19, w: 15.5, h: 46,
    porque:
      "O arquivo físico guarda décadas de dados pessoais — porta escancarada " +
      "com chave na fechadura é o cofre aberto da repartição.",
    artigo: "Art. 46",
  },
  {
    id: "caixa-chao",
    nome: "Caixa de arquivo aberta no chão",
    x: 81.5, y: 69, w: 18, h: 26,
    porque:
      "Pastas com dados pessoais fora do arquivo, no corredor, ao alcance de " +
      "qualquer um que passe — transporte e guarda também são tratamento.",
    artigo: "Art. 46",
  },
];

// -----------------------------------------------------------------------------
// 🔗 LIGUE OS PARES — 3 baralhos de fundamentos
// -----------------------------------------------------------------------------
// Ordens de exibição pré-embaralhadas (fixas). Toca um da esquerda, um da
// direita: certo trava verde; errado conta e libera.

export type Par = {
  id: string;
  esquerda: string;
  direita: string;
  nota: string;
};

export type Baralho = {
  id: string;
  titulo: string;
  instrucao: string;
  pares: Par[];
  ordemEsq: string[]; // ids na ordem de exibição da coluna esquerda
  ordemDir: string[]; // idem, direita
};

export const BARALHOS: Baralho[] = [
  {
    id: "bases",
    titulo: "Cenário ↔ Base legal",
    instrucao: "Ligue cada situação do dia-a-dia público à base legal correta.",
    pares: [
      {
        id: "p-matricula",
        esquerda: "Matrícula na escola municipal",
        direita: "Execução de políticas públicas (art. 7º, III)",
        nota: "Serviço público essencial — a base é a política pública, não consentimento.",
      },
      {
        id: "p-ir",
        esquerda: "Retenção de IR na folha do servidor",
        direita: "Obrigação legal (art. 7º, II)",
        nota: "A lei manda reter — o órgão não escolhe, cumpre.",
      },
      {
        id: "p-foto",
        esquerda: "Foto dos alunos nas redes da escola",
        direita: "Consentimento do responsável (art. 8º e 14)",
        nota: "Atividade opcional, com escolha real — aí sim, consentimento (específico e destacado).",
      },
      {
        id: "p-emergencia",
        esquerda: "Socorro a paciente inconsciente",
        direita: "Proteção da vida (art. 7º, VII)",
        nota: "Sem condições de consentir — a vida decide.",
      },
      {
        id: "p-prontuario",
        esquerda: "Prontuário no posto de saúde",
        direita: "Tutela da saúde (art. 11, II, 'a')",
        nota: "Dado sensível de saúde no cuidado assistencial — hipótese própria do art. 11.",
      },
    ],
    ordemEsq: ["p-foto", "p-prontuario", "p-matricula", "p-emergencia", "p-ir"],
    ordemDir: ["p-ir", "p-matricula", "p-emergencia", "p-foto", "p-prontuario"],
  },
  {
    id: "categorias",
    titulo: "Dado ↔ Categoria",
    instrucao: "Cada dado tem sua categoria — e o regime de proteção muda com ela.",
    pares: [
      {
        id: "p-religiao",
        esquerda: "Religião declarada num cadastro",
        direita: "Dado pessoal SENSÍVEL",
        nota: "Rol do art. 5º, II — proteção reforçada, hipóteses restritas (art. 11).",
      },
      {
        id: "p-cpf",
        esquerda: "CPF do cidadão",
        direita: "Dado pessoal (comum)",
        nota: "Identifica a pessoa — pessoal, mas não sensível.",
      },
      {
        id: "p-estatistica",
        esquerda: "Relatório com totais por bairro, sem nomes",
        direita: "Dado anonimizado / estatístico",
        nota: "Sem identificar ninguém, sai do alcance da LGPD (art. 12).",
      },
      {
        id: "p-prontuario2",
        esquerda: "Resultado de exame de sangue",
        direita: "Dado pessoal SENSÍVEL (saúde)",
        nota: "Todo dado de saúde é sensível — mesmo 'só uns números'.",
      },
      {
        id: "p-cnpj",
        esquerda: "CNPJ da empresa contratada",
        direita: "NÃO é dado pessoal",
        nota: "Pessoa jurídica não é titular — a LGPD protege pessoas naturais (art. 1º).",
      },
    ],
    ordemEsq: ["p-cpf", "p-cnpj", "p-religiao", "p-prontuario2", "p-estatistica"],
    ordemDir: ["p-estatistica", "p-religiao", "p-cnpj", "p-cpf", "p-prontuario2"],
  },
  {
    id: "papeis",
    titulo: "Quem é quem",
    instrucao: "Ligue cada personagem ao seu papel na LGPD.",
    pares: [
      {
        id: "p-prefeitura",
        esquerda: "Prefeitura que decide finalidade e forma do tratamento",
        direita: "Controladora",
        nota: "Quem decide o porquê e o como — e responde por tudo (art. 5º, VI).",
      },
      {
        id: "p-folha",
        esquerda: "Empresa que processa a folha por contrato",
        direita: "Operadora",
        nota: "Trata em nome do controlador, sob instruções (art. 5º, VII · art. 39).",
      },
      {
        id: "p-ana",
        esquerda: "Servidora que atende titulares e orienta o órgão",
        direita: "Encarregada (DPO)",
        nota: "O canal entre titular, órgão e ANPD (art. 41).",
      },
      {
        id: "p-cidadao",
        esquerda: "Cidadão dono dos dados",
        direita: "Titular",
        nota: "A pessoa natural a quem os dados se referem (art. 5º, V) — o protagonista da lei.",
      },
      {
        id: "p-anpd",
        esquerda: "Autoridade que fiscaliza e aplica sanções",
        direita: "ANPD",
        nota: "Zela, orienta, fiscaliza e sanciona (art. 55-J).",
      },
    ],
    ordemEsq: ["p-ana", "p-cidadao", "p-prefeitura", "p-anpd", "p-folha"],
    ordemDir: ["p-folha", "p-anpd", "p-cidadao", "p-prefeitura", "p-ana"],
  },
];

// -----------------------------------------------------------------------------
// ⚡ SPRINT 60 SEGUNDOS — sensível ou comum?
// -----------------------------------------------------------------------------

export type ItemSprint = {
  id: string;
  texto: string;
  resposta: "S" | "C"; // S = sensível · C = comum
  nota: string;
};

export const SPRINT_SEGUNDOS = 60;

export const SPRINT_ITENS: ItemSprint[] = [
  { id: "s1", texto: "Religião", resposta: "S", nota: "Rol expresso do art. 5º, II." },
  { id: "s2", texto: "CPF", resposta: "C", nota: "Identifica, mas não é do rol sensível." },
  { id: "s3", texto: "Digital do polegar (biometria)", resposta: "S", nota: "Dado biométrico = sensível." },
  { id: "s4", texto: "Endereço residencial", resposta: "C", nota: "Pessoal comum — cuidado, mas sem regime reforçado." },
  { id: "s5", texto: "Filiação a sindicato", resposta: "S", nota: "Rol expresso do art. 5º, II." },
  { id: "s6", texto: "Placa do carro", resposta: "C", nota: "Pode identificar o dono — pessoal comum." },
  { id: "s7", texto: "Resultado de exame de sangue", resposta: "S", nota: "Dado de saúde." },
  { id: "s8", texto: "Nome da mãe", resposta: "C", nota: "Pessoal comum (e adorado por golpista — proteja mesmo assim)." },
  { id: "s9", texto: "Orientação sexual", resposta: "S", nota: "Rol expresso — referente à vida sexual." },
  { id: "s10", texto: "Matrícula funcional do servidor", resposta: "C", nota: "Identificador profissional comum." },
  { id: "s11", texto: "Origem racial ou étnica", resposta: "S", nota: "Rol expresso do art. 5º, II." },
  { id: "s12", texto: "E-mail funcional", resposta: "C", nota: "Dado profissional — comum." },
  { id: "s13", texto: "Carteira de vacinação", resposta: "S", nota: "Dado de saúde — sensível." },
  { id: "s14", texto: "Telefone celular", resposta: "C", nota: "Pessoal comum." },
  { id: "s15", texto: "Opinião política", resposta: "S", nota: "Rol expresso do art. 5º, II." },
];

export function getJogo(id: string): JogoMeta | undefined {
  return JOGOS.find((j) => j.id === id);
}
