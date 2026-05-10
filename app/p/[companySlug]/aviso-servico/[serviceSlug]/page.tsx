import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PublicPolicyView from "@/components/politicas/public-policy-view";

/**
 * Página pública de um Aviso de Privacidade por Serviço
 * (`/p/<companySlug>/aviso-servico/<serviceSlug>`).
 *
 * Sem auth, layout limpo. Só renderiza notices com status=PUBLICADO.
 * Reusa `<PublicPolicyView>` pra manter consistência visual com as
 * Políticas institucionais.
 */
export default async function PublicServiceNoticePage({
  params,
}: {
  params: Promise<{ companySlug: string; serviceSlug: string }>;
}) {
  const { companySlug, serviceSlug } = await params;

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

  const notice = await prisma.servicePrivacyNotice.findUnique({
    where: { companyId_slug: { companyId: company.id, slug: serviceSlug } },
    select: {
      id: true,
      slug: true,
      status: true,
      publishedContent: true,
      publishedAt: true,
      currentVersion: true,
      dataInventory: { select: { serviceName: true } },
    },
  });

  if (!notice || notice.status !== "PUBLICADO" || !notice.publishedContent) {
    notFound();
  }

  const title = `Aviso de Privacidade — ${notice.dataInventory.serviceName ?? "Serviço"}`;

  return (
    <PublicPolicyView
      companyName={company.tradeName ?? company.companyName}
      logoUrl={company.logoUrl}
      website={company.website}
      type="AVISO_PRIVACIDADE_SERVICO"
      typeLabel="Aviso de Privacidade do serviço"
      title={title}
      content={notice.publishedContent}
      publishedAt={notice.publishedAt?.toISOString() ?? null}
      version={notice.currentVersion}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string; serviceSlug: string }>;
}) {
  const { companySlug, serviceSlug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: { id: true, companyName: true, tradeName: true },
  });
  if (!company) return { title: "Aviso não encontrado" };
  const notice = await prisma.servicePrivacyNotice.findUnique({
    where: { companyId_slug: { companyId: company.id, slug: serviceSlug } },
    select: {
      status: true,
      dataInventory: { select: { serviceName: true } },
    },
  });
  if (!notice || notice.status !== "PUBLICADO") {
    return { title: "Aviso não encontrado" };
  }
  return {
    title: `Aviso de Privacidade — ${notice.dataInventory.serviceName} — ${company.tradeName ?? company.companyName}`,
    description: `Aviso de Privacidade do serviço ${notice.dataInventory.serviceName}, publicado por ${company.tradeName ?? company.companyName} em cumprimento ao Art. 9º da LGPD.`,
  };
}
