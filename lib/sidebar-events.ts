/**
 * Eventos custom pra atualizar imediatamente os badges da sidebar
 * (Tarefas urgentes + Fórum não-lidos) quando o usuário cria/edita/exclui
 * conteúdo nas próprias telas.
 *
 * Sem isso, o badge só atualiza no próximo polling (60s pra Tarefas, 30s
 * pra Fórum). Com isso, atualiza na hora.
 *
 * Implementado via CustomEvent no `window` — sem Context provider pesado.
 */

const EVENT_NAME = "pgp:sidebar-refresh";

/**
 * Dispara um evento que pede pra a sidebar re-buscar os contadores.
 *
 * Chamado pelos componentes filhos depois de mutações (ex: depois de
 * salvar uma tarefa, deletar um post, marcar como concluída, etc.).
 *
 * Safe pra chamar no SSR — só dispara no client.
 */
export function notifySidebarRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

/**
 * Registra um listener pro evento. Devolve uma função pra remover o
 * listener (use no cleanup do useEffect).
 */
export function onSidebarRefresh(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const wrapped = () => handler();
  window.addEventListener(EVENT_NAME, wrapped);
  return () => window.removeEventListener(EVENT_NAME, wrapped);
}
