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
import { buildIncidentAnpdDocx } from "@/lib/incidentes-docx-export";

/**
 * POST /api/incidents/[id]/communicate-anpd
 *
 * Gera o DOCX da comunicação à ANPD (Res. CD/ANPD nº 15/2024) e:
 *   - Registra `anpdNotifiedAt` (se ainda null) com data/hora atual
 *   - Avança status pra `COMUNICADO_ANPD` se estava em EM_CONTENCAO
 *   - Cria 1 linha em `incident_communications` (target=ANPD) com snapshot
 *
 * Devolve o DOCX como download. Apenas DPO.
 *
 * Idempotência: pode rodar 2x (re-emite o ofício mas mantém anpdNotifiedAt
 * da 1ª vez — só registra nova linha de auditoria).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadIncidentAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  if (!canCommunicateAnpd(user)) {
    return NextResponse.json(
      { error: "Apenas DPO pode comunicar a ANPD" },
      { status: 403 }
    );
  }

  // Carregar incidente + dados da company pra cabeçalho do ofício
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

  // Gera o DTO já com derivados (anpdDeadline, etc.)
  const dto = incidentToDTO(incident as any);

  // Cria/atualiza dados de auditoria + status em transaction
  const now = new Date();
  const isFirstCommunication = incident.anpdNotifiedAt == null;
  const shouldAdvanceStatus =
    incident.status === "EM_CONTENCAO" || incident.status === "EM_ANALISE" ||
    incident.status === "DETECTADO";

  // Snapshot textual pra auditoria (resumo do que foi comunicado)
  const snapshot = buildSnapshot(dto, company);

  await prisma.$transaction([
    prisma.incident.update({
      where: { id: incident.id },
      data: {
        ...(isFirstCommunication ? { anpdNotifiedAt: now } : {}),
        ...(shouldAdvanceStatus ? { status: "COMUNICADO_ANPD" } : {}),
      },
    }),
    prisma.incidentCommunication.create({
      data: {
        incidentId: incident.id,
        target: COMM_TARGET.ANPD,
        content: snapshot,
        channel: "OFICIO",
        createdById: user.id,
      },
    }),
  ]);

  // Gera DOCX (re-busca DTO atualizado pra refletir o status novo no ofício)
  const refreshed = await prisma.incident.findUnique({
    where: { id: incident.id },
    include: INCIDENT_FULL_INCLUDE,
  });
  const refreshedDto = incidentToDTO(refreshed as any);

  const buffer = await buildIncidentAnpdDocx({
    companyName: company.companyName,
    companyCnpj: company.cnpj,
    companyAddress: company.address,
    dpoName: company.dpoName,
    dpoEmail: company.dpoEmail,
    dpoPhone: company.dpoPhone,
    incident: refreshedDto,
    generatedAt: now,
  });

  const filename = `comunicacao-anpd-${slugify(incident.title)}-${formatDateFile(now)}.docx`;

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
  company: {
    companyName: string;
    cnpj: string | null;
  }
): string {
  return [
    `Comunicação à ANPD — ${dto.title}`,
    `Controlador: ${company.companyName} (CNPJ ${company.cnpj ?? "—"})`,
    `Tipo: ${dto.incidentType} · Severidade: ${dto.severity}`,
    `Detectado em: ${dto.detectedAt}`,
    `Titulares afetados: ${dto.affectedSubjectsCount ?? "—"}`,
    `Dados sensíveis: ${dto.hasSensitiveData ? "Sim" : "Não"}`,
    "",
    `Descrição: ${dto.description}`,
    dto.containmentMeasures ? `Contenção: ${dto.containmentMeasures}` : "",
    dto.correctiveMeasures ? `Corretivas: ${dto.correctiveMeasures}` : "",
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
