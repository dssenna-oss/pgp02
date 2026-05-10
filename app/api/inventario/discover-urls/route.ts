/**
 * POST /api/inventario/discover-urls
 *
 * Auto-discovery de URLs do site institucional (Etapa "auto-discover"
 * 2026-05-11). Recebe um domínio (ou usa o `Company.institutionalDomain`
 * cadastrado), chama Firecrawl `/v1/map` pra listar URLs do site, e
 * retorna agrupadas por categoria pra user escolher quais usar no
 * pré-preenchimento via Gemini.
 *
 * Custo MUITO menor que scraping completo: 1 request `/v1/map` (~3-5s)
 * lista até 500 URLs. Sem LLM nessa etapa — só regex em URLs.
 *
 * Auth: qualquer user autenticado.
 *
 * Body:
 *   {
 *     domain?: string  // opcional — se ausente, usa Company.institutionalDomain
 *   }
 *
 * Response 200:
 *   {
 *     domain: string,
 *     totalUrls: number,
 *     groups: [
 *       { category: "carta_servicos", label: "Carta de Serviços", urls: [...] },
 *       { category: "ouvidoria",      label: "Ouvidoria",          urls: [...] },
 *       ...
 *     ]
 *   }
 *
 * Errors:
 *   400 — domínio inválido ou ausente (e Company sem domínio cadastrado)
 *   401 — não autenticado
 *   500 — erro do Firecrawl
 */

export const dynamic = "force-dynamic";
export const maxDuration = 45;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mapSite } from "@/lib/firecrawl";
import {
  groupUrlsByCategory,
  URL_CATEGORY_LABEL,
  type UrlCategoryKey,
} from "@/lib/url-keywords";

/** Mesma normalização do /api/company/institutional-domain. */
function normalizeDomain(input: string): string | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;
  let cleaned = s.replace(/^https?:\/\//, "");
  cleaned = cleaned.split("/")[0];
  cleaned = cleaned.replace(/^www\./, "");
  cleaned = cleaned.split(":")[0];
  if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(cleaned)) return null;
  return cleaned;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { companyId: true },
  });
  if (!user?.companyId) {
    return NextResponse.json(
      { error: "Sem empresa vinculada" },
      { status: 403 },
    );
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // Body vazio é OK — vai usar institutionalDomain do banco
  }

  let domain: string | null = null;
  if (typeof body?.domain === "string" && body.domain.trim()) {
    domain = normalizeDomain(body.domain);
    if (!domain) {
      return NextResponse.json(
        {
          error:
            "Domínio inválido. Exemplos: tcees.tc.br, prefeitura.sp.gov.br",
        },
        { status: 400 },
      );
    }
  } else {
    // Sem domain no body — pega do cadastro da Empresa
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { institutionalDomain: true },
    });
    if (!company?.institutionalDomain) {
      return NextResponse.json(
        {
          error:
            "Nenhum domínio fornecido nem cadastrado no perfil da Empresa. Cadastre em /dashboard/empresa ou passe `domain` no body.",
        },
        { status: 400 },
      );
    }
    domain = company.institutionalDomain;
  }

  // Mapeia o site
  const result = await mapSite(domain, { limit: 500, timeoutMs: 30_000 });
  if (result.error) {
    return NextResponse.json(
      {
        error: `Falha ao mapear o site: ${result.error}`,
        domain,
      },
      { status: 502 },
    );
  }

  // Agrupa por categoria
  const grouped = groupUrlsByCategory(result.urls);

  // Monta o array final, ignorando categorias vazias (mas sempre as
  // ordens conhecidas vêm primeiro).
  const ORDER: UrlCategoryKey[] = [
    "carta_servicos",
    "ouvidoria",
    "sic",
    "lgpd",
    "atos_normativos",
    "edital",
    "transparencia",
    "rh",
    "licitacao",
  ];

  const groups = ORDER.filter((k) => grouped[k].length > 0).map((k) => ({
    category: k,
    label: URL_CATEGORY_LABEL[k],
    urls: grouped[k],
  }));

  return NextResponse.json({
    domain,
    totalUrls: result.urls.length,
    groups,
    // _other é só pra debug — não exibimos no front (ruidoso)
    otherCount: grouped._other.length,
  });
}
