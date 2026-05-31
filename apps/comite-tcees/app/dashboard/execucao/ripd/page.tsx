import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { RipdListClient, type RipdListDTO, type InventoryOption } from "@/components/ripd-list-client";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RipdListPage() {
  const [ripds, inventario] = await Promise.all([
    prisma.ripd.findMany({
      orderBy: { updatedAt: "desc" },
      include: { inventory: { select: { nome: true } } },
    }),
    prisma.dataInventory.findMany({
      orderBy: [{ prioritario: "desc" }, { ordem: "asc" }],
      select: { id: true, nome: true, ripds: { select: { id: true }, take: 1 } },
    }),
  ]);

  const dtos: RipdListDTO[] = ripds.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    inventoryName: r.inventory?.nome ?? null,
    publishedVersionNum: r.publishedVersionNum,
    updatedAt: r.updatedAt.toISOString(),
  }));

  const invOptions: InventoryOption[] = inventario.map((i) => ({
    id: i.id,
    nome: i.nome,
    jaTemRipd: i.ripds.length > 0,
  }));

  return (
    <>
      <Link href="/dashboard/execucao" className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-brand-600 mb-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Central de Instrumentos
      </Link>
      <PageHeader
        emoji="📋"
        title="RIPD — Relatórios de Impacto"
        lead="Fase 6 — Relatório de Impacto à Proteção de Dados (Res. CD/ANPD 2/2022). Crie um por processo do Inventário; as 8 seções vêm pré-preenchidas com os dados e riscos do processo."
      />
      <RipdListClient ripds={dtos} inventario={invOptions} />
    </>
  );
}
