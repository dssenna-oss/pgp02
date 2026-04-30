/**
 * One-off: renomeia a empresa e o nome de exibição do admin.
 *
 * Lê alvos de env vars:
 *   ORG_NEW_NAME (default: "LGPD-PGP")
 *   ADMIN_DISPLAY_NAME (default: "Admin")
 *
 * Identifica o admin via SEED_ADMIN_EMAIL.
 */
import { PrismaClient } from "@prisma/client";

const NEW_COMPANY_NAME = process.env.ORG_NEW_NAME || "LGPD-PGP";
const NEW_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME || "Admin";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("❌ SEED_ADMIN_EMAIL não definido no .env");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { company: true },
  });

  if (!user) {
    console.error(`❌ Usuário ${adminEmail} não encontrado.`);
    process.exit(1);
  }

  // Renomeia o user
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { name: NEW_DISPLAY_NAME },
  });
  console.log(`✅ Usuário: "${user.name ?? "(sem nome)"}" → "${updatedUser.name}"`);

  // Renomeia a empresa (se existir)
  if (user.companyId) {
    const updatedCompany = await prisma.company.update({
      where: { id: user.companyId },
      data: {
        companyName: NEW_COMPANY_NAME,
        tradeName: NEW_COMPANY_NAME,
      },
    });
    console.log(
      `✅ Empresa: "${user.company?.companyName ?? "?"}" → "${updatedCompany.companyName}"`
    );
  } else {
    console.warn("⚠️  Admin não tem empresa associada.");
  }
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
