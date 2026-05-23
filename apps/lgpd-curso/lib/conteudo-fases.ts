// Conteúdo institucional das fases do PGP — versão pro app de curso.
//
// Fonte: o app principal (lgpd-pgp.vercel.app) tem cada fase montada em
// components/fases/fase-N-content.tsx via PhaseDescriptionManager (texto
// padrão hardcoded no defaultContent), PhaseChecklist (7 seções hardcoded),
// PhaseInfoManager (Como Proceder, editável por órgão — vem do banco) e
// PhasePracticalLinks (cards do Coloque em Prática, também por órgão).
//
// Aqui no app de curso, replicamos a parte HARDCODED (Descrição + Checklist
// têm fonte limpa) e ESCREVEMOS o Como Proceder + Coloque em Prática com
// tom didático do curso, mencionando Vegas/PM/CM e adicionando a "dica de
// ouro" da Carta de Serviços como fonte de descoberta de processos.
//
// Renderizado por `/facilitador/conteudo-fase/[fase]` — facilitador projeta
// no telão antes da missão correspondente.

export type CalloutBlock = {
  tom: "aviso" | "info" | "sucesso" | "dica";
  titulo?: string;
  texto: string;
};

export type DescricaoBloco =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "callout"; callout: CalloutBlock };

export type ChecklistSecao = {
  id: string;
  titulo: string;
  itens: { id: string; texto: string }[];
};

export type PraticaCard = {
  emoji: string;
  titulo: string;
  descricao: string;
  badge?: string;       // "Missão 1", "💡 Dica de ouro"
  href?: string;        // se navegável dentro do curso
  destaque?: boolean;   // visual amarelo/laranja pra ficar em evidência
  detalhe?: string;     // texto extra que abre no card
};

export type ConteudoFase = {
  slug: string;
  numero: number;
  titulo: string;
  subtitulo: string;
  missao: string;        // Ex.: "antes das Missões M1 e M2"
  ebook: {
    titulo: string;
    descricao: string;
    url: string;
  };
  descricao: DescricaoBloco[];
  comoProc: DescricaoBloco[];
  checklist: ChecklistSecao[];
  pratica: PraticaCard[];
};

// ─── FASE 3 — Mapeamento e Análise de Riscos ──────────────────────────────

