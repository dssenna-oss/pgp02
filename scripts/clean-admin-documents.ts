import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Encontrar o usuário administrador
    const adminUser = await prisma.user.findUnique({
      where: { email: 'clubedoservidor@protonmail.com' },
      include: { company: true }
    });

    if (!adminUser) {
      console.log('Usuário administrador não encontrado');
      return;
    }

    console.log('Administrador encontrado:', {
      email: adminUser.email,
      companyId: adminUser.companyId,
      companyName: adminUser.company?.companyName
    });

    if (adminUser.companyId) {
      // Contar documentos do administrador
      const count = await prisma.document.count({
        where: { companyId: adminUser.companyId }
      });

      console.log(`Total de documentos do administrador: ${count}`);

      if (count > 0) {
        // Deletar todos os documentos do administrador
        const result = await prisma.document.deleteMany({
          where: { companyId: adminUser.companyId }
        });

        console.log(`✓ ${result.count} documentos do administrador foram excluídos`);
      } else {
        console.log('Nenhum documento encontrado para o administrador');
      }
    }

    // Verificar todos os documentos por empresa
    const allDocs = await prisma.document.groupBy({
      by: ['companyId'],
      _count: true
    });

    console.log('\nDocumentos por empresa:');
    for (const doc of allDocs) {
      const company = await prisma.company.findUnique({
        where: { id: doc.companyId }
      });
      console.log(`- ${company?.companyName || 'N/A'}: ${doc._count} documentos`);
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
