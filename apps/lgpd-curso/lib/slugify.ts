// Slugify para nome de turma -- gera string limpa para uso em emails de login.
// Ex: "Colatina Outubro 2026"     -> "colatina-outubro-2026"
//     "Ensaio Solo"                -> "ensaio-solo"
//     "Sao Bento do Sul"           -> "sao-bento-do-sul"
//
// Restricao: emails do app tem padrao `{papel}.g{N}.{slug}@curso.lgpd`.
// Slug fica limitado a 40 chars (deixa margem na coluna VARCHAR padrao).

// Range Unicode dos combining diacritical marks (U+0300..U+036F).
// Usamos String.fromCharCode pra MANTER o arquivo 100% ASCII -- evita
// bytes UTF-8 que podem causar problemas no build do Vercel.
const DIACRITICS_RE = new RegExp(
  "[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]",
  "g"
);

export function slugifyTurma(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(DIACRITICS_RE, "")            // remove acentos decompostos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")           // nao-alfanumerico vira hifen
    .replace(/^-+|-+$/g, "")               // tira hifens das pontas
    .replace(/-{2,}/g, "-")                // colapsa hifens duplos
    .slice(0, 40);
}
