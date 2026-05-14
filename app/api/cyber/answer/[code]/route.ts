export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadCyberAuth,
  cyberAnswerToDTO,
  VALID_CYBER_ADERENCIAS,
} from "@/lib/cyber-helpers";
import { getCyberControl } from "@/lib/cyber-catalog";

/**
 * GET /api/cyber/answer/[code]
 * Devolve a resposta de um controle específico (ou null se ainda não
 * respondido). Útil pra UI carregar formulário do editor.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } }
) {
  const r = await loadCyberAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  if (!getCyberControl(params.code)) {
    return NextResponse.json(
      { error: "Controle não encontrado no catálogo NIST" },
      { status: 404 }
    );
  }

  const answer = await prisma.cyberAnswer.findUnique({
    where: { companyId_controlCode: { companyId: user.companyId, controlCode: params.code } },
    include: {
      delegatedTo: { select: { id: true, name: true, email: true } },
      answeredBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ answer: answer ? cyberAnswerToDTO(answer) : null });
}

/**
 * PATCH /api/cyber/answer/[code]
 * Cria ou atualiza a resposta pra um controle (upsert).
 * Body: { aderencia, pontoMelhoria?, evidence?, delegatedToId?, delegatedDue? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const r = await loadCyberAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  if (!getCyberControl(params.code)) {
    return NextResponse.json(
      { error: "Controle não encontrado no catálogo NIST" },
      { status: 404 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const aderencia: string = String(body.aderencia ?? "").trim();
  if (!VALID_CYBER_ADERENCIAS.has(aderencia)) {
    return NextResponse.json(
      {
        error:
          "Aderência inválida. Use: ADERENTE, PARCIAL, NAO_ADERENTE, NAO_APLICA, DELEGADO_TI",
      },
      { status: 400 }
    );
  }

  const pontoMelhoria =
    typeof body.pontoMelhoria === "string" ? body.pontoMelhoria.trim() : null;
  const evidence =
    typeof body.evidence === "string" ? body.evidence.trim() : null;

  // Validar delegação
  let delegatedToId: string | null = null;
  let delegatedAt: Date | null = null;
  let delegatedDue: Date | null = null;
  if (aderencia === "DELEGADO_TI") {
    if (typeof body.delegatedToId !== "string" || !body.delegatedToId.trim()) {
      return NextResponse.json(
        { error: "Pra delegar à TI, informe delegatedToId (user)." },
        { status: 400 }
      );
    }
    // Verifica que o user delegado existe e é da mesma empresa
    const delegated = await prisma.user.findFirst({
      where: { id: body.delegatedToId, companyId: user.companyId },
      select: { id: true },
    });
    if (!delegated) {
      return NextResponse.json(
        { error: "Usuário delegado não encontrado na sua empresa." },
        { status: 400 }
      );
    }
    delegatedToId = delegated.id;
    delegatedAt = new Date();
    if (body.delegatedDue) {
      const due = new Date(body.delegatedDue);
      if (Number.isFinite(due.getTime())) delegatedDue = due;
    }
  }

  const answer = await prisma.cyberAnswer.upsert({
    where: {
      companyId_controlCode: {
        companyId: user.companyId,
        controlCode: params.code,
      },
    },
    update: {
      aderencia,
      pontoMelhoria: pontoMelhoria || null,
      evidence: evidence || null,
      evidenceFrom:
        typeof body.evidenceFrom === "string" ? body.evidenceFrom : null,
      delegatedToId,
      delegatedAt,
      delegatedDue,
      answeredById: user.id,
    },
    create: {
      companyId: user.companyId,
      controlCode: params.code,
      aderencia,
      pontoMelhoria: pontoMelhoria || null,
      evidence: evidence || null,
      evidenceFrom:
        typeof body.evidenceFrom === "string" ? body.evidenceFrom : null,
      delegatedToId,
      delegatedAt,
      delegatedDue,
      answeredById: user.id,
    },
    include: {
      delegatedTo: { select: { id: true, name: true, email: true } },
      answeredBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ answer: cyberAnswerToDTO(answer) });
}

/**
 * DELETE /api/cyber/answer/[code]
 * Remove a resposta — controle volta pro estado "não respondido".
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { code: string } }
) {
  const r = await loadCyberAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  await prisma.cyberAnswer
    .delete({
      where: {
        companyId_controlCode: {
          companyId: user.companyId,
          controlCode: params.code,
        },
      },
    })
    .catch(() => {
      // Se não existe, no-op
    });

  return NextResponse.json({ ok: true });
}
