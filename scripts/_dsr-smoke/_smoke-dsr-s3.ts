/**
 * Smoke S3: cria 3 requisições de teste com diferentes status/datas
 * pra validar visualmente o painel DPO.
 * Run: npx tsx scripts/_smoke-dsr-s3.ts
 */
import { prisma } from "../lib/db";
import { computeDueDate, generateProtocolNumber } from "../lib/data-subject-requests";

async function main() {
  const dpo = await prisma.user.findFirst({
    where: {
      role: { in: ["admin", "DPO_PRINCIPAL", "DPO_SUBSTITUTO", "DPO_AUXILIAR"] },
    },
    select: { id: true, email: true, role: true, companyId: true },
  });
  console.log("DPO:", dpo);

  const company = await prisma.company.findFirst({ select: { id: true } });
  if (!company) throw new Error("Sem empresa");

  // 3 cenários: recente, próximo do prazo, vencido
  const now = new Date();
  const protOK = await generateProtocolNumber(company.id);
  const protCrit = `REQ-${now.getFullYear()}-9001`;
  const protOverdue = `REQ-${now.getFullYear()}-9002`;

  // Remove duplicatas eventuais de runs anteriores
  await prisma.dataSubjectRequest.deleteMany({
    where: { protocolNumber: { in: [protOK, protCrit, protOverdue] } },
  });

  const baseData = {
    companyId: company.id,
    titularCpf: "111.222.333-44",
    titularDocType: "RG",
    titularDocNumber: "12.345.678-9",
    titularPhone: "(27) 99999-0000",
    titularCategory: "cidadao",
    requestedRights: ["I", "II", "VII"],
    detailedRequest: "Solicito acesso aos dados que vocês têm sobre mim.",
    responseChannel: "email",
    identityDocUrl: "https://fake.blob.vercel-storage.com/rg.pdf",
    authenticityAccepted: true,
  };

  // 1. Recente
  await prisma.dataSubjectRequest.create({
    data: {
      ...baseData,
      protocolNumber: protOK,
      titularName: "Maria Recente",
      titularEmail: "maria.recente@example.com",
      dueDate: computeDueDate(now),
      status: "RECEBIDA",
    },
  });

  // 2. Em análise, próximo do prazo (2 dias restantes)
  const dueCrit = new Date(now);
  dueCrit.setDate(now.getDate() + 2);
  await prisma.dataSubjectRequest.create({
    data: {
      ...baseData,
      protocolNumber: protCrit,
      titularName: "João Crítico",
      titularEmail: "joao.critico@example.com",
      titularCategory: "servidor",
      requestedRights: ["III", "XII"],
      dueDate: dueCrit,
      status: "EM_ANALISE",
      createdAt: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
    },
  });

  // 3. Vencido
  const dueOver = new Date(now);
  dueOver.setDate(now.getDate() - 3);
  await prisma.dataSubjectRequest.create({
    data: {
      ...baseData,
      protocolNumber: protOverdue,
      titularName: "Carlos Atrasado",
      titularEmail: "carlos.atrasado@example.com",
      titularCategory: "jurisdicionado",
      requestedRights: ["IV", "V", "VI", "X", "XI"],
      dueDate: dueOver,
      status: "RECEBIDA",
      createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✓ 3 requisições de teste criadas");
  const total = await prisma.dataSubjectRequest.count({ where: { companyId: company.id } });
  console.log(`Total no banco: ${total}`);

  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