const FASE_3: ConteudoFase = {
  slug: "fase-3",
  numero: 3,
  titulo: "Fase 3 — Mapeamento e Análise de Riscos",
  subtitulo:
    "Mapeamento completo dos processos e avaliação dos riscos de privacidade e segurança",
  missao: "Antes das Missões M1 (Inventário) e M2 (Análise de Riscos)",
  ebook: {
    titulo: "Trilha LGPD Descomplicada — Clube do Servidor",
    descricao:
      "Biblioteca de e-books interativos sobre as 7 fases do PGP. Folheável, com vídeos embutidos e resumos.",
    url: "https://heyzine.com/shelf/trilha_lgpd_descomplicada.html",
  },
  descricao: [
    {
      tipo: "paragrafo",
      texto:
        "Esta fase combina o mapeamento detalhado de todos os processos de tratamento de dados pessoais com a análise dos riscos associados a cada tratamento.",
    },
    {
      tipo: "subtitulo",
      texto: "Parte 1: Mapeamento de Processos",
    },
    {
      tipo: "paragrafo",
      texto: "O mapeamento deve documentar para cada processo de tratamento:",
    },
    {
      tipo: "lista",
      itens: [
        "Quais dados pessoais são coletados",
        "Como são coletados (formulários, contratos, sistemas)",
        "Para que finalidade são utilizados",
        "Qual a base legal (consentimento, contrato, obrigação legal, etc.)",
        "Onde são armazenados",
        "Quem tem acesso a esses dados",
        "Por quanto tempo são mantidos",
        "Com quem são compartilhados",
        "Como são descartados",
      ],
    },
    {
      tipo: "subtitulo",
      texto: "Parte 2: Análise de Riscos",
    },
    {
      tipo: "paragrafo",
      texto:
        "Para cada processo mapeado, avalie os riscos de segurança e privacidade:",
    },
    {
      tipo: "lista",
      itens: [
        "Riscos de vazamento ou acesso não autorizado",
        "Adequação das medidas de segurança existentes",
        "Vulnerabilidades técnicas e organizacionais",
        "Impacto potencial sobre os titulares em caso de incidente",
        "Riscos regulatórios e reputacionais",
      ],
    },
    {
      tipo: "callout",
      callout: {
        tom: "aviso",
        titulo: "Importante",
        texto:
          "O mapeamento deve incluir TODOS os departamentos da Instituição. Cada área trata dados de forma diferente e todas devem estar em conformidade. A análise de riscos deve ser realizada para cada processo mapeado.",
      },
    },
    {
      tipo: "subtitulo",
      texto: "Resultado Esperado",
    },
    {
      tipo: "paragrafo",
      texto:
        "Ao final desta fase, a Instituição deve ter um Inventário de Dados completo e um Relatório de Análise de Riscos, documentando todo o ciclo de vida dos dados pessoais e os riscos associados a cada tratamento.",
    },
  ],
  comoProc: [
    {
      tipo: "paragrafo",
      texto:
        "A Fase 3 é onde a maioria dos órgãos públicos tropeça — não por falta de método, mas por subestimar o tamanho do mapeamento. Algumas orientações práticas pra esta fase no curso:",
    },
    {
      tipo: "subtitulo",
      texto: "1. Comece pelos processos que mais expõem o cidadão",
    },
    {
      tipo: "paragrafo",
      texto:
        "Em Vegas, escolhemos 2 processos críticos por órgão pro jogo (Posto de Saúde + Estagiários para a Prefeitura · Tribuna Livre + Ouvidoria para a Câmara). Em um caso real, a recomendação é a mesma — comece pelos processos com dados sensíveis, dados de crianças, ou grande volume de cidadãos atendidos. A vitória rápida vem desses.",
    },
    {
      tipo: "subtitulo",
      texto: "2. A ordem dentro de cada processo importa",
    },
    {
      tipo: "paragrafo",
      texto:
        "Não comece pela base legal — comece pelos TITULARES. A pergunta certa é: quem é o cidadão que entrega o dado? Crianças? Idosos? Pacientes? Esse 'quem' muda toda a análise depois: base legal especial, retenção mais curta, medidas de segurança reforçadas.",
    },
    {
      tipo: "callout",
      callout: {
        tom: "info",
        titulo: "A ordem certa do Inventário",
        texto:
          "titulares → dados coletados → finalidade → base legal → retenção → compartilhamentos → medidas de segurança",
      },
    },
    {
      tipo: "subtitulo",
      texto: "3. Riscos são concretos, não abstratos",
    },
    {
      tipo: "paragrafo",
      texto:
        "Risco não é 'pode haver vazamento'. É 'se o pendrive com 2.300 prontuários sair daqui, esses pacientes sofrem chantagem, estigma, ou perdem emprego'. Conecte cada risco a uma consequência concreta pro titular — isso muda como o grupo posiciona o risco na matriz 3×3.",
    },
    {
      tipo: "subtitulo",
      texto: "4. Aprovação pelo DPO é parte do método",
    },
    {
      tipo: "paragrafo",
      texto:
        "No app, o DPO APROVA ou DEVOLVE COM MOTIVO cada processo do Inventário. Devolver não é punição — é parte do método. Um motivo bem escrito na devolução vira aprendizado pro Contribuidor refazer.",
    },
  ],
  checklist: [
    {
      id: "preparacao",
      titulo: "1. Preparação para o Mapeamento",
      itens: [
        { id: "identificar-departamentos", texto: "Identifique todos os departamentos que coletam/tratam dados pessoais" },
        { id: "agendar-entrevistas", texto: "Agende entrevistas com gestores de cada área" },
        { id: "preparar-questionarios", texto: "Prepare questionários de mapeamento para cada departamento" },
        { id: "definir-metodologia", texto: "Defina a metodologia de documentação (planilhas, software específico, etc.)" },
      ],
    },
    {
      id: "mapeamento-por-area",
      titulo: "2. Mapeamento por Área da Instituição",
      itens: [
        { id: "mapear-rh", texto: "Mapeie tratamentos de dados do RH (servidores, candidatos a estágio)" },
        { id: "mapear-atendimento", texto: "Mapeie tratamentos do Atendimento ao Cidadão (formulários, ouvidoria)" },
        { id: "mapear-comunicacao", texto: "Mapeie tratamentos da Comunicação (transmissões, redes sociais, newsletters)" },
        { id: "mapear-ti", texto: "Mapeie sistemas e bancos de dados da TI" },
        { id: "mapear-financeiro", texto: "Mapeie tratamentos do Financeiro (dados bancários, transações)" },
        { id: "mapear-outras-areas", texto: "Mapeie outras áreas relevantes (saúde, plenário, secretarias, etc.)" },
      ],
    },
    {
      id: "documentacao-processos",
      titulo: "3. Documentação dos Processos",
      itens: [
        { id: "tipos-dados", texto: "Liste tipos de dados pessoais coletados (cadastrais, sensíveis, financeiros)" },
        { id: "finalidades", texto: "Documente finalidades de cada coleta" },
        { id: "bases-legais", texto: "Identifique base legal para cada tratamento (Art. 7º / Art. 11)" },
        { id: "fluxos-dados", texto: "Mapeie fluxos de dados (origem → processamento → destino)" },
        { id: "retencao", texto: "Defina prazos de retenção para cada tipo de dado" },
        { id: "compartilhamentos", texto: "Liste compartilhamentos com terceiros (operadores, controladores conjuntos)" },
      ],
    },
    {
      id: "analise-riscos",
      titulo: "4. Análise de Riscos",
      itens: [
        { id: "identificar-riscos", texto: "Identifique riscos de privacidade para cada processo" },
        { id: "classificar-probabilidade", texto: "Classifique probabilidade (baixa, média, alta) na matriz 3×3" },
        { id: "classificar-impacto", texto: "Classifique impacto (baixo, médio, alto) na matriz 3×3" },
        { id: "documentar-vulnerabilidades", texto: "Documente vulnerabilidades técnicas e organizacionais" },
        { id: "avaliar-controles", texto: "Avalie controles de segurança existentes" },
      ],
    },
    {
      id: "validacao-aprovacao",
      titulo: "5. Validação e Aprovação",
      itens: [
        { id: "revisar-gestores", texto: "Revise mapeamento com gestores das áreas" },
        { id: "validar-juridico", texto: "Valide bases legais com Procuradoria/Jurídico" },
        { id: "aprovacao-dpo", texto: "DPO aprova processos no app (ou devolve com motivo)" },
        { id: "registrar-decisoes", texto: "Registre decisões em ata oficial do Comitê" },
      ],
    },
    {
      id: "manutencao",
      titulo: "6. Manutenção do Inventário",
      itens: [
        { id: "atualizar-mudancas", texto: "Atualize inventário a cada mudança de processo" },
        { id: "revisao-anual", texto: "Realize revisão anual completa" },
        { id: "novos-processos", texto: "Inclua novos processos antes de iniciar tratamento" },
      ],
    },
  ],
  pratica: [
    {
      emoji: "💡",
      titulo: "Carta de Serviços como fonte de descoberta",
      descricao:
        "A Carta de Serviços do órgão é uma fonte rica e muitas vezes ignorada de descoberta de processos. Cada serviço prestado ao cidadão envolve tratamento de dados pessoais por trás — e a Carta lista TODOS os serviços oferecidos pela Instituição.",
      badge: "💡 Dica de ouro do curso",
      destaque: true,
      detalhe:
        "Método prático: pegue a Carta de Serviços do seu órgão, leia serviço por serviço, e pergunte: 'pra prestar esse serviço, quais dados pessoais são coletados? de quem? por quanto tempo guardamos?'. Cada serviço vira potencialmente 1 processo no Inventário. No app principal (lgpd-pgp), o recurso 'Sugerir processos da Carta' faz isso automaticamente com IA — extrai o conteúdo da página da Carta de Serviços online e propõe processos pré-rascunhados pra você revisar e aprovar.",
    },
    {
      emoji: "📦",
      titulo: "Inventário de Dados",
      descricao:
        "No jogo, cada grupo tem 2 processos pré-cadastrados pra completar (PM: Posto de Saúde + Estagiários · CM: Tribuna Livre + Ouvidoria). Contribuidores preenchem, DPO aprova ou devolve com motivo.",
      badge: "Missão 1 · 25 min",
      href: "/dashboard/inventario",
    },
    {
      emoji: "⚠️",
      titulo: "Análise de Riscos",
      descricao:
        "Para cada processo do Inventário, o grupo confirma 2-3 riscos sugeridos, posiciona na matriz 3×3 (Probabilidade × Impacto) e descreve plano de mitigação.",
      badge: "Missão 2 · 15 min",
      href: "/dashboard/riscos",
    },
  ],
};

