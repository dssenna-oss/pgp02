/**
 * Diagnóstico: verifica se o admin existe no banco e se a senha confere.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_TEST_EMAIL || "clubedoservidor@protonmail.com";
  const password = process.env.ADMIN_TEST_PASSWORD;

  if (!password) {
    console.error("❌ defina ADMIN_TEST_PASSWORD com a senha que vai testar");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`❌ usuário ${email} não existe no banco`);
    process.exit(1);
  }

  console.log(`✅ usuário existe: ${user.email}`);
  console.log(`   id:       ${user.id}`);
  console.log(`   name:     ${user.name}`);
  console.log(`   role:     ${user.role}`);
  console.log(`   isActive: ${user.isActive}`);
  console.log(`   tem hash de senha: ${user.password ? "sim" : "não"}`);

  if (!user.password) {
    console.log("⚠️  usuário não tem hash de senha — login impossível");
    return;
  }

  const ok = await bcrypt.compare(password, user.password);
  console.log(`\n🔑 senha "${password.slice(0, 3)}***" bate com hash? ${ok ? "SIM" : "NÃO"}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
