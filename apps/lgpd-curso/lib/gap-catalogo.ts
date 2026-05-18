// Catálogo de 30 controles GAP curados pelo curso — agrupados pelas 7 Fases
// do PGP. Facilitador escolhe 10 por turma em /admin/pacote-gap.
// Mais didático que o pacote fixo de 10: permite adaptar ao perfil do grupo
// (técnicos / jurídicos / gestão) e dá visibilidade da abrangência real da
// adequação LGPD num órgão público.
//
// Origem: cruzamento entre os 119 controles do template oficial PRO/Denise
// (lib/gap-catalog.ts no app principal) e os instrumentos das 7 Fases do PGP
// implementados nos mini-apps do curso.
//
// IDs são estáveis — não renumerar (gap_answers.controleId referencia esses).

export type FaseGap =
  | "PRELIMINAR"
  | "FASE_1"
  | "FASE_2"
  | "FASE_3"
  | "FASE_5"
  | "FASE_6"
  | "FASE_7";

export type ControleCatalogo = {
  id: number;
  fase: FaseGap;
  area: string; // categoria mais granular (mostra como pílula)
  texto: string;
  hint?: string;
  /** Se preenchido, o controle aceita "Importar resultados" — botão extra no card.
   *  A chave indica qual engine usar em lib/gap-import.ts. */
  importavel?:
    | "INV_ATUALIZADO"
    | "INV_BASE_LEGAL"
    | "RISCO_MATRIZ"
    | "RIPD_APROVADO"
    | "OPERADOR_CLAUSULAS"
    | "DSR_CANAL"
    | "AVISO_PUBLICADO"
    | "INCIDENTE_REGISTRADO";
};

