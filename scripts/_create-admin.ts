/**
 * Script temporário para criar usuário admin no Neon após reset do DB.
 * Uso: npx ts-node scripts/_create-admin.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "clubedoservidor@protonmail.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme";
  const hash = await bcrypt.hash(password, 12);

  // 1. Empresa
  const company = await prisma.company.upsert({
    where: { cnpj: "00.000.000/0001-00" },
    update: {},
    create: {
      companyName: "Empresa Demo PGP",
      tradeName: "Demo PGP",
      cnpj: "00.000.000/0001-00",
      address: "Av. Principal, 1",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
      email: "contato@demopgp.com.br",
      dpoName: "Admin",
      dpoEmail: email,
      businessSector: "Tecnologia",
    },
  });

  // 2. Usuário DPO
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hash, isActive: true, role: "DPO_PRINCIPAL" },
    create: {
      name: "Admin DPO",
      email,
      password: hash,
      companyId: company.id,
      isActive: true,
      role: "DPO_PRINCIPAL",
    },
  });

  console.log(`✅ Usuário criado: ${user.email} (${user.role})`);
  console.log(`🏢 Empresa: ${company.companyName}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
