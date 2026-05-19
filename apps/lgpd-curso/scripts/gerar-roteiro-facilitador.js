// Gera o Roteiro do Facilitador da Modalidade A (DOCX).
// Versão digital — extrai conteúdo pedagógico do Manual da Mod B e adapta para o app.
//
// Uso (do diretório apps/lgpd-curso):
//   node scripts/gerar-roteiro-facilitador.js
// Salva em:
//   E:\_________PGP\Jogo Vegas Modalidade A - Eletronico\Roteiro_Facilitador_Modalidade_A.docx

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  LevelFormat, PageBreak, Header, Footer, PageNumber,
} = require("docx");

const OUT_DIR = "E:\\_________PGP\\Jogo Vegas Modalidade A - Eletronico";
const OUT_FILE = path.join(OUT_DIR, "Roteiro_Facilitador_Modalidade_A.docx");

const border = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function p(text, opts = {}) {
  const runs = Array.isArray(text)
    ? text.map((t) => (t instanceof TextRun ? t : new TextRun(String(t))))
    : [text instanceof TextRun ? text : new TextRun(String(text))];
  return new Paragraph({
    children: runs,
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { before: opts.before || 60, after: opts.after || 120, line: 300 },
  });
}
function B(text) { return new TextRun({ text, bold: true }); }
function I(text) { return new TextRun({ text, italics: true }); }
function R(text) { return new TextRun(text); }
function H1(text, pageBreak = false) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 30, color: "1F3864" })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    pageBreakBefore: pageBreak,
  });
}
function H2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: "2E5496" })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [text instanceof TextRun ? text : new TextRun(String(text))],
    spacing: { before: 40, after: 60, line: 280 },
  });
}
function quote(text) {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, color: "555555" })],
    indent: { left: 720, right: 720 },
    spacing: { before: 120, after: 120, line: 300 },
  });
}
// Helper: push multiple quote paragraphs into a children[] array.
function quote_lines(arr, lines) {
  lines.forEach((l) => arr.push(quote(l)));
}
function cellPlain(text, width, opts = {}) {
  return new TableCell({
    borders,
    margins: cellMargins,
    width: { size: width, type: WidthType.DXA },
    shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({
      children: [new TextRun({ text: String(text), bold: opts.bold || false })],
      spacing: { before: 20, after: 20, line: 260 },
      alignment: opts.align || AlignmentType.LEFT,
    })],
  });
}
function tbl(widths, headerRow, dataRows) {
  const total = widths.reduce((a, b) => a + b, 0);
  const rows = [
    new TableRow({
      tableHeader: true,
      children: headerRow.map((h, i) =>
        cellPlain(h, widths[i], { bold: true, shade: "D5E8F0", align: AlignmentType.CENTER })),
    }),
    ...dataRows.map((r) => new TableRow({
      children: r.map((c, i) => cellPlain(c, widths[i])),
    })),
  ];
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows });
}

const CONTENT_W = 9026; // A4 - margens 1in

const children = [];

// ============================================================
// CAPA
// ============================================================
children.push(new Paragraph({
  children: [new TextRun({ text: "ROTEIRO DO FACILITADOR", bold: true, size: 44 })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 2400, after: 240 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Curso prático de LGPD — Modalidade A (Digital)", size: 28 })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 120, after: 120 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Município fictício de Vegas", italics: true, size: 22 })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 120, after: 1800 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Use em paralelo com o app PGP Treinamento", size: 22 })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 240, after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "URL do app: lgpd-curso.vercel.app  ·  Senha padrão: Curso2026!", size: 20, color: "666666" })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 80, after: 240 },
}));

// ============================================================
// 1. ANTES DA AULA
// ============================================================
children.push(H1("1. Antes da aula (D-7 a D-0)", true));

children.push(H2("D-7 — uma semana antes"));
[
  "Confirmar a infra da sala: wifi com banda suficiente pra 25 dispositivos · projetor · tomadas · mesas redondas (1 por grupo).",
  "Conferir que cada participante traz seu próprio celular (BYOD). Ter 2-3 tablets ou notebooks reserva da Casa.",
  "Enviar e-mail prévio aos participantes: senha do wifi · pedido pra trazer carregador · expectativa de 8h (4h teoria + 3h prática + 1h coffee/encerramento).",
  "Imprimir o Caderno do Participante (DOCX A5, 17 páginas) — 1 por pessoa. Encadernar grampo simples se possível.",
  "Imprimir o Briefing dos 4 processos (DOCX A4, ~4 páginas) — 1 cópia por participante.",
  "Imprimir os Murais A3 do grupo — 1 por grupo.",
  "Reservar projetor + tela ou TV grande pra mostrar o Painel do Facilitador (S5 — opcional).",
].forEach((t) => children.push(bullet(t)));

