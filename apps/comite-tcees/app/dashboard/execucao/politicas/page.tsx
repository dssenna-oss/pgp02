import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PoliticasClient, type PolicyListDTO } from "@/components/politicas-client";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PoliticasPage() {
  const policies = await prisma.policy.findMany({ orderBy: { updatedAt: "desc" } });

  const dtos: PolicyListDTO[] = policies.map((p) => ({
    id: p.id,
    type: p.type,
    title: p.title,
    slug: p.slug,
    status: p.status,
    currentVersion: p.currentVersion,
    updatedAt: p.updatedAt.toISOString(),
    vinculadaInstrumento: !!p.instrumentoId,
  }));

  return (
    <>
      <Link href="/dashboard/execucao" className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-brand-600 mb-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Central de Instrumentos
      </Link>
      <PageHeader
        emoji="📄"
        title="Políticas e Documentos"
        lead="Editor de documentos da Fase 6 — escreva, versione e publique Aviso de Privacidade, Cookies, PSI, Retenção e demais políticas. Documentos publicados ganham página pública."
      />
      <PoliticasClient policies={dtos} />
    </>
  );
}
