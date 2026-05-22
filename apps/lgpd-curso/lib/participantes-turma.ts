// Participantes inscritos de uma turma — e-mails reais usados no convite de
// confirmação de presença. Guardados no campo JSON `participantes` de
// CursoTurma. Módulo sem dependências de servidor: serve cliente e API.

export type Participante = {
  email: string;
  confirmado: boolean;
  confirmadoEm: string | null; // ISO 8601
};

// Validação simples de e-mail — suficiente pra um curso de treinamento.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Extrai e-mails válidos de um texto colado pelo facilitador. Aceita qualquer
// separador comum (nova linha, vírgula, ponto-e-vírgula, espaço) e o formato
// "Nome <email>". Normaliza pra minúsculas e remove duplicados.
export function parseEmails(texto: string): string[] {
  if (!texto) return [];
  const brutos = texto
    .split(/[\s,;<>()]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const vistos = new Set<string>();
  const validos: string[] = [];
  for (const e of brutos) {
    if (!EMAIL_RE.test(e)) continue;
    if (vistos.has(e)) continue;
    vistos.add(e);
    validos.push(e);
  }
  return validos;
}

// Converte o valor cru do campo JSON num array de Participante tipado.
export function normalizarParticipantes(valor: unknown): Participante[] {
  if (!Array.isArray(valor)) return [];
  const out: Participante[] = [];
  for (const item of valor) {
    if (!item || typeof item !== "object") continue;
    const email = String((item as any).email || "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) continue;
    out.push({
      email,
      confirmado: !!(item as any).confirmado,
      confirmadoEm: (item as any).confirmadoEm ? String((item as any).confirmadoEm) : null,
    });
  }
  return out;
}

// Mescla uma nova lista de e-mails preservando o status de confirmação dos
// que já existiam. E-mails removidos da nova lista deixam de existir.
export function mesclarParticipantes(
  atuais: Participante[],
  novosEmails: string[],
): Participante[] {
  const porEmail = new Map(atuais.map((p) => [p.email, p]));
  return novosEmails.map(
    (email) => porEmail.get(email) ?? { email, confirmado: false, confirmadoEm: null },
  );
}
