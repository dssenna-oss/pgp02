/**
 * POST /api/inventario/sugerir-da-carta
 *
 * Recebe um domínio (ou usa Company.institutionalDomain) e devolve uma
 * lista de serviços extraídos da Carta de Serviços da instituição com
 * classificação "SUGERIDO/TALVEZ/NAO" pra o user revisar e materializar
 * como Inventário em rascunho.
 *
 * Auth: DPO-only (a Fase 3 é DPO-only nas demais ferramentas — seguimos
 * o mesmo padrão).
 *
 * Body:
 *   { domain?: string }   // opcional — usa Company.institutionalDomain se omitido
 *
 * Response 200:
 *   {
 *     services: Array<SuggestedService & { alreadyMapped? }>,
 *     stats: {...},
 *     blockingError: string | null,
 *     warnings: string[]
 *   }
 *
 * Errors:
 *   400 — domínio inválido / sem Company.institutionalDomain salvo
 *   401 — não autenticado
 *   403 — não-DPO
 *   500 — Firecrawl/LLM (raros — pipeline trata erros parciais e
 *         devolve blockingError)
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import {
  suggestServicesFromCarta,
  annotateAlreadyMapped,
} from "@/lib/sugestao-carta";

function normalizeDomain(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Tira protocolo e path
  const stripped = trimmed
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();
  // Validação básica: pelo menos 1 ponto + caracteres válidos
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(stripped)) return null;
  return stripped;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, companyId: true },
  });
  if (!user?.companyId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }
  if (!isDPO(user.role)) {
    return NextResponse.json(
      { error: "Apenas DPO pode usar a sugestão da Carta de Serviços" },
      { status: 403 },
    );
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // body opcional — segue com defaults
  }

  // Determina domain: do body OU do Company.institutionalDomain
  let domain: string | null = null;
  if (typeof body?.domain === "string" && body.domain.trim()) {
    domain = normalizeDomain(body.domain);
    if (!domain) {
      return NextResponse.json(
        { error: "Domínio inválido. Use um endereço como tcees.tc.br ou prefeituradeguarapari.es.gov.br" },
        { status: 400 },
      );
    }
  } else {
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { institutionalDomain: true },
    });
    if (!company?.institutionalDomain) {
      return NextResponse.json(
        {
          error:
            "Nenhum domínio institucional cadastrado em /dashboard/empresa. Cadastre primeiro ou passe `domain` no body.",
        },
        { status: 400 },
      );
    }
    domain = company.institutionalDomain;
  }

  // Pipeline pesado (mapSite + scrape + LLM)
  const result = await suggestServicesFromCarta(domain);

  // Anota "Já mapeado" comparando nomes contra Inventários da org
  if (result.services.length > 0) {
    const existing = await prisma.dataInventory.findMany({
      where: { companyId: user.companyId },
      select: { id: true, serviceName: true, updatedAt: true },
    });
    const annotated = annotateAlreadyMapped(
      result.services,
      existing
        .filter((e): e is { id: string; serviceName: string; updatedAt: Date } =>
          typeof e.serviceName === "string" && e.serviceName.length > 0,
        )
        .map((e) => ({
          id: e.id,
          name: e.serviceName,
          updatedAt: e.updatedAt.toISOString(),
        })),
    );
    return NextResponse.json({ ...result, services: annotated, domain });
  }

  return NextResponse.json({ ...result, domain });
}
