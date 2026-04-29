

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getFileUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Chave do arquivo não fornecida" },
        { status: 400 }
      );
    }

    // Gera URL assinada válida por 1 hora
    const url = await getFileUrl(key, 3600);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Erro ao gerar URL assinada:", error);
    return NextResponse.json(
      { error: "Erro ao gerar URL assinada" },
      { status: 500 }
    );
  }
}
