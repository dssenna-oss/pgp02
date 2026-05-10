import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { policyTypeLabel } from "@/lib/policies-helpers";
import PublicPolicyView from "@/components/politicas/public-policy-view";

/**
 * Página pública de uma política publicada — `/p/<companySlug>/<policySlug>`.
 * Sem autenticação, layout limpo (sem sidebar do dashboard).
 *
 * Só mostra políticas com status=PUBLICADA. Outros status devolvem 404
 * pra não revelar políticas em rascunho.
 *
 * Renderiza o `publishedContent` em markdown.
 */
export default async function PublicPolicyPage({
  params,
}: {
  params: Promise<{ companySlug: string; policySlug: string }>;
}) {
  const { companySlug, policySlug } = await params;

  // 1. Acha a empresa pelo slug
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: {
      id: true,
      companyName: true,
      tradeName: true,
      logoUrl: true,
      website: true,
    },
  });
  if (!company) notFound();

  // 2. Acha política publicada com esse slug
  const policy = await prisma.policy.findFirst({
    where: {
      companyId: company.id,
      slug: policySlug,
      status: "PUBLICADA",
    },
    select: {
      id: true,
      type: true,
      title: true,
      publishedContent: true,
      publishedAt: true,
      currentVersion: true,
    },
  });
  if (!policy || !policy.publishedContent) notFound();

  // Sumário automático: pro Aviso institucional, anexa links pros Avisos
  // por serviço publicados (Checkpoint Aviso por Serviço — 2026-05-10).
  let content = policy.publishedContent;
  if (policy.type === "AVISO_PRIVACIDADE_EXTERNO") {
    const serviceNotices = await prisma.servicePrivacyNotice.findMany({
      where: {
        companyId: company.id,
        status: "PUBLICADO",
      },
      select: {
        slug: true,
        dataInventory: { select: { serviceName: true, setor: true } },
      },
      orderBy: { dataInventory: { serviceName: "asc" } },
    });
    if (serviceNotices.length > 0) {
      const links = serviceNotices
        .map((n) => {
          const name = n.dataInventory.serviceName ?? n.slug;
          const setorTag = n.dataInventory.setor ? ` _(${n.dataInventory.setor})_` : "";
          return `- [${name}](/p/${companySlug}/aviso-servico/${n.slug})${setorTag}`;
        })
        .join("\n");
      content += `\n\n## Avisos de Privacidade específicos por serviço\n\nAlém deste Aviso institucional, publicamos um Aviso detalhado para cada serviço que envolve dados pessoais:\n\n${links}\n`;
    }
  }

  return (
    <PublicPolicyView
      companyName={company.tradeName ?? company.companyName}
      logoUrl={company.logoUrl}
      website={company.website}
      type={policy.type}
      typeLabel={policyTypeLabel(policy.type)}
      title={policy.title}
      content={content}
      publishedAt={policy.publishedAt?.toISOString() ?? null}
      version={policy.currentVersion}
    />
  );
}

// Metadata SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string; policySlug: string }>;
}) {
  const { companySlug, policySlug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: { id: true, companyName: true, tradeName: true },
  });
  if (!company) return { title: "Política não encontrada" };
  const policy = await prisma.policy.findFirst({
    where: { companyId: company.id, slug: policySlug, status: "PUBLICADA" },
    select: { title: true, type: true },
  });
  if (!policy) return { title: "Política não encontrada" };
  return {
    title: `${policy.title} — ${company.tradeName ?? company.companyName}`,
    description: `${policyTypeLabel(policy.type)} — documento oficial publicado por ${company.tradeName ?? company.companyName}.`,
  };
}
