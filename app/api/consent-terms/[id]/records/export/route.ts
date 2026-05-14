/**
 * GET /api/consent-terms/[id]/records/export?status=active|revoked|all
 *
 * Exporta XLSX de evidência de aceites de um Termo de Consentimento.
 * Cada linha é 1 ConsentRecord (aceite digital).
 *
 * Colunas:
 *   Nome · Email · CPF (mascarado) · Aceito em · Revogado em ·
 *   Razão revogação · IP · User-Agent · Versão · SHA-256
 *
 * Acesso: DPO-only da mesma org do termo.
 *
 * Pensamento: cpf é dado pessoal sensível — exportar inteiro num XLSX
 * que vai sair do sistema é arriscado. Mantém mascarado mesmo no
 * export. Se algum DPO precisar do CPF inteiro pra investigar caso
 * específico, faz consulta direto no painel ou banco.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import { maskCpf } from "@/lib/consent-utils";
import * as XLSX from "xlsx";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, companyId: true },
    });
    if (!user?.companyId || !isDPO(user.role)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const term = await prisma.consentTerm.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        companyId: true,
        title: true,
        slug: true,
        currentVersion: true,
      },
    });
    if (!term || term.companyId !== user.companyId) {
      return NextResponse.json({ error: "Termo não encontrado" }, { status: 404 });
    }

    const filter = request.nextUrl.searchParams.get("status") ?? "all";
    const where: any = { termId: term.id };
    if (filter === "active") where.revokedAt = null;
    else if (filter === "revoked") where.revokedAt = { not: null };

    const records = await prisma.consentRecord.findMany({
      where,
      orderBy: { acceptedAt: "desc" },
      select: {
        id: true,
        titularName: true,
        titularEmail: true,
        titularCpf: true,
        ip: true,
        userAgent: true,
        contentChecksum: true,
        acceptedAt: true,
        revokedAt: true,
        revocationReason: true,
        version: { select: { version: true } },
      },
    });

    const rows = records.map((r) => ({
      Nome: r.titularName ?? "",
      Email: r.titularEmail ?? "",
      "CPF (mascarado)": r.titularCpf ? maskCpf(r.titularCpf) : "",
      "Aceito em": r.acceptedAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      "Revogado em": r.revokedAt
        ? r.revokedAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
        : "",
      "Razão da revogação": r.revocationReason ?? "",
      IP: r.ip,
      "User-Agent": r.userAgent,
      Versão: r.version.version,
      "SHA-256": r.contentChecksum,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows, {
      header: [
        "Nome",
        "Email",
        "CPF (mascarado)",
        "Aceito em",
        "Revogado em",
        "Razão da revogação",
        "IP",
        "User-Agent",
        "Versão",
        "SHA-256",
      ],
    });
    // Largura das colunas pra leitura confortável no Excel
    ws["!cols"] = [
      { wch: 28 }, // Nome
      { wch: 32 }, // Email
      { wch: 18 }, // CPF
      { wch: 22 }, // Aceito em
      { wch: 22 }, // Revogado em
      { wch: 40 }, // Razão
      { wch: 18 }, // IP
      { wch: 50 }, // UA
      { wch: 8 }, // Versão
      { wch: 64 }, // SHA-256
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Aceites");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    const date = new Date().toISOString().slice(0, 10);
    const filename = `aceites-${term.slug}-${date}.xlsx`;

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[/api/consent-terms/[id]/records/export] erro:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 },
    );
  }
}
