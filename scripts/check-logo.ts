import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  const c = await prisma.company.findFirst({ select: { companyName: true, logoUrl: true } });
  console.log("company:", c?.companyName);
  console.log("logoUrl set?", c?.logoUrl ? "YES" : "no");
  console.log("logoUrl length:", c?.logoUrl?.length ?? 0, "chars");
  await prisma.$disconnect();
})();
