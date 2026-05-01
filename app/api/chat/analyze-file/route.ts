import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFileUrl } from "@/lib/s3";
import { generateText } from "@/lib/llm";

// Extrair texto do arquivo usando LLM (para PDFs e documentos)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json(
        { error: "ID do arquivo é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar arquivo
    const chatFile = await prisma.chatFile.findUnique({
      where: { id: fileId },
    });

    if (!chatFile) {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 404 }
      );
    }

    // Se já tem texto extraído, retornar
    if (chatFile.extractedText) {
      return NextResponse.json({
        success: true,
        extractedText: chatFile.extractedText,
      });
    }

    // Obter URL do arquivo
    const fileUrl = await getFileUrl(chatFile.cloud_storage_path, false);

    // Para arquivos de texto simples, baixar e retornar
    if (chatFile.mimeType === "text/plain") {
      try {
        const response = await fetch(fileUrl);
        const text = await response.text();
        
        // Salvar texto extraído
        await prisma.chatFile.update({
          where: { id: fileId },
          data: { extractedText: text.slice(0, 50000) }, // Limitar a 50k caracteres
        });

        return NextResponse.json({
          success: true,
          extractedText: text.slice(0, 50000),
        });
      } catch (e) {
        console.error("Erro ao ler arquivo texto:", e);
      }
    }

    // Para PDFs e outros documentos, usar LLM para extrair conteúdo
    // Criar prompt de extração
    const extractionPrompt = `Você é um assistente de extração de texto. Analise o documento fornecido e extraia o conteúdo textual principal.

Arquivo: ${chatFile.fileName}
Tipo: ${chatFile.fileType}

Por favor, forneça um resumo estruturado do conteúdo do documento, incluindo:
1. Título ou assunto principal
2. Pontos principais
3. Qualquer dado relevante sobre LGPD ou proteção de dados

URL do arquivo para análise: ${fileUrl}`;

    let extractedText: string;
    try {
      extractedText = await generateText({
        systemPrompt:
          "Você é um assistente especializado em extrair e resumir conteúdo de documentos. Responda sempre em português brasileiro.",
        history: [],
        userMessage: extractionPrompt,
        temperature: 0.3,
        maxOutputTokens: 2000,
      });
      if (!extractedText) {
        extractedText = "Não foi possível extrair o conteúdo.";
      }
    } catch (e) {
      console.error("Erro na API LLM para extração:", e);
      return NextResponse.json(
        { error: "Erro ao processar arquivo" },
        { status: 500 }
      );
    }

    // Salvar texto extraído
    await prisma.chatFile.update({
      where: { id: fileId },
      data: { extractedText },
    });

    return NextResponse.json({
      success: true,
      extractedText,
    });

  } catch (error) {
    console.error("Erro ao analisar arquivo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
