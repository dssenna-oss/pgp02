import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { buildPolicyDocx, suggestPolicyFilename } from "@/lib/policies-docx-export";
import { policyTypeLabel } from "@/lib/policies-helpers";

export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [policy, comite] = await Promise.all([
    prisma.policy.findUnique({ where: { id: params.id } }),
    prisma.comite.findFirst({ select: { instituicao: true, sigla: true } }),
  ]);
  if (!policy) return NextResponse.json({ error: "Política não encontrada" }, { status: 404 });

  const companyName = comite?.instituicao || comite?.sigla || "TCE-ES";
  // Exporta o conteúdo publicado se houver; senão o rascunho atual.
  const content = policy.publishedContent ?? policy.currentContent;

  const buffer = await buildPolicyDocx({
    companyName,
    policyTitle: policy.title,
    policyTypeLabel: policyTypeLabel(policy.type),
    publishedAt: policy.publishedAt ? policy.publishedAt.toISOString() : null,
    version: policy.currentVersion,
    content,
  });

  const filename = suggestPolicyFilename(policy.title, companyName, "docx");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
