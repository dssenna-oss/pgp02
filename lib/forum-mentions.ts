/**
 * Engine de menções @user no Fórum (G+J — 2026-05-10).
 *
 * Formato adotado no texto: `@[Nome do Usuário](mention:userId)`.
 * Escolha pragmática:
 *  - Markdown-like, fácil de regexar tanto no client quanto no server
 *  - Permite renomes/atualizações de nome (o userId é a fonte de verdade)
 *  - Nada de schema novo — vive embutido no `content` do ForumPost/ForumReply
 *
 * Read state: reusa `ForumPostRead`. Se o user abrir o post (já existe
 * tracker), conta como lido — o que inclui qualquer menção dentro dele.
 *
 * Email: respeita `User.emailNotifyDm` (mesma natureza "alguém te chamou
 * especificamente"). Sem criar nova preferência pra não inflar o
 * formulário de configurações.
 */

/** Regex captura `@[Nome](mention:cuidXYZ)`. Case-insensitive, global. */
export const MENTION_RE = /@\[([^\]]+)\]\(mention:([a-z0-9-]+)\)/gi;

/**
 * Extrai todos os userIds mencionados de um conteúdo, deduplicados.
 * Tolerante: ignora tokens malformados.
 */
export function extractMentionedUserIds(content: string | null | undefined): string[] {
  if (!content) return [];
  const ids = new Set<string>();
  const re = new RegExp(MENTION_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const uid = m[2]?.trim();
    if (uid) ids.add(uid);
  }
  return Array.from(ids);
}

/**
 * Substitui cada `@[Nome](mention:uid)` pelo `replacer(uid, label)` —
 * útil pra renderizar HTML ou markdown no client.
 */
export function replaceMentions(
  content: string,
  replacer: (uid: string, label: string) => string,
): string {
  return content.replace(MENTION_RE, (_match, label: string, uid: string) =>
    replacer(uid, label),
  );
}

/**
 * Versão "plain text" — pra preview de email, push notification, etc.
 * Tira a estrutura markdown e deixa só o `@Nome`.
 */
export function stripMentionMarkdown(content: string): string {
  return content.replace(MENTION_RE, (_match, label: string) => `@${label}`);
}
