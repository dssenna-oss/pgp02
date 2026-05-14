/**
 * Aggregator do Inventário pra Políticas Institucionais.
 *
 * Funções neste arquivo transformam os processos cadastrados no
 * Inventário (DataInventory) em conteúdo agregado e GENÉRICO usado
 * em políticas públicas — por exemplo no Aviso de Privacidade Externo,
 * que precisa expor categorias amplas de dados (não dados específicos
 * por processo) ao mesmo tempo que mantém coerência com o Inventário
 * pra fins de fiscalização.
 *
 * Os 3 placeholders renderizados aqui:
 *   - {{categorias_dados}}       → bullet list com categorias presentes
 *   - {{matriz_tratamento}}      → tabela Finalidades × Titulares × Hipóteses Legais × Categorias
 *   - {{tipos_compartilhamento}} → bullet list de operadores/parceiros agregados
 *
 * Categorias adotadas — modelo da ANPD (5 do Aviso de Privacidade
 * institucional) + 5 categorias adicionais comuns em órgãos públicos:
 *
 *   1. Cadastrais e de identificação
 *   2. Comunicações eletrônicas
 *   3. Interação com agentes de tratamento
 *   4. Denúncias
 *   5. Encarregados/representantes legais
 *   6. Financeiros e bancários
 *   7. Profissionais e funcionais
 *   8. Sensíveis (saúde/biometria/etnia/religião/orientação)
 *   9. Demográficos
 *   10. Documentação fiscal e regulatória
 *
 * O mapeamento campo→categoria é heurístico (regex sobre o texto bruto
 * de `personalData` de cada processo). Não é perfeito — DPO sempre
 * tem o snapshot pra revisar/editar antes de publicar.
 */

export interface AggregatedSnapshot {
  /** Quantos processos do Inventário foram considerados (status APROVADO). */
  processesCount: number;
  /** Categorias de dados presentes (chaves em `CATEGORY_LABELS`), ordenadas por contagem. */
  categories: Array<{
    key: CategoryKey;
    label: string;
    count: number;
    /** Exemplos de dados (não exaustivos) — máx 4 por categoria. */
    examples: string[];
  }>;
  /** Linhas da matriz de tratamento. */
  matrix: Array<{
    finalidades: string[];
    titulares: string[];
    hipoteses: string[];
    categorias: string[];
  }>;
  /** Tipos de compartilhamento agregados. */
  compartilhamentos: Array<{
    label: string;
    examples: string[]; // nomes específicos opcionais
  }>;
  /** Quando o snapshot foi gerado. */
  generatedAt: string; // ISO
}

export type CategoryKey =
  | "cadastrais"
  | "comunicacoes"
  | "interacao"
  | "denuncias"
  | "encarregados"
  | "financeiros"
  | "profissionais"
  | "sensiveis"
  | "demograficos"
  | "fiscais";

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  cadastrais: "Cadastrais e de identificação",
  comunicacoes: "Relacionados a comunicações eletrônicas",
  interacao: "Interação de titular com agentes de tratamento",
  denuncias: "Informações sobre denúncias",
  encarregados: "Informações sobre encarregados ou representantes legais",
  financeiros: "Financeiros e bancários",
  profissionais: "Profissionais e funcionais",
  sensiveis: "Dados pessoais sensíveis (saúde, biometria, etnia, religião, orientação)",
  demograficos: "Demográficos",
  fiscais: "Documentação fiscal e regulatória",
};

/**
 * Heurística de classificação: dado um trecho de texto bruto (ex.: o
 * campo `personalData` de DataInventory), retorna o conjunto de
 * categorias presentes. O mesmo processo pode contribuir pra várias.
 */
