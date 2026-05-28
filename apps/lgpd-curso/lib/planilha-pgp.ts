// Planilha do PGP — workbook Excel (.xlsx) interdependente pra implementação
// da LGPD em Instituições Públicas. 5ª peça da família (após Caderno, Resumo,
// Cartilha e Pacote). Ferramenta OPERACIONAL: o participante preenche dados
// reais e a planilha calcula scores + conecta dados entre abas via fórmulas.
//
// 13 abas: Instruções · Cadastro · Setores · Priorização · Inventário · Riscos
// · GAP · Plano · Operadores · DSR · Incidentes · Painel · Exemplo (Vegas).
//
// Decisões cravadas (2026-05-27):
//   - Cor laranja/âmbar (diferencia das 4 peças anteriores)
//   - Plano de Ação SEMI-AUTOMÁTICO (área de apoio lista pendências; usuário
//     copia pro Plano). Sem macro (órgãos bloqueiam .xlsm).
//   - Aba de Exemplo separada (Vegas) — abas de trabalho ficam limpas.
//   - Células de fórmula TRAVADAS (locked); inputs destravados. Proteção sem
//     senha — usuário desprotege em 2 cliques se precisar mexer na estrutura.
//
// Fórmulas escritas em INGLÊS (padrão exceljs) — o Excel pt-BR traduz ao abrir
// (IF→SE, MATCH→CORRESP, COUNTIF→CONT.SE, WORKDAY→DIATRABALHO, etc.).

import ExcelJS from "exceljs";

export type PlanilhaOpts = {
  nomeInstituicao?: string;
};

// ── Paleta ───────────────────────────────────────────────────────────────────
const COR_HEADER = "FFEA580C"; // laranja escuro (header de tabela)
const COR_HEADER_TXT = "FFFFFFFF";
const COR_TITULO = "FFC2410C"; // laranja mais escuro (títulos de aba)
const COR_INPUT = "FFFFFBEB"; // amarelo bem claro — célula editável
const COR_FORMULA = "FFF1F5F9"; // cinza claro — célula calculada (travada)
const COR_INSTRUCAO = "FFFEF3C7"; // amarelo claro — caixas de instrução
const COR_EXEMPLO = "FFECFEFF"; // azul-água claro — aba de exemplo

const NUM_LINHAS = 40; // linhas de input pré-formatadas por aba

// Nomes de aba SEM acento/espaço — fórmulas cross-sheet ficam robustas.
const ABA = {
  instrucoes: "Instrucoes",
  cadastro: "Cadastro",
  setores: "Setores",
  priorizacao: "Priorizacao",
  inventario: "Inventario",
  riscos: "Riscos",
  gap: "GAP",
  plano: "Plano",
  operadores: "Operadores",
  dsr: "DSR",
  incidentes: "Incidentes",
  painel: "Painel",
  exemplo: "Exemplo",
};

// ── Helpers de estilo ──────────────────────────────────────────────────────
function fill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function bordaFina(): Partial<ExcelJS.Borders> {
  const lado: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "FFCBD5E1" } };
  return { top: lado, left: lado, bottom: lado, right: lado };
}

