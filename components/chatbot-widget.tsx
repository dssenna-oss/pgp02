"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Minimize2, Send, User, Trash2, GraduationCap, ThumbsUp, ThumbsDown, Mic, MicOff, History, ChevronLeft, Volume2, VolumeX, Paperclip, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  feedback?: "like" | "dislike" | null;
  hasAttachment?: boolean;
  fileName?: string;
}

interface QuotaInfo {
  daily: { messages: number; maxMessages: number };
  canSendMessage: boolean;
}

interface Position {
  x: number;
  y: number;
}

interface Conversation {
  id: string;
  title: string;
  mode: string;
  updatedAt: string;
  _count: { messages: number };
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"simple" | "technical">("simple");
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Novos estados para funcionalidades avançadas
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ id: string; name: string } | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const pathname = usePathname();
  const { data: session } = useSession() || {};

  // Extrair contexto da página atual
  const getPageContext = useCallback(() => {
    if (!pathname) return "landing";
    const path = pathname.replace("/dashboard/", "").replace("/", "");
    if (path === "" || path === "dashboard") return "dashboard";
    return path || "landing";
  }, [pathname]);

  // Inicializar posição no canto inferior direito
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chatbot-position");
      if (saved) {
        try {
          const parsedPosition = JSON.parse(saved);
          if (parsedPosition.x >= 0 && parsedPosition.x <= window.innerWidth - 64 &&
              parsedPosition.y >= 0 && parsedPosition.y <= window.innerHeight - 64) {
            setPosition(parsedPosition);
          } else {
            setPosition({
              x: window.innerWidth - 80,
              y: window.innerHeight - 80
            });
          }
        } catch {
          setPosition({
            x: window.innerWidth - 80,
            y: window.innerHeight - 80
          });
        }
      } else {
        setPosition({
          x: window.innerWidth - 80,
          y: window.innerHeight - 80
        });
      }
    }
  }, []);

  // Salvar posição no localStorage
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem("chatbot-position", JSON.stringify(position));
    }
  }, [position]);

  // Listener pra abertura externa via custom event ("chat:open-with").
  // Usado por <FieldHelp> no wizard de Inventário (botão "Quer aprofundar
  // com IA?") — abre o chat já com a pergunta pré-preenchida.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { seed?: string; source?: string }
        | undefined;
      if (!detail?.seed) return;
      setIsOpen(true);
      setIsMinimized(false);
      setInput(detail.seed);
      // Vinda de field-help (LGPD) → modo técnico faz sentido
      if (detail.source === "field-help") setMode("technical");
      // Foca o input na próxima task — depois do widget renderizar
      setTimeout(() => inputRef.current?.focus(), 200);
    };
    window.addEventListener("chat:open-with", handler);
    return () => window.removeEventListener("chat:open-with", handler);
  }, []);

  // Handlers para drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
      setHasMoved(false);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(window.innerWidth - 64, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 64, e.clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
      setHasMoved(true);
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers para mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (buttonRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = buttonRef.current.getBoundingClientRect();
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
      setIsDragging(true);
      setHasMoved(false);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      const newX = Math.max(0, Math.min(window.innerWidth - 64, touch.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 64, touch.clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
      setHasMoved(true);
    }
  }, [isDragging, dragOffset]);

  // Event listeners para drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Mensagem de boas-vindas
  useEffect(() => {
    if (isOpen && messages.length === 0 && !showHistory) {
      setMessages([{
        role: "assistant",
        content: "Olá! \ud83d\udd0d Sou o **Detetive da Privacidade**, seu assistente especializado em LGPD e prote\u00e7\u00e3o de dados.\n\nPosso ajudar com:\n- D\u00favidas sobre a LGPD\n- Direitos dos titulares\n- Obriga\u00e7\u00f5es das empresas\n- Bases legais\n- E muito mais!\n\nComo posso ajudar voc\u00ea hoje?"
      }]);
    }
  }, [isOpen, messages.length, showHistory]);

  // Inicializar Web Speech API (entrada de voz)
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "pt-BR";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  // Carregar quota do usuário
  const loadQuota = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/chat/quota");
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
        if (!data.canSendMessage) {
          setQuotaWarning("Limite de mensagens atingido. Tente novamente amanhã.");
        } else if (data.daily.messages >= data.daily.maxMessages - 5) {
          setQuotaWarning(`Restam ${data.daily.maxMessages - data.daily.messages} mensagens hoje.`);
        } else {
          setQuotaWarning(null);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar quota:", error);
    }
  }, [session]);

  useEffect(() => {
    if (isOpen && session?.user) {
      loadQuota();
    }
  }, [isOpen, session, loadQuota]);

  // Text-to-Speech (saída de voz)
  const speakMessage = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Seu navegador não suporta síntese de voz.");
      return;
    }

    // Cancelar fala anterior
    window.speechSynthesis.cancel();

    // Limpar markdown e formatação
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/ℹ️/g, "")
      .replace(/🔍/g, "")
      .replace(/•/g, "")
      .replace(/\n/g, " ");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "pt-BR";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Upload de arquivo
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Tipo de arquivo não permitido. Use PDF, Word, Excel ou TXT.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    setUploadingFile(true);
    try {
      // Solicitar URL de upload
      const presignRes = await fetch("/api/chat/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          conversationId,
        }),
      });

      if (!presignRes.ok) {
        const error = await presignRes.json();
        alert(error.error || "Erro ao preparar upload.");
        return;
      }

      const { uploadUrl, fileId } = await presignRes.json();

      // Fazer upload direto para S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Falha no upload");
      }

      // Processar arquivo (extrair texto)
      await fetch("/api/chat/analyze-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });

      setPendingFile({ id: fileId, name: file.name });
      loadQuota(); // Atualizar quota
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao enviar arquivo. Tente novamente.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removePendingFile = () => {
    setPendingFile(null);
  };

  // Carregar histórico de conversas
  const loadConversations = async () => {
    if (!session?.user) return;
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Carregar conversa específica
  const loadConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setConversationId(convId);
        setMode(data.mode || "simple");
        setMessages(data.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          feedback: m.feedback?.rating || null
        })));
        setShowHistory(false);
      }
    } catch (error) {
      console.error("Erro ao carregar conversa:", error);
    }
  };

  // Enviar feedback
  const sendFeedback = async (messageId: string, rating: "like" | "dislike") => {
    if (!messageId) return;
    
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating })
      });
      
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, feedback: rating } : m
      ));
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
    }
  };

  // Toggle gravação de voz
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Seu navegador n\u00e3o suporta reconhecimento de voz.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // Enviar mensagem
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Verificar quota
    if (quota && !quota.canSendMessage) {
      setQuotaWarning("Limite de mensagens atingido. Tente novamente amanhã.");
      return;
    }

    const userMessage = input.trim();
    const fileToSend = pendingFile;
    setInput("");
    setPendingFile(null);
    
    // Adicionar mensagem do usuário com indicador de arquivo
    setMessages(prev => [...prev, { 
      role: "user", 
      content: userMessage,
      hasAttachment: !!fileToSend,
      fileName: fileToSend?.name
    }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const pageContext = getPageContext();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage, 
          history, 
          mode,
          pageContext,
          conversationId,
          fileId: fileToSend?.id
        })
      });

      if (!response.ok) throw new Error("Erro na resposta");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let currentMessageId: string | null = null;

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            
            try {
              const parsed = JSON.parse(data);
              
              // Processar eventos especiais
              if (parsed.type === "init" && parsed.conversationId) {
                setConversationId(parsed.conversationId);
              } else if (parsed.type === "messageId" && parsed.messageId) {
                currentMessageId = parsed.messageId;
                // Atualizar ID da mensagem
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated.length > 0) {
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      id: parsed.messageId
                    };
                  }
                  return updated;
                });
              } else if (parsed.content) {
                assistantMessage += parsed.content;
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated.length > 0) {
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: assistantMessage
                    };
                  }
                  return updated;
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      
      // Verificar se é erro de quota
      if (error.message?.includes("quota") || error.message?.includes("Limite")) {
        setQuotaWarning("Limite de mensagens atingido. Tente novamente amanhã.");
      }
      
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente."
      }]);
    } finally {
      setIsLoading(false);
      loadQuota(); // Atualizar quota após envio
    }
  };

  // Limpar conversa
  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
    setShowHistory(false);
  };

  // Nova conversa
  const newChat = () => {
    clearChat();
    setMessages([{
      role: "assistant",
      content: "Olá! \ud83d\udd0d Sou o **Detetive da Privacidade**, seu assistente especializado em LGPD e prote\u00e7\u00e3o de dados.\n\nPosso ajudar com:\n- D\u00favidas sobre a LGPD\n- Direitos dos titulares\n- Obriga\u00e7\u00f5es das empresas\n- Bases legais\n- E muito mais!\n\nComo posso ajudar voc\u00ea hoje?"
    }]);
  };

  // Formatar conteúdo Markdown básico
  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
      .replace(/- /g, '\u2022 ');
  };

  return (
    <>
      {/* Bot\u00e3o flutuante arrast\u00e1vel com imagem */}
      {!isOpen && mounted && (
        <button
          ref={buttonRef}
          onClick={() => !hasMoved && setIsOpen(true)}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={cn(
            "fixed z-[9999] w-16 h-16 rounded-full shadow-lg overflow-hidden border-2 border-blue-500 bg-white select-none",
            isDragging ? "cursor-grabbing scale-110 shadow-xl" : "cursor-grab hover:scale-105 hover:shadow-xl transition-all duration-200"
          )}
          style={{ 
            left: `${position.x}px`, 
            top: `${position.y}px`,
            touchAction: "none"
          }}
          aria-label="Abrir Detetive da Privacidade (arraste para mover)"
        >
          <div className="relative w-full h-full">
            <Image
              src="/images/chatbot/icon.png"
              alt="Detetive da Privacidade"
              fill
              className="object-cover pointer-events-none"
              draggable={false}
            />
          </div>
        </button>
      )}

      {/* Janela do chatbot */}
      {isOpen && mounted && (
        <div
          className={cn(
            "fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300",
            isMinimized
              ? "w-72 h-14"
              : "w-[95vw] sm:w-[420px] h-[75vh] sm:h-[600px] max-h-[85vh]"
          )}
          style={{ 
            bottom: '24px', 
            right: '24px'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white">
                <Image
                  src="/images/chatbot/icon.png"
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Detetive da Privacidade</h3>
                <p className="text-xs text-blue-100">
                  {mode === "technical" ? "Modo T\u00e9cnico" : "Modo Simples"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Bot\u00e3o Hist\u00f3rico (s\u00f3 se logado) */}
              {session?.user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/20"
                  onClick={() => {
                    setShowHistory(!showHistory);
                    if (!showHistory) loadConversations();
                  }}
                  title="Hist\u00f3rico de conversas"
                >
                  <History className="h-4 w-4" />
                </Button>
              )}
              {/* Bot\u00e3o Modo */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={() => setMode(mode === "simple" ? "technical" : "simple")}
                title={mode === "simple" ? "Mudar para modo t\u00e9cnico" : "Mudar para modo simples"}
              >
                <GraduationCap className="h-4 w-4" />
              </Button>
              {/* Bot\u00e3o Nova Conversa */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={newChat}
                title="Nova conversa"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {/* Bot\u00e3o Minimizar */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              {/* Bot\u00e3o Fechar */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Conte\u00fado */}
          {!isMinimized && (
            <>
              {/* Hist\u00f3rico de Conversas */}
              {showHistory ? (
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHistory(false)}
                      className="p-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                      Hist\u00f3rico de Conversas
                    </h4>
                  </div>
                  
                  {loadingHistory ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : conversations.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Nenhuma conversa salva
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => loadConversation(conv.id)}
                          className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
                        >
                          <p className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
                            {conv.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {conv._count.messages} mensagens \u2022 {new Date(conv.updatedAt).toLocaleDateString("pt-BR")}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* \u00c1rea de Mensagens */
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex gap-2",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-blue-100 flex-shrink-0">
                          <Image
                            src="/images/chatbot/icon.png"
                            alt="Bot"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex flex-col max-w-[80%]">
                        <div
                          className={cn(
                            "rounded-lg px-4 py-2 text-sm",
                            msg.role === "user"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          )}
                          dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                        />
                        {/* Indicador de arquivo anexado */}
                        {msg.hasAttachment && msg.fileName && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <FileText className="h-3 w-3" />
                            <span>{msg.fileName}</span>
                          </div>
                        )}
                        {/* Botões de Feedback e Áudio (apenas para mensagens do assistente) */}
                        {msg.role === "assistant" && msg.content && (
                          <div className="flex items-center gap-1 mt-1">
                            {/* Botão de áudio */}
                            <button
                              onClick={() => isSpeaking ? stopSpeaking() : speakMessage(msg.content)}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              title={isSpeaking ? "Parar áudio" : "Ouvir resposta"}
                            >
                              {isSpeaking ? (
                                <VolumeX className="h-3.5 w-3.5 text-blue-600" />
                              ) : (
                                <Volume2 className="h-3.5 w-3.5 text-gray-400" />
                              )}
                            </button>
                            {msg.id && (
                              <>
                                <button
                                  onClick={() => sendFeedback(msg.id!, "like")}
                                  className={cn(
                                    "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors",
                                    msg.feedback === "like" && "bg-green-100 dark:bg-green-900"
                                  )}
                                  title="Útil"
                                >
                                  <ThumbsUp className={cn(
                                    "h-3.5 w-3.5",
                                    msg.feedback === "like" ? "text-green-600" : "text-gray-400"
                                  )} />
                                </button>
                                <button
                                  onClick={() => sendFeedback(msg.id!, "dislike")}
                                  className={cn(
                                    "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors",
                                    msg.feedback === "dislike" && "bg-red-100 dark:bg-red-900"
                                  )}
                                  title="Não foi útil"
                                >
                                  <ThumbsDown className={cn(
                                    "h-3.5 w-3.5",
                                    msg.feedback === "dislike" ? "text-red-600" : "text-gray-400"
                                  )} />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-blue-100 flex-shrink-0">
                        <Image
                          src="/images/chatbot/icon.png"
                          alt="Bot"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Input */}
              {!showHistory && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Aviso de quota */}
                  {quotaWarning && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-300">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {quotaWarning}
                    </div>
                  )}
                  
                  {/* Arquivo pendente */}
                  {pendingFile && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-blue-700 dark:text-blue-300 flex-1 truncate">
                        {pendingFile.name}
                      </span>
                      <button
                        onClick={removePendingFile}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {/* Input de arquivo oculto */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {/* Botão de Upload */}
                    {session?.user && (
                      <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                          "flex-shrink-0",
                          uploadingFile && "animate-pulse"
                        )}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile || isLoading}
                        title="Anexar arquivo (PDF, Word, Excel, TXT)"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {/* Botão de Microfone */}
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "flex-shrink-0",
                        isRecording && "bg-red-100 border-red-500 text-red-600"
                      )}
                      onClick={toggleRecording}
                      title={isRecording ? "Parar gravação" : "Falar"}
                    >
                      {isRecording ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder={isRecording ? "Ouvindo..." : pendingFile ? "Pergunte sobre o arquivo..." : "Digite sua dúvida..."}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      disabled={isLoading || isRecording || (quota ? !quota.canSendMessage : false)}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading || (quota ? !quota.canSendMessage : false)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Contexto: {getPageContext()}
                    {quota && session?.user && (
                      <span className="ml-2">
                        • {quota.daily.maxMessages - quota.daily.messages} msgs restantes
                      </span>
                    )}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
