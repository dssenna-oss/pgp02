/**
 * GET /api/p/consent/[orgSlug]/[termSlug]/status?email=X | ?cpf=Y
 *
 * Endpoint público (sem auth) — devolve o status do consentimento de
 * um titular específico pra um termo. Usado pela UI:
 *   1) Titular abre a URL pública → vê o termo
 *   2) Digita email/CPF no campo "Já aceitei antes — verificar"
 *   3) UI chama este endpoint e mostra:
 *      - "Você aceitou em DD/MM" → botão "Revogar"
 *      - "Você revogou em DD/MM" → botão "Aceitar de novo"
 *      - "Sem registro" → formulário de aceite
 *
 * Privacy: nunca devolve o registro de OUTRO titular — sempre filtra
 * pelo identificador exato. Não vaza lista de aceites.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeCpf, normalizeEmail } from "@/lib/consent-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string; termSlug: string } },
) {
  const sp = request.nextUrl.searchParams;
  const email = normalizeEmail(sp.get("email"));
  const cpf = normalizeCpf(sp.get("cpf"));

  if (!email && !cpf) {
    return NextResponse.json(
      { error: "Forneça email ou cpf como query param" },
      { status: 400 },
    );
  }

  const company = await prisma.company.findUnique({
    where: { slug: params.orgSlug },
    select: { id: true },
  });
  if (!company) {
    return NextResponse.json({ status: "none" });
  }

  const term = await prisma.consentTerm.findUnique({
    where: { companyId_slug: { companyId: company.id, slug: params.termSlug } },
    select: { id: true, status: true },
  });
  if (!term || term.status !== "PUBLICADO") {
    return NextResponse.json({ status: "none" });
  }

  // Pega o registro MAIS RECENTE pra o titular (em qualquer versão).
  // Status:
  //   - "accepted" se acceptedAt presente e revokedAt null
  //   - "revoked" se ambos presentes
  //   - "none" se nada encontrado
  const record = await prisma.consentRecord.findFirst({
    where: {
      termId: term.id,
      OR: [
        ...(email ? [{ titularEmail: email }] : []),
        ...(cpf ? [{ titularCpf: cpf }] : []),
      ],
    },
    orderBy: { acceptedAt: "desc" },
    select: {
      id: true,
      acceptedAt: true,
      revokedAt: true,
      version: { select: { version: true } },
    },
  });

  if (!record) {
    return NextResponse.json({ status: "none" });
  }

  if (record.revokedAt) {
    return NextResponse.json({
      status: "revoked",
      recordId: record.id,
      acceptedAt: record.acceptedAt.toISOString(),
      revokedAt: record.revokedAt.toISOString(),
      version: record.version.version,
    });
  }

  return NextResponse.json({
    status: "accepted",
    recordId: record.id,
    acceptedAt: record.acceptedAt.toISOString(),
    version: record.version.version,
  });
}
