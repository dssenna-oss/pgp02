// Seed inicial — cria SOMENTE o usuário admin/facilitador.
// Os usuários dos grupos são criados pela tela "/admin/criar-turma" (S3).

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "facilitador@curso.lgpd";
  const adminPassword = process.env.ADMIN_PASSWORD || "Curso2026!";

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`✓ Admin já existe: ${adminEmail}`);
    return;
  }

  const hash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Facilitador",
      password: hash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`✓ Admin criado: ${adminEmail} / ${adminPassword}`);
  console.log("  ⚠ Troque a senha após o primeiro login em produção.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
