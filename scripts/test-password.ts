import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'clubedoservidor@protonmail.com' }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('✓ Usuário encontrado:', user.email);

    if (!user.password) {
      console.log('❌ Usuário não tem senha definida');
      return;
    }

    const testPassword = '741963PgP@*#$';
    const isValid = await bcrypt.compare(testPassword, user.password);

    if (isValid) {
      console.log('✓ Senha correta! O login deveria funcionar.');
    } else {
      console.log('❌ Senha incorreta! Precisa atualizar a senha.');
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
