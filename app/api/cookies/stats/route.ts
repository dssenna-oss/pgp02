/**
 * GET /api/cookies/stats
 *
 * Agrega consentimentos de cookies (CP26) pro painel do DPO em
 * `/dashboard/termos-consentimento` aba "Cookies".
 *
 * Hoje `cookie_consents` é uma tabela GLOBAL (sem companyId) — o banner
 * roda no domínio público da org única. Por isso o endpoint é DPO-only
 * mas as estatísticas refletem o app inteiro, não filtragem multi-tenant.
 *
 * Retorna:
 *   - total           — todos os registros
 *   - active          — revokedAt = null
 *   - revoked         — revokedAt != null
 *   - analyticsRate   — % de ativos com analytics=true
 *   - marketingRate   — idem marketing
 *   - preferencesRate — idem preferences
 *   - byMonth         — últimos 12 meses: { ym: "YYYY-MM", created, revoked }
 *   - latest          — 10 últimos consentimentos (data + flags + revogado)
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";

function ymKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, companyId: true },
  });
  if (!user?.companyId || !isDPO(user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  // Janela dos últimos 12 meses (inclusive) — usado pro chart.
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 11);
  twelveMonthsAgo.setUTCDate(1);
  twelveMonthsAgo.setUTCHours(0, 0, 0, 0);

  // 1 query carrega tudo que precisamos (a tabela é pequena — sub-1000 rows
  // típico; quando crescer migrar pro raw SQL com GROUP BY).
  const [all, latest] = await Promise.all([
    prisma.cookieConsent.findMany({
      select: {
        createdAt: true,
        revokedAt: true,
        analytics: true,
        marketing: true,
        preferences: true,
      },
    }),
    prisma.cookieConsent.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        revokedAt: true,
        analytics: true,
        marketing: true,
        preferences: true,
        consentMethod: true,
      },
    }),
  ]);

  const total = all.length;
  const active = all.filter((c) => c.revokedAt === null);
  const revoked = all.filter((c) => c.revokedAt !== null);

  function rate(predicate: (c: { analytics: boolean; marketing: boolean; preferences: boolean }) => boolean) {
    if (active.length === 0) return 0;
    return Math.round((active.filter(predicate).length / active.length) * 100);
  }

  const analyticsRate = rate((c) => c.analytics);
  const marketingRate = rate((c) => c.marketing);
  const preferencesRate = rate((c) => c.preferences);

  // Histograma mensal: 12 buckets vazios, preenche com counts dos registros
  const buckets: Record<string, { ym: string; created: number; revoked: number }> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(twelveMonthsAgo);
    d.setUTCMonth(d.getUTCMonth() + i);
    const key = ymKey(d);
    buckets[key] = { ym: key, created: 0, revoked: 0 };
  }
  for (const c of all) {
    const ymCreated = ymKey(c.createdAt);
    if (buckets[ymCreated]) buckets[ymCreated].created += 1;
    if (c.revokedAt) {
      const ymRev = ymKey(c.revokedAt);
      if (buckets[ymRev]) buckets[ymRev].revoked += 1;
    }
  }
  const byMonth = Object.values(buckets).sort((a, b) => a.ym.localeCompare(b.ym));

  return NextResponse.json({
    total,
    active: active.length,
    revoked: revoked.length,
    analyticsRate,
    marketingRate,
    preferencesRate,
    byMonth,
    latest: latest.map((c) => ({
      id: c.id,
      createdAt: c.createdAt.toISOString(),
      revokedAt: c.revokedAt?.toISOString() ?? null,
      analytics: c.analytics,
      marketing: c.marketing,
      preferences: c.preferences,
      consentMethod: c.consentMethod,
    })),
  });
}
