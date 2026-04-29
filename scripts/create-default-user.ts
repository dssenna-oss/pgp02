import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    // Verificar se já existe um usuário com o novo e-mail
    const existingUser = await prisma.user.findUnique({
      where: { email: "clubedoservidor@protonmail.com" },
    });

    if (existingUser) {
      console.log("Usuário já existe. Atualizando senha...");
      
      // Atualizar senha do usuário existente
      const hashedPassword = await bcrypt.hash("741963PgP@*#$", 10);
      await prisma.user.update({
        where: { email: "clubedoservidor@protonmail.com" },
        data: {
          password: hashedPassword,
          name: "Administrador",
        },
      });
      
      console.log("Senha atualizada com sucesso!");
      console.log("Email: clubedoservidor@protonmail.com");
      console.log("Senha: 741963PgP@*#$");
      return;
    }

    // Verificar se existe usuário antigo
    const oldUser = await prisma.user.findUnique({
      where: { email: "admin@pgp.com" },
    });

    let company;
    
    if (oldUser) {
      // Atualizar usuário antigo com novas credenciais
      const hashedPassword = await bcrypt.hash("741963PgP@*#$", 10);
      await prisma.user.update({
        where: { email: "admin@pgp.com" },
        data: {
          email: "clubedoservidor@protonmail.com",
          password: hashedPassword,
          name: "Administrador",
        },
      });
      
      console.log("Usuário atualizado com sucesso:");
      console.log("Email: clubedoservidor@protonmail.com");
      console.log("Senha: 741963PgP@*#$");
      return;
    }

    // Criar empresa padrão
    company = await prisma.company.create({
      data: {
        companyName: "Empresa Padrão",
        tradeName: "Empresa Padrão",
      },
    });

    // Criar senha hash
    const hashedPassword = await bcrypt.hash("741963PgP@*#$", 10);

    // Criar usuário padrão
    const user = await prisma.user.create({
      data: {
        email: "clubedoservidor@protonmail.com",
        name: "Administrador",
        password: hashedPassword,
        companyId: company.id,
      },
    });

    console.log("Usuário padrão criado com sucesso:");
    console.log("Email: clubedoservidor@protonmail.com");
    console.log("Senha: 741963PgP@*#$");
  } catch (error) {
    console.error("Erro ao criar/atualizar usuário padrão:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