export function classifyDataText(rawText: string): Set<CategoryKey> {
  const text = rawText.toLowerCase();
  const result = new Set<CategoryKey>();

  // Cadastrais — sinais clássicos (CPF, RG, nome, endereço, data nasc.)
  if (
    /\b(cpf|rg|nome\s+(completo|civil)?|nome|sobrenome|data.*nasc|endere[çc]o|cep|naturalidade|nacionalidade|filia[çc][aã]o|estado\s+civil)\b/.test(
      text,
    )
  ) {
    result.add("cadastrais");
  }

  // Comunicações eletrônicas — e-mail, telefone, IP, MAC, endereço web
  if (
    /\b(e-?mail|email|correio\s+eletr|telefone|celular|whatsapp|endere[çc]o\s+ip|\bip\b|mac\s+address|navega[çc][aã]o|cookies?|p[áa]ginas?\s+acessadas?)\b/.test(
      text,
    )
  ) {
    result.add("comunicacoes");
  }

  // Interação com agentes — petição, requerimento, reclamação, ouvidoria
  if (
    /\b(peti[çc][aã]o|requerimento|reclama[çc][aã]o|ouvidoria|chamado|protocolo|atendimento)\b/.test(
      text,
    )
  ) {
    result.add("interacao");
  }

  // Denúncias
  if (/\b(den[úu]ncia|denunciante|whistleblower|delator|infra[çc][aã]o)\b/.test(text)) {
    result.add("denuncias");
  }

  // Encarregados / representantes legais
  if (
    /\b(encarregado|dpo|representante\s+legal|procurador|outorga|advogado)\b/.test(text)
  ) {
    result.add("encarregados");
  }

  // Financeiros e bancários
  if (
    /\b(conta\s+banc|ag[êe]ncia|banco|pix|cart[ãa]o|sal[áa]rio|renda|fatura|pagamento|cobran[çc]a|boleto|transfer[êe]ncia\s+banc)\b/.test(
      text,
    )
  ) {
    result.add("financeiros");
  }

  // Profissionais e funcionais
  if (
    /\b(cargo|matr[íi]cula|lota[çc][aã]o|v[íi]nculo|fun[çc][aã]o|departamento|sequencial|servidor|prestador|estagi[áa]rio|terceirizado|exerc[íi]cio|posto)\b/.test(
      text,
    )
  ) {
    result.add("profissionais");
  }

  // Dados sensíveis (Art. 5º, II e Art. 11 LGPD)
  if (
    /\b(sa[úu]de|prontu[áa]rio|exame|atestado|m[ée]dico|laudo|biom[ée]trico|biometria|impress[ãa]o\s+digital|reconhecimento\s+facial|identidade\s+de\s+g[êe]nero|orienta[çc][aã]o\s+sexual|religi[ãa]o|cren[çc]a|filia[çc][aã]o\s+sindical|filia[çc][aã]o\s+partid|dado\s+gen[ée]tico|origem\s+(racial|[ée]tnica)|ra[çc]a|etnia)\b/.test(
      text,
    )
  ) {
    result.add("sensiveis");
  }

  // Demográficos
  if (
    /\b(idade|data\s+de\s+nascimento|g[êe]nero|sexo|escolaridade|estado\s+civil|cidade|estado|uf|munic[íi]pio|localiza[çc][aã]o)\b/.test(
      text,
    )
  ) {
    result.add("demograficos");
  }

  // Documentação fiscal e regulatória
  if (
    /\b(cnpj|inscri[çc][aã]o\s+(estadual|municipal)|nota\s+fiscal|certid[ãa]o|registro|alvar[áa]|licen[çc]a|cnh|titulo\s+de\s+eleitor|t[ée]rmo\s+de|contrato)\b/.test(
      text,
    )
  ) {
    result.add("fiscais");
  }

  return result;
}

/**
 * Quebra o texto em "tokens" curtos pra usar como exemplos por categoria.
 * Ex.: "Nome, CPF, e-mail" → ["nome", "cpf", "e-mail"].
 */
function splitExamples(text: string): string[] {
  return text
    .split(/[,;]+|\bou\b|\be\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 40)
    .slice(0, 8);
}

interface InventoryProcess {
  serviceName: string;
  personalData: string;
  legalBasis: string;
  purpose: string;
  dataSubjects: string;
  sharing: string | null;
  status: string;
}

interface OperatorRecord {
  name: string;
  cnpj?: string | null;
  /** "INDEFINIDO" | "OPERADOR" | "CONTROLADOR" | "CO_CONTROLADOR" */
  relationType?: string | null;
  /** Categorização: CLOUD/PAGAMENTOS/MARKETING/RH/AUDITORIA/LOGISTICA/TI/JURIDICO/SAUDE/OUTRO. */
  operatorType?: string | null;
}

/**
 * Função principal: agrega os dados do Inventário (apenas processos
 * APROVADOS) + Operadores em uma estrutura serializável.
 */
