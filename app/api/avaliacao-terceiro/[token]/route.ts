export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  FORM_QUESTIONS,
  type FormResponses,
  type FormResponseItem,
} from "@/lib/operadores-formulario";
import { ASSESSMENT_STATUS } from "@/lib/operadores-pontuacao";

/**
 * Endpoint PÚBLICO (sem auth) — autenticação por `publicToken`.
 *
 * Token é gerado quando DPO envia o formulário pro terceiro. Se DPO
 * cancelar (status=CANCELADO ou REVISADO), token vira null e o link
 * para de funcionar.
 *
 * Funções:
 *   GET  → devolve perguntas + respostas atuais + identificação
 *           (operador + nome da empresa controladora)
 *   PATCH → salva respostas (auto-save por pergunta)
 *   POST  → finaliza (terceiro clica "Enviar" → status=RESPONDIDO)
 */

async function loadByToken(token: string) {
  if (!token || token.length < 8) return null;
  const a = await prisma.operatorAssessment.findFirst({
    where: { publicToken: token },
    include: {
      operator: {
        select: { id: true, name: true, tradeName: true, company: { select: { companyName: true } } },
      },
    },
  });
  if (!a) return null;
  // Só responde se status permite preenchimento
  if (
    a.status !== ASSESSMENT_STATUS.AGUARDANDO_TERCEIRO &&
    a.status !== ASSESSMENT_STATUS.RESPONDIDO
  ) {
    return null;
  }
  return a;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const a = await loadByToken(params.token);
  if (!a) {
    return NextResponse.json(
      {
        error:
          "Link inválido, expirado ou já revisado. Entre em contato com o controlador pra mais informações.",
      },
      { status: 404 }
    );
  }

  // Marca primeira abertura
  if (!a.thirdPartyStartedAt) {
    await prisma.operatorAssessment.update({
      where: { id: a.id },
      data: { thirdPartyStartedAt: new Date() },
    });
  }

  return NextResponse.json({
    assessment: {
      id: a.id,
      label: a.label,
      status: a.status,
      operatorName: a.operator.tradeName ?? a.operator.name,
      controllerName: a.operator.company.companyName,
      thirdPartyAnswers: a.thirdPartyAnswers ?? {},
      thirdPartyStartedAt: a.thirdPartyStartedAt?.toISOString() ?? null,
      thirdPartyCompletedAt: a.thirdPartyCompletedAt?.toISOString() ?? null,
    },
    questions: FORM_QUESTIONS,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const a = await loadByToken(params.token);
  if (!a) {
    return NextResponse.json(
      { error: "Link inválido ou expirado" },
      { status: 404 }
    );
  }

  // Após finalizar, ainda permite ajustes até DPO revisar?
  // Decisão: sim, mas só com status=AGUARDANDO_TERCEIRO. Status
  // RESPONDIDO travado pra mexer (terceiro já clicou em Finalizar).
  if (a.status !== ASSESSMENT_STATUS.AGUARDANDO_TERCEIRO) {
    return NextResponse.json(
      {
        error:
          "Avaliação já enviada pra revisão. Pra ajustar, peça pro controlador reabrir o formulário.",
      },
      { status: 409 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const incoming = body.answers;
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return NextResponse.json(
      { error: "answers deve ser objeto { qid: { answer, evidence?, comment? } }" },
      { status: 400 }
    );
  }

  // Mescla com respostas existentes pra suportar auto-save por pergunta
  const current: FormResponses = (a.thirdPartyAnswers ?? {}) as unknown as FormResponses;
  const merged: FormResponses = { ...current };
  for (const [qid, item] of Object.entries(incoming)) {
    if (!item || typeof item !== "object") continue;
    const it = item as Partial<FormResponseItem>;
    if (it.answer !== "S" && it.answer !== "N" && it.answer !== "NA") continue;
    merged[qid] = {
      answer: it.answer,
      evidence: typeof it.evidence === "string" ? it.evidence.slice(0, 500) : undefined,
      comment: typeof it.comment === "string" ? it.comment.slice(0, 1000) : undefined,
    };
  }

  await prisma.operatorAssessment.update({
    where: { id: a.id },
    data: { thirdPartyAnswers: merged as any },
  });

  return NextResponse.json({ ok: true, savedCount: Object.keys(incoming).length });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  // Endpoint de "submit" — terceiro clica em "Finalizar".
  const a = await loadByToken(params.token);
  if (!a) {
    return NextResponse.json(
      { error: "Link inválido ou expirado" },
      { status: 404 }
    );
  }
  if (a.status !== ASSESSMENT_STATUS.AGUARDANDO_TERCEIRO) {
    return NextResponse.json(
      { error: "Avaliação já foi finalizada" },
      { status: 409 }
    );
  }

  await prisma.operatorAssessment.update({
    where: { id: a.id },
    data: {
      status: ASSESSMENT_STATUS.RESPONDIDO,
      thirdPartyCompletedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    message:
      "Avaliação enviada com sucesso. O controlador será notificado e fará a revisão.",
  });
}
