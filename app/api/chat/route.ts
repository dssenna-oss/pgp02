import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { anonymizeText, detectSentiment } from "@/lib/chat-utils";
import { streamChat, type ChatMessage } from "@/lib/llm";

// Mapeamento de contexto de página para descrição amigável
const PAGE_CONTEXT_MAP: Record<string, string> = {
  "dashboard": "Dashboard principal do PGP",
  "fase-preliminar": "Fase Preliminar - Preparação e Sensibilização",
  "fase-1": "Fase 1 - Formação da Equipe",
  "fase-2": "Fase 2 - Diagnóstico Inicial",
  "fase-3": "Fase 3 - Mapeamento e Análise de Riscos",
  "fase-4": "Fase 4 - GAP Analysis",
  "fase-5": "Fase 5 - Plano de Ação e Adequação",
  "fase-6": "Fase 6 - Políticas e Procedimentos",
  "fase-7": "Fase 7 - Monitoramento Contínuo",
  "inventario": "Inventário de Dados Pessoais",
  "analise-riscos": "Análise de Riscos",
  "gap-analysis": "GAP Analysis",
  "plano-acao": "Plano de Ação",
  "ripd": "RIPD - Relatório de Impacto",
  "incidentes": "Gestão de Incidentes",
  "documentos": "Documentos",
  "configuracoes": "Configurações",
  "conteudos-didaticos": "Conteúdos Didáticos",
  "entendendo-pgp": "Entendendo o PGP",
  "login": "Página de Login",
  "signup": "Página de Cadastro",
  "landing": "Página Inicial",
};

// System prompt do Detetive da Privacidade
const SYSTEM_PROMPT_SIMPLE = `Você é o **Detetive da Privacidade** 🔍, um assistente virtual especializado em conformidade legal e proteção de dados.

## Suas Especialidades:
- **LGPD** (Lei Geral de Proteção de Dados - Lei 13.709/2018)
- **LAI** (Lei de Acesso à Informação - Lei 12.527/2011)
- **CDU** (Código de Defesa do Usuário de Serviços Públicos - Lei 13.460/2017)
- **CDC** (Código de Defesa do Consumidor - Lei 8.078/1990)
- **MCI** (Marco Civil da Internet - Lei 12.965/2014)
- **ECA Digital** (Lei 15.211/2025)

## Modo Simplificado (Atual):
- Use linguagem simples e acessível, sem jargão jurídico excessivo
- Dê exemplos práticos do dia a dia
- Tom amigável e conversacional
- Respostas de 3-5 parágrafos
- Use emojis moderadamente para tornar a conversa mais agradável

## Público-Alvo:
- Titulares de dados: Cidadãos que querem entender seus direitos
- DPOs/Encarregados: Profissionais de privacidade
- Empresas: Organizações buscando conformidade

## Diretrizes:
1. Sempre responda em português brasileiro
2. Seja preciso mas acessível
3. Quando mencionar artigos de lei, explique de forma simples
4. Se não souber algo, admita e sugira onde buscar mais informações
5. Sempre termine com uma sugestão de próximo passo ou pergunta relacionada

## Disclaimer Obrigatório:
Sempre inclua ao final de cada resposta:
"\n\nℹ️ *Disclaimer: Esta é uma orientação geral. Para casos específicos, consulte um advogado especializado.*"`;

