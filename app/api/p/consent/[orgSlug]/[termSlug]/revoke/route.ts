/**
 * POST /api/p/consent/[orgSlug]/[termSlug]/revoke
 *
 * Endpoint público (sem auth) — registra revogação de consentimento
 * (Art. 8º §5º LGPD: direito de revogar a qualquer momento, sem ônus).
 *
 * Não DELETA o ConsentRecord — só marca `revokedAt`. A evidência do
 * período em que o consentimento esteve ativo precisa sobreviver à
 * revogação pra defender o controlador num eventual questionamento.
 *
 * Body:
 *   {
 *     titularEmail?: string,    — pelo menos 1 (email OU cpf)
 *     titularCpf?: string,
 *     reason?: string           — opcional
 *   }
 *
 * Idempotência: se já está revogado, devolve o estado atual sem erro.
 *
 * Response 200:
 *   {
 *     recordId: string,
 *     revokedAt: string (ISO),
 *     alreadyRevoked: boolean
 *   }
 */

export const dynamic = "force-dynamic";
export const maxDuration = 10;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeCpf, normalizeEmail } from "@/lib/consent-utils";
import { notifyConsentRevoked } from "@/lib/consent-notify";

export async function POST(
  request: NextRequest,
  { params }: { params: { orgSlug: string; termSlug: string } },
) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const titularEmail = normalizeEmail(body?.titularEmail);
    const titularCpf = normalizeCpf(body?.titularCpf);
    const reason =
      typeof body?.reason === "string"
        ? body.reason.trim().slice(0, 1000) || null
        : null;

    if (!titularEmail && !titularCpf) {
      return NextResponse.json(
        { error: "Forneça email ou CPF pra identificar o consentimento a revogar" },
        { status: 400 },
      );
    }

    const company = await prisma.company.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    });
    if (!company) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
    }

    const term = await prisma.consentTerm.findUnique({
      where: { companyId_slug: { companyId: company.id, slug: params.termSlug } },
      select: { id: true, companyId: true, title: true },
    });
    if (!term) {
      return NextResponse.json({ error: "Termo não encontrado" }, { status: 404 });
    }

    // Pega o registro ativo mais recente pro titular.
    const active = await prisma.consentRecord.findFirst({
      where: {
        termId: term.id,
        revokedAt: null,
        OR: [
          ...(titularEmail ? [{ titularEmail }] : []),
          ...(titularCpf ? [{ titularCpf }] : []),
        ],
      },
      orderBy: { acceptedAt: "desc" },
      select: {
        id: true,
        acceptedAt: true,
        titularName: true,
        titularEmail: true,
        titularCpf: true,
      },
    });

    if (!active) {
      // Já revogado ou nunca aceitou — checa se há registro revogado
      const revoked = await prisma.consentRecord.findFirst({
        where: {
          termId: term.id,
          revokedAt: { not: null },
          OR: [
            ...(titularEmail ? [{ titularEmail }] : []),
            ...(titularCpf ? [{ titularCpf }] : []),
          ],
        },
        orderBy: { revokedAt: "desc" },
        select: { id: true, revokedAt: true },
      });
      if (revoked && revoked.revokedAt) {
        return NextResponse.json({
          recordId: revoked.id,
          revokedAt: revoked.revokedAt.toISOString(),
          alreadyRevoked: true,
        });
      }
      return NextResponse.json(
        { error: "Não encontramos consentimento ativo pra este identificador" },
        { status: 404 },
      );
    }

    const updated = await prisma.consentRecord.update({
      where: { id: active.id },
      data: {
        revokedAt: new Date(),
        revocationReason: reason,
      },
      select: { id: true, revokedAt: true },
    });

    // Fire-and-forget: notifica DPOs da org (Etapa 31).
    void notifyConsentRevoked({
      companyId: term.companyId,
      termId: term.id,
      termTitle: term.title,
      titular: {
        name: active.titularName,
        email: active.titularEmail,
        cpf: active.titularCpf,
      },
      revokedAtIso: updated.revokedAt!.toISOString(),
      acceptedAtIso: active.acceptedAt.toISOString(),
      reason,
    });

    return NextResponse.json({
      recordId: updated.id,
      revokedAt: updated.revokedAt!.toISOString(),
      alreadyRevoked: false,
    });
  } catch (e: any) {
    console.error("[/api/p/consent/.../revoke] erro:", e);
    return NextResponse.json(
      { error: e?.message ?? "Erro inesperado" },
      { status: 500 },
    );
  }
}
