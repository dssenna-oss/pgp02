export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadGapDPO } from "@/lib/gap-helpers";
import { buildGapDiff, type CompareAnswer } from "@/lib/gap-compare";

/**
 * GET /api/gap/compare?a=<id|atual>&b=<id|atual>
 *
 * Compara 2 versões do GAP — cada lado pode ser:
 *   - "atual"           → estado ao vivo (tabela GapAnswer)
 *   - <snapshotId>      → payload congelado de um GapSnapshot
 *
 * Devolve o diff calculado por `lib/gap-compare.ts::buildGapDiff`:
 * scores, contadores, lista priorizada de mudanças.
 *
 * Acesso: apenas DPO. Snapshots têm que pertencer à mesma org.
 */
export async function GET(request: NextRequest) {
  const r = await loadGapDPO();
  if ("error" in r) return r.error;
  const { user } = r;

  const sp = request.nextUrl.searchParams;
  const aRef = sp.get("a") ?? "atual";
  const bRef = sp.get("b") ?? "atual";

  // Carrega cada lado (em paralelo)
  const [aData, bData] = await Promise.all([
    loadAnswers(aRef, user.companyId),
    loadAnswers(bRef, user.companyId),
  ]);

  if (aData.error) return aData.error;
  if (bData.error) return bData.error;

  const diff = buildGapDiff(aData.answers, bData.answers);

  return NextResponse.json({
    a: { ref: aRef, label: aData.label, generatedAt: aData.generatedAt },
    b: { ref: bRef, label: bData.label, generatedAt: bData.generatedAt },
    diff,
  });
}

interface LoadResult {
  answers: CompareAnswer[];
  label: string;
  generatedAt: string | null;
  error?: NextResponse;
}

async function loadAnswers(
  ref: string,
  companyId: string,
): Promise<LoadResult> {
  if (ref === "atual" || !ref) {
    const answers = await prisma.gapAnswer.findMany({
      where: { companyId },
      select: {
        controlCode: true,
        cenarioAtual: true,
        mapeamento: true,
        aderencia: true,
        pontoMelhoria: true,
      },
    });
    return {
      answers,
      label: "Estado atual",
      generatedAt: new Date().toISOString(),
    };
  }
  // ref = snapshotId
  const snap = await prisma.gapSnapshot.findFirst({
    where: { id: ref, companyId },
    select: { id: true, label: true, createdAt: true, payload: true },
  });
  if (!snap) {
    return {
      answers: [],
      label: "",
      generatedAt: null,
      error: NextResponse.json(
        { error: `Snapshot não encontrado: ${ref}` },
        { status: 404 },
      ),
    };
  }
  const payload = (snap.payload as any) ?? {};
  const arr: any[] = Array.isArray(payload.answers) ? payload.answers : [];
  const answers: CompareAnswer[] = arr.map((a) => ({
    controlCode: String(a.controlCode),
    cenarioAtual: a.cenarioAtual ?? null,
    mapeamento: a.mapeamento ?? null,
    aderencia: a.aderencia ?? null,
    pontoMelhoria: a.pontoMelhoria ?? null,
  }));
  return {
    answers,
    label: snap.label,
    generatedAt: snap.createdAt.toISOString(),
  };
}