children.push(H2("D-2 — dois dias antes"));
[
  "Abrir o app PGP Treinamento → /admin/criar-turma → criar a turma do dia (nome ex: 'Out-2026'). Quantidades: 4-5 grupos (PM + CM) conforme tamanho da turma.",
  "Gerar os cartões de login (botão 'Baixar cartões de login') → salvar PDF → recortar na linha tracejada.",
  "Conferir que o admin facilitador@curso.lgpd está ativo.",
  "Fazer 1 login de teste com cada papel: dpo.g1, saude.g1, rh.g1, ti.g1, comunicacao.g1 → ver se conseguem acessar o Inventário e ver os 2 processos pré-cadastrados.",
].forEach((t) => children.push(bullet(t)));

children.push(H2("D-0 — manhã do dia"));
[
  "Chegar 60 min antes do início. Testar o wifi com 2 dispositivos simultâneos.",
  "Abrir 2 abas no notebook do facilitador: /admin/criar-turma e /facilitador.",
  "Distribuir cartões de login + Caderno do Participante + Briefing nos lugares das mesas, separados por grupo (PM verde · CM azul).",
  "Pendurar o Mural A3 em cada mesa.",
  "Testar o áudio: trilha sonora discreta opcional pra disparar o incidente (carrega no celular do facilitador via fone bluetooth).",
].forEach((t) => children.push(bullet(t)));

// ============================================================
// 2. CRONOGRAMA DO DIA
// ============================================================
children.push(H1("2. Cronograma do dia (8h total)", true));

children.push(tbl([1500, 2500, 5026],
  ["Horário", "Atividade", "O que acontece"],
  [
    ["08:30-09:00", "Recepção + café",                       "Distribuir crachás. Mostrar tela inicial do app no projetor."],
    ["09:00-09:10", "Boas-vindas + M0 (3 slides)",           "Apresentação · objetivo do dia · M0 'Onde estamos?' (slides M0.1-M0.3 — projeta o MapaPgp do app pra mostrar onde a turma se encaixa no PGP)."],
    ["09:10-10:15", "Bloco 1 — Conteúdos Didáticos",         "Slides M1 (1-12). Falas detalhadas na Seção 3.1. Equivale ao item '📚 Conteúdos Didáticos' da sidebar do app."],
    ["10:15-10:30", "Pausa",                                  "—"],
    ["10:30-11:30", "Bloco 1 (cont.) — Direitos do Titular", "Slides M2 (13-24). Casos práticos + perguntas. Ainda parte do '📚 Conteúdos Didáticos'."],
    ["11:30-12:30", "Bloco 2 — Entendendo o PGP",            "Slides M3 (25-37). Falas detalhadas na Seção 3.2. Equivale ao item '📚 Entendendo o PGP' da sidebar."],
    ["12:30-13:30", "Almoço",                                 "—"],
    ["13:30-14:00", "Bloco 3 — Fase Preliminar",             "Slides M4 (38-51) + apresentação livre. Falas na Seção 3.3. Equivale a '🚩 Fase Preliminar' da sidebar."],
    ["14:00-14:15", "Bloco 4 — Fase 2 (Diagnóstico)",         "Apresentação livre (~15min). Falas na Seção 3.4. Equivale a '🚩 Fase 2' da sidebar."],
    ["14:15-14:25", "Briefing do jogo + login",               "Explicar Vegas + grupos PM/CM + papéis. Distribuir cartões de login. Cada participante visita as 8 telas da sidebar."],
    ["14:25-17:25", "AULA PRÁTICA — 6 missões",               "Detalhamento na Seção 4 deste roteiro."],
    ["17:25-17:55", "Reflexão Final + premiação",             "Comparação dos grupos · pegadinhas reveladas · entrega de certificados."],
    ["17:55-18:00", "Encerramento",                           "Foto da turma com selo 'LGPD-Friendly'."],
  ]
));

// ============================================================
// 3. APRESENTAÇÃO INICIAL — falas dos blocos teóricos (~5h)
// ============================================================
children.push(H1("3. Apresentação inicial — falas roteirizadas", true));

