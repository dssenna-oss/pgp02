/**
 * GET / PATCH /api/company/institutional-domain
 *
 * Endpoint focado pro campo `Company.institutionalDomain` (Etapa 28).
 * Usado pelo card "Domínio institucional" em `/dashboard/empresa` e
 * pelo modal "Pré-preencher por Carta de Serviços" pra alimentar:
 *   - O botão "🔍 Buscar no Google" (query `site:<domínio>...`)
 *   - O auto-discovery de URLs via Firecrawl /v1/map
 *
 * Auth: DPO-only (mesmo padrão da edição de Empresa).
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";

async function loadCtx() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, companyId: true },
  });
  if (!user?.companyId) {
    return {
      error: NextResponse.json({ error: "Sem empresa vinculada" }, { status: 403 }),
    };
  }
  if (!isDPO(user.role)) {
    return {
      error: NextResponse.json(
        { error: "Apenas DPO pode editar o domínio institucional" },
        { status: 403 },
      ),
    };
  }
  return { user, companyId: user.companyId };
}

/**
 * Normaliza domínio: remove protocolo, www., barras e espaços.
 * "https://www.tcees.tc.br/" → "tcees.tc.br"
 */
function normalizeDomain(input: string): string | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;
  // Remove protocolo
  let cleaned = s.replace(/^https?:\/\//, "");
  // Remove path
  cleaned = cleaned.split("/")[0];
  // Remove www.
  cleaned = cleaned.replace(/^www\./, "");
  // Remove porta
  cleaned = cleaned.split(":")[0];
  // Validação simples — pelo menos 1 ponto, só caracteres válidos
  if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(cleaned)) return null;
  return cleaned;
}

export async function GET() {
  const r = await loadCtx();
  if ("error" in r) return r.error;
  const { companyId } = r;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { institutionalDomain: true, companyName: true },
  });

  return NextResponse.json({
    institutionalDomain: company?.institutionalDomain ?? null,
    companyName: company?.companyName ?? null,
  });
}

export async function PATCH(request: NextRequest) {
  const r = await loadCtx();
  if ("error" in r) return r.error;
  const { companyId } = r;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const raw = body?.institutionalDomain;
  // Aceita string vazia ou null pra LIMPAR o campo
  if (raw == null || (typeof raw === "string" && !raw.trim())) {
    await prisma.company.update({
      where: { id: companyId },
      data: { institutionalDomain: null },
    });
    return NextResponse.json({ ok: true, institutionalDomain: null });
  }

  if (typeof raw !== "string") {
    return NextResponse.json(
      { error: "institutionalDomain deve ser string" },
      { status: 400 },
    );
  }

  const normalized = normalizeDomain(raw);
  if (!normalized) {
    return NextResponse.json(
      {
        error:
          "Domínio inválido. Exemplos válidos: tcees.tc.br, prefeitura.sp.gov.br",
      },
      { status: 400 },
    );
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { institutionalDomain: normalized },
  });

  return NextResponse.json({ ok: true, institutionalDomain: normalized });
}
