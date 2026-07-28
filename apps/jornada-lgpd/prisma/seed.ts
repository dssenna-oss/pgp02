// Seed de desenvolvimento — admin do Clube + instituição de demonstração.
// Senhas são de DEV; em produção o admin real troca no primeiro acesso (E4).

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senha = await bcrypt.hash("Jornada2026!", 10);

  await prisma.user.upsert({
    where: { email: "admin@clubedoservidor.com.br" },
    update: {},
    create: {
      email: "admin@clubedoservidor.com.br",
      nome: "Clube do Servidor",
      senha,
      role: "ADMIN",
    },
  });

  const vegas = await prisma.instituicao.upsert({
    where: { id: "demo-vegas" },
    update: {},
    create: {
      id: "demo-vegas",
      nome: "Prefeitura Municipal de Vegas",
      tipo: "Prefeitura",
      cidade: "Vegas",
      uf: "ES",
      autoridadeCargo: "Prefeito(a) Municipal",
    },
  });

  await prisma.user.upsert({
    where: { email: "gestor@vegas.gov.br" },
    update: {},
    create: {
      email: "gestor@vegas.gov.br",
      nome: "Ana Prado",
      senha,
      role: "GESTOR",
      instituicaoId: vegas.id,
    },
  });

  console.log("Seed ok: admin@clubedoservidor.com.br e gestor@vegas.gov.br (senha Jornada2026!)");
}

main().finally(() => prisma.$disconnect());