children.push(p([
  R("Antes do jogo começar, "), B("~5h de apresentação teórica"),
  R(" cobrem os 4 itens de leitura da sidebar do app: Conteúdos Didáticos, Entendendo o PGP, Fase Preliminar e Fase 2. "),
  R("O facilitador projeta os slides M0-M4 (deck Slides_M1-M4_Vegas.pptx + Slides_M0_Contextualizacao.pptx mesclados) e acompanha com as falas abaixo. "),
  R("Cada bloco abaixo lista: objetivo, falas de microfone (cole-e-leia ou improvise em cima), perguntas-chave pra turma e tempo sugerido.")
]));

// 3.0 — Bloco M0 (abertura, ~10min)
children.push(H2("3.0  Bloco 0 — Abertura + Slides M0 'Onde estamos?'  ·  ~10 min"));
children.push(p([R("Objetivo: ancorar a turma. Eles precisam SABER que estão entrando na "), B("Fase 3"), R(" do PGP, e que as 3 anteriores já foram cumpridas em Vegas.")]));
children.push(p([B("Fala 1 — boas-vindas (depois de 'bom dia' protocolar):")]));
children.push(quote("\"Hoje vocês vão viver, em 3 horas, o que numa adequação real demora 6 a 12 meses. Vão errar. Vão descobrir armadilhas. Vão sair daqui sabendo onde apertar quando voltarem pras suas Casas. Errar é o objetivo do jogo — não o pecado.\""));
children.push(p([B("Fala 2 — antes de projetar o slide M0.2 (linha do tempo):")]));
children.push(quote("\"Adequar à LGPD é um caminho de 8 etapas. Antes do curso começar, em Vegas (nosso município fictício), as 3 primeiras etapas já aconteceram: alguém capacitou os servidores, alguém nomeou o DPO e formou o Comitê, alguém mapeou os setores. VOCÊS são o resultado disso. Hoje, vocês continuam o trabalho — a partir da Fase 3, onde os processos viram inventário, riscos viram matriz, e o trabalho fica visível.\""));
children.push(p([B("Apoio no app: "), R("abre na tela inicial /dashboard projetada. Mostra o "), B("MapaPgp"), R(" com a Fase 3 pulsando 'você está aqui' e clica nos cards Preliminar/Fase 1/Fase 2 pra abrir os modais explicativos.")]));
children.push(p([B("Pergunta socrática pra turma: "), I("\"Quem aqui já participou de algum treinamento de LGPD antes? Quem nunca ouviu falar?\"")]));

// 3.1 — Bloco 1 (Conteúdos Didáticos, ~2h com pausa)
children.push(H2("3.1  Bloco 1 — Conteúdos Didáticos  ·  ~2h (com pausa)"));
children.push(p([R("Objetivo: alinhar vocabulário. No fim do bloco, a turma toda deve usar os MESMOS termos. Cobre o item "), B("'📚 Conteúdos Didáticos'"), R(" da sidebar.")]));
children.push(p([B("Slides de apoio: "), R("Slides_M1-M4_Vegas.pptx → slides 1-24 (M1 Por que LGPD + M2 Direitos do Titular).")]));
children.push(p([B("Fala-chave 1 — abertura M1 (slide 'Por que LGPD?'):")]));
quote_lines(children, [
  "\"LGPD não nasceu pra burocratizar. Nasceu porque um vazamento causa dano REAL — pessoas perdem emprego, são chantageadas, sofrem golpe. O Art. 5º LXXIX da Constituição diz: proteção dos dados pessoais é DIREITO FUNDAMENTAL. Não é capricho da ANPD.\"",
]);
children.push(p([B("Fala-chave 2 — antes do slide de bases legais:")]));
quote_lines(children, [
  "\"Existem 10 bases legais no Art. 7º e 7 no Art. 11. Vocês NÃO precisam decorar todas. Precisam reconhecer que toda vez que sua organização trata dado pessoal, alguma dessas hipóteses TEM que se encaixar. Sem isso = tratamento ilegal.\"",
]);
children.push(p([B("Fala-chave 3 — abrindo o M2 (Direitos do Titular):")]));
quote_lines(children, [
  "\"O cidadão tem 9 direitos no Art. 18. Os 3 mais cobrados na prática são: confirmação (existe meu dado?), acesso (me mostra qual) e eliminação (apaga isso). Se sua Casa não tem canal pra atender esses 3, está fora da lei agora mesmo.\"",
]);
children.push(p([B("Perguntas pra turma (escolher 2-3): ")]));
[
  "\"Quem aqui já recebeu uma reclamação de cidadão pedindo dados que a Casa tinha sobre ele? Como foi tratado?\"",
  "\"Pra quem é jurídico/procuradoria: vocês conseguem identificar a base legal de algum processo que rodam sem pensar muito?\"",
  "\"Vocês acham que um vazamento de 500 prontuários médicos é mais grave que vazamento de 50.000 emails de marketing? Por quê?\"",
].forEach((t) => children.push(p([I(t)])));
children.push(p([B("Nota: "), I("após o slide 12 (fim do M1), pausa de 15min. Depois retoma com M2.")]));

