// =============================================================================
// "Saiba mais" — guia teórico de cada documento/prática do montador
// =============================================================================
// A teoria que o participante lê ANTES de praticar. 5 blocos por documento:
// o que é · quando/quem usa · como construir · erros que derrubam · base legal.
// Os "erros que derrubam" espelham de propósito as pegadinhas das atividades —
// o participante lê a cilada aqui e depois a caça na atividade.
//
// Mapa separado (por id) pra não inflar montador-docs.ts. Conteúdo em
// linguagem simples, com os artigos citados (o facilitador é DPO e revisa).

export type PassoConstrucao = { titulo: string; texto: string };
export type RefLegal = { ref: string; oque: string };

export type SaibaMais = {
  oQueE: string;
  quandoQuem: string;
  comoConstruir: PassoConstrucao[];
  errosComuns: string[];
  baseLegal: RefLegal[];
  dica?: string;
};

export const SAIBA_MAIS: Record<string, SaibaMais> = {
  // ─────────────────────────────────────────────────────────────────────────
  "aviso-privacidade": {
    oQueE:
      "É o documento PÚBLICO, em linguagem simples, que conta ao cidadão o que " +
      "o órgão faz com os dados dele: quais coleta, por quê, com quem " +
      "compartilha e como ele exerce seus direitos. É a 'cara' da " +
      "transparência do órgão.",
    quandoQuem:
      "Todo órgão que trata dados pessoais precisa ter, publicado e acessível " +
      "(no portal, no balcão, no formulário). O público é o TITULAR — o " +
      "cidadão comum. Não confundir com a Política de Proteção de Dados, que é " +
      "interna e fala com o servidor.",
    comoConstruir: [
      { titulo: "Quem somos", texto: "Identifique o órgão controlador (nome, CNPJ, sede)." },
      { titulo: "Encarregado (DPO)", texto: "Nome e contato de quem o titular procura." },
      { titulo: "Quais dados e por quê", texto: "Os dados tratados e a finalidade — dizendo claramente quando há dados sensíveis." },
      { titulo: "Base legal", texto: "O fundamento de cada tratamento (no serviço público, quase nunca é consentimento)." },
      { titulo: "Retenção", texto: "Por quanto tempo cada dado é guardado, com prazo específico." },
      { titulo: "Segurança e compartilhamento", texto: "Como protege e com quem divide, sempre com salvaguardas." },
      { titulo: "Direitos e canal", texto: "Como o titular pede acesso, correção ou exclusão — por um canal que funciona." },
    ],
    errosComuns: [
      "Declarar 'consentimento' como base num serviço público essencial (o cidadão não pode recusar e continuar atendido).",
      "Silenciar que há dados sensíveis — justamente o que mais precisa ser informado.",
      "Retenção vaga: 'pelo tempo necessário' não diz nada ao titular.",
      "Juridiquês ('outrossim', 'mutatis mutandis') num texto que é pra qualquer cidadão entender.",
      "Escrever 'não fazemos transferência internacional' sem checar se os sistemas usam nuvem no exterior.",
      "Divulgar um e-mail genérico que ninguém lê como 'canal do titular'.",
    ],
    baseLegal: [
      { ref: "Art. 9º", oque: "O titular tem direito ao acesso facilitado às informações sobre o tratamento." },
      { ref: "Art. 6º, VI", oque: "Princípio da transparência — informação clara, adequada e acessível." },
      { ref: "Art. 23, I", oque: "O poder público deve informar as hipóteses e a finalidade do tratamento." },
      { ref: "Art. 41", oque: "Indicação do Encarregado, com identidade e contato divulgados." },
    ],
    dica:
      "Teste de qualidade do Aviso: a sua mãe entenderia? Se precisou de " +
      "advogado pra ler, ele falhou na transparência.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  "politica-protecao-dados": {
    oQueE:
      "É o documento INTERNO com as regras de conduta pro servidor: como " +
      "coletar, acessar, transportar, guardar e descartar dados no dia-a-dia. " +
      "Enquanto o Aviso fala com o cidadão, a Política fala com quem trabalha " +
      "no órgão.",
    quandoQuem:
      "Vale pra todos os agentes que tratam dados — servidores, estagiários, " +
      "terceirizados. Aprovada pela alta gestão e reforçada por capacitação. É " +
      "a espinha da cultura de proteção de dados dentro da casa.",
    comoConstruir: [
      { titulo: "Objetivo e abrangência", texto: "Pra que serve e quem alcança." },
      { titulo: "Responsabilidades", texto: "Deixe claro que proteção de dados é dever de TODOS, cada um no seu papel — não só da TI." },
      { titulo: "Coleta e uso", texto: "A regra do mínimo necessário: cada dado precisa justificar sua finalidade." },
      { titulo: "Acesso", texto: "Necessidade de conhecer (need-to-know) + registro de quem acessa." },
      { titulo: "Canais e equipamentos", texto: "Dados só trafegam por meios institucionais autorizados." },
      { titulo: "Incidentes", texto: "Quem suspeita comunica o Encarregado IMEDIATAMENTE." },
      { titulo: "Guarda e descarte", texto: "Prazos definidos e descarte seguro (triturar papel, eliminar mídia)." },
    ],
    errosComuns: [
      "Tratar LGPD como 'assunto da TI' — o vazamento mais comum é humano (papel esquecido, tela aberta).",
      "Estimular a coletar 'o máximo pra não pedir depois' — o oposto da necessidade.",
      "Confundir publicidade (LAI) com liberar dado pessoal do cidadão internamente.",
      "Permitir dados no pendrive pessoal ou WhatsApp 'com promessa de apagar'.",
      "Mandar resolver incidente 'na surdina' — queima o prazo legal e impede a contenção.",
      "Descartar documento com dado pessoal no lixo comum, sem triturar.",
    ],
    baseLegal: [
      { ref: "Art. 46", oque: "Dever de adotar medidas de segurança técnicas e administrativas." },
      { ref: "Art. 47", oque: "Todos os agentes devem garantir a segurança, mesmo após o término do tratamento." },
      { ref: "Art. 50", oque: "Regras de boas práticas e governança em proteção de dados." },
      { ref: "Art. 6º, VII e VIII", oque: "Princípios da segurança e da prevenção." },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  ripd: {
    oQueE:
      "O RIPD (Relatório de Impacto à Proteção de Dados Pessoais) é o documento " +
      "que descreve os tratamentos de ALTO RISCO e as medidas para reduzi-lo. " +
      "É a lição de casa que se faz ANTES de a ANPD pedir — e que ela pode " +
      "pedir a qualquer momento.",
    quandoQuem:
      "Obrigatório quando o tratamento é de alto risco — lembra da regra 1+1 " +
      "(um critério geral + um específico)? Feito pelo controlador com o " +
      "Encarregado e as áreas envolvidas. Casos típicos: dados sensíveis em " +
      "volume, decisões automatizadas, vigilância, dados de crianças.",
    comoConstruir: [
      { titulo: "Identificação", texto: "Controlador, Encarregado e quem participou da elaboração." },
      { titulo: "Descrição do tratamento", texto: "O fluxo real: o que coleta, onde guarda, quem acessa, quando descarta." },
      { titulo: "Necessidade e proporcionalidade", texto: "Por que cada categoria de dado é necessária à finalidade." },
      { titulo: "Análise de riscos", texto: "Riscos concretos, com probabilidade × impacto (a matriz da Fase 3)." },
      { titulo: "Medidas e salvaguardas", texto: "Uma medida pra cada risco, com responsável e prazo." },
      { titulo: "Conclusão", texto: "O risco residual é aceitável? O que ainda falta? Quando reavaliar?" },
    ],
    errosComuns: [
      "Descrição genérica ('diversos dados para fins administrativos') que esconde o que o RIPD existe pra mostrar.",
      "Escrever 'não foram identificados riscos relevantes' — o atestado do RIPD de fachada.",
      "Medidas vagas: 'adotamos as melhores práticas de mercado' sem dizer quais, pra qual risco, com que dono.",
      "Conclusão-carimbo: 'plenamente em conformidade, nada a providenciar' (se não há nada, por que era alto risco?).",
      "Contradições internas — negar compartilhamento numa seção que outra seção declara.",
    ],
    baseLegal: [
      { ref: "Art. 5º, XVII", oque: "Define o relatório de impacto à proteção de dados pessoais." },
      { ref: "Art. 38", oque: "A ANPD pode determinar ao controlador a elaboração do RIPD." },
      { ref: "Art. 10, §3º", oque: "No legítimo interesse, a ANPD pode solicitar o relatório de impacto." },
      { ref: "Art. 32", oque: "A ANPD pode solicitar RIPD ao poder público." },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  pri: {
    oQueE:
      "O PRI (Plano de Resposta a Incidentes) é o roteiro que a instituição " +
      "segue no dia em que os dados vazam: quem faz o quê, em que ordem e com " +
      "quais prazos. É o extintor de incêndio — inútil se você for procurar " +
      "só quando o fogo começar.",
    quandoQuem:
      "Todo órgão deve ter, pronto e conhecido, ANTES do incidente. O público " +
      "é a equipe de resposta (ETIR) — Encarregado, TI, Jurídico, Comunicação " +
      "e o gestor da área afetada. Incidente não é 'se', é 'quando'.",
    comoConstruir: [
      { titulo: "Objetivo e equipe", texto: "Escopo, base legal e quem compõe a equipe de resposta, com contatos." },
      { titulo: "Classificação de severidade", texto: "Por tipo de dado, volume e impacto ao titular — define quem aciona e os prazos." },
      { titulo: "Detecção e notificação interna", texto: "Qualquer servidor comunica o Encarregado imediatamente, por canal direto." },
      { titulo: "Contenção e recuperação", texto: "Isolar e revogar acessos — PRESERVANDO evidências (nada de formatar)." },
      { titulo: "Comunicação", texto: "ANPD em até 3 dias úteis (havendo risco relevante) + titulares em linguagem clara." },
      { titulo: "Registro e lições", texto: "Registrar todos os incidentes e extrair melhorias do plano." },
    ],
    errosComuns: [
      "Tratar todo incidente igual, sem triagem — o grave espera o trivial na fila.",
      "Mandar abrir 'chamado comum de TI' — o prazo da ANPD morre antes da triagem.",
      "Formatar/desligar tudo na pressa: destrói a evidência que prova o que houve e a diligência.",
      "Comunicar 'só se virar notícia' — a obrigação nasce do risco ao titular, não da manchete.",
      "Registrar só os incidentes graves — os pequenos são o ensaio geral do grande.",
    ],
    baseLegal: [
      { ref: "Art. 48", oque: "Dever de comunicar à ANPD e ao titular incidente com risco relevante." },
      { ref: "Res. CD/ANPD nº 15/2024", oque: "Prazo de comunicação (3 dias úteis) e o que informar." },
      { ref: "Art. 46 e 47", oque: "Segurança e responsabilidade dos agentes de tratamento." },
      { ref: "Art. 50", oque: "Plano de resposta como parte do programa de governança." },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  "clausulas-operadores": {
    oQueE:
      "São as cláusulas de proteção de dados no CONTRATO com quem trata dados " +
      "em nome do órgão (o operador): o sistema em nuvem, a empresa da folha, " +
      "a manutenção de TI. É o que amarra o fornecedor às mesmas obrigações do " +
      "controlador.",
    quandoQuem:
      "Em todo contrato em que um terceiro acessa ou processa dados pessoais " +
      "do órgão. Cuidado a cargo do Jurídico/Procuradoria com o Encarregado. " +
      "No setor público, que vive de contrato, é frente enorme e esquecida.",
    comoConstruir: [
      { titulo: "Objeto e instruções", texto: "O operador trata os dados SÓ conforme as instruções e finalidades do órgão." },
      { titulo: "Segurança", texto: "Medidas técnicas compatíveis com o art. 46, detalhadas em anexo." },
      { titulo: "Incidentes", texto: "Comunicação ao órgão em prazo curto (ex.: 24h) — antes que o prazo da ANPD estoure." },
      { titulo: "Subcontratação", texto: "Só com anuência e repassando as mesmas obrigações ao suboperador." },
      { titulo: "Confidencialidade", texto: "Termo assinado pela equipe que acessa os dados, mantido após o desligamento." },
      { titulo: "Término", texto: "Devolução e eliminação comprovada dos dados ao fim do contrato." },
      { titulo: "Auditoria", texto: "Direito do órgão de verificar o cumprimento das cláusulas." },
    ],
    errosComuns: [
      "Deixar o operador usar os dados pra fim próprio ('aprimorar seus produtos').",
      "Aceitar cláusula que 'isenta o órgão' — a responsabilidade perante o titular não se transfere por contrato.",
      "Permitir subcontratação sem aviso — o dado passa de mão em mão sem o órgão saber onde está.",
      "Aceitar 'backup por prazo indeterminado' após o fim do contrato.",
      "Prazo de comunicação de incidente longo (30 dias) que inviabiliza o prazo do órgão com a ANPD.",
    ],
    baseLegal: [
      { ref: "Art. 39", oque: "O operador deve seguir as instruções do controlador." },
      { ref: "Art. 42", oque: "Responsabilidade e reparação — controlador e operador respondem pelos danos." },
      { ref: "Art. 46", oque: "Medidas de segurança exigíveis também do operador." },
      { ref: "Art. 48", oque: "Dever de comunicar incidentes (por isso o prazo curto no contrato)." },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  "termo-consentimento": {
    oQueE:
      "É o 'sim' formal do titular para um tratamento específico — usado " +
      "quando NÃO há outra base legal. No setor público, é a exceção, não a " +
      "regra: a maior lição é saber QUANDO ele realmente cabe.",
    quandoQuem:
      "Cabe quando o titular pode dizer não sem perder o serviço — atividades " +
      "opcionais (foto em rede social, newsletter). Para o serviço essencial, " +
      "a base é outra (política pública, obrigação legal). Dado de criança " +
      "exige consentimento de um dos pais/responsável.",
    comoConstruir: [
      { titulo: "Quando se aplica", texto: "Deixe claro que é para a atividade OPCIONAL, sem efeito sobre o serviço essencial." },
      { titulo: "Finalidade específica", texto: "O quê, onde e até quando — nada de 'finalidades futuras'." },
      { titulo: "Forma da manifestação", texto: "Ato ativo e em destaque, separado dos demais documentos." },
      { titulo: "Revogação", texto: "Direito de retirar o sim a qualquer tempo, de forma simples e gratuita." },
      { titulo: "Crianças e adolescentes", texto: "Consentimento específico e destacado de um dos pais/responsável." },
    ],
    errosComuns: [
      "Pedir consentimento 'pra tudo, por garantia' — base errada quebra o serviço quando alguém revoga.",
      "O 'casadinho': condicionar a matrícula (obrigatória) à autorização da foto (opcional).",
      "Finalidade genérica ('quaisquer finalidades futuras') — a lei a considera NULA.",
      "Consentimento por silêncio ('se não responder, consideramos aceito').",
      "Declarar o consentimento 'irrevogável' — a revogação é da essência da LGPD.",
    ],
    baseLegal: [
      { ref: "Art. 5º, XII", oque: "Consentimento é manifestação livre, informada e inequívoca." },
      { ref: "Art. 8º", oque: "Requisitos do consentimento (forma, destaque, ônus da prova)." },
      { ref: "Art. 8º, §4º e §5º", oque: "Autorização genérica é nula; consentimento pode ser revogado a qualquer momento." },
      { ref: "Art. 14, §1º", oque: "Dados de crianças: consentimento específico de um dos pais ou responsável." },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  "politica-cookies": {
    oQueE:
      "É o aviso do PORTAL sobre os cookies (os arquivinhos que o site grava " +
      "no seu dispositivo): o que são, pra que servem e como você escolhe " +
      "aceitar ou recusar. Anda junto do banner de cookies.",
    quandoQuem:
      "Todo portal que usa cookies além dos estritamente necessários. O " +
      "público é o visitante do site. Segue o Guia da ANPD sobre cookies.",
    comoConstruir: [
      { titulo: "O que são", texto: "Explique em português simples o que os cookies fazem." },
      { titulo: "Categorias", texto: "Necessários, estatísticos e de terceiros — pra permitir escolha por tipo." },
      { titulo: "Essenciais", texto: "Dispensam consentimento (o site não funciona sem eles) — mas devem ser informados." },
      { titulo: "Opt-in dos demais", texto: "Estatística e terceiros só DEPOIS do 'sim' — nunca pré-ativados." },
      { titulo: "Painel de preferências", texto: "Revisar e mudar as escolhas a qualquer momento, fácil como foi aceitar." },
      { titulo: "Prazos e terceiros", texto: "Tempo de expiração de cada cookie e lista dos cookies de terceiros." },
    ],
    errosComuns: [
      "'Ao continuar navegando, você concorda' — inércia não é consentimento.",
      "Cookies não-essenciais pré-ativados (opt-out disfarçado de comodidade).",
      "Recusar mais difícil que aceitar (protocolar ofício!) — é padrão manipulativo (dark pattern).",
      "Dizer 'não rastreamos' e usar Google Analytics gravando identificador.",
      "Comercializar dados de navegação do cidadão com parceiros.",
    ],
    baseLegal: [
      { ref: "Art. 5º, XII", oque: "Consentimento livre e inequívoco — vale pros cookies não-essenciais." },
      { ref: "Art. 7º e 11", oque: "Bases legais do tratamento (cookies essenciais x não-essenciais)." },
      { ref: "Art. 6º, VI", oque: "Transparência sobre o que se coleta e por quê." },
      { ref: "Guia ANPD sobre Cookies (2023)", oque: "Orienta banner com opções equivalentes e opt-in pros não-essenciais." },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  "resposta-titular": {
    oQueE:
      "É a resposta formal ao pedido de um cidadão que exerce seus direitos " +
      "(acesso, correção, eliminação, portabilidade...). Não é uma política — " +
      "é um documento-resposta, com prazo, forma e cuidados próprios.",
    quandoQuem:
      "Sempre que um titular procura o órgão pra exercer um direito. Quem " +
      "responde é o canal do Encarregado. O relógio corre a partir do pedido — " +
      "por isso o registro da data é o primeiro passo.",
    comoConstruir: [
      { titulo: "Registrar o pedido", texto: "Protocolo com data, canal e o direito exercido." },
      { titulo: "Validar a identidade", texto: "Antes de entregar qualquer dado — por meio proporcional (nunca pedindo senha)." },
      { titulo: "Localizar os dados", texto: "Com o Inventário como mapa dos tratamentos." },
      { titulo: "Responder claro", texto: "Em linguagem de gente, organizado — não o 'dump' bruto do sistema." },
      { titulo: "Prazo e gratuidade", texto: "Até 15 dias úteis (declaração completa) e sem cobrar taxa." },
      { titulo: "Quando não puder atender", texto: "Responder mesmo assim, com as razões, a base legal e o caminho à ANPD." },
    ],
    errosComuns: [
      "Entregar os dados ao e-mail 'informado no pedido' sem validar a identidade (pode ser golpista).",
      "Exportar o 'dump' bruto do sistema — críptico e podendo misturar dados de terceiros.",
      "Confundir com a LAI e usar o prazo dela (20+10 dias) — pedido de dados pessoais é LGPD: 15 dias úteis.",
      "Cobrar taxa pra atender — o exercício de direitos é gratuito.",
      "Arquivar o pedido inviável sem responder — toda negativa merece resposta fundamentada.",
    ],
    baseLegal: [
      { ref: "Art. 18", oque: "Direitos do titular (acesso, correção, eliminação, portabilidade...)." },
      { ref: "Art. 19, II", oque: "Prazo de até 15 dias úteis para a declaração completa." },
      { ref: "Art. 18, §5º", oque: "O exercício dos direitos é gratuito ao titular." },
      { ref: "Art. 18, §4º", oque: "Quando não puder atender, deve responder indicando as razões." },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  "inventario-ropa": {
    oQueE:
      "O Inventário (ou ROPA — Registro das Operações de Tratamento) é o MAPA " +
      "de todos os tratamentos de dados do órgão: cada processo, com seus " +
      "dados, finalidade, base legal e prazos. É a fundação — sem ele, nada do " +
      "resto se sustenta.",
    quandoQuem:
      "É a base de toda a adequação. O dono do processo preenche; o Encarregado " +
      "revisa e aprova. Alimenta o Aviso, os Riscos, o GAP e as respostas aos " +
      "titulares. No poder público, é dever registrar as operações.",
    comoConstruir: [
      { titulo: "Processo e titulares", texto: "Que serviço é, quem é o dono e de quem são os dados." },
      { titulo: "Dados e categorias", texto: "Que dados trata — marcando claramente se há sensíveis." },
      { titulo: "Base legal", texto: "O fundamento do tratamento (raramente consentimento, no setor público)." },
      { titulo: "Retenção", texto: "Prazo de guarda específico por finalidade." },
      { titulo: "Compartilhamentos", texto: "Com quem divide e sob qual justificativa." },
      { titulo: "Segurança e aprovação", texto: "As medidas de proteção e o fluxo dono → DPO com data de revisão." },
    ],
    errosComuns: [
      "Coletar dado 'pra conhecer melhor o cidadão' — excesso sem finalidade.",
      "Classificar prontuário/saúde como dado 'comum' — subestima tudo que vem depois.",
      "Registrar 'consentimento' como base de um serviço essencial.",
      "Retenção 'enquanto o sistema existir' — ausência de gestão, não prazo.",
      "Aceitar compartilhamento sem checar a finalidade (a lista de hipertensos pro marketing).",
      "Deixar a TI preencher tudo sozinha — inventário de gabinete nasce errado.",
    ],
    baseLegal: [
      { ref: "Art. 37", oque: "O controlador e o operador devem manter registro das operações de tratamento." },
      { ref: "Art. 5º, X", oque: "Define 'tratamento' — tudo que o inventário precisa mapear." },
      { ref: "Art. 6º, III", oque: "Necessidade — só o mínimo de dados para a finalidade." },
      { ref: "Art. 23", oque: "O poder público deve informar e registrar as hipóteses de tratamento." },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  "analise-risco": {
    oQueE:
      "É a ficha que mede o PERIGO de cada tratamento, cruzando probabilidade " +
      "× impacto numa matriz. Transforma 'acho que é arriscado' em uma leitura " +
      "objetiva que orienta o que priorizar.",
    quandoQuem:
      "Feita para os processos priorizados (o que veio da Fase 2). Alimenta o " +
      "Plano de Ação (risco alto vira ação) e o RIPD (nos casos de alto risco). " +
      "Conduzida pelo Encarregado com o dono do processo.",
    comoConstruir: [
      { titulo: "Processo vinculado", texto: "Todo risco aponta pra um processo do Inventário." },
      { titulo: "Descrição concreta", texto: "O cenário real, o ativo, quem é atingido e qual o dano — nada de abstrato." },
      { titulo: "Probabilidade", texto: "Estimada por fatos (frequência, fragilidade, histórico), não por otimismo." },
      { titulo: "Impacto", texto: "Medido pelo dano ao TITULAR: natureza do dado × quantidade × reversibilidade." },
      { titulo: "Severidade (P × I)", texto: "A régua MULTIPLICA: ≥6 é Alto, ≥3 é Médio. Não é média." },
      { titulo: "Medida e encaminhamento", texto: "Uma mitigação que ataca a causa, com dono e prazo → Plano de Ação." },
    ],
    errosComuns: [
      "Risco abstrato ('pode haver vazamento') — inanalisável, serve pra qualquer órgão.",
      "Probabilidade 'baixa porque nunca aconteceu' — todo incidente inédito era 'baixo' na véspera.",
      "Medir o impacto pelo constrangimento do órgão, e não pelo dano ao titular.",
      "Fazer MÉDIA em vez de multiplicar — dilui justamente os riscos que mais importam.",
      "Medida do tipo 'orientar a ter mais cuidado' — torcida não é controle.",
    ],
    baseLegal: [
      { ref: "Art. 6º, VIII", oque: "Princípio da prevenção — adotar medidas para evitar danos." },
      { ref: "Art. 46", oque: "Medidas de segurança proporcionais ao risco." },
      { ref: "Art. 5º, II", oque: "Dado sensível pesa mais no impacto." },
      { ref: "Art. 38", oque: "Risco alto pode exigir o RIPD (a análise alimenta o relatório)." },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  "checklist-gap": {
    oQueE:
      "O GAP Analysis é o diagnóstico de MATURIDADE: um checklist que compara " +
      "o que a lei pede com o que o órgão já faz, classificando cada controle " +
      "como Aderente, Parcial ou Não aderente. É a fotografia honesta de onde " +
      "você está.",
    quandoQuem:
      "Fotografia do órgão hoje, feita pelo Encarregado e pelo Comitê. Cada " +
      "lacuna (Parcial ou Não aderente) vira uma ação no Plano (Fase 5). É o " +
      "que transforma diagnóstico em trabalho priorizado.",
    comoConstruir: [
      { titulo: "Ler a evidência", texto: "Para cada controle, veja o que EXISTE de fato — não o que se pretende fazer." },
      { titulo: "Classificar", texto: "Aderente (praticado e comprovável), Parcial (cumprido pela metade) ou Não aderente." },
      { titulo: "Ser honesto", texto: "Score baixo honesto vale mais que score alto de mentira — o GAP é mapa, não prova." },
      { titulo: "Priorizar", texto: "Urgência legal e risco alto primeiro; anote também as vitórias rápidas." },
      { titulo: "Virar ações", texto: "Cada Parcial e cada Não aderente entra no Plano com dono e prazo." },
    ],
    errosComuns: [
      "Tratar intenção como aderência ('pretendemos treinar' não é treinamento feito).",
      "Marcar 'Parcial' quando a parte que falta é a essência do controle (canal do titular que não responde = Não aderente).",
      "Rigor excessivo que zera um trabalho real e evidenciado.",
      "Autoavaliação maquiada 'pra ficar bem na foto' — engana só a si mesmo.",
      "Esconder a lacuna: score alto de mentira apaga o caminho do trabalho.",
    ],
    baseLegal: [
      { ref: "Art. 50", oque: "Programa de governança e boas práticas — o que o GAP mede." },
      { ref: "Art. 6º, X", oque: "Responsabilização e prestação de contas (demonstrar as medidas)." },
      { ref: "Art. 37", oque: "Registro das operações, um dos controles avaliados." },
      { ref: "Art. 32", oque: "A ANPD pode solicitar ao poder público a demonstração de conformidade." },
    ],
  },
};

export function getSaibaMais(id: string): SaibaMais | undefined {
  return SAIBA_MAIS[id];
}
