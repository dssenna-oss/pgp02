export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import { buildPolicyDocx, suggestPolicyFilename } from "@/lib/policies-docx-export";
import { CONSENT_TEMPLATE_BY_ID } from "@/lib/consent-templates";

/**
 * GET /api/consent-terms/[id]/export?source=current|published
 *
 * Exporta o Termo em DOCX. Reusa `buildPolicyDocx` (parser markdown
 * genérico das Políticas). DPO usa pra imprimir e coletar assinatura
 * física (modo `allowsPhysical`).
 *
 * Auth: DPO-only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
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
      return NextResponse.json({ error: "Apenas DPO" }, { status: 403 });
    }

    const sp = request.nextUrl.searchParams;
    const source = sp.get("source") === "current" ? "current" : "published";

    const [term, company] = await Promise.all([
      prisma.consentTerm.findFirst({
        where: { id: params.id, companyId: user.companyId },
      }),
      prisma.company.findUnique({
        where: { id: user.companyId },
        select: { companyName: true, tradeName: true },
      }),
    ]);

    if (!term || !company) {
      return NextResponse.json({ error: "Termo não encontrado" }, { status: 404 });
    }

    const content =
      source === "published" ? term.publishedContent : term.currentContent;
    if (!content) {
      return NextResponse.json(
        {
          error:
            "Termo ainda não foi publicado. Use ?source=current pra exportar o rascunho.",
        },
        { status: 404 },
      );
    }

    const typeLabel =
      CONSENT_TEMPLATE_BY_ID[term.templateType as keyof typeof CONSENT_TEMPLATE_BY_ID]
        ?.label ?? "Termo de Consentimento";

    const buf = await buildPolicyDocx({
      companyName: company.tradeName ?? company.companyName,
      policyTitle: term.title,
      policyTypeLabel: typeLabel,
      publishedAt:
        source === "published" && term.publishedAt
          ? term.publishedAt.toISOString()
          : null,
      version: term.currentVersion,
      content,
    });

    const filename = suggestPolicyFilename(
      term.title,
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
    console.error("[/api/consent-terms/[id]/export] erro:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 },
    );
  }
}