// 3.2 — Bloco 2 (Entendendo o PGP, ~1h)
children.push(H2("3.2  Bloco 2 — Entendendo o PGP  ·  ~1h"));
children.push(p([R("Objetivo: explicar PGP como PROGRAMA contínuo (não projeto). Apresentar as 8 etapas. Cobre o item "), B("'📚 Entendendo o PGP'"), R(" da sidebar.")]));
children.push(p([B("Slides de apoio: "), R("Slides_M1-M4_Vegas.pptx → slides 25-37 (M3 'O PGP em 9 fases').")]));
children.push(p([B("Fala-chave 1 — abertura:")]));
quote_lines(children, [
  "\"Programa de Governança em Privacidade. Note: PROGRAMA. Não projeto. Não tem início, meio e fim — tem ciclos. Cada ano você revisa o que ficou pra trás, refaz o que mudou, melhora o que descobriu. É como manter um prédio: nunca acaba.\"",
]);
children.push(p([B("Fala-chave 2 — antes do diagrama das 8 etapas:")]));
quote_lines(children, [
  "\"As 8 etapas seguem uma ORDEM DEPENDENTE: você não consegue fazer GAP sem ter Inventário, não consegue Plano de Ação sem ter GAP, não consegue Aviso de Privacidade real sem ter RIPD. Quem pula etapa entrega ETAPA VAZIA.\"",
]);
children.push(p([B("Fala-chave 3 — ressaltando o 'aqui estamos':")]));
quote_lines(children, [
  "\"Vegas chegou na Fase 3. Vocês vão jogar a Fase 3 (Mapeamento + Riscos), Fase 4 (GAP), Fase 5 (Plano de Ação), Fase 6 (Execução: RIPD/Aviso/Terceiros/DSR) e Fase 7 (Monitoramento de Incidentes). Em ~3h. Spoiler: vão errar. Mas vão errar com método.\"",
]);
children.push(p([B("Perguntas pra turma: ")]));
[
  "\"Pra quem é DPO ou já trabalhou com adequação: em qual fase a sua organização real está hoje? Justifica.\"",
  "\"Qual fase parece mais difícil pra vocês implementarem na realidade? Por quê?\"",
].forEach((t) => children.push(p([I(t)])));

// 3.3 — Bloco 3 (Fase Preliminar, ~30min)
children.push(H2("3.3  Bloco 3 — Fase Preliminar  ·  ~30 min"));
children.push(p([R("Objetivo: explicar por que NÃO se vai direto pro Inventário. Capacitação é alicerce. Cobre o item "), B("'🚩 Fase Preliminar'"), R(" da sidebar.")]));
children.push(p([B("Slides de apoio: "), R("Slides_M1-M4_Vegas.pptx → slides 38-51 (M4 'Como o jogo cobre as 9 fases' + complementos).")]));
children.push(p([B("Fala-chave 1:")]));
quote_lines(children, [
  "\"A Fase Preliminar é onde 80% das adequações fracassam. Não por falta de software. Por falta de SENSIBILIZAÇÃO. Servidor que não entende o que é dado pessoal vai preencher Inventário no escuro. Vai botar 'sim' onde deveria botar 'não'. Vai esquecer o sensível porque acha que é normal.\"",
]);
children.push(p([B("Fala-chave 2 — sobre o trabalho de vocês:")]));
quote_lines(children, [
  "\"VOCÊS são o resultado da Fase Preliminar de Vegas. Hoje vocês entenderam dado pessoal, base legal, direito do titular. Esse 'entender' não é luxo — é PRÉ-REQUISITO pro que vem agora. Sem isso, Inventário vira teatro.\"",
]);
children.push(p([B("Fala-chave 3 — leve confronto pedagógico:")]));
quote_lines(children, [
  "\"Quando voltarem pras suas Casas, vocês vão precisar fazer o que foi feito com vocês hoje — capacitar SEUS colegas. Não dá pra adequar sozinho. Quem tenta vira o 'cara da LGPD' chato do setor. Quem capacita, vira o organizador da resistência.\"",
]);
children.push(p([B("Pergunta pra turma: ")]));
children.push(p([I("\"Pensem agora em 1 colega do seu setor que VOCÊS vão capacitar na semana seguinte. Anota o nome no caderno. Depois é cobrança.\"")]));

