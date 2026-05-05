export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadIncidentAuth,
  canCommunicateAnpd,
  incidentToDTO,
  INCIDENT_FULL_INCLUDE,
  COMM_TARGET,
} from "@/lib/incidentes-helpers";
import { buildIncidentSubjectsDocx } from "@/lib/incidentes-titulares-docx";

/**
 * POST /api/incidents/[id]/communicate-subjects
 *
 * Gera o DOCX da carta de comunicação aos titulares (Art. 48 §1º LGPD)
 * e:
 *   - Marca `subjectsNotifiedAt` (se ainda null)
 *   - Avança status pra `COMUNICADO_TITULARES` se vinha de `COMUNICADO_ANPD`
 *     (mantém status atual se já estava ENCERRADO ou não passou pela ANPD)
 *   - Cria 1 linha em `incident_communications` (target=TITULARES) com snapshot
 *
 * Apenas DPO (mesma regra do communicate-anpd).
 *
 * Idempotência: pode rodar 2x — re-emite a carta mas mantém
 * `subjectsNotifiedAt` da 1ª vez. Cada chamada gera nova linha de auditoria.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadIncidentAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  if (!canCommunicateAnpd(user)) {
    return NextResponse.json(
      { error: "Apenas DPO pode comunicar os titulares" },
      { status: 403 }
    );
  }

  const incident = await prisma.incident.findFirst({
    where: { id: params.id, companyId: user.companyId },
    include: INCIDENT_FULL_INCLUDE,
  });
  if (!incident) {
    return NextResponse.json(
      { error: "Incidente não encontrado" },
      { status: 404 }
    );
  }

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: {
      companyName: true,
      cnpj: true,
      address: true,
      dpoName: true,
      dpoEmail: true,
      dpoPhone: true,
    },
  });
  if (!company) {
    return NextResponse.json(
      { error: "Empresa não encontrada" },
      { status: 404 }
    );
  }

  const dto = incidentToDTO(incident as any);
  const now = new Date();
  const isFirstCommunication = incident.subjectsNotifiedAt == null;
  // Avança status apenas quando vem do ANPD (fluxo natural).
  // Se incidente foi pra ENCERRADO ou FALSO_POSITIVO, não mexe.
  const shouldAdvanceStatus = incident.status === "COMUNICADO_ANPD";

  const snapshot = buildSnapshot(dto, company);

  await prisma.$transaction([
    prisma.incident.update({
      where: { id: incident.id },
      data: {
        ...(isFirstCommunication ? { subjectsNotifiedAt: now } : {}),
        ...(shouldAdvanceStatus ? { status: "COMUNICADO_TITULARES" } : {}),
      },
    }),
    prisma.incidentCommunication.create({
      data: {
        incidentId: incident.id,
        target: COMM_TARGET.TITULARES,
        content: snapshot,
        channel: "EMAIL",
        createdById: user.id,
      },
    }),
  ]);

  // Re-busca pra refletir status novo
  const refreshed = await prisma.incident.findUnique({
    where: { id: incident.id },
    include: INCIDENT_FULL_INCLUDE,
  });
  const refreshedDto = incidentToDTO(refreshed as any);

  const buffer = await buildIncidentSubjectsDocx({
    companyName: company.companyName,
    companyCnpj: company.cnpj,
    companyAddress: company.address,
    dpoName: company.dpoName,
    dpoEmail: company.dpoEmail,
    dpoPhone: company.dpoPhone,
    incident: refreshedDto,
    generatedAt: now,
  });

  const filename = `comunicado-titulares-${slugify(incident.title)}-${formatDateFile(now)}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function buildSnapshot(
  dto: ReturnType<typeof incidentToDTO>,
  company: { companyName: string; cnpj: string | null }
): string {
  return [
    `Comunicação aos titulares — ${dto.title}`,
    `Controlador: ${company.companyName} (CNPJ ${company.cnpj ?? "—"})`,
    `Severidade: ${dto.severity}`,
    `Detectado em: ${dto.detectedAt}`,
    `Titulares afetados: ${dto.affectedSubjectsCount ?? "—"}`,
    `Dados sensíveis: ${dto.hasSensitiveData ? "Sim" : "Não"}`,
    "",
    `Descrição: ${dto.description}`,
    dto.containmentMeasures ? `Contenção: ${dto.containmentMeasures}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function formatDateFile(d: Date): string {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}
