import { prisma } from "@/lib/prisma";

/**
 * Casa um login (User) com o registro de Membro correspondente.
 *
 * Estratégia em 2 níveis:
 *  1) por e-mail — oficial (`email`) OU interno (`emailInterno`);
 *  2) fallback por NOME completo — cobre logins de sistema (ex.: coordenador@)
 *     cujo e-mail não bate com o do membro, mas que têm o mesmo nome.
 *
 * Retorna o id do membro (ou null) + os campos pedidos em `select`.
 */
export async function membroDoLogin<T extends Record<string, boolean>>(
  login: { email?: string | null; name?: string | null },
  select: T,
) {
  const email = login.email?.toLowerCase().trim() ?? "";
  const nome = login.name?.trim() ?? "";

  // garante que id e nome venham (precisamos deles), preserva o select pedido
  const sel = { id: true as const, ...select };

  if (email) {
    const porEmail = await prisma.membro.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { emailInterno: { equals: email, mode: "insensitive" } },
        ],
      },
      select: sel,
    });
    if (porEmail) return porEmail;
  }

  if (nome) {
    const porNome = await prisma.membro.findFirst({
      where: { nome: { equals: nome, mode: "insensitive" } },
      select: sel,
    });
    if (porNome) return porNome;
  }

  return null;
}
