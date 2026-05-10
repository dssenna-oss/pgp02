/**
 * Endpoint debug TEMPORÁRIO (2026-05-11) pra diagnosticar por que
 * `process.env.FIRECRAWL_API_KEY` aparece como vazia em prod mesmo
 * com a var cadastrada no Vercel.
 *
 * Retorna metadados sobre as envs sensíveis SEM expor o valor:
 *   - hasKey: a env existe e não é vazia?
 *   - keyLen: comprimento da string (pra confirmar que tem conteúdo)
 *   - keyPrefix: 4 primeiros caracteres (formato esperado: "fc-")
 *
 * Auth: DPO-only.
 *
 * REMOVER após validar o problema.
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (!isDPO(user?.role)) {
    return NextResponse.json({ error: "Apenas DPO" }, { status: 403 });
  }

  const fc = process.env.FIRECRAWL_API_KEY;
  const ga = process.env.GOOGLE_API_KEY;
  const br = process.env.BREVO_API_KEY;
  const cr = process.env.CRON_SECRET;

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    firecrawl: {
      hasKey: !!fc && fc.length > 0,
      keyLen: fc?.length ?? 0,
      keyPrefix: fc ? fc.slice(0, 3) : null,
    },
    google: {
      hasKey: !!ga && ga.length > 0,
      keyLen: ga?.length ?? 0,
    },
    brevo: {
      hasKey: !!br && br.length > 0,
      keyLen: br?.length ?? 0,
    },
    cron: {
      hasKey: !!cr && cr.length > 0,
      keyLen: cr?.length ?? 0,
    },
  });
}