// 3.4 — Bloco 4 (Fase 2, ~15min)
children.push(H2("3.4  Bloco 4 — Fase 2: Diagnóstico Inicial  ·  ~15 min"));
children.push(p([R("Objetivo: explicar que ANTES do Inventário, faz-se o levantamento macro. Cobre o item "), B("'🚩 Fase 2 — Diagnóstico Inicial'"), R(" da sidebar.")]));
children.push(p([B("Slides de apoio: "), R("livre — explicar com o quadro/projetor ou direto no app (página /dashboard/fase-2 do curso).")]));
children.push(p([B("Fala-chave 1:")]));
quote_lines(children, [
  "\"Antes de detalhar processo a processo, faz-se o RAIO-X da organização. Quais setores tratam dados? Quais sistemas? Quais terceiros recebem essas bases? Não é Inventário — é fotografia do ponto de partida. Pra você saber o tamanho do problema antes de começar.\"",
]);
children.push(p([B("Fala-chave 2 — conectando com o jogo:")]));
quote_lines(children, [
  "\"Os 2 processos pré-cadastrados que vocês vão detalhar hoje — Posto de Saúde + Estagiários no caso da PM, Tribuna Livre + Ouvidoria no caso da CM — NÃO caíram do céu. Vieram desse levantamento da Fase 2 que aconteceu em Vegas antes de vocês chegarem. Foi escolha consciente: começamos pelos processos mais sensíveis.\"",
]);
children.push(p([B("Fala-chave 3 — transição pro jogo (encerramento do bloco):")]));
quote_lines(children, [
  "\"Pronto. Vocês têm o vocabulário (Bloco 1), entendem o programa (Bloco 2), reconhecem o alicerce (Bloco 3) e sabem de onde vieram os processos (Bloco 4). Agora é a hora de ENSAIAR a Fase 3 na prática. 5 missões, 3 horas, cronômetro. Bora jogar.\"",
]);

// ============================================================
// 4. AULA PRÁTICA — 6 MISSÕES (3h)
// ============================================================
children.push(H1("4. Aula prática — roteiro das 6 missões", true));

children.push(p([
  R("Tempo total: "), B("~3 horas"), R(" cronometradas + check-ins de 3 min entre missões + 15 min de Reflexão Final.")
]));
children.push(p([
  R("Princípio: "), B("errar é o objetivo, não o pecado"), R(". Deixe o grupo descobrir as armadilhas em segurança.")
]));

