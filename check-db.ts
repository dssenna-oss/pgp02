import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const phases = await prisma.phaseInfo.findMany({
    orderBy: { phase: 'asc' }
  });
  
  console.log('\n=== Fases no banco de dados ===\n');
  phases.forEach(phase => {
    console.log(`Fase: ${phase.phase}`);
    console.log(`  Company ID: ${phase.companyId}`);
    console.log(`  E-book URL: ${phase.heyzineEmbedUrl || '(vazio)'}`);
    console.log(`  Como Proceder: ${phase.howToProceed ? phase.howToProceed.substring(0, 100) + '...' : '(vazio)'}`);
    console.log('');
  });
  
  console.log(`Total de fases: ${phases.length}`);
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
