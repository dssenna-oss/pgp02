export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadGapDPO, isValidControlCode } from "@/lib/gap-helpers";
import { GAP_CONTROLS } from "@/lib/gap-catalog";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/tarefas-types";

/**
 * POST /api/gap/answer/[code]/task
 *
 * Cria uma Task pessoal pro DPO logado a partir do "Ponto de Melhoria"
 * de um controle do GAP (decisão 8b). A Task fica privada — só o dono vê
 * (modelo Task é pessoal por design).
 *
 * Body (opcionais):
 *   {
 *     title?:    string   // default: "GAP <code> — <domínio>"
 *     priority?: "BAIXA" | "MEDIA" | "ALTA"   // default: MEDIA
 *     dueDate?:  string   // ISO date opcional
 *   }
 *
 * Pré-requisito: o GapAnswer correspondente precisa existir e ter
 * `pontoMelhoria` preenchido (a Task usa ele como descrição).
 */

const VALID_PRIO = new Set(["BAIXA", "MEDIA", "ALTA"]);

const CONTROLS_BY_CODE = new Map(GAP_CONTROLS.map((c) => [c.code, c]));

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> | { code: string } },
) {
  const { code } = await Promise.resolve(params as any);

  if (!isValidControlCode(code)) {
    return NextResponse.json(
      { error: `Código de controle inválido: ${code}` },
      { status: 400 },
    );
  }

  const r = await loadGapDPO();
  if ("error" in r) return r.error;
  const { user } = r;

  const ctrl = CONTROLS_BY_CODE.get(code)!;

  const answer = await prisma.gapAnswer.findUnique({
    where: {
      companyId_controlCode: { companyId: user.companyId, controlCode: code },
    },
  });
  if (!answer) {
    return NextResponse.json(
      {
        error:
          "Esse controle ainda não tem resposta salva. Preencha primeiro o Ponto de Melhoria.",
      },
      { status: 400 },
    );
  }
  const ponto = answer.pontoMelhoria?.trim();
  if (!ponto) {
    return NextResponse.json(
      {
        error:
          "Resposta sem Ponto de Melhoria — não há nada pra virar tarefa. Preencha o campo antes.",
      },
      { status: 400 },
    );
  }

  let body: any = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const defaultTitle = `GAP #${ctrl.code}${
    ctrl.number ? ` (controle ${ctrl.number})` : ""
  } — ${ctrl.domain}`;
  const titleRaw = String(body.title ?? defaultTitle).trim();
  const title = titleRaw.length > 200 ? titleRaw.slice(0, 200) : titleRaw;

  const priority = VALID_PRIO.has(body.priority)
    ? body.priority
    : TASK_PRIORITY.MEDIA;

  const dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (dueDate && isNaN(dueDate.getTime())) {
    return NextResponse.json(
      { error: "dueDate inválido (esperava ISO date)" },
      { status: 400 },
    );
  }

  // Descrição mistura: pergunta do controle + ponto de melhoria
  const description = [
    `Origem: GAP Analysis — controle #${ctrl.code} (${ctrl.domain}).`,
    "",
    `Pergunta: ${ctrl.question}`,
    "",
    "Ponto de Melhoria:",
    ponto,
  ].join("\n");

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      companyId: user.companyId,
      title,
      description,
      priority,
      status: TASK_STATUS.A_FAZER,
      dueDate,
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