// ─── PLACEHOLDERS — Fases 4 a 7 (preenchidas nas próximas fatias) ─────────

const FASE_4_STUB: ConteudoFase = {
  slug: "fase-4",
  numero: 4,
  titulo: "Fase 4 — GAP Analysis",
  subtitulo: "Diagnóstico de aderência aos controles da LGPD",
  missao: "Antes da Missão M3 (GAP Analysis)",
  ebook: {
    titulo: "Em breve",
    descricao: "Conteúdo desta fase será adicionado na próxima fatia.",
    url: "",
  },
  descricao: [{ tipo: "paragrafo", texto: "Conteúdo em construção — disponível em breve." }],
  comoProc: [],
  checklist: [],
  pratica: [],
};

const FASE_5_STUB: ConteudoFase = {
  slug: "fase-5",
  numero: 5,
  titulo: "Fase 5 — Plano de Ação",
  subtitulo: "Consolida o que veio de Riscos e GAP em ações com responsável e prazo",
  missao: "Após M3 (GAP), entre M3 e M4a",
  ebook: { titulo: "Em breve", descricao: "Conteúdo desta fase será adicionado na próxima fatia.", url: "" },
  descricao: [{ tipo: "paragrafo", texto: "Conteúdo em construção — disponível em breve." }],
  comoProc: [],
  checklist: [],
  pratica: [],
};