const SYSTEM_PROMPT_TECHNICAL = `Você é o **Detetive da Privacidade** 🔍, um assistente virtual especializado em conformidade legal e proteção de dados.

## Suas Especialidades:
- **LGPD** (Lei Geral de Proteção de Dados - Lei 13.709/2018)
- **LAI** (Lei de Acesso à Informação - Lei 12.527/2011)
- **CDU** (Código de Defesa do Usuário de Serviços Públicos - Lei 13.460/2017)
- **CDC** (Código de Defesa do Consumidor - Lei 8.078/1990)
- **MCI** (Marco Civil da Internet - Lei 12.965/2014)
- **ECA Digital** (Lei 15.211/2025)

## Modo Técnico (Atual):
- Use terminologia jurídica precisa
- Cite artigos de lei completos quando relevante
- Faça referências a doutrina e jurisprudência quando aplicável
- Tom formal e acadêmico
- Respostas de 5-7 parágrafos com profundidade técnica

## Público-Alvo:
- DPOs/Encarregados: Profissionais de privacidade
- Advogados: Especialistas em direito digital
- Compliance Officers: Responsáveis por conformidade

## Diretrizes:
1. Sempre responda em português brasileiro
2. Seja preciso e tecnicamente rigoroso
3. Cite artigos específicos das leis quando relevante
4. Mencione precedentes da ANPD quando aplicável
5. Sempre termine com uma sugestão de próximo passo ou pergunta relacionada

## Disclaimer Obrigatório:
Sempre inclua ao final de cada resposta:
"\n\nℹ️ *Disclaimer: Esta é uma orientação geral. Para casos específicos, consulte um advogado especializado.*"`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [], mode = "simple", pageContext, conversationId, fileId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Mensagem é obrigatória" },
        { status: 400 }
      );
    }

    // Obter sessão do usuário (opcional - chatbot funciona com ou sem login)
    const session = await getServerSession(authOptions);
    let userId: string | null = null;
    let dbConversationId: string | null = conversationId || null;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      userId = user?.id || null;

      // Verificar cotas do usuário
      if (userId) {
        let quota = await prisma.chatQuota.findUnique({
          where: { userId },
        });

        if (!quota) {
          quota = await prisma.chatQuota.create({
            data: { userId },
          });
        }

        // Verificar se precisa resetar contadores
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (quota.lastResetDate < today) {
          await prisma.chatQuota.update({
            where: { userId },
            data: {
              dailyMessages: 0,
              dailyFiles: 0,
              lastResetDate: now,
            },
          });
          quota.dailyMessages = 0;
        }

        // Verificar limite
        if (quota.dailyMessages >= quota.maxDailyMessages) {
          return NextResponse.json(
            { error: "Limite diário de mensagens atingido. Tente novamente amanhã.", quotaExceeded: true },
            { status: 429 }
          );
        }

        // Incrementar contador
        await prisma.chatQuota.update({
          where: { userId },
          data: {
            dailyMessages: { increment: 1 },
            monthlyMessages: { increment: 1 },
          },
        });
      }
    }

    // Anonimizar dados sensíveis na mensagem
    const { text: anonymizedMessage, foundSensitive } = anonymizeText(message);
    
    // Detectar sentimento da mensagem
    const { sentiment, score: sentimentScore } = detectSentiment(message);

    // Construir contexto da página
    const pageDescription = pageContext ? PAGE_CONTEXT_MAP[pageContext] || pageContext : null;
    
    let systemPrompt = mode === "technical" ? SYSTEM_PROMPT_TECHNICAL : SYSTEM_PROMPT_SIMPLE;
    
    // Adicionar contexto da página ao prompt do sistema
    if (pageDescription) {
      systemPrompt += `\n\n## Contexto Atual:\nO usuário está na página: **${pageDescription}**\nAdapte suas respostas para serem relevantes a este contexto quando apropriado.`;
    }

    // Adicionar contexto de sentimento ao prompt se detectado frustração ou confusão
    if (sentiment === "frustrated" || sentiment === "confused") {
      systemPrompt += `\n\n## Observação sobre o usuário:\nO usuário parece estar ${sentiment === "frustrated" ? "frustrado" : "confuso"}. Seja extra paciente, use linguagem ainda mais clara e ofereça exemplos práticos.`;
    }

    // Adicionar contexto de arquivo se houver
    let fileContext = "";
    if (fileId) {
      try {
        const chatFile = await prisma.chatFile.findUnique({
          where: { id: fileId },
        });
        if (chatFile?.extractedText) {
          fileContext = `\n\n## Documento anexado:\nO usuário enviou um arquivo "${chatFile.fileName}" com o seguinte conteúdo:\n\n${chatFile.extractedText.slice(0, 3000)}${chatFile.extractedText.length > 3000 ? "...(conteúdo truncado)" : ""}`;
          systemPrompt += fileContext;
        }
      } catch (e) {
        console.error("Erro ao buscar arquivo:", e);
      }
    }

    // Histórico anterior (sem mensagem atual e sem o system prompt)
    const llmHistory: ChatMessage[] = (history as ChatMessage[]).slice(-10);

    // Salvar mensagem do usuário no banco (se autenticado)
    let userMessageId: string | null = null;
    if (userId) {
      try {
        // Criar conversa se não existir
        if (!dbConversationId) {
          const conversation = await prisma.chatConversation.create({
            data: {
              userId,
              title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
              mode,
              lastPageContext: pageContext,
            },
          });
          dbConversationId = conversation.id;
        } else {
          // Atualizar contexto da conversa
          await prisma.chatConversation.update({
            where: { id: dbConversationId },
            data: { lastPageContext: pageContext, updatedAt: new Date() },
          });
        }

        // Salvar mensagem do usuário (anonimizada)
        const userMessage = await prisma.chatMessage.create({
          data: {
            conversationId: dbConversationId,
            role: "user",
            content: anonymizedMessage,
            pageContext,
            sentiment,
            sentimentScore,
            hasAttachment: !!fileId,
          },
        });
        userMessageId = userMessage.id;

        // Atualizar arquivo com conversationId se necessário
        if (fileId) {
          await prisma.chatFile.update({
            where: { id: fileId },
            data: { 
              conversationId: dbConversationId,
              messageId: userMessage.id,
            },
          });
        }
      } catch (dbError) {
        console.error("Erro ao salvar no banco:", dbError);
        // Continua mesmo se falhar o salvamento
      }
    }

    // Stream da resposta do LLM (Gemini) — convertido pro mesmo formato SSE
    // que o frontend já espera: data: {"content": "..."} + data: [DONE]
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullResponse = "";

        if (dbConversationId) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "init", conversationId: dbConversationId })}\n\n`
            )
          );
        }

        try {
          for await (const chunk of streamChat({
            systemPrompt,
            history: llmHistory,
            userMessage: anonymizedMessage,
            temperature: 0.7,
            maxOutputTokens: 1500,
          })) {
            fullResponse += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
            );
          }

          // Persistir resposta do assistant
          if (userId && dbConversationId && fullResponse) {
            try {
              const assistantMessage = await prisma.chatMessage.create({
                data: {
                  conversationId: dbConversationId,
                  role: "assistant",
                  content: fullResponse,
                  pageContext,
                },
              });
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "messageId", messageId: assistantMessage.id })}\n\n`
                )
              );
            } catch (dbError) {
              console.error("Erro ao salvar resposta:", dbError);
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ content: "\n\n⚠️ Erro ao processar sua pergunta. Tente novamente." })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error) {
    console.error("Erro no chat:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
