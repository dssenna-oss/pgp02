// GET /api/curso/turma/[id]/pacote-gap — retorna pacote atual + catálogo + se
//                                        já há respostas (pra bloquear edição)
// POST /api/curso/turma/[id]/pacote-gap { ids: number[] } — salva novo pacote.
// Admin-only.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { GAP_CATALOGO, FASES_ORDEM, PACOTE_DEFAULT_IDS } from "@/lib/gap-catalogo";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TAMANHO_FIXO = 10;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const turma = await prisma.cursoTurma.findUnique({
    where: { id: params.id },
    select: {
      id: true, nome: true, cidade: true, gapPacote: true,
      grupos: { select: { id: true, companyId: true } },
    },
  });
  if (!turma) return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });

  const companyIds = turma.grupos.map((g) => g.companyId);
  // Quantos grupos já têm GapAnswer? Avisa o facilitador se já há respostas
  // (não bloqueia hard — pode estar corrigindo um erro no início da turma).
  const qtdRespostas = companyIds.length
    ? await prisma.gapAnswer.count({ where: { companyId: { in: companyIds } } })
    : 0;

  return NextResponse.json({
    turma: { id: turma.id, nome: turma.nome, cidade: turma.cidade },
    pacoteAtual: turma.gapPacote.length > 0 ? turma.gapPacote : PACOTE_DEFAULT_IDS,
    customizado: turma.gapPacote.length > 0,
    catalogo: GAP_CATALOGO,
    fasesOrdem: FASES_ORDEM,
    pacoteDefaultIds: PACOTE_DEFAULT_IDS,
    tamanhoFixo: TAMANHO_FIXO,
    qtdRespostas,
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const idsRaw = body.ids;
  if (!Array.isArray(idsRaw)) {
    return NextResponse.json({ error: "ids: array obrigatório" }, { status: 400 });
  }
  const ids: number[] = idsRaw.map((n: any) => parseInt(n, 10)).filter((n: number) => Number.isFinite(n));
  if (ids.length !== TAMANHO_FIXO) {
    return NextResponse.json({ error: `Pacote precisa ter exatos ${TAMANHO_FIXO} controles (recebeu ${ids.length})` }, { status: 400 });
  }
  const idsCatalogo = new Set(GAP_CATALOGO.map((c) => c.id));
  const idsInvalidos = ids.filter((id) => !idsCatalogo.has(id));
  if (idsInvalidos.length > 0) {
    return NextResponse.json({ error: `IDs fora do catálogo: ${idsInvalidos.join(", ")}` }, { status: 400 });
  }

  const usarDefault = arraysIguais([...ids].sort(), [...PACOTE_DEFAULT_IDS].sort());

  const turma = await prisma.cursoTurma.update({
    where: { id: params.id },
    data: { gapPacote: usarDefault ? [] : ids },
    select: { id: true, gapPacote: true },
  });

  return NextResponse.json({ ok: true, turma, customizado: !usarDefault });
}

function arraysIguais(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
