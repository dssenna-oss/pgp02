import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generatePresignedUploadUrl, getFileUrl } from "@/lib/s3";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Gerar URL de upload presignada
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar quota de arquivos
    let quota = await prisma.chatQuota.findUnique({
      where: { userId: user.id },
    });

    if (!quota) {
      quota = await prisma.chatQuota.create({
        data: { userId: user.id },
      });
    }

    // Resetar contadores se necessário
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (quota.lastResetDate < today) {
      quota = await prisma.chatQuota.update({
        where: { userId: user.id },
        data: {
          dailyMessages: 0,
          dailyFiles: 0,
          lastResetDate: now,
        },
      });
    }

    if (quota.dailyFiles >= quota.maxDailyFiles) {
      return NextResponse.json(
        { error: "Limite diário de arquivos atingido", exceeded: true },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { fileName, contentType, fileSize, conversationId } = body;

    if (!fileName || !contentType || !fileSize) {
      return NextResponse.json(
        { error: "Dados do arquivo incompletos" },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Use PDF, Word, Excel ou TXT." },
        { status: 400 }
      );
    }

    // Validar tamanho
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo 10MB." },
        { status: 400 }
      );
    }

    // Gerar URL presignada
    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
      `chat-${user.id}-${fileName}`,
      contentType,
      false // Arquivos do chat são privados
    );

    // Incrementar contador de arquivos
    await prisma.chatQuota.update({
      where: { userId: user.id },
      data: {
        dailyFiles: { increment: 1 },
        monthlyFiles: { increment: 1 },
      },
    });

    // Determinar tipo do arquivo
    const fileType = getFileType(contentType);

    // Registrar arquivo no banco
    const chatFile = await prisma.chatFile.create({
      data: {
        conversationId: conversationId || "temp",
        fileName,
        fileType,
        fileSize,
        mimeType: contentType,
        cloud_storage_path,
      },
    });

    return NextResponse.json({
      uploadUrl,
      cloud_storage_path,
      fileId: chatFile.id,
    });

  } catch (error) {
    console.error("Erro ao gerar URL de upload:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function getFileType(mimeType: string): string {
  const typeMap: Record<string, string> = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/plain": "txt",
  };
  return typeMap[mimeType] || "unknown";
}
