import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const VALID_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB (base64 incha ~33%, fica ~2.7 MB no DB)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem alterar o logo" },
        { status: 403 }
      );
    }

    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File;

    if (!file) {
      return NextResponse.json({ error: "Arquivo não fornecido" }, { status: 400 });
    }

    if (!VALID_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo inválido. Use JPG, PNG, GIF ou WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Tamanho máximo: 2MB" },
        { status: 400 }
      );
    }

    // Codifica o arquivo como data URL (base64) e salva direto no banco.
    // Logos são pequenos (1 por empresa) — não justifica S3/Vercel Blob.
    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

    await prisma.company.update({
      where: { id: companyId },
      data: { logoUrl: dataUrl },
    });

    return NextResponse.json({
      message: "Logo atualizado com sucesso",
      logoUrl: dataUrl,
    });
  } catch (error) {
    console.error("Erro ao fazer upload do logo:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload do logo" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { logoUrl: true },
    });

    return NextResponse.json({ logoUrl: company?.logoUrl ?? null });
  } catch (error) {
    console.error("Erro ao buscar logo:", error);
    return NextResponse.json(
      { error: "Erro ao buscar logo" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem remover o logo" },
        { status: 403 }
      );
    }

    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    await prisma.company.update({
      where: { id: companyId },
      data: { logoUrl: null },
    });

    return NextResponse.json({ message: "Logo removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover logo:", error);
    return NextResponse.json(
      { error: "Erro ao remover logo" },
      { status: 500 }
    );
  }
}
