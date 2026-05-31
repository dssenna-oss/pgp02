import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { buildPolicyDocx } from "@/lib/policies-docx-export";

export const maxDuration = 60;

/** Gera DOCX a partir de um markdown de cláusula já renderizado. */
export async function POST(req: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { title?: string; content?: string } | null;
  if (!body?.content) return NextResponse.json({ error: "Conteúdo ausente" }, { status: 400 });

  const comite = await prisma.comite.findFirst({ select: { instituicao: true, sigla: true } });
  const companyName = comite?.instituicao || comite?.sigla || "TCE-ES";
  const title = body.title?.trim() || "Cláusula LGPD para Operador";

  // Reusa o parser markdown→docx das Políticas (cláusulas também são markdown).
  const buffer = await buildPolicyDocx({
    companyName,
    policyTitle: title,
    policyTypeLabel: "Cláusula contratual — Operadores (art. 39 LGPD)",
    publishedAt: null,
    version: 0,
    content: body.content,
  });

  const safe = title.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9-]+/g, "_").slice(0, 50);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${safe}.docx"`,
    },
  });
}
