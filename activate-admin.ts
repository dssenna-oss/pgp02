import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function activateAdmin() {
  try {
    const adminEmail = "clubedoservidor@protonmail.com";
    
    // Verificar se o admin existe
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (admin) {
      // Ativar o admin
      await prisma.user.update({
        where: { email: adminEmail },
        data: { isActive: true },
      });
      console.log("✅ Usuário administrador ativado com sucesso!");
    } else {
      console.log("⚠️ Usuário administrador não encontrado.");
    }
  } catch (error) {
    console.error("❌ Erro ao ativar administrador:", error);
  } finally {
    await prisma.$disconnect();
  }
}

activateAdmin();
