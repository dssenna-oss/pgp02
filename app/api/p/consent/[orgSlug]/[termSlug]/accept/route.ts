/**
 * POST /api/p/consent/[orgSlug]/[termSlug]/accept
 *
 * Endpoint público (sem auth) — grava ConsentRecord representando o
 * aceite digital do titular. Resolve o ônus da prova do Art. 8º §2º
 * LGPD: salva IP + UA + SHA-256 do conteúdo + versionId + timestamp.
 *
 * Idempotência: se mesmo (titularEmail OU titularCpf) já tem aceite
 * ATIVO (não revogado) pra este termo+versão, devolve o existente
 * em vez de criar duplicado. Permite re-aceitar após revogação.
 *
 * Body:
 *   {
 *     titularName?: string,    — opcional (DPO pode pedir ou não)
 *     titularEmail?: string,   — pelo menos 1 (email OU cpf)
 *     titularCpf?: string,
 *   }
 *
 * Response 201:
 *   {
 *     recordId: string,
 *     acceptedAt: string (ISO),
 *     reused: boolean      — true se já existia aceite ativo
 *   }
 */

export const dynamic = "force-dynamic";
export const maxDuration = 15;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  extractClientIp,
  extractUserAgent,
  normalizeCpf,
  normalizeEmail,
  sha256,
} from "@/lib/consent-utils";
import { notifyConsentAccepted } from "@/lib/consent-notify";

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

    const titularName =
      typeof body?.titularName === "string"
        ? body.titularName.trim().slice(0, 200)
        : null;
    const titularEmail = normalizeEmail(body?.titularEmail);
    const titularCpf = normalizeCpf(body?.titularCpf);

    if (!titularEmail && !titularCpf) {
      return NextResponse.json(
        {
          error:
            "Forneça pelo menos um identificador: email ou CPF (com dígitos verificadores válidos)",
        },
        { status: 400 },
      );
    }

    // Resolve o termo pelo slug + valida que está PUBLICADO e que
    // a coleta digital está ativa.
    const company = await prisma.company.findUnique({
      where: { slug: params.orgSlug },
      select: { id: true },
    });
    if (!company) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
    }

    const term = await prisma.consentTerm.findUnique({
      where: { companyId_slug: { companyId: company.id, slug: params.termSlug } },
      select: {
        id: true,
        companyId: true,
        title: true,
        slug: true,
        status: true,
        publishedContent: true,
        currentVersion: true,
        allowsDigital: true,
        versions: {
          where: {
            // pega a versão atualmente publicada (currentVersion)
          },
          orderBy: { version: "desc" },
          take: 1,
          select: { id: true, version: true, content: true },
        },
      },
    });
    if (!term || term.status !== "PUBLICADO" || !term.publishedContent) {
      return NextResponse.json({ error: "Termo não disponível" }, { status: 404 });
    }
    if (!term.allowsDigital) {
      return NextResponse.json(
        { error: "Este termo é coletado presencialmente — não aceita aceite digital." },
        { status: 422 },
      );
    }

    const currentVer = term.versions[0];
    if (!currentVer) {
      return NextResponse.json(
        { error: "Estado inconsistente: termo publicado sem versão." },
        { status: 500 },
      );
    }

    // Idempotência — se já tem aceite ativo (não revogado) pro mesmo
    // titular nessa versão, devolve o existente.
    const existing = await prisma.consentRecord.findFirst({
      where: {
        termId: term.id,
        versionId: currentVer.id,
        revokedAt: null,
        OR: [
          ...(titularEmail ? [{ titularEmail }] : []),
          ...(titularCpf ? [{ titularCpf }] : []),
        ],
      },
      select: { id: true, acceptedAt: true },
    });
    if (existing) {
      return NextResponse.json(
        {
          recordId: existing.id,
          acceptedAt: existing.acceptedAt.toISOString(),
          reused: true,
        },
        { status: 200 },
      );
    }

    // Cria novo registro de aceite com toda a evidência.
    const ip = extractClientIp(request);
    const userAgent = extractUserAgent(request);
    const contentChecksum = sha256(currentVer.content);

    const created = await prisma.consentRecord.create({
      data: {
        termId: term.id,
        versionId: currentVer.id,
        titularName,
        titularEmail,
        titularCpf,
        ip,
        userAgent,
        contentChecksum,
      },
      select: { id: true, acceptedAt: true },
    });

    // Fire-and-forget: notifica DPOs da org (filtra por emailNotifyConsent).
    void notifyConsentAccepted({
      companyId: term.companyId,
      termId: term.id,
      termTitle: term.title,
      termSlug: term.slug,
      version: currentVer.version,
      titular: { name: titularName, email: titularEmail, cpf: titularCpf },
      ip,
      acceptedAtIso: created.acceptedAt.toISOString(),
    });

    return NextResponse.json(
      {
        recordId: created.id,
        acceptedAt: created.acceptedAt.toISOString(),
        reused: false,
      },
      { status: 201 },
    );
  } catch (e: any) {
    console.error("[/api/p/consent/.../accept] erro:", e);
    return NextResponse.json(
      { error: e?.message ?? "Erro inesperado" },
      { status: 500 },
    );
  }
}