export const GAP_CATALOGO: ControleCatalogo[] = [
  // ─── FASE PRELIMINAR — Cultura ─────────────────────────────────────────
  { id: 1,  fase: "PRELIMINAR", area: "Capacitação",
    texto: "Equipe treinada em LGPD nos últimos 12 meses",
    hint: "Treinamento formal, com registro de presença e avaliação. Inclui pelo menos DPO + Comitê + áreas que tratam dados sensíveis." },
  { id: 2,  fase: "PRELIMINAR", area: "Sensibilização",
    texto: "Campanhas periódicas de sensibilização sobre privacidade pra todo o corpo funcional",
    hint: "Banners na intranet, e-mails informativos, comunicados sobre incidentes do setor. Pelo menos 1 por trimestre." },
  { id: 3,  fase: "PRELIMINAR", area: "Onboarding",
    texto: "Onboarding de novos servidores inclui módulo obrigatório de LGPD",
    hint: "Novo servidor não trata dados pessoais antes de fazer o módulo. Registro formal no RH." },

  // ─── FASE 1 — Governança ───────────────────────────────────────────────
  { id: 4,  fase: "FASE_1", area: "DPO/Encarregado",
    texto: "Encarregado (DPO) designado por ato formal e publicado",
    hint: "Portaria, ato, decreto. Não basta nomear na intenção — precisa ato formal publicado oficialmente." },
  { id: 5,  fase: "FASE_1", area: "Comitê de Privacidade",
    texto: "Comitê de Privacidade instituído por ato formal com representantes de áreas-chave",
    hint: "Comitê multidisciplinar (TI, Jurídico, RH, áreas de negócio). Apoia o DPO. Reunião periódica." },
  { id: 6,  fase: "FASE_1", area: "Princípios",
    texto: "Declaração institucional de compromisso com a proteção de dados publicada pelo dirigente máximo",
    hint: "Documento curto, principista, anterior ao PGP. Sinaliza prioridade institucional." },
  { id: 7,  fase: "FASE_1", area: "Orçamento",
    texto: "Recursos (orçamento + pessoal) alocados explicitamente pra adequação LGPD",
    hint: "Linha orçamentária específica ou rubrica clara no planejamento anual." },

  // ─── FASE 2 — Diagnóstico Inicial ──────────────────────────────────────
  { id: 8,  fase: "FASE_2", area: "Escopo",
    texto: "Levantamento preliminar de sistemas de informação que tratam dados pessoais",
    hint: "Lista bruta dos sistemas (e-SUS, SEI, folha de pagamento, etc) que entrarão no Inventário detalhado." },
  { id: 9,  fase: "FASE_2", area: "Processos críticos",
    texto: "Processos críticos com dados sensíveis identificados e priorizados",
    hint: "Saúde, biometria, dados de crianças/adolescentes, dados criminais entram primeiro no Inventário." },

  // ─── FASE 3 — Mapeamento e Análise de Riscos ───────────────────────────
  { id: 10, fase: "FASE_3", area: "Inventário",
    texto: "Inventário de processos atualizado nos últimos 12 meses",
    hint: "Inclui novos sistemas, fluxos, terceirizações. Revisão periódica formal.",
    importavel: "INV_ATUALIZADO" },
  { id: 11, fase: "FASE_3", area: "Bases Legais",
    texto: "Base legal documentada por processo (Art. 7º ou Art. 11 LGPD)",
    hint: "Cada processo tem hipótese de tratamento justificada juridicamente. Não basta 'consentimento por padrão'.",
    importavel: "INV_BASE_LEGAL" },
  { id: 12, fase: "FASE_3", area: "Tipos de dados",
    texto: "Tipos de dados pessoais mapeados por processo (cadastrais, sensíveis, financeiros, de menores)",
    hint: "Identificação granular permite aplicar cuidados específicos do Art. 11 (sensíveis) e Art. 14 (crianças)." },
  { id: 13, fase: "FASE_3", area: "Fluxos",
    texto: "Fluxos de dados documentados (origem → tratamento → destino)",
    hint: "Diagrama ou tabela mostrando de onde vem, quem trata, com quem compartilha, onde armazena." },
  { id: 14, fase: "FASE_3", area: "Análise de Riscos",
    texto: "Análise de Riscos formalizada com matriz Probabilidade × Impacto",
    hint: "Riscos identificados, classificados (Baixo/Médio/Alto) e com medidas de mitigação propostas.",
    importavel: "RISCO_MATRIZ" },

  // ─── FASE 5 — Programa de Governança em Privacidade ────────────────────
  { id: 15, fase: "FASE_5", area: "PGP institucional",
    texto: "PGP (Programa de Governança em Privacidade) formalizado e aprovado pelo dirigente máximo",
    hint: "Documento mater citando os outros instrumentos como anexos. Sai dos resultados de Inventário + Riscos + GAP." },
  { id: 16, fase: "FASE_5", area: "Plano de Ação",
    texto: "Plano de Ação estruturado com responsável, prazo e prioridade pra cada item",
    hint: "Cada GAP NÃO ADERENTE e cada Risco ALTO vira uma ação no Plano com dono identificado." },
  { id: 17, fase: "FASE_5", area: "Cronograma",
    texto: "Cronograma de adequação com marcos mensais e revisões trimestrais",
    hint: "Não basta lista de ações — precisa data, ordem de execução e momentos de checagem." },

  // ─── FASE 6 — Execução (instrumentos) ──────────────────────────────────
  { id: 18, fase: "FASE_6", area: "RIPD/DPIA",
    texto: "RIPD elaborado pra processos de alto risco (sensíveis, perfilamento, vigilância)",
    hint: "Art. 38 LGPD. Detalha tipos de dados, finalidade, riscos e medidas de mitigação por processo crítico.",
    importavel: "RIPD_APROVADO" },
  { id: 19, fase: "FASE_6", area: "PSI",
    texto: "Política de Segurança da Informação (PSI) aprovada — controle de acesso por perfil + senhas fortes + MFA em sistemas críticos",
    hint: "Documento institucional que define como cada um vê só o que precisa pra função, com autenticação reforçada nos sistemas que tratam dados sensíveis." },
  { id: 20, fase: "FASE_6", area: "Segurança técnica",
    texto: "Backup criptografado dos dados pessoais com plano de recuperação testado",
    hint: "AES-256 ou equivalente. Restauração testada periodicamente. RTO/RPO definidos." },
  { id: 21, fase: "FASE_6", area: "Auditoria",
    texto: "Logs de acesso aos sistemas críticos registrados e auditados periodicamente",
    hint: "Quem acessou o quê e quando. Logs preservados pelo prazo legal e revisados em busca de anomalias." },
  { id: 22, fase: "FASE_6", area: "Gestão de Operadores",
    texto: "Contratos com operadores (terceirizados) contêm cláusulas LGPD obrigatórias (Art. 39)",
    hint: "Toda relação de tratamento por terceiros (cloud, folha, sistema legado) tem cláusula expressa de proteção de dados.",
    importavel: "OPERADOR_CLAUSULAS" },
  { id: 23, fase: "FASE_6", area: "Direitos do Titular",
    texto: "Canal pra exercer direitos do titular (DSR) divulgado e funcional",
    hint: "E-mail dedicado + formulário público + telefone. Divulgado no portal externo e no Aviso de Privacidade.",
    importavel: "DSR_CANAL" },
  { id: 24, fase: "FASE_6", area: "Direitos do Titular",
    texto: "Prazo de 15 dias úteis (Art. 19, II LGPD) nas respostas a DSR monitorado",
    hint: "Registro formal das solicitações com data de entrada e prazo de resposta. Indicador de cumprimento por trimestre." },
  { id: 25, fase: "FASE_6", area: "Aviso de Privacidade",
    texto: "Aviso de Privacidade publicado no portal externo (Art. 9 LGPD)",
    hint: "Acessível ao cidadão. Lista finalidades, formas de tratamento, direitos do titular e canal do DPO.",
    importavel: "AVISO_PUBLICADO" },
  { id: 26, fase: "FASE_6", area: "Anonimização",
    texto: "Procedimento de anonimização documentado pra dados que perderam finalidade",
    hint: "Quando os dados não são mais necessários, anonimizar saí do escopo da LGPD." },
  { id: 27, fase: "FASE_6", area: "Retenção",
    texto: "Política de retenção e descarte de dados pessoais com prazos por categoria",
    hint: "Cada tipo de dado tem prazo de guarda definido (saúde 20 anos, fiscal 5, etc) e procedimento de descarte seguro." },

  // ─── FASE 7 — Monitoramento e Resposta ─────────────────────────────────
  { id: 28, fase: "FASE_7", area: "Resposta a Incidentes",
    texto: "Plano de resposta a incidente formalizado e testado nos últimos 12 meses",
    hint: "Documento + simulado anual. Contém papéis, contatos, fluxo de decisão e modelos de comunicação.",
    importavel: "INCIDENTE_REGISTRADO" },
  { id: 29, fase: "FASE_7", area: "Comunicação ANPD",
    texto: "Procedimento de comunicação à ANPD (Art. 48 + Resolução 15/2024) documentado",
    hint: "Modelo de comunicação pronto, lista de informações obrigatórias, fluxo de aprovação interno antes do envio." },
  { id: 30, fase: "FASE_7", area: "Revisão do PGP",
    texto: "Auditoria/revisão anual do PGP com relatório ao dirigente máximo",
    hint: "Não é estático — PGP precisa ser revisitado em ciclo anual com avaliação de maturidade e ajuste de rota." },
];

