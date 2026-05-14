export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/company/public-links
 *
 * Devolve as URLs públicas de políticas relevantes da organização do user
 * logado — usado pelo rodapé do app autenticado (D7 do cardápio Aviso)
 * pra mostrar links como "Aviso de Privacidade" e "Política de Cookies"
 * APENAS quando estão de fato publicados (evita 404 visível).
 *
 * Resposta: { companySlug, avisoPrivacidadeUrl, cookiesUrl }
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { companyId: true },
  });
  if (!user?.companyId) {
    return NextResponse.json({
      companySlug: null,
      avisoPrivacidadeUrl: null,
      cookiesUrl: null,
    });
  }

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { slug: true },
  });
  const companySlug = company?.slug ?? null;

  if (!companySlug) {
    return NextResponse.json({
      companySlug: null,
      avisoPrivacidadeUrl: null,
      cookiesUrl: null,
    });
  }

  const policies = await prisma.policy.findMany({
    where: {
      companyId: user.companyId,
      status: "PUBLICADA",
      type: { in: ["AVISO_PRIVACIDADE_EXTERNO", "POLITICA_COOKIES"] },
    },
    select: { type: true, slug: true, publishedContent: true },
  });

  const aviso = policies.find(
    (p) => p.type === "AVISO_PRIVACIDADE_EXTERNO" && p.publishedContent,
  );
  const cookies = policies.find(
    (p) => p.type === "POLITICA_COOKIES" && p.publishedContent,
  );

  return NextResponse.json({
    companySlug,
    avisoPrivacidadeUrl: aviso ? `/p/${companySlug}/${aviso.slug}` : null,
    cookiesUrl: cookies ? `/p/${companySlug}/${cookies.slug}` : null,
  });
}
