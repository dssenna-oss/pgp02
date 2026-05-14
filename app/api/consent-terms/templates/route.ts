/**
 * GET /api/consent-terms/templates — devolve o catálogo dos 5 modelos
 * institucionais (label, blurb, legalRef). UI usa pra renderizar o
 * picker no botão "Criar termo".
 *
 * Auth: DPO-only (a estrutura dos modelos é detalhe interno da curadoria
 * do DPO; URL pública não precisa conhecer).
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import { CONSENT_TEMPLATES } from "@/lib/consent-templates";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (!user || !isDPO(user.role)) {
    return NextResponse.json({ error: "Apenas DPO" }, { status: 403 });
  }

  return NextResponse.json({
    templates: CONSENT_TEMPLATES.map((t) => ({
      id: t.id,
      label: t.label,
      blurb: t.blurb,
      legalRef: t.legalRef,
    })),
  });
}