// Ordem visual das Fases (pra renderizar a tela admin e a tela do GAP).
export const FASES_ORDEM: { id: FaseGap; nome: string; cor: string; emoji: string }[] = [
  { id: "PRELIMINAR", nome: "Fase Preliminar — Cultura",                              cor: "border-l-gray-400",    emoji: "🌱" },
  { id: "FASE_1",     nome: "Fase 1 — Governança",                                    cor: "border-l-violet-400",  emoji: "🏛" },
  { id: "FASE_2",     nome: "Fase 2 — Diagnóstico Inicial",                           cor: "border-l-sky-400",     emoji: "🔍" },
  { id: "FASE_3",     nome: "Fase 3 — Mapeamento & Riscos",                           cor: "border-l-blue-400",    emoji: "🗺" },
  { id: "FASE_5",     nome: "Fase 5 — Programa de Governança em Privacidade",         cor: "border-l-emerald-400", emoji: "📋" },
  { id: "FASE_6",     nome: "Fase 6 — Execução",                                      cor: "border-l-purple-400",  emoji: "⚙️" },
  { id: "FASE_7",     nome: "Fase 7 — Monitoramento & Resposta",                      cor: "border-l-red-400",     emoji: "🚨" },
];

// Pacote padrão (10 controles) — usado quando turma.gapPacote está vazio.
// Cobre uma ação de cada Fase + 4 em Fase 6 (que tem mais instrumentos).
export const PACOTE_DEFAULT_IDS = [1, 4, 10, 11, 15, 18, 19, 22, 23, 28];

export function getControleById(id: number): ControleCatalogo | undefined {
  return GAP_CATALOGO.find((c) => c.id === id);
}

export function getPacotePorIds(ids: number[]): ControleCatalogo[] {
  return ids
    .map((id) => getControleById(id))
    .filter((c): c is ControleCatalogo => !!c);
}

export function getPacoteDefault(): ControleCatalogo[] {
  return getPacotePorIds(PACOTE_DEFAULT_IDS);
}
