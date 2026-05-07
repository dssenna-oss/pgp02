/**
 * Configuração de sub-itens da sidebar por rota.
 *
 * Cada chave é o `href` de um item do menu principal. O valor é o array
 * de sub-itens que aparecem como árvore expansível abaixo dele. Cada
 * sub-item gera link tipo `<href>#<hash>` que dá smooth-scroll pra âncora
 * correspondente na página (atributo `data-phase-section-id` ou `id`).
 *
 * Itens sem entrada aqui continuam renderizando como link simples.
 *
 * Fatia 1 da feature de árvore na sidebar (CP_arvore): aplica só na Fase
 * Preliminar pra validar visual antes de replicar nas demais fases e
 * mini-apps (Fatias 2-3).
 */
export interface SidebarSubItem {
  /** Hash usado em `<href>#<hash>` — bate com `data-phase-section-id` no DOM. */
  hash: string;
  /** Texto mostrado no menu. */
  label: string;
  /** Ícone opcional (emoji ou string curta). */
  icon?: string;
}

export const SIDEBAR_SUB_ITEMS: Record<string, SidebarSubItem[]> = {
  // ────────────────────────────────────────────────────────────────────
  // 9 fases — Fatia 2 (replica da Fase Preliminar pras demais).
  // Ordem reflete a sequência visual real das PhaseSection na página.
  // Fase 6 não tem "descricao" (estrutura própria com 4 cards de
  // mini-apps); abre direto pelo "howto" + "consideracoes".
  // ────────────────────────────────────────────────────────────────────
  "/dashboard/fase-preliminar": [
    { hash: "descricao", label: "Descrição da Fase", icon: "📄" },
    { hash: "consideracoes", label: "Considerações", icon: "💭" },
    { hash: "checklist", label: "Checklist", icon: "✅" },
    { hash: "documentacao", label: "Documentação", icon: "📂" },
  ],
  "/dashboard/fase-1": [
    { hash: "descricao", label: "Descrição da Fase", icon: "📄" },
    { hash: "howto", label: "Como Proceder", icon: "🛠️" },
    { hash: "checklist", label: "Checklist", icon: "✅" },
    { hash: "documentacao", label: "Documentação", icon: "📂" },
  ],
  "/dashboard/fase-2": [
    { hash: "descricao", label: "Descrição da Fase", icon: "📄" },
    { hash: "howto", label: "Como Proceder", icon: "🛠️" },
    { hash: "checklist", label: "Checklist", icon: "✅" },
    { hash: "documentacao", label: "Documentação", icon: "📂" },
  ],
  "/dashboard/fase-3": [
    { hash: "descricao", label: "Descrição da Fase", icon: "📄" },
    { hash: "howto", label: "Como Proceder", icon: "🛠️" },
    { hash: "checklist", label: "Checklist", icon: "✅" },
    { hash: "documentacao", label: "Documentação", icon: "📂" },
  ],
  "/dashboard/fase-4": [
    { hash: "descricao", label: "Descrição da Fase", icon: "📄" },
    { hash: "howto", label: "Como Proceder", icon: "🛠️" },
    { hash: "checklist", label: "Checklist", icon: "✅" },
    { hash: "documentacao", label: "Documentação", icon: "📂" },
  ],
  "/dashboard/fase-5": [
    { hash: "descricao", label: "Descrição da Fase", icon: "📄" },
    { hash: "howto", label: "Como Proceder", icon: "🛠️" },
    { hash: "checklist", label: "Checklist", icon: "✅" },
    { hash: "documentacao", label: "Documentação", icon: "📂" },
  ],
  "/dashboard/fase-6": [
    { hash: "howto", label: "Como Proceder", icon: "🛠️" },
    { hash: "consideracoes", label: "Considerações", icon: "💭" },
    { hash: "checklist", label: "Checklist", icon: "✅" },
    { hash: "documentacao", label: "Documentação", icon: "📂" },
  ],
  "/dashboard/fase-7": [
    { hash: "descricao", label: "Descrição da Fase", icon: "📄" },
    { hash: "howto", label: "Como Proceder", icon: "🛠️" },
    { hash: "checklist", label: "Checklist", icon: "✅" },
    { hash: "documentacao", label: "Documentação", icon: "📂" },
  ],

  // ────────────────────────────────────────────────────────────────────
  // Mini-apps — Fatia 3.
  // Cobertura inicial dos mini-apps com tabs/filtros claramente
  // navegáveis. Hash sincroniza com state via `useHashSyncedState`.
  // Mini-apps que são "lista única" (Tarefas, Contribuidores, RIPD,
  // LIA, Políticas, Terceiros, Incidentes, Bases Legais, Fórum) ficam
  // como Link simples — adicionar sub-itens só quando virarem
  // necessidade de navegação interna real.
  // ────────────────────────────────────────────────────────────────────
  "/dashboard/plano-acao": [
    { hash: "abertas", label: "Em aberto", icon: "📌" },
    { hash: "concluidas", label: "Concluídas", icon: "✅" },
    { hash: "cronograma", label: "Cronograma", icon: "📅" },
  ],
  "/dashboard/capacitacao": [
    { hash: "ALL", label: "Todos os eixos", icon: "📋" },
    { hash: "ONBOARDING", label: "Onboarding", icon: "🚪" },
    { hash: "PILULAS", label: "Pílulas de Conhecimento", icon: "💊" },
    { hash: "PRATICA", label: "Prática/Gamificação", icon: "🎮" },
    { hash: "DEPARTAMENTAL", label: "Departamental", icon: "🏢" },
    { hash: "MONITORAMENTO", label: "Monitoramento", icon: "📊" },
  ],
};
