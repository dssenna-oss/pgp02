/**
 * Smoke S5: gera um DOCX de resposta a partir de dados-mock,
 * pra validar visualmente o layout sem precisar passar pelo endpoint.
 * Output: E:\_________PGP\_test-export-resposta.docx
 */
import { prisma } from "../../lib/db";
import { generateDsrResponseDocx } from "../../lib/dsr-docx";
import fs from "fs";

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("sem company");
  const buf = await generateDsrResponseDocx({
    orgName: company.companyName,
    orgCnpj: company.cnpj,
    orgAddress: company.address,
    dpoName: company.dpoName,
    dpoEmail: company.dpoEmail,
    dpoPhone: company.dpoPhone,
    protocolNumber: "REQ-2026-9999",
    createdAt: new Date("2026-05-01"),
    dueDate: new Date("2026-05-16"),
    status: "RESPONDIDA",
    titularName: "João Teste DOCX",
    titularCpf: "111.222.333-44",
    titularEmail: "joao.docx@example.com",
    titularCategory: "cidadao",
    requestedRights: ["I", "II", "VII", "XII"],
    detailedRequest:
      "Solicito acesso a todos os dados que vocês têm sobre mim no Sistema de Protocolo, no Sistema de Recursos Humanos e em qualquer outro sistema. Por favor, especificar o período entre 2020 e 2025 e o compartilhamento com terceiros.",
    responseChannel: "email",
    responseChannelOther: null,
    decision: "DEFERIDO_PARCIAL",
    responseText:
      "Prezado(a) João Teste DOCX,\n\nEm atendimento à sua requisição protocolo REQ-2026-9999, informamos que:\n\n1. Confirmamos a existência de tratamento de seus dados pessoais em nosso Sistema de Protocolo Administrativo (período: 2020-2025).\n2. Os dados específicos são: nome, CPF, endereço, número de protocolo e histórico de tramitação.\n3. Esses dados foram compartilhados com a Secretaria Estadual de Fazenda exclusivamente para fins de fiscalização tributária.\n\nQuanto à solicitação de acesso ao Sistema de Recursos Humanos, não há registros relacionados ao CPF informado.",
    responseActions:
      "Conferência cruzada nos 2 sistemas internos. Extração de relatório consolidado pelo TI. Validação jurídica do compartilhamento com a SEFA.",
    responseDate: new Date("2026-05-12"),
    responseChannelUsed: "email",
    respondedByName: company.dpoName || "Encarregado",
  });
  const out = "E:/_________PGP/_test-export-resposta.docx";
  fs.writeFileSync(out, buf);
  console.log("OK:", out, "tamanho:", buf.length, "bytes");
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
