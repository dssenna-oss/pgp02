/**
 * Smoke test do mini-app de Requisições de Direitos do Titular (S1).
 * Cria 1 requisição via Prisma, valida campos derivados (protocolo, dueDate),
 * lê de volta e remove. Não toca Brevo/Tarefa (S4).
 *
 * Run: npx tsx scripts/_smoke-dsr.ts
 */

import { prisma } from "../../lib/db";
import {
  computeDueDate,
  generateProtocolNumber,
  validateDsrSubmission,
} from "../../lib/data-subject-requests";

async function main() {
  // Pega a primeira empresa cadastrada pra usar no teste
  const company = await prisma.company.findFirst({
    select: { id: true, companyName: true },
  });
  if (!company) {
    console.error("❌ Nenhuma empresa cadastrada — rode o seed antes.");
    process.exit(1);
  }
  console.log(`✓ Empresa de teste: ${company.companyName} (${company.id})`);

  // Validar dados intencionalmente inválidos
  const invalid = validateDsrSubmission({
    companyId: company.id,
    titularName: "AB",
    titularCpf: "abc",
    titularPhone: "",
    titularEmail: "x",
    titularCategory: "marciano",
    requestedRights: [],
    detailedRequest: "",
    responseChannel: "telepatia",
    authenticityAccepted: false,
  });
  console.log(`✓ Validação rejeitou ${invalid.length} campos inválidos`);
  if (invalid.length === 0) {
    console.error("❌ Validação deveria ter rejeitado!");
    process.exit(1);
  }

  // Gera protocolo
  const protocolNumber = await generateProtocolNumber(company.id);
  const dueDate = computeDueDate();
  console.log(`✓ Protocolo gerado: ${protocolNumber}`);
  console.log(`✓ Prazo (15d): ${dueDate.toISOString().slice(0, 10)}`);

  // Cria registro real
  const created = await prisma.dataSubjectRequest.create({
    data: {
      companyId: company.id,
      protocolNumber,
      titularName: "Smoke Test Titular",
      titularCpf: "000.000.000-00",
      titularPhone: "(27) 99999-0000",
      titularEmail: "smoke-test@example.com",
      titularCategory: "cidadao",
      requestedRights: ["I", "II", "XII"],
      detailedRequest: "Este é um pedido de teste do smoke test S1.",
      responseChannel: "email",
      identityDocUrl: "https://example.com/fake-rg.pdf",
      authenticityAccepted: true,
      ipAddress: "127.0.0.1",
      userAgent: "smoke-test/1.0",
      dueDate,
    },
    select: {
      id: true,
      protocolNumber: true,
      status: true,
      requestedRights: true,
      dueDate: true,
    },
  });
  console.log("✓ Requisição criada:", created);

  // Lê de volta
  const found = await prisma.dataSubjectRequest.findUnique({
    where: { id: created.id },
  });
  if (!found || found.protocolNumber !== protocolNumber) {
    console.error("❌ Falha ao ler requisição criada.");
    process.exit(1);
  }
  console.log("✓ Leitura confirmou status:", found.status);

  // Limpa
  await prisma.dataSubjectRequest.delete({ where: { id: created.id } });
  console.log("✓ Registro de teste removido.");

  // Validar contagem zerou novamente
  const remaining = await prisma.dataSubjectRequest.count({
    where: { companyId: company.id, protocolNumber },
  });
  if (remaining !== 0) {
    console.error("❌ Cleanup falhou.");
    process.exit(1);
  }

  console.log("\n🎉 Smoke S1 OK — schema + lib + Prisma Client funcionando.");
}

main()
  .catch((e) => {
    console.error("❌ Smoke falhou:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
