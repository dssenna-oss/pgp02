import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  const r = await prisma.company.updateMany({ data: { logoUrl: null } });
  console.log(`✅ logoUrl removido de ${r.count} empresa(s)`);
  await prisma.$disconnect();
})();
