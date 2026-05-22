// Participantes inscritos de uma turma — nome + e-mail usados no convite de
// confirmação de presença. Guardados no campo JSON `participantes` de
// CursoTurma. Módulo sem dependências de servidor: serve cliente e API.

export type Participante = {
  email: string;
  nome: string; // primeiro nome, normalizado (ex.: "Elias"); "" se não informado
  confirmado: boolean;
  confirmadoEm: string | null; // ISO 8601
};

// Validação simples de e-mail — suficiente pra um curso de treinamento.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Token de e-mail dentro de uma célula (ignora separadores ao redor).
const EMAIL_TOKEN = /[^\s,;<>]+@[^\s,;<>]+\.[^\s,;<>]+/;

// "ELIAS" -> "Elias", "ana paula" -> "Ana Paula", "JOÃO" -> "João".
function tituloNome(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/(^|[\s'-])([\p{L}])/gu, (_, sep, c) => sep + c.toUpperCase());
}

// Extrai { nome, email } de um texto colado pelo facilitador. Cada linha é
// uma pessoa. Aceita colunas do Excel (separadas por TAB), "Nome <email>",
// "Nome, email" ou só o e-mail. Normaliza e remove duplicados.
export function parseParticipantes(texto: string): { nome: string; email: string }[] {
  if (!texto) return [];
  const vistos = new Set<string>();
  const out: { nome: string; email: string }[] = [];
  for (const linha of texto.split(/\r?\n/)) {
    if (!linha.trim()) continue;
    const temTab = linha.includes("\t");
    const celulas = linha.split(/[\t,;<>]+/).map((c) => c.trim()).filter(Boolean);

    let email = "";
    const resto: string[] = [];
    for (const cel of celulas) {
      const m = !email ? cel.match(EMAIL_TOKEN) : null;
      if (m) {
        email = m[0].toLowerCase();
        const semEmail = cel.replace(m[0], "").trim();
        if (semEmail) resto.push(semEmail);
      } else {
        resto.push(cel);
      }
    }
    if (!email || !EMAIL_RE.test(email) || vistos.has(email)) continue;
    vistos.add(email);

    // Colado de Excel (com TAB): a 1ª célula restante é a coluna "Nome"
    // inteira. Texto solto: pega só a 1ª palavra (primeiro nome).
    let nome = "";
    if (resto.length) {
      nome = temTab ? tituloNome(resto[0]) : tituloNome(resto[0].split(/\s+/)[0]);
    }
    out.push({ nome, email });
  }
  return out;
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
      nome: typeof (item as any).nome === "string" ? (item as any).nome : "",
      confirmado: !!(item as any).confirmado,
      confirmadoEm: (item as any).confirmadoEm ? String((item as any).confirmadoEm) : null,
    });
  }
  return out;
}

// Mescla uma nova lista preservando o status de confirmação de quem já
// existia. E-mails fora da nova lista deixam de existir. O nome é atualizado
// pela nova lista (mantém o anterior se a nova não trouxer nome).
export function mesclarParticipantes(
  atuais: Participante[],
  novos: { nome: string; email: string }[],
): Participante[] {
  const porEmail = new Map(atuais.map((p) => [p.email, p]));
  return novos.map((n) => {
    const ex = porEmail.get(n.email);
    return {
      email: n.email,
      nome: n.nome || ex?.nome || "",
      confirmado: ex?.confirmado ?? false,
      confirmadoEm: ex?.confirmadoEm ?? null,
    };
  });
}
