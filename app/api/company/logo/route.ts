

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadLogo, deleteFile, getFileUrl } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verifica se o usuário é admin
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

    // Valida o tipo de arquivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo inválido. Use JPG, PNG, GIF ou WebP" },
        { status: 400 }
      );
    }

    // Valida o tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Tamanho máximo: 5MB" },
        { status: 400 }
      );
    }

    // Busca a empresa para obter o logo antigo
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { logoUrl: true },
    });

    // Converte para Buffer e faz upload
    const buffer = Buffer.from(await file.arrayBuffer());
    const cloud_storage_path = await uploadLogo(buffer, file.name, file.type);

    // Atualiza o logo no banco
    await prisma.company.update({
      where: { id: companyId },
      data: { logoUrl: cloud_storage_path },
    });

    // Remove o logo antigo do S3 (se existir)
    if (company?.logoUrl) {
      try {
        await deleteFile(company.logoUrl);
      } catch (error) {
        console.error("Erro ao deletar logo antigo:", error);
      }
    }

    // Gera URL assinada para o novo logo
    const logoUrl = await getFileUrl(cloud_storage_path, 7 * 24 * 60 * 60); // 7 dias

    return NextResponse.json({
      message: "Logo atualizado com sucesso",
      logoUrl,
      cloud_storage_path,
    });
  } catch (error) {
    console.error("Erro ao fazer upload do logo:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload do logo" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    if (!company?.logoUrl) {
      return NextResponse.json({ logoUrl: null });
    }

    // Gera URL assinada
    const logoUrl = await getFileUrl(company.logoUrl, 7 * 24 * 60 * 60); // 7 dias

    return NextResponse.json({ logoUrl, cloud_storage_path: company.logoUrl });
  } catch (error) {
    console.error("Erro ao buscar logo:", error);
    return NextResponse.json(
      { error: "Erro ao buscar logo" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verifica se o usuário é admin
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

    // Busca o logo atual
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { logoUrl: true },
    });

    if (!company?.logoUrl) {
      return NextResponse.json(
        { message: "Nenhum logo para remover" },
        { status: 200 }
      );
    }

    // Remove do S3
    try {
      await deleteFile(company.logoUrl);
    } catch (error) {
      console.error("Erro ao deletar logo do S3:", error);
    }

    // Remove do banco
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