const FASE_6_STUB: ConteudoFase = {
  slug: "fase-6",
  numero: 6,
  titulo: "Fase 6 — Execução",
  subtitulo: "RIPD, Gestão de Terceiros, Direitos do Titular e Aviso de Privacidade",
  missao: "Antes das Missões M4a (RIPD/Terceiros/DSR) e M4b (Aviso)",
  ebook: { titulo: "Em breve", descricao: "Conteúdo desta fase será adicionado na próxima fatia.", url: "" },
  descricao: [{ tipo: "paragrafo", texto: "Conteúdo em construção — disponível em breve." }],
  comoProc: [],
  checklist: [],
  pratica: [],
};

const FASE_7_STUB: ConteudoFase = {
  slug: "fase-7",
  numero: 7,
  titulo: "Fase 7 — Monitoramento",
  subtitulo: "Resposta a Incidentes + PRI institucional",
  missao: "Antes da Missão M5 (Incidente Surpresa)",
  ebook: { titulo: "Em breve", descricao: "Conteúdo desta fase será adicionado na próxima fatia.", url: "" },
  descricao: [{ tipo: "paragrafo", texto: "Conteúdo em construção — disponível em breve." }],
  comoProc: [],
  checklist: [],
  pratica: [],
};

// ─── EXPORT ───────────────────────────────────────────────────────────────

export const CONTEUDO_FASES: ConteudoFase[] = [
  FASE_3,
  FASE_4_STUB,
  FASE_5_STUB,
  FASE_6_STUB,
  FASE_7_STUB,
];

export function getConteudoFase(slug: string): ConteudoFase | undefined {
  return CONTEUDO_FASES.find((f) => f.slug === slug);
}

// Auxiliar pra sidebar saber quais fases já têm conteúdo (não-stub)
export function temConteudo(fase: ConteudoFase): boolean {
  return fase.descricao.length > 1 || fase.checklist.length > 0;
}
