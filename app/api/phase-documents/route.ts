
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/s3";

// GET - Listar documentos de uma fase
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const phase = searchParams.get("phase");

    if (!phase) {
      return NextResponse.json({ error: "Fase não especificada" }, { status: 400 });
    }

    const documents = await prisma.phaseDocument.findMany({
      where: {
        phase: phase,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Para documentos com arquivo S3, não precisamos gerar signed URLs
    // O S3 já está configurado para acesso público ou vamos usar presigned URLs
    const documentsWithUrls = documents.map((doc) => ({
      ...doc,
      downloadUrl: doc.cloud_storage_path 
        ? `/api/phase-documents/download/${doc.id}` 
        : null,
      viewUrl: doc.cloud_storage_path 
        ? `/api/phase-documents/view/${doc.id}` 
        : null,
    }));

    return NextResponse.json(documentsWithUrls);
  } catch (error) {
    console.error("Erro ao buscar documentos:", error);
    return NextResponse.json({ error: "Erro ao buscar documentos" }, { status: 500 });
  }
}

// POST - Criar novo documento (upload ou URL de vídeo)
export async function POST(req: NextRequest) {
  try {
    console.log("=== Iniciando upload de documento ===");

    // Verificar se o usuário é administrador
    const session = await getServerSession(authOptions);
    if (!session || session.user?.email !== "clubedoservidor@protonmail.com") {
      console.log("Acesso negado: usuário não é administrador");
      return NextResponse.json(
        { error: "Acesso negado. Apenas o administrador pode fazer upload de documentos." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const phase = formData.get("phase") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string || "";
    const videoUrl = formData.get("videoUrl") as string | null;
    const file = formData.get("file") as File | null;
    
    console.log("Dados recebidos:", {
      phase,
      title,
      description: description ? "sim" : "não",
      videoUrl: videoUrl ? "sim" : "não",
      file: file ? file.name : "não",
    });

    if (!phase || !title) {
      console.log("Erro: Campos obrigatórios faltando");
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    // Se for URL de vídeo
    if (videoUrl) {
      console.log("Criando registro de vídeo...");
      const document = await prisma.phaseDocument.create({
        data: {
          phase,
          title,
          description: description || null,
          videoUrl,
          isVideoUrl: true,
        },
      });
      console.log("Vídeo criado com sucesso:", document.id);
      return NextResponse.json(document);
    }

    // Se for upload de arquivo
    if (file) {
      console.log("Processando arquivo:", file.name, "Tamanho:", file.size, "bytes");
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name;
      const mimeType = file.type;
      const fileSize = file.size;
      
      console.log("Buffer criado. Iniciando upload para S3...");

      // Fazer upload para S3
      const cloud_storage_path = await uploadFile(buffer, fileName, mimeType);
      console.log("Upload para S3 concluído. Path:", cloud_storage_path);

      // Salvar no banco de dados
      console.log("Salvando no banco de dados...");
      const document = await prisma.phaseDocument.create({
        data: {
          phase,
          title,
          description: description || null,
          fileName,
          fileType: fileName.split(".").pop() || null,
          fileSize,
          mimeType,
          cloud_storage_path,
          isVideoUrl: false,
        },
      });
      console.log("Documento salvo com sucesso:", document.id);
      return NextResponse.json(document);
    }

    console.log("Erro: Nenhum arquivo ou URL fornecido");
    return NextResponse.json({ error: "Nenhum arquivo ou URL fornecido" }, { status: 400 });
  } catch (error) {
    console.error("=== ERRO AO CRIAR DOCUMENTO ===");
    console.error("Erro:", error);
    console.error("Stack:", (error as Error).stack);
    return NextResponse.json({ 
      error: "Erro ao criar documento",
      details: (error as Error).message 
    }, { status: 500 });
  }
}
