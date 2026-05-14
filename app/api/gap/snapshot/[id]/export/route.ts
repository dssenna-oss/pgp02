export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadGapDPO } from "@/lib/gap-helpers";
import { buildGapExportXLSX, suggestFilename } from "@/lib/gap-export";

/**
 * GET /api/gap/snapshot/[id]/export
 *
 * Devolve o XLSX do GAP **a partir de um snapshot congelado**. Útil pra
 * ter "fotos exportáveis" das versões anteriores (Q1, Q2…) sem que o
 * dado atual interfira.
 *
 * Acesso: apenas DPO da mesma org.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const { id } = await Promise.resolve(params as any);

  const r = await loadGapDPO();
  if ("error" in r) return r.error;
  const { user } = r;

  const snap = await prisma.gapSnapshot.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!snap) {
    return NextResponse.json(
      { error: "Snapshot não encontrado nesta organização" },
      { status: 404 },
    );
  }

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { companyName: true },
  });
  if (!company) {
    return NextResponse.json(
      { error: "Empresa não encontrada" },
      { status: 404 },
    );
  }

  const payload = (snap.payload as any) ?? {};
  const answers = Array.isArray(payload.answers) ? payload.answers : [];

  const buf = buildGapExportXLSX({
    companyName: company.companyName,
    answers,
    snapshotLabel: snap.label,
  });
  const filename = suggestFilename({
    companyName: company.companyName,
    snapshotLabel: snap.label,
  });

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
