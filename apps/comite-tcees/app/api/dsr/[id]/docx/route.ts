import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { generateDsrResponseDocx } from "@/lib/dsr-docx";
import { tceesPlaceholders } from "@/lib/policy-mono";
import type { DsrDecision, DsrStatus } from "@/lib/dsr-helpers";

export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [dsr, ph] = await Promise.all([
    prisma.dataSubjectRequest.findUnique({ where: { id: params.id } }),
    tceesPlaceholders(),
  ]);
  if (!dsr) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  const buffer = await generateDsrResponseDocx({
    orgName: ph.companyName,
    orgCnpj: ph.cnpj,
    orgAddress: ph.address,
    dpoName: ph.dpoName,
    dpoEmail: ph.dpoEmail,
    dpoPhone: ph.dpoPhone,
    protocolNumber: dsr.protocolNumber,
    createdAt: dsr.receivedAt,
    dueDate: dsr.dueDate,
    status: dsr.status as DsrStatus,
    titularName: dsr.titularName,
    titularCpf: "",
    titularEmail: "",
    titularCategory: dsr.titularCategory,
    requestedRights: dsr.requestedRights,
    detailedRequest: dsr.detailedRequest ?? "",
    responseChannel: "email",
    responseChannelOther: null,
    decision: (dsr.decision as DsrDecision | null) ?? null,
    responseText: dsr.responseText,
    responseActions: dsr.responseActions,
    responseDate: dsr.responseDate,
    responseChannelUsed: null,
    respondedByName: dsr.respondedBy,
  });

  const safe = dsr.protocolNumber.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9-]+/g, "_").slice(0, 40);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Resposta_DSR_${safe}.docx"`,
    },
  });
}