const MISSOES = [
  {
    n: "0", titulo: "Quem somos nós?", tempo: "5 min", quem: "DPO de cada grupo",
    objetivo: "Cada DPO loga e visita o painel inicial do app. Conferir que vê os 2 processos pré-cadastrados.",
    fala: "\"Vocês são uma equipe de servidores municipais de Vegas que decidiu adequar a Casa à LGPD por iniciativa própria. Não há apoio explícito dos chefes — mas vocês acreditam que é a coisa certa a fazer. Em 3h, vocês vão vivenciar a essência do que numa adequação real demora 6-12 meses.\"",
    nota: "Se algum DPO não conseguir logar, é checar e-mail/senha no cartão. Em último caso, reseta a turma e recria.",
  },
  {
    n: "1", titulo: "Inventário de Dados", tempo: "25 min", quem: "Donos dos processos + DPO aprova",
    objetivo: "Saúde + RH (PM) ou Cerimonial + Ouvidoria (CM) completam os 2 processos rascunhados. DPO aprova ou devolve com motivo.",
    fala: "\"Cada Contribuidor preenche o processo que conhece. Pensem na ordem: titulares (quem) → dados (o quê) → finalidade (por quê) → base legal (qual artigo da LGPD) → retenção (por quanto tempo) → compartilhamentos (com quem).\"",
    nota: "Se o grupo travar, faça pergunta socrática: 'Vocês listam crianças entre os titulares? E se tiver, qual a base legal especial?'. Não dê resposta — dê direção.",
  },
  {
    n: "2", titulo: "Análise de Riscos", tempo: "15 min", quem: "DPO + TI",
    objetivo: "Identificar 2-3 riscos por processo. Posicionar na matriz 3×3 P×I. Anotar mitigação básica.",
    fala: "\"Risco não é abstrato. É o que pode acontecer com o cidadão se algo falhar. Pensem em vazamento, uso indevido, acesso sem necessidade.\"",
    nota: "Riscos esperados PM: vazamento da base de prontuários · acesso indevido ao histórico médico. Riscos esperados CM: identificação do denunciante anônimo · uso secundário das gravações da Tribuna.",
  },
  {
    n: "3", titulo: "GAP Analysis — 10 controles", tempo: "10 min", quem: "DPO conduz, grupo discute",
    objetivo: "Responder cada um dos 10 controles (Aderente / Parcial / Não Aderente) + 1 linha de justificativa.",
    fala: "\"Não estamos avaliando onde Vegas QUER chegar. Estamos medindo onde ela está HOJE. Não tem nota baixa — tem retrato honesto. O 'Não aderente' bem registrado vira o plano de ação do próximo trimestre.\"",
    nota: "Score esperado nessa fase: 30-50%. Quem chega em 80% provavelmente está mentindo pra si próprio.",
  },
  {
    n: "4a", titulo: "RIPD + Terceiros + DSR", tempo: "8 min", quem: "DPO + donos",
    objetivo: "Criar 1 RIPD do processo crítico (8 seções ANPD) + listar 1-2 operadores com cláusulas LGPD + cadastrar 1 solicitação simulada de titular.",
    fala: "\"Estas 3 telas alimentam o Aviso de Privacidade. Sem elas preenchidas, o Aviso vai ser promessa vazia — 'temos canal pra exercer seus direitos' mas o canal não existe.\"",
    nota: "Não exigir RIPD completo. Pelo menos seção 2 (descrição) + seção 4 (riscos) + seção 5 (medidas). Depois o DPO pode aprovar mesmo incompleto, conscientemente.",
  },
  {
    n: "4b", titulo: "Aviso de Privacidade", tempo: "12 min", quem: "DPO + Comunicação/Procuradoria",
    objetivo: "Editar as 12 seções ANPD do Aviso, agora alimentadas pelas 3 telas anteriores. Publicar → momento UAU.",
    fala: "\"Transparência só vale se o que está prometido EXISTE. Vejam o quadro de pré-requisitos no topo da tela — RIPD ✓ · Terceiros ✓ · DSR ✓ — só publiquem quando estiver verde.\"",
    nota: "Quando o grupo publicar, a URL aparece no rodapé. Mostre no projetor pra todos: 'olha o aviso público do grupo X' — é o momento de orgulho.",
  },
  {
    n: "5", titulo: "🚨 Incidente Surpresa", tempo: "25 min", quem: "DPO + Procuradoria",
    objetivo: "Registrar o incidente no app, classificar severidade, gerar Comunicação ANPD + Carta aos Titulares.",
    fala_pm: "\"ATENÇÃO GRUPOS DA PREFEITURA! Acaba de ocorrer um incidente. Um pendrive sem criptografia, com prontuários e exames de 2.300 pacientes do Posto Dr. Joaquim Bento, foi encontrado num ônibus municipal de Vegas. Imprensa local pedindo posicionamento. Prefeito quer respostas até o final da tarde. Vocês têm 25 minutos.\"",
    fala_cm: "\"ATENÇÃO GRUPOS DA CÂMARA! Vazou num grupo público de WhatsApp da cidade a lista completa dos 480 inscritos da Tribuna Livre — nome, CPF, telefone, endereço e tema da fala. Vereador de oposição protocolou requerimento exigindo explicações. Vocês têm 25 minutos.\"",
    nota: "Tom dramático. Microfone, cara séria. Opcional: trilha sonora tensa de fundo. Botão 'Disparar Incidente' no Painel do Facilitador cria automaticamente um Incident.RASCUNHO em todos os grupos do órgão — eles só precisam preencher detalhes + clicar em gerar DOCX.",
  },
];

for (const m of MISSOES) {
  children.push(H2(`Missão ${m.n} — ${m.titulo}  ·  ${m.tempo}`));
  children.push(p([R("Quem conduz: "), B(m.quem)]));
  children.push(p([R("Objetivo: "), R(m.objetivo)]));
  if (m.fala) {
    children.push(p([B("Fala de microfone (cole-e-leia):")]));
    children.push(quote(m.fala));
  }
  if (m.fala_pm) {
    children.push(p([B("Fala — disparo do incidente PM:")]));
    children.push(quote(m.fala_pm));
  }
  if (m.fala_cm) {
    children.push(p([B("Fala — disparo do incidente CM:")]));
    children.push(quote(m.fala_cm));
  }
  children.push(p([B("Nota ao facilitador: "), I(m.nota)]));
}

