export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadPolicyAuth, policyTypeLabel } from "@/lib/policies-helpers";
import {
  buildPolicyDocx,
  suggestPolicyFilename,
} from "@/lib/policies-docx-export";

/**
 * GET /api/politicas/[id]/export?source=current|published
 *
 * Exporta a política em DOCX (Word). DPO-only.
 *   - source=published (default) → exporta `publishedContent` (versão
 *     publicada). 404 se ainda não publicada.
 *   - source=current → exporta `currentContent` (rascunho atual).
 *     Útil pra revisão antes de publicar.
 *
 * (PDF tem fluxo separado via página `/dashboard/politicas/[id]/pdf`
 * + window.print(), mesmo padrão do PDF do GAP.)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const r = await loadPolicyAuth();
    if ("error" in r) return r.error;
    const { user } = r;
    const { id } = await params;

    const sp = request.nextUrl.searchParams;
    const source = sp.get("source") === "current" ? "current" : "published";

    const [policy, company] = await Promise.all([
      prisma.policy.findFirst({
        where: { id, companyId: user.companyId },
      }),
      prisma.company.findUnique({
        where: { id: user.companyId },
        select: { companyName: true, tradeName: true },
      }),
    ]);

    if (!policy || !company) {
      return NextResponse.json({ error: "Política não encontrada" }, { status: 404 });
    }

    const content = source === "published" ? policy.publishedContent : policy.currentContent;
    if (!content) {
      return NextResponse.json(
        { error: "Política ainda não foi publicada. Use ?source=current pra exportar o rascunho." },
        { status: 404 },
      );
    }

    const buf = await buildPolicyDocx({
      companyName: company.tradeName ?? company.companyName,
      policyTitle: policy.title,
      policyTypeLabel: policyTypeLabel(policy.type),
      publishedAt: source === "published" && policy.publishedAt
        ? policy.publishedAt.toISOString()
        : null,
      version: policy.currentVersion,
      content,
    });

    const filename = suggestPolicyFilename(
      policy.title,
      company.tradeName ?? company.companyName,
      "docx",
    );

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[/api/politicas/[id]/export] erro:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 },
    );
  }
}
