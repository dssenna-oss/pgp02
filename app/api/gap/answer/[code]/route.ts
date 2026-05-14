export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadGapDPO,
  isValidControlCode,
  VALID_MAPEAMENTO,
  VALID_ADERENCIA,
  answerToDTO,
} from "@/lib/gap-helpers";

/**
 * PATCH /api/gap/answer/[code]
 *
 * Salva a resposta de 1 controle (upsert por (companyId, controlCode)).
 *
 * Body (todos opcionais — campos ausentes mantêm o valor atual):
 *   {
 *     cenarioAtual?:  string | null,
 *     mapeamento?:    "NAO_INICIADO" | "EM_ANDAMENTO" | "FINALIZADO" | null,
 *     aderencia?:     "ADERENTE" | "PARCIAL" | "NAO_ADERENTE" | "NA" | null,
 *     pontoMelhoria?: string | null,
 *     applySuggestion?: boolean   // se true, marca autoSuggested=true; senão false
 *   }
 *
 * Regras:
 *   - Salvar via PATCH manual zera `autoSuggested` (DPO confirmou na mão)
 *   - `applySuggestion: true` mantém `autoSuggested = true` (vem de auto-suggest)
 *   - String vazia ("") em texto livre vira null
 *
 * Acesso: apenas DPO (qualquer nível).
 */

const TEXT_MAX = 5000;

function normText(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.length > TEXT_MAX ? s.slice(0, TEXT_MAX) : s;
}

export async function PATCH(
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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Validação dos enums (quando presentes)
  const mapInput =
    body.mapeamento === undefined ? undefined : (body.mapeamento as string | null);
  if (
    mapInput !== undefined &&
    mapInput !== null &&
    !VALID_MAPEAMENTO.has(mapInput)
  ) {
    return NextResponse.json(
      { error: `Valor inválido pra mapeamento: ${mapInput}` },
      { status: 400 },
    );
  }

  const adeInput =
    body.aderencia === undefined ? undefined : (body.aderencia as string | null);
  if (
    adeInput !== undefined &&
    adeInput !== null &&
    !VALID_ADERENCIA.has(adeInput)
  ) {
    return NextResponse.json(
      { error: `Valor inválido pra aderência: ${adeInput}` },
      { status: 400 },
    );
  }

  const cenarioInput =
    body.cenarioAtual === undefined ? undefined : normText(body.cenarioAtual);
  const pontoInput =
    body.pontoMelhoria === undefined ? undefined : normText(body.pontoMelhoria);
  const notesInput =
    body.notes === undefined ? undefined : normText(body.notes);

  const isAutoSuggestion = body.applySuggestion === true;
  const now = new Date();

  // Upsert
  const updateData: any = {
    answeredById: user.id,
    answeredAt: now,
    autoSuggested: isAutoSuggestion,
  };
  if (cenarioInput !== undefined) updateData.cenarioAtual = cenarioInput;
  if (mapInput !== undefined) updateData.mapeamento = mapInput;
  if (adeInput !== undefined) updateData.aderencia = adeInput;
  if (pontoInput !== undefined) updateData.pontoMelhoria = pontoInput;
  if (notesInput !== undefined) updateData.notes = notesInput;

  const createData: any = {
    companyId: user.companyId,
    controlCode: code,
    cenarioAtual: cenarioInput ?? null,
    mapeamento: mapInput ?? null,
    aderencia: adeInput ?? null,
    pontoMelhoria: pontoInput ?? null,
    notes: notesInput ?? null,
    autoSuggested: isAutoSuggestion,
    answeredById: user.id,
    answeredAt: now,
  };

  const saved = await prisma.gapAnswer.upsert({
    where: {
      companyId_controlCode: { companyId: user.companyId, controlCode: code },
    },
    update: updateData,
    create: createData,
    include: { answeredBy: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ answer: answerToDTO(saved) });
}

/**
 * DELETE /api/gap/answer/[code]
 *
 * Apaga a resposta (volta o controle ao estado "Sem resposta"). Útil pra
 * UI permitir "Limpar" ou pra o DPO descartar uma sugestão automática.
 */
export async function DELETE(
  _request: NextRequest,
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

  await prisma.gapAnswer
    .delete({
      where: {
        companyId_controlCode: {
          companyId: user.companyId,
          controlCode: code,
        },
      },
    })
    .catch(() => null); // 404 silencioso é ok aqui (já não existia)

  return NextResponse.json({ ok: true });
}
