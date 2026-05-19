// Slugify para nome de turma — gera string limpa para uso em emails de login.
// Ex: "Colatina · Outubro 2026" → "colatina-outubro-2026"
//     "Ensaio Solo" → "ensaio-solo"
//     "São Bento do Sul" → "sao-bento-do-sul"
//
// Restrição: emails do app têm padrão `{papel}.g{N}.{slug}@curso.lgpd`.
// Slug fica limitado a 40 chars (deixa margem na coluna VARCHAR padrão).

export function slugifyTurma(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")     // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")          // não-alfanumérico vira hífen
    .replace(/^-+|-+$/g, "")              // tira hífens das pontas
    .replace(/-{2,}/g, "-")               // colapsa hífens duplos
    .slice(0, 40);
}
