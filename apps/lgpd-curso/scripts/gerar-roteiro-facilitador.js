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
    ["09:00-09:15", "Boas-vindas + apresentação",            "Quem somos · objetivo do dia · regras da casa (errar é o objetivo, perguntas a qualquer momento)."],
    ["09:15-10:15", "M1 — Por que LGPD",                     "Slides M1 (slides 1-12). Foco: contexto histórico + direito fundamental art. 5º LXXIX."],
    ["10:15-10:30", "Pausa",                                  "—"],
    ["10:30-11:30", "M2 — Direitos do Titular",              "Slides M2 (13-24). Casos práticos + perguntas."],
    ["11:30-12:30", "M3 — Estrutura do PGP",                 "Slides M3 (25-38). Apresenta as 9 fases + organograma do PGP."],
    ["12:30-13:30", "Almoço",                                 "—"],
    ["13:30-14:00", "M4 — Incidentes + RIPD",                "Slides M4 (39-50). Foco em art. 48 + Res. ANPD 15/2024."],
    ["14:00-14:15", "Briefing do jogo",                       "Explicar Vegas + grupos PM/CM + papéis. Distribuir cartões de login."],
    ["14:15-14:25", "Configurar dispositivos",                "Cada participante faz login + visita as 8 telas da sidebar (~3 min)."],
    ["14:25-17:25", "AULA PRÁTICA — 6 missões",               "Detalhamento na Seção 3 deste roteiro."],
    ["17:25-17:55", "Reflexão Final + premiação",             "Comparação dos grupos · pegadinhas reveladas · entrega de certificados."],
    ["17:55-18:00", "Encerramento",                           "Foto da turma com selo 'LGPD-Friendly'."],
  ]
));

// ============================================================
// 3. AULA PRÁTICA — 6 MISSÕES (3h)
// ============================================================
children.push(H1("3. Aula prática — roteiro das 6 missões", true));

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
// 4. PEGADINHAS PLANTADAS
// ============================================================
children.push(H1("4. Pegadinhas plantadas — quando revelar", true));

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
// 5. REFLEXÃO FINAL
// ============================================================
children.push(H1("5. Reflexão Final (15 min)", true));

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
// 6. PLANOS B
// ============================================================
children.push(H1("6. Planos B (situações de risco)", true));

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
// 7. PÓS-AULA
// ============================================================
children.push(H1("7. Pós-aula (mesmo dia + D+7)", true));

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
