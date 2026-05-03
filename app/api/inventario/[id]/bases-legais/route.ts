import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";

/**
 * Endpoints pra o DPO complementar as Bases Legais de um processo.
 *
 * Esses 4 campos correspondem às colunas J/K/L/M do Excel modelo:
 *   - previsaoLegal       (J) — Lei/norma que obriga o tratamento
 *   - legalBasisSensitive (K) — Base legal pra dados sensíveis (Art. 11 LGPD)
 *   - legalBasis          (L) — Base legal pra dados comuns (Art. 7 LGPD)
 *   - legalBasisComments  (M) — Comentários sobre as bases sugeridas
 *
 * GET   → carrega o processo com os campos legais (qualquer DPO da org)
 * PATCH → atualiza os 4 campos (qualquer DPO da org pode preencher).
 *         Marca legalReviewedById/At pra trilha de auditoria.
 */

async function loadDPOAndProcess(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user?.companyId) {
    return { error: NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 }) };
  }
  if (!isDPO(user.role)) {
    return {
      error: NextResponse.json(
        { error: "Apenas DPO pode acessar/editar Bases Legais" },
        { status: 403 }
      ),
    };
  }
  const inv = await prisma.dataInventory.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      createdBy: { select: { name: true, email: true, setor: true } },
      legalReviewedBy: { select: { name: true, email: true } },
    },
  });
  if (!inv) {
    return {
      error: NextResponse.json(
        { error: "Inventário não encontrado nesta organização" },
        { status: 404 }
      ),
    };
  }
  return { user, inv };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await Promise.resolve(params as any);
  const r = await loadDPOAndProcess(id);
  if ("error" in r) return r.error;
  return NextResponse.json(r.inv);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await Promise.resolve(params as any);
  const r = await loadDPOAndProcess(id);
  if ("error" in r) return r.error;
  const { user } = r;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const update: any = {
    legalReviewedById: user.id,
    legalReviewedAt: new Date(),
  };
  // Aceita campos parciais — DPO pode salvar incrementalmente
  if (body.previsaoLegal !== undefined)
    update.previsaoLegal = body.previsaoLegal?.toString().trim() || null;
  if (body.legalBasisSensitive !== undefined)
    update.legalBasisSensitive =
      body.legalBasisSensitive?.toString().trim() || null;
  if (body.legalBasis !== undefined)
    update.legalBasis = body.legalBasis?.toString().trim() || "";
  if (body.legalBasisComments !== undefined)
    update.legalBasisComments =
      body.legalBasisComments?.toString().trim() || null;

  const updated = await prisma.dataInventory.update({
    where: { id },
    data: update,
  });
  return NextResponse.json(updated);
}
