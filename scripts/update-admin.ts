/**
 * Atualiza o e-mail e a senha do usuário admin existente.
 *
 * Lê as credenciais novas de variáveis de ambiente (NUNCA hardcoded):
 *   ADMIN_NEW_EMAIL    — e-mail novo (default: admin@example.com)
 *   ADMIN_NEW_PASSWORD — senha nova (obrigatório)
 *   ADMIN_OLD_EMAIL    — e-mail antigo a renomear (default: admin@example.com)
 *
 * Uso (PowerShell):
 *   $env:ADMIN_NEW_EMAIL="novo@email.com"
 *   $env:ADMIN_NEW_PASSWORD="senha-forte"
 *   $env:ADMIN_OLD_EMAIL="antigo@email.com"
 *   npx tsx --require dotenv/config scripts/update-admin.ts
 *
 * Uso (bash):
 *   ADMIN_NEW_EMAIL=novo@email.com ADMIN_NEW_PASSWORD=senha-forte \
 *   ADMIN_OLD_EMAIL=antigo@email.com \
 *   npx tsx --require dotenv/config scripts/update-admin.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const NEW_EMAIL = process.env.ADMIN_NEW_EMAIL || "admin@example.com";
const NEW_PASSWORD = process.env.ADMIN_NEW_PASSWORD;
const OLD_EMAIL = process.env.ADMIN_OLD_EMAIL || "admin@example.com";

if (!NEW_PASSWORD) {
  console.error("❌ ADMIN_NEW_PASSWORD não definida. Defina a variável de ambiente e rode de novo.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Atualizando admin do banco de dados...");

  const hashedPassword = await bcrypt.hash(NEW_PASSWORD!, 12);

  const oldUser = await prisma.user.findUnique({ where: { email: OLD_EMAIL } });
  const newUser = await prisma.user.findUnique({ where: { email: NEW_EMAIL } });

  if (oldUser && OLD_EMAIL !== NEW_EMAIL && !newUser) {
    const updated = await prisma.user.update({
      where: { email: OLD_EMAIL },
      data: {
        email: NEW_EMAIL,
        password: hashedPassword,
        isActive: true,
        role: "admin",
      },
    });
    console.log(`✅ Usuário renomeado: ${OLD_EMAIL} → ${updated.email}`);
  } else if (newUser) {
    const updated = await prisma.user.update({
      where: { email: NEW_EMAIL },
      data: {
        password: hashedPassword,
        isActive: true,
        role: "admin",
      },
    });
    console.log(`✅ Senha/permissões atualizadas: ${updated.email}`);

    if (oldUser && OLD_EMAIL !== NEW_EMAIL) {
      await prisma.user.delete({ where: { email: OLD_EMAIL } });
      console.log(`🗑️  Usuário antigo removido: ${OLD_EMAIL}`);
    }
  } else {
    console.error(
      `❌ Nenhum usuário encontrado (nem ${OLD_EMAIL}, nem ${NEW_EMAIL}). Rode o seed primeiro.`
    );
    process.exit(1);
  }

  console.log(`👤 Login agora: ${NEW_EMAIL}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