export function aggregateInventoryData(
  processes: InventoryProcess[],
  operators: OperatorRecord[] = [],
): AggregatedSnapshot {
  // Apenas processos APROVADOS entram no snapshot público — rascunhos e
  // submetidos não devem aparecer em política externa publicada.
  const approved = processes.filter((p) => p.status === "APROVADO");

  // 1) Categorias de dados — agrega de personalData de todos processos
  const categoryCount: Record<CategoryKey, number> = {
    cadastrais: 0,
    comunicacoes: 0,
    interacao: 0,
    denuncias: 0,
    encarregados: 0,
    financeiros: 0,
    profissionais: 0,
    sensiveis: 0,
    demograficos: 0,
    fiscais: 0,
  };
  const categoryExamples: Record<CategoryKey, Set<string>> = {
    cadastrais: new Set(),
    comunicacoes: new Set(),
    interacao: new Set(),
    denuncias: new Set(),
    encarregados: new Set(),
    financeiros: new Set(),
    profissionais: new Set(),
    sensiveis: new Set(),
    demograficos: new Set(),
    fiscais: new Set(),
  };

  for (const proc of approved) {
    const detected = classifyDataText(proc.personalData);
    const tokens = splitExamples(proc.personalData);

    for (const cat of detected) {
      categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
      // Adiciona os tokens cuja heurística também classifica nessa categoria
      for (const tok of tokens) {
        if (classifyDataText(tok).has(cat)) {
          if (categoryExamples[cat].size < 4) {
            categoryExamples[cat].add(tok);
          }
        }
      }
    }
  }

  const categories: AggregatedSnapshot["categories"] = (
    Object.keys(categoryCount) as CategoryKey[]
  )
    .filter((k) => categoryCount[k] > 0)
    .sort((a, b) => categoryCount[b] - categoryCount[a])
    .map((k) => ({
      key: k,
      label: CATEGORY_LABELS[k],
      count: categoryCount[k],
      examples: Array.from(categoryExamples[k]),
    }));

  // 2) Matriz de tratamento — uma linha por processo aprovado
  // Mantemos as informações próximas ao que o DPO cadastrou. Em política
  // pública, o DPO pode editar manualmente pra agregar/anonimizar mais.
  const matrix: AggregatedSnapshot["matrix"] = approved.map((proc) => {
    const dataCats = classifyDataText(proc.personalData);
    return {
      finalidades: [proc.purpose].filter(Boolean),
      titulares: splitMultiValue(proc.dataSubjects),
      hipoteses: splitMultiValue(proc.legalBasis),
      categorias: Array.from(dataCats).map((c) => CATEGORY_LABELS[c]),
    };
  });

  // 3) Compartilhamentos — agrega operadores em categorias amplas
  // Modelo institucional sugerido pela ANPD. Nomes específicos vão como
  // exemplos opcionais (a critério do DPO mantê-los ou agregar mais).
  const sharingBuckets: Record<
    string,
    { label: string; examples: Set<string> }
  > = {
    operadoresContratados: {
      label:
        "Organizações contratadas pela {{empresa_nome_curto}} para a prestação de serviços (provedores de tecnologia, prestadores de serviços administrativos)",
      examples: new Set(),
    },
    parceiros: {
      label:
        "Organizações públicas parceiras na prestação de serviços ou execução de políticas",
      examples: new Set(),
    },
    controle: {
      label:
        "Órgãos de controle externo, tais como Tribunal de Contas, Controladoria, Ministério Público",
      examples: new Set(),
    },
    judiciario: {
      label: "Órgãos do Poder Judiciário, no exercício da função jurisdicional",
      examples: new Set(),
    },
    lai: {
      label:
        "Qualquer pessoa que apresente um pedido de acesso à informação à {{empresa_nome_curto}}, observado o disposto na LAI (Lei nº 12.527/2011)",
      examples: new Set(),
    },
  };

  for (const op of operators) {
    // operatorType usa códigos curtos: CLOUD, PAGAMENTOS, MARKETING, RH,
    // AUDITORIA, LOGISTICA, TI, JURIDICO, SAUDE, OUTRO. Combinamos com o
    // nome do operador e o relationType pra inferir bucket.
    const opType = (op.operatorType ?? "").toUpperCase();
    const opName = op.name.toLowerCase();
    if (opType === "AUDITORIA" || /tcu|tce|cgu|cge|controladoria|tribunal\s+de\s+contas/.test(opName)) {
      sharingBuckets.controle.examples.add(op.name);
    } else if (opType === "JURIDICO" || /minist[ée]rio\s+p[úu]blico|mpu|tjf|tj[a-z]{2}|tribunal\s+de\s+justi/.test(opName)) {
      sharingBuckets.judiciario.examples.add(op.name);
    } else if (op.relationType === "CO_CONTROLADOR" || /parceiro|conv[êe]nio|coopera/.test(opName)) {
      sharingBuckets.parceiros.examples.add(op.name);
    } else {
      // OPERADOR contratado (cloud, RH, TI, pagamentos, etc.)
      sharingBuckets.operadoresContratados.examples.add(op.name);
    }
  }

  // Inclui também o "compartilhamento via processo" extraído de DataInventory.sharing
  for (const proc of approved) {
    const sharing = proc.sharing?.toLowerCase() ?? "";
    if (sharing) {
      if (/tribunal|controlador|minist[ée]rio\s+p[úu]blico|cgu|tcu|tce/.test(sharing)) {
        sharingBuckets.controle.examples.add("(processo: " + proc.serviceName + ")");
      } else if (/judici[áa]rio|justi[çc]a/.test(sharing)) {
        sharingBuckets.judiciario.examples.add("(processo: " + proc.serviceName + ")");
      }
    }
  }

  const compartilhamentos: AggregatedSnapshot["compartilhamentos"] = Object.values(
    sharingBuckets,
  )
    .filter((b) => b.examples.size > 0)
    .map((b) => ({ label: b.label, examples: Array.from(b.examples).slice(0, 5) }));

  // Sempre inclui a linha LAI (atende princípio de publicidade administrativa)
  if (!compartilhamentos.some((c) => c.label.includes("LAI"))) {
    compartilhamentos.push({
      label: sharingBuckets.lai.label,
      examples: [],
    });
  }

  return {
    processesCount: approved.length,
    categories,
    matrix,
    compartilhamentos,
    generatedAt: new Date().toISOString(),
  };
}

