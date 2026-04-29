
import { prisma } from "@/lib/db";
import type { User, Company } from "@prisma/client";

type UserWithCompany = User & {
  company: Company;
  companyId: string;
};

/**
 * Garante que o usuário tenha uma empresa associada.
 * Se não tiver, cria uma empresa padrão e associa ao usuário.
 */
export async function ensureUserHasCompany(userEmail: string): Promise<UserWithCompany> {
  let user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { company: true },
  });

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  // Se o usuário não tem empresa, criar uma empresa padrão
  if (!user.companyId) {
    const defaultCompany = await prisma.company.create({
      data: {
        companyName: "Empresa Padrão",
        tradeName: "Empresa Padrão",
      },
    });

    // Associar usuário à empresa
    user = await prisma.user.update({
      where: { id: user.id },
      data: { companyId: defaultCompany.id },
      include: { company: true },
    });
  }

  // Garantir que o TypeScript entenda que companyId e company sempre existem
  return {
    ...user,
    companyId: user.companyId!,
    company: user.company!,
  };
}
