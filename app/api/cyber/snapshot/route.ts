export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadCyberAuth, computeCyberScore } from "@/lib/cyber-helpers";

/**
 * GET /api/cyber/snapshot — lista snapshots criados.
 * POST /api/cyber/snapshot — cria snapshot a partir do estado atual.
 */
export async function GET(_request: NextRequest) {
  const r = await loadCyberAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const snapshots = await prisma.cyberSnapshot.findMany({
    where: { companyId: user.companyId },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: snapshots.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      score: s.score,
      createdBy: s.createdBy,
      createdAt: s.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const r = await loadCyberAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      { error: "Informe um nome pro snapshot (ex.: 'Q1 2026 — Pré-auditoria')." },
      { status: 400 }
    );
  }
  const description =
    typeof body.description === "string" ? body.description.trim() : null;

  // Carrega respostas atuais
  const answers = await prisma.cyberAnswer.findMany({
    where: { companyId: user.companyId },
    select: {
      controlCode: true,
      aderencia: true,
      pontoMelhoria: true,
      evidence: true,
      evidenceFrom: true,
    },
  });

  const score = computeCyberScore(answers);

  // JSON congelado: { "ID.AM-1": { aderencia, pontoMelhoria, ... } }
  const answersJson: Record<string, any> = {};
  for (const a of answers) {
    answersJson[a.controlCode] = {
      aderencia: a.aderencia,
      pontoMelhoria: a.pontoMelhoria,
      evidence: a.evidence,
      evidenceFrom: a.evidenceFrom,
    };
  }

  const snapshot = await prisma.cyberSnapshot.create({
    data: {
      companyId: user.companyId,
      name,
      description,
      answers: answersJson,
      score: score as any,
      createdById: user.id,
    },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(
    {
      snapshot: {
        id: snapshot.id,
        name: snapshot.name,
        description: snapshot.description,
        score: snapshot.score,
        createdBy: snapshot.createdBy,
        createdAt: snapshot.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