function splitMultiValue(text: string): string[] {
  return text
    .split(/[,;]+|\bou\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 5);
}

// ============================================================
// Renderização markdown — substitui os 3 placeholders do template
// ============================================================

/**
 * Renderiza o bloco Markdown que substitui {{categorias_dados}}.
 * Bullet list com categoria + exemplos.
 */
export function renderCategoriesMarkdown(snapshot: AggregatedSnapshot): string {
  if (snapshot.categories.length === 0) {
    return "_Nenhuma categoria de dados identificada — cadastre processos aprovados no Inventário e clique em \"Atualizar do Inventário\"._";
  }
  return snapshot.categories
    .map((c) => {
      const ex =
        c.examples.length > 0
          ? `, tais como **${c.examples.join("**, **")}**`
          : "";
      return `- **${c.label}**${ex}.`;
    })
    .join("\n");
}

/**
 * Renderiza o bloco Markdown que substitui {{matriz_tratamento}}.
 * Tabela Finalidades × Titulares × Hipóteses × Categorias.
 */
export function renderMatrixMarkdown(snapshot: AggregatedSnapshot): string {
  if (snapshot.matrix.length === 0) {
    return "_Nenhum processo aprovado no Inventário — cadastre processos e clique em \"Atualizar do Inventário\"._";
  }
  const header = `| Finalidades | Titulares afetados | Hipóteses legais | Categorias de dados pessoais |\n|---|---|---|---|`;
  const rows = snapshot.matrix
    .map((row) => {
      const fin = row.finalidades.map((f) => f).join("<br>") || "—";
      const tit = row.titulares.map((t) => t).join("<br>") || "—";
      const hip = row.hipoteses.map((h) => h).join("<br>") || "—";
      const cat = row.categorias.map((c) => c).join("<br>") || "—";
      return `| ${fin} | ${tit} | ${hip} | ${cat} |`;
    })
    .join("\n");
  return `${header}\n${rows}`;
}

/**
 * Renderiza o bloco Markdown que substitui {{tipos_compartilhamento}}.
 * Bullet list de categorias de operadores.
 */
export function renderOperatorsMarkdown(snapshot: AggregatedSnapshot): string {
  if (snapshot.compartilhamentos.length === 0) {
    return "_Nenhum compartilhamento identificado — cadastre operadores e processos no Inventário e clique em \"Atualizar do Inventário\"._";
  }
  return snapshot.compartilhamentos
    .map((c) => {
      const ex =
        c.examples.length > 0
          ? ` (exemplos: ${c.examples.join(", ")})`
          : "";
      return `- ${c.label}${ex};`;
    })
    .join("\n");
}

/**
 * Substitui os 3 placeholders no conteúdo markdown da política.
 * Idempotente — pode rodar múltiplas vezes.
 */
export function applyAggregatedSnapshot(
  content: string,
  snapshot: AggregatedSnapshot,
): string {
  const cats = renderCategoriesMarkdown(snapshot);
  const mat = renderMatrixMarkdown(snapshot);
  const ops = renderOperatorsMarkdown(snapshot);

  return content
    .split("{{categorias_dados}}")
    .join(cats)
    .split("{{matriz_tratamento}}")
    .join(mat)
    .split("{{tipos_compartilhamento}}")
    .join(ops);
}

/**
 * Verifica se o template tem ALGUM dos 3 placeholders agregáveis.
 * UI usa pra decidir mostrar ou não o botão "Atualizar do Inventário".
 */
export function hasAggregatablePlaceholders(content: string): boolean {
  return (
    content.includes("{{categorias_dados}}") ||
    content.includes("{{matriz_tratamento}}") ||
    content.includes("{{tipos_compartilhamento}}")
  );
}
