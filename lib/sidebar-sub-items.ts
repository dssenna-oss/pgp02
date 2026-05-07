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
  "/dashboard/fase-preliminar": [
    { hash: "descricao", label: "Descrição da Fase", icon: "📄" },
    { hash: "consideracoes", label: "Considerações", icon: "💭" },
    { hash: "checklist", label: "Checklist", icon: "✅" },
    { hash: "documentacao", label: "Documentação", icon: "📂" },
  ],
};