// ============================================================
// 5. PEGADINHAS PLANTADAS
// ============================================================
children.push(H1("5. Pegadinhas plantadas — quando revelar", true));

children.push(p("As 4 pegadinhas ficam escondidas no Briefing dos processos. Grupos que flagam ganham bônus na premiação 🕵️ Olho Clínico. Revelar somente na Reflexão Final — após a Missão 5."));

children.push(H2("Pegadinha 1 — PM Posto: marketing parceiro"));
children.push(p([
  R("Texto plantado no briefing: "),
  I("\"O posto também envia relatórios mensais com lista nominal e telefone dos pacientes hipertensos e diabéticos pra uma empresa de marketing parceira do município, que vende serviço de campanhas de vacinação personalizadas via WhatsApp. A direção do posto acha que isso é OK porque é pra ajudar o paciente.\"")
]));
children.push(p([B("Por que é pegadinha: "), R("compartilhar lista nominal + dados de saúde com fim comercial NÃO é finalidade de saúde pública. Falta base legal. Provável uso indevido + ausência de DPA com o operador.")]));

children.push(H2("Pegadinha 2 — PM Estagiários: checkbox pré-marcado"));
children.push(p([
  R("Texto plantado: "),
  I("\"O e-mail automático que vai pro candidato após a inscrição também envia 'newsletter da Prefeitura' sobre eventos culturais — a caixa de check 'aceito receber comunicados' vem marcada por padrão no formulário.\"")
]));
children.push(p([B("Por que é pegadinha: "), R("consentimento marcado por padrão NÃO é consentimento válido (Art. 5º XII e Art. 8º LGPD — manifestação livre, informada, inequívoca). Padrão tem que ser opt-in.")]));

children.push(H2("Pegadinha 3 — CM Tribuna: reels Instagram"));
children.push(p([
  R("Texto plantado: "),
  I("\"Após a sessão, o setor de Comunicação publica reels no Instagram da Câmara com 'trechos das melhores falas' — incluindo nome do cidadão na legenda. Não existe formulário avisando sobre essa publicação no Instagram (só sobre o YouTube).\"")
]));
children.push(p([B("Por que é pegadinha: "), R("base legal cobre transmissão no YouTube (finalidade pública declarada), mas reels no Instagram extrapolam a finalidade declarada — uso secundário sem aviso ao titular.")]));

children.push(H2("Pegadinha 4 — CM Ouvidoria: newsletter trimestral"));
children.push(p([
  R("Texto plantado: "),
  I("\"A Ouvidoria envia trimestralmente uma 'newsletter com os principais temas das manifestações' pra TODOS os cidadãos que entraram em contato no ano. A justificativa interna é 'transparência ativa'. Base legal alegada: interesse legítimo da Câmara.\"")
]));
children.push(p([B("Por que é pegadinha: "), R("interesse legítimo aqui NÃO passa no teste de balanceamento (Art. 10 LGPD) — o titular não esperaria razoavelmente receber esse email só por ter reclamado de algo. Mistura de finalidades.")]));

// ============================================================
// 6. REFLEXÃO FINAL
// ============================================================
children.push(H1("6. Reflexão Final (15 min)", true));

children.push(H2("Estrutura sugerida"));
[
  "Mostrar o Painel do Facilitador no projetor — placar comparativo dos grupos.",
  "Perguntar pra cada grupo: 'O que mais surpreendeu vocês?' (não 'o que aprenderam' — surpresa é pedagogicamente mais valiosa).",
  "Revelar as 4 pegadinhas. Quem flagou ganha bônus 🕵️ Olho Clínico.",
  "Comparar tempo da Missão 5 entre grupos — quem foi mais rápido? Quem foi mais completo?",
  "Comparar score Maturidade — quem chegou mais alto? Por quê?",
  "Pergunta final ao grupão: 'Se a ANPD bater na porta amanhã, Vegas tem como comprovar a sua conformidade com a LGPD?'",
].forEach((t) => children.push(bullet(t)));

children.push(H2("Categorias de premiação"));
[
  "🥇 Grupo mais maduro — maior score Maturidade do PGP",
  "📜 Melhor Aviso de Privacidade — clareza pro cidadão (avaliação do facilitador)",
  "⚡ Resposta mais rápida ao incidente — menor tempo entre disparo e geração do DOCX",
  "🕵️ Olho clínico — quem flagou as pegadinhas",
].forEach((t) => children.push(bullet(t)));

// ============================================================
// 7. PLANOS B
// ============================================================
children.push(H1("7. Planos B (situações de risco)", true));

