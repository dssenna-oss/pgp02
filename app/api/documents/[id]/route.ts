
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    const document = await prisma.document.update({
      where: { id: params.id },
      data: {
        title: body.title,
        type: body.type,
        content: body.content,
        version: body.version,
        status: body.status,
        language: body.language,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Erro ao atualizar documento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar documento" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await prisma.document.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir documento:", error);
    return NextResponse.json(
      { error: "Erro ao excluir documento" },
      { status: 500 }
    );
  }
}
