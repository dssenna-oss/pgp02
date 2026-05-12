import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PublicPolicyView from "@/components/politicas/public-policy-view";
import { CONSENT_TEMPLATE_BY_ID } from "@/lib/consent-templates";

/**
 * Página pública de um Termo de Consentimento — `/p/<companySlug>/termo/<termSlug>`.
 *
 * S1 — render-only. O botão "Aceito" + formulário de aceite + gravação
 * de ConsentRecord ficam pra S2.
 *
 * Reusa <PublicPolicyView> pra manter estética consistente com Avisos
 * e Políticas.
 */
export default async function PublicConsentTermPage({
  params,
}: {
  params: Promise<{ companySlug: string; termSlug: string }>;
}) {
  const { companySlug, termSlug } = await params;

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

  const term = await prisma.consentTerm.findUnique({
    where: { companyId_slug: { companyId: company.id, slug: termSlug } },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      templateType: true,
      publishedContent: true,
      publishedAt: true,
      currentVersion: true,
      allowsDigital: true,
    },
  });

  if (!term || term.status !== "PUBLICADO" || !term.publishedContent) {
    notFound();
  }

  const typeLabel =
    CONSENT_TEMPLATE_BY_ID[term.templateType as keyof typeof CONSENT_TEMPLATE_BY_ID]
      ?.label ?? "Termo de Consentimento";

  // Banner S1: enquanto a coleta digital não rola (S2), informamos o
  // cidadão que precisa procurar a organização pra dar o consentimento.
  // Quando S2 entrar, troca por formulário de aceite inline.
  const banner = term.allowsDigital
    ? "📝 Este termo aceita assinatura digital. (Em breve: botão **Aceito** aqui mesmo nesta página.)"
    : "📋 Este termo é coletado presencialmente. Entre em contato com a Ouvidoria/Atendimento da organização pra fornecer seu consentimento.";

  const contentWithBanner = `${banner}\n\n---\n\n${term.publishedContent}`;

  return (
    <PublicPolicyView
      companyName={company.tradeName ?? company.companyName}
      logoUrl={company.logoUrl}
      website={company.website}
      type="CONSENT_TERM"
      typeLabel={typeLabel}
      title={term.title}
      content={contentWithBanner}
      publishedAt={term.publishedAt?.toISOString() ?? null}
      version={term.currentVersion}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string; termSlug: string }>;
}) {
  const { companySlug, termSlug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: { id: true, companyName: true, tradeName: true },
  });
  if (!company) return { title: "Termo não encontrado" };
  const term = await prisma.consentTerm.findUnique({
    where: { companyId_slug: { companyId: company.id, slug: termSlug } },
    select: { status: true, title: true },
  });
  if (!term || term.status !== "PUBLICADO") {
    return { title: "Termo não encontrado" };
  }
  return {
    title: `${term.title} — ${company.tradeName ?? company.companyName}`,
    description: `Termo de Consentimento do Titular publicado por ${company.tradeName ?? company.companyName} em cumprimento ao Art. 8º da LGPD.`,
  };
}
