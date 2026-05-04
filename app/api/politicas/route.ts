export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadPolicyAuth,
  policyToDTO,
  computePolicyStats,
  ensureCompanySlug,
  defaultSlugForType,
  slugify,
  VALID_POLICY_TYPES,
} from "@/lib/policies-helpers";
import {
  POLICY_TEMPLATES,
  getTemplate,
  applyPlaceholders,
} from "@/lib/policies-templates";

/**
 * GET /api/politicas
 *
 * Lista políticas da org (DPO-only). Devolve { items, stats, templates,
 * companySlug }. Templates é o catálogo público (read-only) — UI usa
 * pra mostrar "criar de template".
 */
export async function GET(_request: NextRequest) {
  const r = await loadPolicyAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const [policies, company] = await Promise.all([
    prisma.policy.findMany({
      where: { companyId: user.companyId },
      include: {
        publishedBy: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { versions: true } },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.company.findUnique({
      where: { id: user.companyId },
      select: { slug: true },
    }),
  ]);

  const items = policies.map((p) => policyToDTO(p, company?.slug ?? null));
  const stats = computePolicyStats(policies);

  // Templates expostos pra UI escolher na hora de criar
  const templates = POLICY_TEMPLATES.map((t) => ({
    type: t.type,
    defaultTitle: t.defaultTitle,
    blurb: t.blurb,
  }));

  return NextResponse.json({
    items,
    stats,
    templates,
    companySlug: company?.slug ?? null,
  });
}

/**
 * POST /api/politicas
 *
 * Cria nova política a partir de um template (DPO-only). Body:
 *   - type (obrigatório, PolicyType)
 *   - title (opcional, default = template.defaultTitle)
 *   - slug (opcional, default = defaultSlugForType(type))
 *
 * Aplica os placeholders {{...}} do template usando dados da Company.
 * Garante Company.slug se ainda não existir (gera de companyName).
 */
export async function POST(request: NextRequest) {
  const r = await loadPolicyAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const type = body.type;
  if (!VALID_POLICY_TYPES.has(type)) {
    return NextResponse.json(
      { error: `Tipo de política inválido: ${type}` },
      { status: 400 },
    );
  }

  const template = getTemplate(type);
  const title = body.title ? String(body.title).trim().slice(0, 200) : template.defaultTitle;
  const requestedSlug = body.slug
    ? slugify(String(body.slug))
    : defaultSlugForType(type);

  // Garante Company.slug + carrega placeholders
  await ensureCompanySlug(user.companyId);
  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
  });
  if (!company) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }

  const content = applyPlaceholders(template.content, {
    companyName: company.companyName,
    tradeName: company.tradeName,
    cnpj: company.cnpj,
    address: company.address,
    city: company.city,
    state: company.state,
    email: company.email,
    phone: company.phone,
    website: company.website,
    dpoName: company.dpoName,
    dpoEmail: company.dpoEmail,
    dpoPhone: company.dpoPhone,
    legalRepresentative: company.legalRepresentative,
  });

  // Garante uniqueness de (companyId, type, slug). Retry com sufixo se colisão.
  let slug = requestedSlug;
  let suffix = 2;
  while (true) {
    const existing = await prisma.policy.findFirst({
      where: { companyId: user.companyId, type, slug },
      select: { id: true },
    });
    if (!existing) break;
    slug = `${requestedSlug}-${suffix++}`;
    if (suffix > 50) {
      slug = `${requestedSlug}-${Date.now()}`;
      break;
    }
  }

  const created = await prisma.policy.create({
    data: {
      companyId: user.companyId,
      type,
      title,
      slug,
      status: "RASCUNHO",
      currentContent: content,
      publishedContent: null,
      currentVersion: 0,
      createdById: user.id,
    },
    include: {
      publishedBy: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { versions: true } },
    },
  });

  return NextResponse.json({ policy: policyToDTO(created, company.slug) });
}
