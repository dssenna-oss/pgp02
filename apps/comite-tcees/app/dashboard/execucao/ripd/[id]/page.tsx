import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeRipdData } from "@/lib/ripd-helpers";
import { RipdEditorClient } from "@/components/ripd-editor-client";

export const dynamic = "force-dynamic";

export default async function RipdEditorPage({ params }: { params: { id: string } }) {
  const ripd = await prisma.ripd.findUnique({
    where: { id: params.id },
    include: { inventory: { select: { nome: true } } },
  });
  if (!ripd) notFound();

  return (
    <div className="max-w-5xl mx-auto">
      <RipdEditorClient
        ripd={{
          id: ripd.id,
          title: ripd.title,
          status: ripd.status,
          data: normalizeRipdData(ripd.data),
          inventoryName: ripd.inventory?.nome ?? null,
          publishedVersionNum: ripd.publishedVersionNum,
          approvedBy: ripd.approvedBy,
        }}
      />
    </div>
  );
}
