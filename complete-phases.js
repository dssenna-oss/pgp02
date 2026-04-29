const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

// Leia o arquivo externo de conteúdos (que vamos criar separadamente)
const fs = require('fs');

async function main() {
  const user = await prisma.user.findFirst({ 
    where: { email: 'clubedoservidor@protonmail.com' }
  });
  
  if (!user || !user.companyId) {
    console.log('❌ Erro: Usuário/empresa não encontrado!');
    return;
  }
  
  const companyId = user.companyId;
  console.log(`Company ID: ${companyId}\n`);
  
  // Fases 4-7 com conteúdo resumido mas completo
  const phases = {
    'fase-4': fs.readFileSync(__dirname + '/content-fase-4.html', 'utf8'),
    'fase-5': fs.readFileSync(__dirname + '/content-fase-5.html', 'utf8'),
    'fase-6': fs.readFileSync(__dirname + '/content-fase-6.html', 'utf8'),
    'fase-7': fs.readFileSync(__dirname + '/content-fase-7.html', 'utf8')
  };
  
  for (const [phase, content] of Object.entries(phases)) {
    await prisma.phaseInfo.upsert({
      where: { companyId_phase: { companyId, phase }},
      update: { howToProceed: content },
      create: { companyId, phase, howToProceed: content }
    });
    console.log(`✅ ${phase} criada (${content.length} chars)`);
  }
  
  console.log('\n🎉 Fases 4-7 criadas com sucesso!');
}

main()
  .catch((e) => { console.error('Erro:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
