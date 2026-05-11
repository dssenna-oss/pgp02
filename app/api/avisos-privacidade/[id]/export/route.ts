export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import { buildPolicyDocx, suggestPolicyFilename } from "@/lib/policies-docx-export";

/**
 * GET /api/avisos-privacidade/[id]/export?source=current|published
 *
 * Exporta o Aviso de Privacidade em DOCX. Reusa o builder das Políticas
 * (`lib/policies-docx-export.ts`) que aceita markdown genérico.
 *
 * Default: source=published. Se ainda não publicado, devolve 404 — DPO
 * pode passar `?source=current` pra exportar o rascunho atual.
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

    const [notice, company] = await Promise.all([
      prisma.servicePrivacyNotice.findFirst({
        where: { id: params.id, companyId: user.companyId },
        include: { dataInventory: { select: { serviceName: true } } },
      }),
      prisma.company.findUnique({
        where: { id: user.companyId },
        select: { companyName: true, tradeName: true },
      }),
    ]);

    if (!notice || !company) {
      return NextResponse.json({ error: "Aviso não encontrado" }, { status: 404 });
    }

    const content =
      source === "published" ? notice.publishedContent : notice.currentContent;
    if (!content) {
      return NextResponse.json(
        {
          error:
            "Aviso ainda não foi publicado. Use ?source=current pra exportar o rascunho.",
        },
        { status: 404 },
      );
    }

    const serviceName = notice.dataInventory.serviceName ?? "Serviço";
    const title = `Aviso de Privacidade — ${serviceName}`;

    const buf = await buildPolicyDocx({
      companyName: company.tradeName ?? company.companyName,
      policyTitle: title,
      policyTypeLabel: "Aviso de Privacidade do serviço",
      publishedAt:
        source === "published" && notice.publishedAt
          ? notice.publishedAt.toISOString()
          : null,
      version: notice.currentVersion,
      content,
    });

    const filename = suggestPolicyFilename(
      title,
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
    console.error("[/api/avisos-privacidade/[id]/export] erro:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 },
    );
  }
}
