
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Buscar as configurações globais
    const globalSettings = await prisma.globalSettings.findFirst();

    return NextResponse.json({
      ripdEbookUrl: globalSettings?.ripdEbookUrl || null,
    });
  } catch (error) {
    console.error("Erro ao buscar URL do ebook:", error);
    return NextResponse.json(
      { error: "Erro ao buscar URL do ebook" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Buscar o usuário e verificar se é admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Verificar se o usuário é admin
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem editar o ebook." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ripdEbookUrl } = body;

    if (!ripdEbookUrl || typeof ripdEbookUrl !== "string") {
      return NextResponse.json(
        { error: "URL do ebook inválida" },
        { status: 400 }
      );
    }

    // Buscar ou criar configurações globais
    const existingSettings = await prisma.globalSettings.findFirst();

    let updatedSettings;
    if (existingSettings) {
      updatedSettings = await prisma.globalSettings.update({
        where: { id: existingSettings.id },
        data: { ripdEbookUrl },
      });
    } else {
      updatedSettings = await prisma.globalSettings.create({
        data: { ripdEbookUrl },
      });
    }

    return NextResponse.json({
      message: "URL do ebook salva com sucesso",
      ripdEbookUrl: updatedSettings.ripdEbookUrl,
    });
  } catch (error) {
    console.error("Erro ao salvar URL do ebook:", error);
    return NextResponse.json(
      { error: "Erro ao salvar URL do ebook" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Buscar o usuário e verificar se é admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Verificar se o usuário é admin
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem remover o ebook." },
        { status: 403 }
      );
    }

    // Remover a URL do ebook das configurações globais
    const existingSettings = await prisma.globalSettings.findFirst();
    
    if (existingSettings) {
      await prisma.globalSettings.update({
        where: { id: existingSettings.id },
        data: { ripdEbookUrl: null },
      });
    }

    return NextResponse.json({
      message: "URL do ebook removida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover URL do ebook:", error);
    return NextResponse.json(
      { error: "Erro ao remover URL do ebook" },
      { status: 500 }
    );
  }
}
