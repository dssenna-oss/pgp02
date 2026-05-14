export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/cookies/system-policies
 *
 * Retorna URLs públicas das políticas do PRÓPRIO APP PGP (não das
 * empresas clientes) — usadas pelo banner de cookies pra apontar
 * "Política de Cookies / Aviso de Privacidade / Termos de Uso" nos
 * links do overlay.
 *
 * Lógica:
 *   1. Identifica a "empresa do sistema" — a Company do super admin
 *      (`SUPER_ADMIN_EMAIL` env var) ou a Company do user com
 *      role=admin (legado).
 *   2. Busca as 3 políticas dessa empresa: AVISO_PRIVACIDADE_EXTERNO,
 *      TERMOS_USO, POLITICA_COOKIES — apenas se publicadas.
 *   3. Devolve `/p/<companySlug>/<policySlug>` pra cada uma. null se
 *      a política ainda não foi publicada.
 *
 * Endpoint público (sem auth) — banner aparece em /login, /signup, etc.
 * onde não há sessão.
 */
export async function GET() {
  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();

    // Acha a Company do super admin (se env var setada) OU do user
    // legacy com role=admin. Fallback pra primeira Company existente.
    let companyId: string | null = null;
    if (superAdminEmail) {
      const u = await prisma.user.findUnique({
        where: { email: superAdminEmail },
        select: { companyId: true },
      });
      companyId = u?.companyId ?? null;
    }
    if (!companyId) {
      const u = await prisma.user.findFirst({
        where: { role: "admin" },
        select: { companyId: true },
      });
      companyId = u?.companyId ?? null;
    }
    if (!companyId) {
      return NextResponse.json({
        avisoUrl: null,
        termosUrl: null,
        cookiesUrl: null,
        reason: "Empresa do sistema não encontrada",
      });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { slug: true },
    });
    if (!company?.slug) {
      return NextResponse.json({
        avisoUrl: null,
        termosUrl: null,
        cookiesUrl: null,
        reason: "Empresa do sistema sem slug",
      });
    }

    const policies = await prisma.policy.findMany({
      where: {
        companyId,
        status: "PUBLICADA",
        type: {
          in: ["AVISO_PRIVACIDADE_EXTERNO", "TERMOS_USO", "POLITICA_COOKIES"],
        },
      },
      select: { type: true, slug: true },
    });

    const byType = (t: string) => policies.find((p) => p.type === t)?.slug ?? null;
    const avisoSlug = byType("AVISO_PRIVACIDADE_EXTERNO");
    const termosSlug = byType("TERMOS_USO");
    const cookiesSlug = byType("POLITICA_COOKIES");

    const buildUrl = (slug: string | null) =>
      slug ? `/p/${company.slug}/${slug}` : null;

    return NextResponse.json({
      avisoUrl: buildUrl(avisoSlug),
      termosUrl: buildUrl(termosSlug),
      cookiesUrl: buildUrl(cookiesSlug),
    });
  } catch (error) {
    console.error("Erro ao buscar políticas do sistema:", error);
    return NextResponse.json(
      {
        avisoUrl: null,
        termosUrl: null,
        cookiesUrl: null,
        error: "Erro ao buscar políticas",
      },
      { status: 200 }, // 200 com null pra graceful fallback
    );
  }
}
