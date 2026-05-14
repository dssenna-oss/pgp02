/**
 * API — detalhe e atualização de uma Requisição de Direitos do Titular
 *
 * GET    /api/direitos-titulares/[id] → DPO-only — retorna requisição completa
 * PATCH  /api/direitos-titulares/[id] → DPO-only — atualiza status/resposta
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import {
  DSR_DECISIONS,
  DSR_RESPONSE_CHANNELS,
  DSR_STATUSES,
  type DsrDecision,
  type DsrResponseChannel,
  type DsrStatus,
} from "@/lib/data-subject-requests";

export const dynamic = "force-dynamic";

// ----------------------------------------------------------------------
// GET — detalhe (DPO-only)
// ----------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const dsr = await prisma.dataSubjectRequest.findUnique({
      where: { id: params.id },
      include: {
        respondedByUser: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!dsr || dsr.companyId !== user.companyId) {
      return NextResponse.json(
        { error: "Requisição não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(dsr);
  } catch (error) {
    console.error("Erro ao buscar requisição:", error);
    return NextResponse.json(
      { error: "Erro ao buscar requisição" },
      { status: 500 },
    );
  }
}

// ----------------------------------------------------------------------
// PATCH — atualizar status / responder (DPO-only)
// ----------------------------------------------------------------------
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const existing = await prisma.dataSubjectRequest.findUnique({
      where: { id: params.id },
      select: { id: true, companyId: true, status: true },
    });
    if (!existing || existing.companyId !== user.companyId) {
      return NextResponse.json(
        { error: "Requisição não encontrada" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const update: Record<string, unknown> = {};

    // Mudança de status (workflow)
    if (typeof body.status === "string") {
      if (!DSR_STATUSES.includes(body.status as DsrStatus)) {
        return NextResponse.json(
          { error: "Status inválido" },
          { status: 422 },
        );
      }
      update.status = body.status;
    }

    // Decisão e texto da resposta
    if (typeof body.decision === "string") {
      if (!DSR_DECISIONS.includes(body.decision as DsrDecision)) {
        return NextResponse.json(
          { error: "Decisão inválida" },
          { status: 422 },
        );
      }
      update.decision = body.decision;
    }

    if (typeof body.responseText === "string") {
      update.responseText = body.responseText;
    }
    if (typeof body.responseActions === "string") {
      update.responseActions = body.responseActions;
    }

    if (typeof body.responseChannelUsed === "string") {
      if (
        !DSR_RESPONSE_CHANNELS.includes(
          body.responseChannelUsed as DsrResponseChannel,
        )
      ) {
        return NextResponse.json(
          { error: "Canal de resposta inválido" },
          { status: 422 },
        );
      }
      update.responseChannelUsed = body.responseChannelUsed;
    }

    // Quando vai pra "RESPONDIDA" ou "INDEFERIDA", carimba responseDate + DPO
    const willConclude =
      update.status === "RESPONDIDA" || update.status === "INDEFERIDA";
    if (willConclude) {
      update.responseDate = new Date();
      update.respondedByUserId = user.id;
    }

    const updated = await prisma.dataSubjectRequest.update({
      where: { id: existing.id },
      data: update,
      include: {
        respondedByUser: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch (error) {
    console.error("Erro ao atualizar requisição:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar requisição" },
      { status: 500 },
    );
  }
}