// Cabeçalho de tabela (laranja + branco + bold), travado
function setHeaderRow(ws: ExcelJS.Worksheet, row: number, headers: string[]) {
  headers.forEach((h, i) => {
    const cell = ws.getCell(row, i + 1);
    cell.value = h;
    cell.fill = fill(COR_HEADER);
    cell.font = { bold: true, color: { argb: COR_HEADER_TXT }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = bordaFina();
    cell.protection = { locked: true };
  });
  ws.getRow(row).height = 30;
}

// Título grande no topo da aba
function setTituloAba(ws: ExcelJS.Worksheet, texto: string, subtitulo?: string) {
  ws.getCell("A1").value = texto;
  ws.getCell("A1").font = { bold: true, size: 16, color: { argb: COR_TITULO } };
  ws.getCell("A1").protection = { locked: true };
  if (subtitulo) {
    ws.getCell("A2").value = subtitulo;
    ws.getCell("A2").font = { italic: true, size: 10, color: { argb: "FF64748B" } };
    ws.getCell("A2").protection = { locked: true };
  }
}

// Marca uma faixa de células de INPUT como editável (destravada) + estilo
function marcarInput(ws: ExcelJS.Worksheet, colDe: number, colAte: number, linhaDe: number, linhaAte: number) {
  for (let r = linhaDe; r <= linhaAte; r++) {
    for (let c = colDe; c <= colAte; c++) {
      const cell = ws.getCell(r, c);
      cell.protection = { locked: false };
      cell.fill = fill(COR_INPUT);
      cell.border = bordaFina();
      cell.alignment = { vertical: "top", wrapText: true };
    }
  }
}

// Marca uma faixa como célula de FÓRMULA/calculada (travada + cinza)
function marcarFormula(ws: ExcelJS.Worksheet, colDe: number, colAte: number, linhaDe: number, linhaAte: number) {
  for (let r = linhaDe; r <= linhaAte; r++) {
    for (let c = colDe; c <= colAte; c++) {
      const cell = ws.getCell(r, c);
      cell.protection = { locked: true };
      cell.fill = fill(COR_FORMULA);
      cell.border = bordaFina();
      cell.alignment = { vertical: "top", wrapText: true };
      cell.font = { color: { argb: "FF334155" } };
    }
  }
}

// Adiciona validação de lista (dropdown) inline numa faixa.
// Nota: `dataValidations` existe em runtime no exceljs mas falta nas typings 4.x
// — daí o cast pontual pra `any`.
function dropdown(ws: ExcelJS.Worksheet, range: string, opcoes: string[]) {
  (ws as any).dataValidations.add(range, {
    type: "list",
    allowBlank: true,
    formulae: [`"${opcoes.join(",")}"`],
    showErrorMessage: true,
    errorStyle: "warning",
    error: "Selecione um valor da lista (ou apague pra deixar em branco).",
  });
}

// Dropdown puxando de outra aba (faixa de células)
function dropdownDeAba(ws: ExcelJS.Worksheet, range: string, abaOrigemRange: string) {
  (ws as any).dataValidations.add(range, {
    type: "list",
    allowBlank: true,
    formulae: [abaOrigemRange],
    showErrorMessage: false,
  });
}

// Caixa de instrução (linha mesclada amarela)
function caixaInstrucao(ws: ExcelJS.Worksheet, row: number, colSpan: number, texto: string) {
  ws.mergeCells(row, 1, row, colSpan);
  const cell = ws.getCell(row, 1);
  cell.value = texto;
  cell.fill = fill(COR_INSTRUCAO);
  cell.font = { size: 10, color: { argb: "FF92400E" }, italic: true };
  cell.alignment = { vertical: "middle", wrapText: true };
  cell.protection = { locked: true };
  ws.getRow(row).height = 42;
}

// Protege a aba (células locked ficam read-only; inputs destravados editáveis).
// Sem senha — usuário pode desproteger em Revisão > Desproteger Planilha.
function protegerAba(ws: ExcelJS.Worksheet) {
  ws.protect("", {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: true,
    formatRows: true,
    insertRows: false,
    deleteRows: false,
    sort: true,
    autoFilter: true,
  });
}

// =============================================================================
// ABA 0 — Instruções
// =============================================================================
function addInstrucoes(wb: ExcelJS.Workbook, opts: PlanilhaOpts) {
  const ws = wb.addWorksheet(ABA.instrucoes, { properties: { tabColor: { argb: COR_HEADER } } });
  ws.getColumn(1).width = 100;
  setTituloAba(ws, "Planilha do PGP — Programa de Governança em Privacidade", "Ferramenta de implementação da LGPD em Instituições Públicas");

  const linhas: Array<[string, "h" | "p" | "b"]> = [
    ["", "p"],
    ["COMO USAR ESTA PLANILHA", "h"],
    ["Esta planilha reúne, em abas que conversam entre si, os instrumentos do PGP. Você preenche os dados reais da sua Instituição e a planilha calcula scores e conecta as informações automaticamente. Funciona offline — nada é enviado pra lugar nenhum.", "p"],
    ["", "p"],
    ["ORDEM DE PREENCHIMENTO (siga as abas da esquerda pra direita)", "h"],
    ["1. Cadastro — dados da Instituição e do Encarregado (alimenta as demais abas).", "b"],
    ["2. Setores — liste os setores que tratam dados pessoais.", "b"],
    ["3. Priorizacao — pontue os processos pra decidir quais mapear primeiro (score automático).", "b"],
    ["4. Inventario — mapeie cada processo (vira fonte pros Riscos).", "b"],
    ["5. Riscos — identifique riscos por processo (severidade calculada automática).", "b"],
    ["6. GAP — avalie os controles de conformidade (% de aderência automático).", "b"],
    ["7. Plano — registre as ações (a aba sugere o que deve virar ação).", "b"],
    ["8. Operadores — cadastre os terceiros que tratam dados.", "b"],
    ["9. DSR — registre solicitações de titulares (prazo de 15 dias úteis automático).", "b"],
    ["10. Incidentes — registre incidentes (prazos ANPD e titular automáticos).", "b"],
    ["11. Painel — dashboard com indicadores consolidados (só-leitura).", "b"],
    ["", "p"],
    ["LEGENDA DE CORES", "h"],
    ["🟡 Amarelo claro = célula pra você PREENCHER.", "b"],
    ["⬜ Cinza claro = célula CALCULADA automaticamente (travada — não edite).", "b"],
    ["🟠 Laranja = cabeçalho de tabela.", "b"],
    ["", "p"],
    ["IMPORTANTE — proteção das fórmulas", "h"],
    ["As abas estão protegidas pra você não apagar fórmulas sem querer. Você consegue editar normalmente as células amarelas. Se precisar mexer na estrutura (inserir/apagar linhas), vá em Revisão > Desproteger Planilha (não há senha). Mas cuidado: apagar linhas no meio pode quebrar as fórmulas que conectam as abas.", "p"],
    ["", "p"],
    ["A aba 'Exemplo' mostra um caso fictício (Município de Vegas) totalmente preenchido — use como referência.", "b"],
    ["", "p"],
    ["Material de apoio: consulte a Cartilha do PGP e o Pacote de Modelos (documentos Word complementares a esta planilha).", "b"],
  ];

  let r = 3;
  for (const [texto, tipo] of linhas) {
    const cell = ws.getCell(r, 1);
    cell.value = texto;
    cell.protection = { locked: true };
    cell.alignment = { wrapText: true, vertical: "top" };
    if (tipo === "h") {
      cell.font = { bold: true, size: 12, color: { argb: COR_TITULO } };
    } else if (tipo === "b") {
      cell.font = { size: 11 };
    } else {
      cell.font = { size: 11 };
    }
    if (texto.length > 90) ws.getRow(r).height = 42;
    r++;
  }
  protegerAba(ws);
}

// =============================================================================
// ABA 1 — Cadastro Institucional
// =============================================================================
function addCadastro(wb: ExcelJS.Workbook, opts: PlanilhaOpts) {
  const ws = wb.addWorksheet(ABA.cadastro, { properties: { tabColor: { argb: COR_HEADER } } });
  ws.getColumn(1).width = 38;
  ws.getColumn(2).width = 60;
  setTituloAba(ws, "1 · Cadastro Institucional", "Preencha uma vez — estes dados alimentam as demais abas e o Painel.");
  caixaInstrucao(ws, 3, 2, "Os campos amarelos são referenciados automaticamente em outras abas (ex: o Painel mostra o nome da Instituição). Os 2 últimos campos (Aviso publicado / nº de RIPDs) entram no cálculo do score de maturidade do Painel.");

  const campos: Array<[string, string]> = [
    ["Nome da Instituição", opts.nomeInstituicao?.trim() || ""],
    ["CNPJ", ""],
    ["Cidade", ""],
    ["Tipo de órgão", ""],
    ["Encarregado (DPO) — Nome", ""],
    ["Encarregado — E-mail", ""],
    ["Encarregado — Telefone", ""],
    ["Encarregado — Endereço de atendimento", ""],
    ["Encarregado Substituto — Nome", ""],
    ["Comitê de Privacidade — periodicidade de reunião", ""],
    ["Aviso de Privacidade publicado? (Sim/Não)", ""],
    ["Nº de RIPDs elaborados", ""],
  ];
  let r = 5;
  for (const [rotulo, valor] of campos) {
    const cR = ws.getCell(r, 1);
    cR.value = rotulo;
    cR.font = { bold: true, size: 11 };
    cR.fill = fill(COR_FORMULA);
    cR.border = bordaFina();
    cR.protection = { locked: true };
    cR.alignment = { vertical: "middle", wrapText: true };
    const cV = ws.getCell(r, 2);
    cV.value = valor;
    cV.protection = { locked: false };
    cV.fill = fill(COR_INPUT);
    cV.border = bordaFina();
    cV.alignment = { vertical: "middle", wrapText: true };
    r++;
  }
  // dropdowns
  dropdown(ws, "B8", ["Prefeitura Municipal", "Câmara Municipal", "Autarquia", "Tribunal", "Fundação", "Outro"]);
  dropdown(ws, "B15", ["Sim", "Não"]);
  protegerAba(ws);
}

// =============================================================================
// ABA 2 — Setores
// =============================================================================
function addSetores(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet(ABA.setores, { properties: { tabColor: { argb: COR_HEADER } } });
  ws.getColumn(1).width = 40;
  ws.getColumn(2).width = 22;
  ws.getColumn(3).width = 55;
  setTituloAba(ws, "2 · Setores que tratam dados pessoais", "Liste os setores. Usados como referência nas próximas abas.");
  caixaInstrucao(ws, 3, 3, "Dica: use a Carta de Serviços do órgão pra descobrir os setores — cada serviço prestado ao cidadão tem tratamento de dados por trás.");

  const headerRow = 5;
  setHeaderRow(ws, headerRow, ["Setor", "Trata dados sensíveis?", "Observação"]);
  ws.views = [{ state: "frozen", ySplit: headerRow }];
  const ini = headerRow + 1;
  const fim = headerRow + NUM_LINHAS;
  marcarInput(ws, 1, 3, ini, fim);
  dropdown(ws, `B${ini}:B${fim}`, ["Sim", "Não"]);
  protegerAba(ws);
}

// =============================================================================
// ABA 3 — Priorização (Res. CD/ANPD nº 2/2022)
// =============================================================================
function addPriorizacao(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet(ABA.priorizacao, { properties: { tabColor: { argb: COR_HEADER } } });
  [34, 11, 13, 12, 12, 13, 16, 9, 14].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  setTituloAba(ws, "3 · Matriz de Priorização de Processos", "Critérios da Resolução CD/ANPD nº 2/2022. Pontue 1 (baixo) a 3 (alto). Score e prioridade são automáticos.");
  caixaInstrucao(ws, 3, 9, "Pra cada processo, escolha 1, 2 ou 3 em cada critério. Score (soma) e Prioridade (ALTA/MÉDIA/BAIXA) são calculados sozinhos. Processos de maior score entram primeiro no Inventário.");

  const headerRow = 5;
  setHeaderRow(ws, headerRow, [
    "Processo",
    "Volume (1-3)",
    "Sensibilidade (1-3)",
    "Vulneráveis (1-3)",
    "Exposição (1-3)",
    "Tecnologias (1-3)",
    "Compartilham. (1-3)",
    "Score",
    "Prioridade",
  ]);
  ws.views = [{ state: "frozen", ySplit: headerRow }];
  const ini = headerRow + 1;
  const fim = headerRow + NUM_LINHAS;
  marcarInput(ws, 1, 7, ini, fim); // Processo + 6 critérios
  marcarFormula(ws, 8, 9, ini, fim); // Score + Prioridade

  for (let r = ini; r <= fim; r++) {
    dropdown(ws, `B${r}:G${r}`, ["1", "2", "3"]);
    // Score = soma dos 6 critérios (só se todos preenchidos)
    ws.getCell(r, 8).value = {
      formula: `IF(COUNT(B${r}:G${r})=6,SUM(B${r}:G${r}),"")`,
    };
    // Prioridade
    ws.getCell(r, 9).value = {
      formula: `IF(H${r}="","",IF(H${r}>=13,"ALTA",IF(H${r}>=7,"MÉDIA","BAIXA")))`,
    };
  }
  // Formatação condicional na coluna Prioridade
  ws.addConditionalFormatting({
    ref: `I${ini}:I${fim}`,
    rules: [
      { type: "containsText", operator: "containsText", text: "ALTA", priority: 1, style: { fill: fill("FFFEE2E2"), font: { color: { argb: "FF991B1B" }, bold: true } } },
      { type: "containsText", operator: "containsText", text: "MÉDIA", priority: 2, style: { fill: fill("FFFEF9C3"), font: { color: { argb: "FF854D0E" }, bold: true } } },
      { type: "containsText", operator: "containsText", text: "BAIXA", priority: 3, style: { fill: fill("FFDCFCE7"), font: { color: { argb: "FF166534" }, bold: true } } },
    ],
  });
  protegerAba(ws);
}

// =============================================================================
// ABA 4 — Inventário
// =============================================================================
function addInventario(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet(ABA.inventario, { properties: { tabColor: { argb: COR_HEADER } } });
  [30, 22, 40, 34, 34, 14, 26, 30, 34, 20].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  setTituloAba(ws, "4 · Inventário de Processos", "Mapeie cada processo de tratamento. A coluna 'Processo' vira fonte pros Riscos.");
  caixaInstrucao(ws, 3, 10, "Cada linha = 1 processo de tratamento de dados pessoais. Preencha o ciclo completo: finalidade, base legal, dados, retenção, compartilhamentos e medidas de segurança.");

  const headerRow = 5;
  setHeaderRow(ws, headerRow, [
    "Processo",
    "Setor",
    "Finalidade",
    "Base legal",
    "Tipos de dados",
    "Dados sensíveis?",
    "Retenção",
    "Compartilhamentos",
    "Medidas de segurança",
    "Status",
  ]);
  ws.views = [{ state: "frozen", ySplit: headerRow }];
  const ini = headerRow + 1;
  const fim = headerRow + NUM_LINHAS;
  marcarInput(ws, 1, 10, ini, fim);
  dropdown(ws, `D${ini}:D${fim}`, [
    "Art. 7º II - obrigação legal",
    "Art. 7º III - política pública",
    "Art. 7º V - execução de contrato",
    "Art. 7º IV - proteção da vida",
    "Art. 7º VI - exercício de direitos",
    "Art. 7º IX - legítimo interesse",
    "Art. 7º I - consentimento",
    "Art. 11 - dados sensíveis",
  ]);
  dropdown(ws, `F${ini}:F${fim}`, ["Sim", "Não"]);
  dropdown(ws, `J${ini}:J${fim}`, ["Rascunho", "Em revisão", "Aprovado pelo DPO", "Devolvido"]);
  protegerAba(ws);
}

// =============================================================================
// ABA 5 — Riscos
// =============================================================================
function addRiscos(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet(ABA.riscos, { properties: { tabColor: { argb: COR_HEADER } } });
  [34, 30, 24, 16, 16, 14, 40, 18].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  setTituloAba(ws, "5 · Análise de Riscos", "Identifique riscos por processo. Severidade (matriz P×I) é automática.");
  caixaInstrucao(ws, 3, 8, "O 'Processo' é escolhido por lista, puxada do Inventário. Escolha Probabilidade e Impacto — a Severidade (BAIXO/MÉDIO/ALTO) é calculada pela matriz 3×3 automaticamente.");

  const headerRow = 5;
  setHeaderRow(ws, headerRow, [
    "Risco",
    "Processo (do Inventário)",
    "Categoria",
    "Probabilidade",
    "Impacto",
    "Severidade",
    "Plano de mitigação",
    "Status",
  ]);
  ws.views = [{ state: "frozen", ySplit: headerRow }];
  const ini = headerRow + 1;
  const fim = headerRow + NUM_LINHAS;
  const invIni = 6;
  const invFim = 6 + NUM_LINHAS - 1;
  marcarInput(ws, 1, 5, ini, fim);
  marcarFormula(ws, 6, 6, ini, fim); // severidade
  marcarInput(ws, 7, 8, ini, fim);

  // Processo: dropdown puxando do Inventário
  dropdownDeAba(ws, `B${ini}:B${fim}`, `${ABA.inventario}!$A$${invIni}:$A$${invFim}`);
  dropdown(ws, `D${ini}:D${fim}`, ["Baixa", "Média", "Alta"]);
  dropdown(ws, `E${ini}:E${fim}`, ["Baixo", "Médio", "Alto"]);
  dropdown(ws, `H${ini}:H${fim}`, ["Rascunho", "Em revisão", "Aprovado pelo DPO", "Devolvido"]);

  for (let r = ini; r <= fim; r++) {
    // Severidade pela soma de pontos (B/M/A = 1/2/3). ≤3 BAIXO · =4 MÉDIO · ≥5 ALTO
    ws.getCell(r, 6).value = {
      formula:
        `IF(OR(D${r}="",E${r}=""),"",` +
        `IF(MATCH(D${r},{"Baixa","Média","Alta"},0)+MATCH(E${r},{"Baixo","Médio","Alto"},0)>=5,"ALTO",` +
        `IF(MATCH(D${r},{"Baixa","Média","Alta"},0)+MATCH(E${r},{"Baixo","Médio","Alto"},0)=4,"MÉDIO","BAIXO")))`,
    };
  }
  ws.addConditionalFormatting({
    ref: `F${ini}:F${fim}`,
    rules: [
      { type: "containsText", operator: "containsText", text: "ALTO", priority: 1, style: { fill: fill("FFFEE2E2"), font: { color: { argb: "FF991B1B" }, bold: true } } },
      { type: "containsText", operator: "containsText", text: "MÉDIO", priority: 2, style: { fill: fill("FFFEF9C3"), font: { color: { argb: "FF854D0E" }, bold: true } } },
      { type: "containsText", operator: "containsText", text: "BAIXO", priority: 3, style: { fill: fill("FFDCFCE7"), font: { color: { argb: "FF166534" }, bold: true } } },
    ],
  });
  protegerAba(ws);
}

// =============================================================================
// ABA 6 — GAP
// =============================================================================
function addGAP(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet(ABA.gap, { properties: { tabColor: { argb: COR_HEADER } } });
  [8, 60, 24, 26, 44, 30].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  setTituloAba(ws, "6 · GAP — Análise de Conformidade", "Classifique cada controle. % de aderência calculado no Painel.");
  caixaInstrucao(ws, 3, 6, "Pra cada controle, escolha a classificação. ADERENTE = implementado e funcionando · PARCIAL = existe mas não consolidado · NÃO ADERENTE = ausente (vira ação no Plano) · APOIO PENDENTE = depende de outro setor avaliar.");

  const headerRow = 5;
  setHeaderRow(ws, headerRow, ["ID", "Controle", "Área / Fase", "Classificação", "Justificativa", "Evidência"]);
  ws.views = [{ state: "frozen", ySplit: headerRow }];

  // Pré-popula com 10 controles essenciais (pacote default do curso)
  const controles: Array<[number, string, string]> = [
    [1, "Equipe treinada em LGPD nos últimos 12 meses", "Preliminar — Capacitação"],
    [2, "Encarregado (DPO) designado por ato formal e publicado", "Fase 1 — Governança"],
    [3, "Comitê de Privacidade instituído por ato formal", "Fase 1 — Governança"],
    [4, "Inventário de processos atualizado nos últimos 12 meses", "Fase 3 — Inventário"],
    [5, "Base legal documentada por processo (Art. 7º ou 11)", "Fase 3 — Bases Legais"],
    [6, "Análise de Riscos formalizada (matriz Probabilidade × Impacto)", "Fase 3 — Riscos"],
    [7, "Plano de Ação estruturado com responsável, prazo e prioridade", "Fase 5 — Plano"],
    [8, "RIPD elaborado pra processos de alto risco (Art. 38)", "Fase 6 — RIPD"],
    [9, "Contratos com operadores contêm cláusulas LGPD (Art. 39)", "Fase 6 — Terceiros"],
    [10, "Canal pra exercício de direitos do titular (DSR) divulgado", "Fase 6 — Direitos"],
    [11, "Aviso de Privacidade publicado no portal externo (Art. 9º)", "Fase 6 — Aviso"],
    [12, "Plano de resposta a incidente formalizado e testado", "Fase 7 — Incidentes"],
  ];
  let r = headerRow + 1;
  for (const [id, texto, area] of controles) {
    ws.getCell(r, 1).value = id;
    ws.getCell(r, 2).value = texto;
    ws.getCell(r, 3).value = area;
    [1, 2, 3].forEach((c) => {
      const cell = ws.getCell(r, c);
      cell.protection = { locked: true };
      cell.fill = fill(COR_FORMULA);
      cell.border = bordaFina();
      cell.alignment = { vertical: "top", wrapText: true };
    });
    marcarInput(ws, 4, 6, r, r);
    r++;
  }
  // Linhas extras em branco pra controles adicionais
  const fimExtra = r + 13;
  marcarInput(ws, 1, 6, r, fimExtra);

  const fimTudo = fimExtra;
  dropdown(ws, `D${headerRow + 1}:D${fimTudo}`, ["ADERENTE", "PARCIAL", "NÃO ADERENTE", "APOIO PENDENTE"]);
  ws.addConditionalFormatting({
    ref: `D${headerRow + 1}:D${fimTudo}`,
    rules: [
      { type: "containsText", operator: "containsText", text: "NÃO ADERENTE", priority: 1, style: { fill: fill("FFFEE2E2"), font: { color: { argb: "FF991B1B" }, bold: true } } },
      { type: "containsText", operator: "containsText", text: "PARCIAL", priority: 2, style: { fill: fill("FFFEF9C3"), font: { color: { argb: "FF854D0E" }, bold: true } } },
      { type: "containsText", operator: "containsText", text: "ADERENTE", priority: 3, style: { fill: fill("FFDCFCE7"), font: { color: { argb: "FF166534" }, bold: true } } },
    ],
  });
  protegerAba(ws);
}

// =============================================================================
// ABA 7 — Plano de Ação (semi-automático)
// =============================================================================
function addPlano(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet(ABA.plano, { properties: { tabColor: { argb: COR_HEADER } } });
  [44, 16, 22, 26, 14, 14, 16, 30].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  setTituloAba(ws, "7 · Plano de Ação", "Cada GAP não-aderente e cada risco ALTO deve virar uma ação aqui.");

  // Área de apoio semi-automática (conta pendências das outras abas)
  const gIni = 6, gFim = 6 + NUM_LINHAS - 1;
  const rIni = 6, rFim = 6 + NUM_LINHAS - 1;
  ws.getCell("A3").value = {
    formula: `"➜ Pendências detectadas: "&COUNTIF(${ABA.gap}!D:D,"NÃO ADERENTE")&" controle(s) NÃO ADERENTE(s) no GAP + "&COUNTIF(${ABA.riscos}!F:F,"ALTO")&" risco(s) de severidade ALTA. Registre uma ação pra cada um abaixo."`,
  };
  ws.mergeCells("A3:H3");
  ws.getCell("A3").fill = fill(COR_INSTRUCAO);
  ws.getCell("A3").font = { size: 10, color: { argb: "FF92400E" }, bold: true };
  ws.getCell("A3").alignment = { vertical: "middle", wrapText: true };
  ws.getCell("A3").protection = { locked: true };
  ws.getRow(3).height = 30;

  const headerRow = 5;
  setHeaderRow(ws, headerRow, [
    "Ação",
    "Origem",
    "Referência",
    "Responsável",
    "Prioridade",
    "Prazo",
    "Status",
    "Evidência de conclusão",
  ]);
  ws.views = [{ state: "frozen", ySplit: headerRow }];
  const ini = headerRow + 1;
  const fim = headerRow + NUM_LINHAS;
  marcarInput(ws, 1, 8, ini, fim);
  dropdown(ws, `B${ini}:B${fim}`, ["GAP", "RISCO", "DIAGNÓSTICO", "MANUAL"]);
  dropdown(ws, `E${ini}:E${fim}`, ["ALTA", "MÉDIA", "BAIXA"]);
  dropdown(ws, `G${ini}:G${fim}`, ["ABERTA", "EM ANDAMENTO", "CONCLUÍDA"]);
  ws.getColumn(6).numFmt = "dd/mm/yyyy";
  ws.addConditionalFormatting({
    ref: `G${ini}:G${fim}`,
    rules: [
      { type: "containsText", operator: "containsText", text: "CONCLUÍDA", priority: 1, style: { fill: fill("FFDCFCE7"), font: { color: { argb: "FF166534" }, bold: true } } },
      { type: "containsText", operator: "containsText", text: "EM ANDAMENTO", priority: 2, style: { fill: fill("FFFEF9C3"), font: { color: { argb: "FF854D0E" } } } },
      { type: "containsText", operator: "containsText", text: "ABERTA", priority: 3, style: { fill: fill("FFFEE2E2"), font: { color: { argb: "FF991B1B" } } } },
    ],
  });
  protegerAba(ws);
}

// =============================================================================
// ABA 8 — Operadores
// =============================================================================
function addOperadores(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet(ABA.operadores, { properties: { tabColor: { argb: COR_HEADER } } });
  [34, 22, 40, 18, 18, 18, 16, 22].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  setTituloAba(ws, "8 · Operadores (Terceiros)", "Terceiros que tratam dados em nome da Instituição (Art. 39 LGPD).");
  caixaInstrucao(ws, 3, 8, "Todo contrato com operador deve ter cláusulas LGPD. Contratos antigos (pré-2020) sem cláusulas → promover aditamento (ver Pacote de Modelos).");

  const headerRow = 5;
  setHeaderRow(ws, headerRow, ["Operador", "CNPJ", "Serviço prestado", "Papel", "Contrato nº", "Cláusulas LGPD?", "Nível de risco", "Vigência (fim)"]);
  ws.views = [{ state: "frozen", ySplit: headerRow }];
  const ini = headerRow + 1;
  const fim = headerRow + NUM_LINHAS;
  marcarInput(ws, 1, 8, ini, fim);
  dropdown(ws, `D${ini}:D${fim}`, ["Operador", "Controlador conjunto"]);
  dropdown(ws, `F${ini}:F${fim}`, ["Sim", "Não", "Em aditamento"]);
  dropdown(ws, `G${ini}:G${fim}`, ["Baixo", "Médio", "Alto"]);
  ws.getColumn(8).numFmt = "dd/mm/yyyy";
  protegerAba(ws);
}

// =============================================================================
// ABA 9 — DSR
// =============================================================================
function addDSR(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet(ABA.dsr, { properties: { tabColor: { argb: COR_HEADER } } });
  [14, 16, 18, 28, 30, 16, 16, 16, 14].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  setTituloAba(ws, "9 · Direitos do Titular (DSR)", "Prazo de resposta de 15 dias úteis (Art. 19 II LGPD) calculado automático.");
  caixaInstrucao(ws, 3, 9, "Ao preencher a data de recebimento, o 'Prazo limite' (15 dias úteis) aparece sozinho. 'Dias decorridos' acompanha o andamento. Vermelho = atrasado.");

  const headerRow = 5;
  setHeaderRow(ws, headerRow, [
    "Protocolo",
    "Recebido em",
    "Canal",
    "Titular",
    "Tipo (Art. 18)",
    "Status",
    "Prazo limite",
    "Respondido em",
    "Dias úteis decorridos",
  ]);
  ws.views = [{ state: "frozen", ySplit: headerRow }];
  const ini = headerRow + 1;
  const fim = headerRow + NUM_LINHAS;
  marcarInput(ws, 1, 6, ini, fim);
  marcarFormula(ws, 7, 7, ini, fim);
  marcarInput(ws, 8, 8, ini, fim);
  marcarFormula(ws, 9, 9, ini, fim);
  ws.getColumn(2).numFmt = "dd/mm/yyyy";
  ws.getColumn(7).numFmt = "dd/mm/yyyy";
  ws.getColumn(8).numFmt = "dd/mm/yyyy";
  dropdown(ws, `C${ini}:C${fim}`, ["E-mail", "Formulário web", "Telefone", "Presencial", "Carta"]);
  dropdown(ws, `E${ini}:E${fim}`, [
    "Confirmação de tratamento",
    "Acesso",
    "Correção",
    "Anonimização/Eliminação",
    "Portabilidade",
    "Informação sobre compartilhamento",
    "Oposição",
    "Revogação de consentimento",
  ]);
  dropdown(ws, `F${ini}:F${fim}`, ["Aberta", "Em análise", "Respondida", "Negada"]);
  for (let r = ini; r <= fim; r++) {
    ws.getCell(r, 7).value = { formula: `IF(B${r}="","",WORKDAY(B${r},15))` };
    ws.getCell(r, 9).value = {
      formula: `IF(B${r}="","",IF(H${r}="",NETWORKDAYS(B${r},TODAY()),NETWORKDAYS(B${r},H${r})))`,
    };
  }
  // Atraso: respondido depois do prazo OU em aberto e já passou do prazo
  ws.addConditionalFormatting({
    ref: `G${ini}:G${fim}`,
    rules: [
      {
        type: "expression",
        priority: 1,
        formulae: [`AND($G${ini}<>"",OR(AND($H${ini}<>"",$H${ini}>$G${ini}),AND($H${ini}="",TODAY()>$G${ini})))`],
        style: { fill: fill("FFFEE2E2"), font: { color: { argb: "FF991B1B" }, bold: true } },
      },
    ],
  });
  protegerAba(ws);
}

// =============================================================================
// ABA 10 — Incidentes
// =============================================================================
function addIncidentes(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet(ABA.incidentes, { properties: { tabColor: { argb: COR_HEADER } } });
  [34, 16, 16, 16, 16, 16, 16, 16, 16].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  setTituloAba(ws, "10 · Incidentes de Segurança", "Prazos ANPD (3 dias úteis) e titular (7 dias úteis) calculados automático.");
  caixaInstrucao(ws, 3, 9, "Ao preencher 'Detectado em', os prazos de comunicação à ANPD (3 dias úteis) e aos titulares (7 dias úteis, severidade ALTA/CRÍTICA) aparecem sozinhos — Art. 48 LGPD + Res. CD/ANPD nº 15/2024.");

  const headerRow = 5;
  setHeaderRow(ws, headerRow, [
    "Incidente",
    "Severidade",
    "Status",
    "Ocorrido em",
    "Detectado em",
    "Prazo ANPD",
    "Prazo titular",
    "Comunicado ANPD?",
    "Comunicado titular?",
  ]);
  ws.views = [{ state: "frozen", ySplit: headerRow }];
  const ini = headerRow + 1;
  const fim = headerRow + NUM_LINHAS;
  marcarInput(ws, 1, 5, ini, fim);
  marcarFormula(ws, 6, 7, ini, fim);
  marcarInput(ws, 8, 9, ini, fim);
  ws.getColumn(4).numFmt = "dd/mm/yyyy";
  ws.getColumn(5).numFmt = "dd/mm/yyyy";
  ws.getColumn(6).numFmt = "dd/mm/yyyy";
  ws.getColumn(7).numFmt = "dd/mm/yyyy";
  dropdown(ws, `B${ini}:B${fim}`, ["Baixa", "Média", "Alta", "Crítica"]);
  dropdown(ws, `C${ini}:C${fim}`, ["Rascunho", "Em análise", "Encerrado"]);
  dropdown(ws, `H${ini}:H${fim}`, ["Sim", "Não", "Não aplicável"]);
  dropdown(ws, `I${ini}:I${fim}`, ["Sim", "Não", "Não aplicável"]);
  for (let r = ini; r <= fim; r++) {
    ws.getCell(r, 6).value = { formula: `IF(E${r}="","",WORKDAY(E${r},3))` };
    ws.getCell(r, 7).value = { formula: `IF(E${r}="","",WORKDAY(E${r},7))` };
  }
  ws.addConditionalFormatting({
    ref: `B${ini}:B${fim}`,
    rules: [
      { type: "containsText", operator: "containsText", text: "Crítica", priority: 1, style: { fill: fill("FFFEE2E2"), font: { color: { argb: "FF991B1B" }, bold: true } } },
      { type: "containsText", operator: "containsText", text: "Alta", priority: 2, style: { fill: fill("FFFFEDD5"), font: { color: { argb: "FF9A3412" }, bold: true } } },
    ],
  });
  protegerAba(ws);
}

// =============================================================================
// ABA 11 — Painel (dashboard só-leitura)
// =============================================================================
function addPainel(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet(ABA.painel, { properties: { tabColor: { argb: COR_TITULO } } });
  ws.getColumn(1).width = 48;
  ws.getColumn(2).width = 26;
  setTituloAba(ws, "11 · Painel de Indicadores", "Consolidado automático das demais abas. Só-leitura.");

  const invR = "6:1000"; // faixas amplas (ignoram cabeçalho via COUNTIF de texto)
  const linhas: Array<[string, ExcelJS.CellValue]> = [
    [`Instituição`, { formula: `IF(${ABA.cadastro}!B5="","(preencha o Cadastro)",${ABA.cadastro}!B5)` }],
    [`Encarregado (DPO)`, { formula: `IF(${ABA.cadastro}!B9="","(não designado)",${ABA.cadastro}!B9)` }],
    [`Processos no Inventário`, { formula: `COUNTA(${ABA.inventario}!A6:A1000)` }],
    [`Processos aprovados pelo DPO`, { formula: `COUNTIF(${ABA.inventario}!J6:J1000,"Aprovado pelo DPO")` }],
    [`Riscos identificados`, { formula: `COUNTA(${ABA.riscos}!A6:A1000)` }],
    [`Riscos de severidade ALTA`, { formula: `COUNTIF(${ABA.riscos}!F6:F1000,"ALTO")` }],
    [`Controles GAP avaliados`, { formula: `COUNTIF(${ABA.gap}!D6:D1000,"ADERENTE")+COUNTIF(${ABA.gap}!D6:D1000,"PARCIAL")+COUNTIF(${ABA.gap}!D6:D1000,"NÃO ADERENTE")` }],
    [`GAP — % de aderência`, { formula: `IF((COUNTIF(${ABA.gap}!D6:D1000,"ADERENTE")+COUNTIF(${ABA.gap}!D6:D1000,"PARCIAL")+COUNTIF(${ABA.gap}!D6:D1000,"NÃO ADERENTE"))=0,0,ROUND((COUNTIF(${ABA.gap}!D6:D1000,"ADERENTE")*100+COUNTIF(${ABA.gap}!D6:D1000,"PARCIAL")*50)/((COUNTIF(${ABA.gap}!D6:D1000,"ADERENTE")+COUNTIF(${ABA.gap}!D6:D1000,"PARCIAL")+COUNTIF(${ABA.gap}!D6:D1000,"NÃO ADERENTE"))*100)*100,0))` }],
    [`Controles NÃO ADERENTES (viram ação)`, { formula: `COUNTIF(${ABA.gap}!D6:D1000,"NÃO ADERENTE")` }],
    [`Ações no Plano`, { formula: `COUNTA(${ABA.plano}!A6:A1000)` }],
    [`Ações concluídas`, { formula: `COUNTIF(${ABA.plano}!G6:G1000,"CONCLUÍDA")` }],
    [`Operadores cadastrados`, { formula: `COUNTA(${ABA.operadores}!A6:A1000)` }],
    [`Operadores com cláusulas LGPD`, { formula: `COUNTIF(${ABA.operadores}!F6:F1000,"Sim")` }],
    [`Solicitações DSR`, { formula: `COUNTA(${ABA.dsr}!A6:A1000)` }],
    [`Incidentes registrados`, { formula: `COUNTA(${ABA.incidentes}!A6:A1000)` }],
    [`Aviso de Privacidade publicado`, { formula: `IF(${ABA.cadastro}!B15="","(não informado)",${ABA.cadastro}!B15)` }],
    [`RIPDs elaborados`, { formula: `IF(${ABA.cadastro}!B16="",0,${ABA.cadastro}!B16)` }],
  ];

  let r = 4;
  for (const [rotulo, valor] of linhas) {
    const cR = ws.getCell(r, 1);
    cR.value = rotulo;
    cR.font = { bold: true, size: 11 };
    cR.fill = fill(COR_FORMULA);
    cR.border = bordaFina();
    cR.protection = { locked: true };
    cR.alignment = { vertical: "middle", wrapText: true };
    const cV = ws.getCell(r, 2);
    cV.value = valor;
    cV.fill = fill("FFFFFFFF");
    cV.border = bordaFina();
    cV.protection = { locked: true };
    cV.font = { size: 12, bold: true, color: { argb: COR_TITULO } };
    cV.alignment = { vertical: "middle", horizontal: "center" };
    r++;
  }

  // Score de maturidade (mesma ponderação do app, adaptada aos dados da planilha)
  // Inventário 25 · GAP 20 · Aviso 15 · RIPDs 10 · Riscos 10 · Terceiros 5 · DSR 5 (÷90 ×100)
  const cAprov = `COUNTIF(${ABA.inventario}!J6:J1000,"Aprovado pelo DPO")`;
  const cInvTotal = `COUNTA(${ABA.inventario}!A6:A1000)`;
  const cGapScore = `IF((COUNTIF(${ABA.gap}!D6:D1000,"ADERENTE")+COUNTIF(${ABA.gap}!D6:D1000,"PARCIAL")+COUNTIF(${ABA.gap}!D6:D1000,"NÃO ADERENTE"))=0,0,(COUNTIF(${ABA.gap}!D6:D1000,"ADERENTE")*100+COUNTIF(${ABA.gap}!D6:D1000,"PARCIAL")*50)/((COUNTIF(${ABA.gap}!D6:D1000,"ADERENTE")+COUNTIF(${ABA.gap}!D6:D1000,"PARCIAL")+COUNTIF(${ABA.gap}!D6:D1000,"NÃO ADERENTE"))*100))`;
  const cAviso = `IF(${ABA.cadastro}!B15="Sim",1,0)`;
  const cRipds = `IF(${ABA.cadastro}!B16="",0,${ABA.cadastro}!B16)`;
  const cRiscos = `COUNTA(${ABA.riscos}!A6:A1000)`;
  const cTerceiros = `COUNTIF(${ABA.operadores}!F6:F1000,"Sim")`;
  const cDsr = `COUNTA(${ABA.dsr}!A6:A1000)`;

  const fMaturidade =
    `ROUND(MIN(100,(` +
    `25*IF(${cAprov}>=2,1,IF(${cAprov}=1,0.5,IF(${cInvTotal}>0,0.25,0)))` +
    `+20*(${cGapScore})` +
    `+15*${cAviso}` +
    `+MIN(10,${cRipds}*5)` +
    `+MIN(10,${cRiscos}*3)` +
    `+MIN(5,${cTerceiros}*2.5)` +
    `+IF(${cDsr}>=2,5,IF(${cDsr}=1,3,0))` +
    `)*100/90),0)`;

  r += 1;
  ws.getCell(r, 1).value = "SCORE DE MATURIDADE DO PGP (0-100)";
  ws.getCell(r, 1).font = { bold: true, size: 13, color: { argb: COR_HEADER_TXT } };
  ws.getCell(r, 1).fill = fill(COR_HEADER);
  ws.getCell(r, 1).border = bordaFina();
  ws.getCell(r, 1).protection = { locked: true };
  ws.getCell(r, 1).alignment = { vertical: "middle" };
  ws.getCell(r, 2).value = { formula: fMaturidade };
  ws.getCell(r, 2).font = { bold: true, size: 18, color: { argb: COR_HEADER } };
  ws.getCell(r, 2).fill = fill("FFFFFFFF");
  ws.getCell(r, 2).border = bordaFina();
  ws.getCell(r, 2).protection = { locked: true };
  ws.getCell(r, 2).alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(r).height = 30;

  // Nível qualitativo
  r += 1;
  ws.getCell(r, 1).value = "Nível";
  ws.getCell(r, 1).font = { bold: true, size: 11 };
  ws.getCell(r, 1).fill = fill(COR_FORMULA);
  ws.getCell(r, 1).border = bordaFina();
  ws.getCell(r, 1).protection = { locked: true };
  ws.getCell(r, 2).value = {
    formula: `IF(B${r - 1}>=80,"Excelência",IF(B${r - 1}>=60,"Consolidado",IF(B${r - 1}>=40,"Em construção",IF(B${r - 1}>=20,"Inicial","Não iniciado"))))`,
  };
  ws.getCell(r, 2).font = { bold: true, size: 12, color: { argb: COR_TITULO } };
  ws.getCell(r, 2).fill = fill("FFFFFFFF");
  ws.getCell(r, 2).border = bordaFina();
  ws.getCell(r, 2).protection = { locked: true };
  ws.getCell(r, 2).alignment = { vertical: "middle", horizontal: "center" };

  r += 2;
  ws.getCell(r, 1).value = "Score = ponderação Inventário 25 · GAP 20 · Aviso 15 · RIPDs 10 · Riscos 10 · Terceiros 5 · DSR 5 (normalizado 0-100). Mesma lógica do app do curso.";
  ws.mergeCells(r, 1, r, 2);
  ws.getCell(r, 1).font = { italic: true, size: 9, color: { argb: "FF94A3B8" } };
  ws.getCell(r, 1).alignment = { wrapText: true };
  ws.getCell(r, 1).protection = { locked: true };
  ws.getRow(r).height = 40;

  protegerAba(ws);
}

// =============================================================================
// ABA 12 — Exemplo (Vegas) — caso fictício preenchido, só-leitura
// =============================================================================
function addExemplo(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet(ABA.exemplo, { properties: { tabColor: { argb: "FF0891B2" } } });
  [30, 26, 40, 30].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  setTituloAba(ws, "📋 Exemplo preenchido — Município de Vegas (fictício)", "Use como referência. NÃO edite aqui — preencha suas abas de trabalho.");

  let r = 4;
  const sec = (titulo: string) => {
    ws.getCell(r, 1).value = titulo;
    ws.mergeCells(r, 1, r, 4);
    ws.getCell(r, 1).font = { bold: true, size: 12, color: { argb: COR_TITULO } };
    ws.getCell(r, 1).fill = fill(COR_EXEMPLO);
    ws.getCell(r, 1).protection = { locked: true };
    ws.getRow(r).height = 22;
    r++;
  };
  const linha = (cols: string[], header = false) => {
    cols.forEach((t, i) => {
      const cell = ws.getCell(r, i + 1);
      cell.value = t;
      cell.protection = { locked: true };
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = bordaFina();
      if (header) {
        cell.fill = fill(COR_HEADER);
        cell.font = { bold: true, color: { argb: COR_HEADER_TXT }, size: 10 };
      } else {
        cell.fill = fill("FFFFFFFF");
        cell.font = { size: 10 };
      }
    });
    r++;
  };

  sec("Cadastro");
  linha(["Campo", "Valor"], true);
  linha(["Instituição", "Prefeitura Municipal de Vegas"]);
  linha(["Encarregada (DPO)", "Maria Silva Santos — dpo@vegas.gov.br"]);
  linha(["Aviso publicado?", "Sim"]);
  r++;

  sec("Priorização (exemplo de 1 processo)");
  linha(["Processo", "Critérios (V/S/Vu/E/T/C)", "Score", "Prioridade"], true);
  linha(["Atendimento no Posto de Saúde", "3/3/2/1/2/2", "13", "ALTA"]);
  r++;

  sec("Inventário (exemplo)");
  linha(["Processo", "Base legal", "Dados", "Retenção"], true);
  linha(["Atendimento no Posto de Saúde", "Art. 7º III + Art. 11", "Cadastrais + saúde (sensíveis)", "20 anos (CFM)"]);
  linha(["Folha de Pagamento", "Art. 7º II (obrigação legal)", "Cadastrais + bancários + dependentes", "75 anos (previdenciário)"]);
  r++;

  sec("Riscos (exemplo)");
  linha(["Risco", "Probabilidade", "Impacto", "Severidade"], true);
  linha(["Acesso indevido à folha por servidor", "Alta", "Médio", "ALTO"]);
  r++;

  sec("GAP (exemplo)");
  linha(["Controle", "Classificação", "Justificativa", ""], true);
  linha(["Encarregado designado por ato formal", "ADERENTE", "Portaria 03/2026 publicada", ""]);
  linha(["Cláusulas LGPD nos contratos", "NÃO ADERENTE", "30 contratos, só 5 com cláusulas → vira ação", ""]);
  r++;

  sec("DSR (exemplo)");
  linha(["Tipo", "Recebido em", "Prazo limite (15 dias úteis)", "Status"], true);
  linha(["Acesso", "10/04/2027", "02/05/2027", "Respondida (8 dias úteis)"]);

  protegerAba(ws);
}

// =============================================================================
// FUNÇÃO PRINCIPAL
// =============================================================================
export async function gerarPlanilhaPGP(opts: PlanilhaOpts = {}): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "PGP Treinamento — Curso prático de LGPD";
  wb.created = new Date();
  wb.title = opts.nomeInstituicao
    ? `Planilha do PGP — ${opts.nomeInstituicao}`
    : "Planilha do PGP — Implementação da LGPD";
  // Recalcular fórmulas ao abrir (garante valores corretos sem result pré-computado)
  wb.calcProperties.fullCalcOnLoad = true;

  addInstrucoes(wb, opts);
  addCadastro(wb, opts);
  addSetores(wb);
  addPriorizacao(wb);
  addInventario(wb);
  addRiscos(wb);
  addGAP(wb);
  addPlano(wb);
  addOperadores(wb);
  addDSR(wb);
  addIncidentes(wb);
  addPainel(wb);
  addExemplo(wb);

  return wb.xlsx.writeBuffer();
}