children.push(tbl([3000, 6026],
  ["Situação", "Como agir"],
  [
    ["Internet cai",
     "Distribuir o briefing impresso e continuar a discussão sem app. Quando voltar, os grupos digitam decisões já anotadas no mural do grupo."],
    ["Compute do Neon dormiu (primeiro request lento)",
     "App tem retry automático — aguardar até 15s. Se persistir, recarregar a página 1x."],
    ["Grupo termina muito antes",
     "Empurrar pra revisar decisões anteriores. Pedir aos observadores que apresentem ao grupo o 'como' da decisão (revelando lacunas)."],
    ["Grupo emperra na Missão 1",
     "Senta junto, faz pergunta socrática. Não dá resposta — dá direção."],
    ["Aluno chega atrasado",
     "Encaixa no grupo com 1 a menos. 4 ativos + 5 observadores funciona — DPO acumula 1 setor."],
    ["Cronômetro estoura na Missão 5",
     "Permite +5 min. Anuncia. Tempo se ganha cortando 1 check-in posterior."],
    ["Aluno sem celular",
     "Empresta dos 2-3 tablets reserva da Casa. Em último caso, agrupa 2 papéis num dispositivo só."],
  ]
));

// ============================================================
// 8. PÓS-AULA
// ============================================================
children.push(H1("8. Pós-aula (mesmo dia + D+7)", true));

children.push(H2("No mesmo dia (após o encerramento)"));
[
  "Tirar screenshots do Painel do Facilitador com os scores finais (vale como evidência institucional).",
  "Exportar os Avisos publicados de cada grupo (URLs /p/<slug>) — guardar como evidência pedagógica.",
  "Resetar a turma no /admin/criar-turma OU manter pra consulta dos participantes por 30 dias.",
].forEach((t) => children.push(bullet(t)));

children.push(H2("D+7 — feedback"));
[
  "Enviar formulário curto (Google Form): 3 perguntas sobre o que funcionou, o que poderia melhorar, 1 sugestão.",
  "Reler as anotações dos murais A3 fotografados — extrair padrões dos grupos pra ajustar o próximo curso.",
  "Atualizar este Roteiro com lições aprendidas (versão 1.1, 1.2, etc.).",
].forEach((t) => children.push(bullet(t)));

// ============================================================
// ANEXO — Checklist de impressão pré-aula
// ============================================================
children.push(H1("Anexo — Checklist de impressão pré-aula", true));

children.push(tbl([3500, 1500, 4026],
  ["Material", "Qtd. por turma", "Onde está"],
  [
    ["Cartões de login (PDF A4)",                        "Auto-gerado", "Botão 'Baixar cartões' em /admin/criar-turma"],
    ["Caderno do Participante (DOCX A5, 17 pgs)",        "1 por aluno",  "Pasta 'Jogo Vegas Modalidade A - Eletronico/'"],
    ["Briefing dos 4 processos (DOCX A4, ~4 pgs)",       "1 por aluno",  "Pasta 'Jogo Vegas Modalidade A - Eletronico/'"],
    ["Slides M1-M4 (PPTX)",                              "Projetor",     "Pasta 'Jogo Vegas Modalidade A - Eletronico/'"],
    ["Mural A3 (PDF/DOCX)",                              "1 por grupo",  "Pasta 'Jogo Vegas Modalidade A - Eletronico/'"],
    ["Certificado 'LGPD-Friendly' (PDF A4)",             "1 por aluno + 4 categorias", "Pasta 'Jogo Vegas Modalidade A - Eletronico/'"],
    ["Roteiro do Facilitador (este DOCX)",               "1 cópia",      "Pasta 'Jogo Vegas Modalidade A - Eletronico/'"],
  ]
));

// ============================================================
// DOCUMENT
// ============================================================
const doc = new Document({
  creator: "PGP Treinamento — Modalidade A",
  title: "Roteiro do Facilitador — Curso prático de LGPD",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: "Arial", color: "1F3864" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "2E5496" },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 },
      },
    ],
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [new TextRun({
            text: "Roteiro do Facilitador — PGP Treinamento — Modalidade A",
            size: 18, italics: true, color: "666666",
          })],
          alignment: AlignmentType.CENTER,
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: "Página ", size: 18, color: "666666" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "666666" }),
          ],
          alignment: AlignmentType.CENTER,
        })],
      }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUT_FILE, buffer);
  console.log(`✓ Roteiro gerado: ${OUT_FILE}`);
  console.log(`  Tamanho: ${(buffer.length / 1024).toFixed(1)} KB`);
}).catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
