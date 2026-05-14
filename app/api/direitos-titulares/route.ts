/**
 * API — Requisições de Direitos do Titular (LGPD arts. 18, 19, 20)
 *
 * POST /api/direitos-titulares       → Público (sem auth)  — cria nova requisição
 * GET  /api/direitos-titulares       → DPO-only           — lista requisições da empresa
 *
 * O GET aceita filtros via querystring: ?status=RECEBIDA&q=texto&page=1&pageSize=20
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import {
  computeDueDate,
  generateProtocolNumber,
  normalizeDsrSubmission,
  validateDsrSubmission,
  DSR_STATUSES,
  type DsrSubmissionInput,
  type DsrStatus,
} from "@/lib/data-subject-requests";
import {
  sendDsrAlertToDpo,
  sendDsrConfirmationToTitular,
} from "@/lib/dsr-notifications";

export const dynamic = "force-dynamic";

// ----------------------------------------------------------------------
// POST — submissão pública (titular preenche form, sem login)
// ----------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DsrSubmissionInput;

    if (!body.companyId) {
      return NextResponse.json(
        { error: "companyId é obrigatório" },
        { status: 400 },
      );
    }

    // Confirma que a empresa existe (segurança contra IDs inventados)
    const company = await prisma.company.findUnique({
      where: { id: body.companyId },
      select: {
        id: true,
        companyName: true,
        tradeName: true,
        dpoName: true,
        dpoEmail: true,
      },
    });
    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 },
      );
    }

    // Auditoria: IP + User-Agent
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    const normalized = normalizeDsrSubmission({ ...body, ipAddress, userAgent });

    const errors = validateDsrSubmission(normalized);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Dados inválidos", validation: errors },
        { status: 422 },
      );
    }

    const now = new Date();
    const protocolNumber = await generateProtocolNumber(company.id);
    const dueDate = computeDueDate(now);

    const created = await prisma.dataSubjectRequest.create({
      data: {
        companyId: company.id,
        protocolNumber,
        titularName: normalized.titularName,
        titularCpf: normalized.titularCpf,
        titularDocType: normalized.titularDocType || null,
        titularDocNumber: normalized.titularDocNumber || null,
        titularBirthDate: normalized.titularBirthDate
          ? new Date(normalized.titularBirthDate)
          : null,
        titularPhone: normalized.titularPhone,
        titularEmail: normalized.titularEmail,
        titularAddress: normalized.titularAddress || null,
        titularCategory: normalized.titularCategory,
        titularCategoryOther: normalized.titularCategoryOther || null,
        hasRepresentative: !!normalized.hasRepresentative,
        representativeName: normalized.representativeName || null,
        representativeCpf: normalized.representativeCpf || null,
        representativeType: normalized.representativeType || null,
        representativeTypeOther: normalized.representativeTypeOther || null,
        representativeEmail: normalized.representativeEmail || null,
        representativePhone: normalized.representativePhone || null,
        requestedRights: normalized.requestedRights,
        detailedRequest: normalized.detailedRequest,
        responseChannel: normalized.responseChannel,
        responseChannelOther: normalized.responseChannelOther || null,
        identityDocUrl: normalized.identityDocUrl || null,
        representationDocUrl: normalized.representationDocUrl || null,
        additionalDocs: normalized.additionalDocs
          ? (normalized.additionalDocs as object)
          : undefined,
        status: "RECEBIDA",
        authenticityAccepted: !!normalized.authenticityAccepted,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        dueDate,
      },
      select: {
        id: true,
        protocolNumber: true,
        status: true,
        dueDate: true,
        createdAt: true,
        titularEmail: true,
      },
    });

    // ----- Side effects (best-effort, não bloqueiam a resposta) -----

    // C5: auto-criar Tarefa atribuída ao Encarregado da organização
    // (busca o primeiro DPO_PRINCIPAL ou admin legado da empresa).
    try {
      const dpoUser = await prisma.user.findFirst({
        where: {
          companyId: company.id,
          role: { in: ["DPO_PRINCIPAL", "admin"] },
        },
        select: { id: true },
      });
      if (dpoUser) {
        const task = await prisma.task.create({
          data: {
            companyId: company.id,
            userId: dpoUser.id,
            title: `📋 Atender requisição ${created.protocolNumber}`,
            description: `Requisição de direitos do titular recebida.\n\nTitular: ${normalized.titularName}\nE-mail: ${normalized.titularEmail}\nDireitos solicitados: ${normalized.requestedRights.join(", ")}\n\nAbra o painel em /dashboard/requisicoes-titulares para responder.\n\nPrazo legal: ${created.dueDate.toLocaleDateString("pt-BR")} (15 dias corridos da LGPD, art. 19 §1º).`,
            status: "A_FAZER",
            priority: "ALTA",
            dueDate: created.dueDate,
            // `markers` é String JSON (ver schema Task) — não array nativo.
            markers: JSON.stringify(["LGPD", "Direitos do Titular"]),
          },
          select: { id: true },
        });
        // Vincular a tarefa ao DSR
        await prisma.dataSubjectRequest.update({
          where: { id: created.id },
          data: { relatedTaskId: task.id },
        });
      } else {
        console.log(
          `[dsr] Nenhum DPO encontrado em company=${company.id} — tarefa não criada.`,
        );
      }
    } catch (taskErr) {
      console.error("[dsr] Falha ao auto-criar tarefa:", taskErr);
    }

    // B4 + C4: emails ao titular e ao DPO
    const dsrSummary = {
      protocolNumber: created.protocolNumber,
      titularName: normalized.titularName,
      titularEmail: normalized.titularEmail,
      titularPhone: normalized.titularPhone,
      titularCategory: normalized.titularCategory,
      requestedRights: normalized.requestedRights,
      detailedRequest: normalized.detailedRequest,
      responseChannel: normalized.responseChannel,
      dueDate: created.dueDate,
      companyId: company.id,
      dsrId: created.id,
    };
    const orgInfo = {
      companyName: company.companyName,
      tradeName: company.tradeName,
      dpoName: company.dpoName,
      dpoEmail: company.dpoEmail,
    };

    await Promise.allSettled([
      sendDsrConfirmationToTitular(dsrSummary, orgInfo),
      sendDsrAlertToDpo(dsrSummary, orgInfo),
    ]);

    return NextResponse.json(
      {
        ok: true,
        request: created,
        message: `Requisição registrada com o protocolo ${created.protocolNumber}.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar requisição de direitos:", error);
    return NextResponse.json(
      { error: "Erro ao registrar requisição" },
      { status: 500 },
    );
  }
}

// ----------------------------------------------------------------------
// GET — listagem (DPO-only)
// ----------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, companyId: true, role: true },
    });
    if (!user || !user.companyId) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 },
      );
    }
    if (!isDPO(user.role)) {
      return NextResponse.json(
        { error: "Acesso restrito ao Encarregado e equipe (DPO)" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)),
    );

    const where: Record<string, unknown> = { companyId: user.companyId };

    if (statusParam && DSR_STATUSES.includes(statusParam as DsrStatus)) {
      where.status = statusParam;
    }

    if (q) {
      Object.assign(where, {
        OR: [
          { protocolNumber: { contains: q, mode: "insensitive" } },
          { titularName: { contains: q, mode: "insensitive" } },
          { titularEmail: { contains: q, mode: "insensitive" } },
          { titularCpf: { contains: q } },
        ],
      });
    }

    const [items, total, statusCounts] = await Promise.all([
      prisma.dataSubjectRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          protocolNumber: true,
          titularName: true,
          titularEmail: true,
          titularCategory: true,
          requestedRights: true,
          status: true,
          dueDate: true,
          createdAt: true,
          responseDate: true,
          decision: true,
        },
      }),
      prisma.dataSubjectRequest.count({ where }),
      // Contadores por status (sem filtro de q nem status)
      prisma.dataSubjectRequest.groupBy({
        by: ["status"],
        where: { companyId: user.companyId },
        _count: { _all: true },
      }),
    ]);

    const counts = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count._all]),
    );

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      counts,
    });
  } catch (error) {
    console.error("Erro ao listar requisições de direitos:", error);
    return NextResponse.json(
      { error: "Erro ao listar requisições" },
      { status: 500 },
    );
  }
}
