
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, Download, Trash2, BookOpen, Loader2, Video, Link as LinkIcon, FileVideo, Eye, ArrowUpDown, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface PhaseDocument {
  id: string;
  title: string;
  description?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  mimeType?: string;
  downloadUrl?: string;
  viewUrl?: string;
  videoUrl?: string;
  isVideoUrl: boolean;
  createdAt: string;
}

type SortOption = "name-asc" | "name-desc" | "date-asc" | "date-desc" | "type-asc" | "type-desc";

interface PhaseDocumentsUploadProps {
  phase: string;
  /** Se true, não renderiza Card próprio (usado dentro de PhaseSection). */
  noCard?: boolean;
}

export default function PhaseDocumentsUpload({ phase, noCard = false }: PhaseDocumentsUploadProps) {
  const { data: session } = useSession() || {};
  const [documents, setDocuments] = useState<PhaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState<"file" | "video">("file");
  const [selectedDocument, setSelectedDocument] = useState<PhaseDocument | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  // CP19 Fatia 4 — UI: busca + filtro de tipo + view mode (cards/tabela).
  // Aplicado só no modo noCard (dentro de PhaseSection).
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  
  // Formulário de upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  
  // Verificar se o usuário é administrador
  const isAdmin = session?.user?.email === "clubedoservidor@protonmail.com";

  useEffect(() => {
    loadDocuments();
  }, [phase]);

  async function loadDocuments() {
    try {
      setLoading(true);
      const response = await fetch(`/api/phase-documents?phase=${phase}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
      toast.error("Erro ao carregar documentos");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    // Validação baseada no tipo de upload
    if (uploadType === "file" && selectedFiles.length === 0) {
      toast.error("Selecione pelo menos um arquivo");
      return;
    }
    
    if (uploadType === "video" && (!videoUrl || !title)) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setUploading(true);
      
      // Upload de vídeo (individual)
      if (uploadType === "video" && videoUrl) {
        const formData = new FormData();
        formData.append("videoUrl", videoUrl);
        formData.append("phase", phase);
        formData.append("title", title);
        formData.append("description", description);

        const response = await fetch("/api/phase-documents", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          toast.success("Vídeo adicionado com sucesso!");
          setShowUploadDialog(false);
          resetForm();
          loadDocuments();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || "Erro ao adicionar vídeo");
        }
        return;
      }
      
      // Upload de múltiplos arquivos
      if (uploadType === "file" && selectedFiles.length > 0) {
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileTitle = title || file.name.replace(/\.[^/.]+$/, ""); // Usa o nome do arquivo se título não for fornecido
          
          try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("phase", phase);
            formData.append("title", fileTitle + (selectedFiles.length > 1 ? ` (${i + 1}/${selectedFiles.length})` : ""));
            formData.append("description", description);

            const response = await fetch("/api/phase-documents", {
              method: "POST",
              body: formData,
            });

            if (response.ok) {
              successCount++;
              setUploadProgress(prev => ({...prev, [file.name]: 100}));
            } else {
              errorCount++;
              const errorData = await response.json();
              console.error(`Erro ao enviar ${file.name}:`, errorData.error);
            }
          } catch (error) {
            errorCount++;
            console.error(`Erro ao enviar ${file.name}:`, error);
          }
        }
        
        if (successCount > 0) {
          toast.success(`${successCount} arquivo(s) enviado(s) com sucesso!`);
        }
        if (errorCount > 0) {
          toast.error(`${errorCount} arquivo(s) falharam no upload`);
        }
        
        setShowUploadDialog(false);
        resetForm();
        loadDocuments();
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao fazer upload dos documentos");
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este documento?")) {
      return;
    }

    try {
      const response = await fetch(`/api/phase-documents/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Documento excluído com sucesso!");
        if (selectedDocument?.id === id) {
          setSelectedDocument(null);
        }
        loadDocuments();
      } else {
        throw new Error("Erro ao excluir");
      }
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
      toast.error("Erro ao excluir documento");
    }
  }

  function handleDownload(url: string, fileName: string) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function resetForm() {
    setSelectedFiles([]);
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setUploadType("file");
    setUploadProgress({});
  }
  
  function removeFile(fileName: string) {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName));
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  }

  /** Aplica busca textual + filtro de tipo (CP19 Fatia 4). */
  function getFilteredDocuments(): PhaseDocument[] {
    let result = documents;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.title?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.fileName?.toLowerCase().includes(q),
      );
    }
    if (typeFilter !== "all") {
      result = result.filter((d) => {
        const tn = getFileTypeName(d);
        return tn === typeFilter;
      });
    }
    return result;
  }

  function getSortedDocuments(): PhaseDocument[] {
    const sorted = noCard ? [...getFilteredDocuments()] : [...documents];

    switch (sortBy) {
      case "name-asc":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "name-desc":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case "date-asc":
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case "date-desc":
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "type-asc":
        return sorted.sort((a, b) => {
          const typeA = a.isVideoUrl ? "video" : (a.fileType || "");
          const typeB = b.isVideoUrl ? "video" : (b.fileType || "");
          return typeA.localeCompare(typeB);
        });
      case "type-desc":
        return sorted.sort((a, b) => {
          const typeA = a.isVideoUrl ? "video" : (a.fileType || "");
          const typeB = b.isVideoUrl ? "video" : (b.fileType || "");
          return typeB.localeCompare(typeA);
        });
      default:
        return sorted;
    }
  }

  function getFileIcon(doc: PhaseDocument) {
    if (doc.isVideoUrl) return "🎬";
    if (doc.mimeType?.startsWith("video/")) return "🎥";
    if (doc.mimeType === "application/pdf") return "📄";
    if (doc.mimeType?.includes("word") || doc.mimeType?.includes("document")) return "📝";
    if (doc.mimeType?.includes("spreadsheet") || doc.mimeType?.includes("excel") || doc.fileType === "xlsx" || doc.fileType === "xls") return "📊";
    return "📎";
  }

  function getFileTypeName(doc: PhaseDocument): string {
    if (doc.isVideoUrl) return "Vídeo Online";
    if (doc.mimeType?.startsWith("video/")) return "Vídeo";
    if (doc.mimeType === "application/pdf") return "PDF";
    if (doc.mimeType?.includes("word") || doc.mimeType?.includes("document")) return "Documento";
    if (doc.mimeType?.includes("spreadsheet") || doc.mimeType?.includes("excel") || doc.fileType === "xlsx" || doc.fileType === "xls") return "Excel";
    return doc.fileType?.toUpperCase() || "Arquivo";
  }

  // Quando dentro de PhaseSection, evita Card duplo (PhaseSection já fornece
  // o card externo com título). Renderizamos o conteúdo direto + ações inline.
  const Wrapper = noCard ? "div" : Card;
  const Header = noCard ? "div" : CardHeader;
  const Content = noCard ? "div" : CardContent;

  return (
    <>
      <Wrapper>
        {!noCard && (
          <Header>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span>Documentação da Fase</span>
                </CardTitle>
                <CardDescription>
                  E-books, textos, PDFs e vídeos relacionados a esta fase
                  {!isAdmin && (
                    <span className="block mt-1 text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      Apenas o administrador pode fazer upload de documentos
                    </span>
                  )}
                </CardDescription>
              </div>
              {isAdmin && (
                <Button onClick={() => setShowUploadDialog(true)} className="self-start sm:self-auto">
                  <Upload className="h-4 w-4 mr-2" />
                  Fazer Upload
                </Button>
              )}
            </div>
          </Header>
        )}
        {noCard && isAdmin && (
          <div className="flex justify-end mb-3">
            <Button onClick={() => setShowUploadDialog(true)} size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Fazer Upload
            </Button>
          </div>
        )}
        {noCard && !isAdmin && (
          <p className="mb-3 text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" />
            Apenas o administrador pode fazer upload de documentos
          </p>
        )}
        <Content>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">Carregando documentos...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
              <div className="text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Nenhum documento enviado ainda
                </p>
                {isAdmin && (
                  <Button onClick={() => setShowUploadDialog(true)} variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Primeiro Documento
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Barra de busca/filtro/ordenação (CP19 Fatia 4 — só noCard) */}
              {noCard ? (
                <div className="flex flex-col gap-2 mb-3">
                  {/* Linha 1: busca + filtro tipo + view toggle */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      type="search"
                      placeholder="🔍 Buscar documento..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 min-w-[180px] px-3 py-1.5 text-sm border dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="Documento">Word/Doc</SelectItem>
                        <SelectItem value="Excel">Excel</SelectItem>
                        <SelectItem value="Vídeo">Vídeo</SelectItem>
                        <SelectItem value="Vídeo Online">Vídeo URL</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-desc">Mais recentes</SelectItem>
                        <SelectItem value="date-asc">Mais antigos</SelectItem>
                        <SelectItem value="name-asc">Nome A-Z</SelectItem>
                        <SelectItem value="name-desc">Nome Z-A</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="inline-flex border dark:border-gray-700 rounded-md overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setViewMode("table")}
                        className={`px-2.5 py-1.5 text-xs ${
                          viewMode === "table"
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                        title="Visualização em tabela"
                      >
                        ☰
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("cards")}
                        className={`px-2.5 py-1.5 text-xs border-l dark:border-gray-700 ${
                          viewMode === "cards"
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                        title="Visualização em cards"
                      >
                        ▦
                      </button>
                    </div>
                  </div>
                  {/* Linha 2: contagem + clear filters */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {getFilteredDocuments().length} de {documents.length} documento(s)
                      {(searchQuery || typeFilter !== "all") && " (filtrado)"}
                    </span>
                    {(searchQuery || typeFilter !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setTypeFilter("all");
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Modo Card legado: mantém barra original */
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 flex-wrap min-w-0 w-full sm:w-auto">
                    <ArrowUpDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <Label htmlFor="sort" className="text-sm font-medium">Ordenar por:</Label>
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                      <SelectTrigger id="sort" className="w-full sm:w-[180px] max-w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-desc">Mais recentes</SelectItem>
                        <SelectItem value="date-asc">Mais antigos</SelectItem>
                        <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                        <SelectItem value="type-asc">Tipo (A-Z)</SelectItem>
                        <SelectItem value="type-desc">Tipo (Z-A)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {documents.length} {documents.length === 1 ? "documento" : "documentos"}
                  </span>
                </div>
              )}

              {/* Tabela compacta — só noCard em viewMode='table' (CP19 Fatia 4) */}
              {noCard && viewMode === "table" ? (
                getSortedDocuments().length === 0 ? (
                  <p className="text-sm italic text-gray-500 dark:text-gray-400 py-4 text-center">
                    Nenhum documento atende aos filtros.
                  </p>
                ) : (
                  <div className="border dark:border-gray-700 rounded-md overflow-hidden overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/40 text-xs text-gray-600 dark:text-gray-400">
                        <tr className="text-left">
                          <th className="px-3 py-2 font-medium">Documento</th>
                          <th className="px-3 py-2 font-medium hidden sm:table-cell">Tipo</th>
                          <th className="px-3 py-2 font-medium hidden md:table-cell">Tamanho</th>
                          <th className="px-3 py-2 font-medium hidden md:table-cell">Data</th>
                          <th className="px-3 py-2 font-medium text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-gray-700">
                        {getSortedDocuments().map((doc) => (
                          <tr
                            key={doc.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                          >
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => setSelectedDocument(doc)}
                                className="flex items-center gap-2 text-left text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                                title={doc.description ?? doc.title}
                              >
                                <span className="text-base shrink-0">{getFileIcon(doc)}</span>
                                <span className="truncate max-w-xs">{doc.title}</span>
                              </button>
                            </td>
                            <td className="px-3 py-2 hidden sm:table-cell">
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                                {getFileTypeName(doc)}
                              </span>
                            </td>
                            <td className="px-3 py-2 hidden md:table-cell text-gray-500 dark:text-gray-400">
                              {doc.fileSize ? formatFileSize(doc.fileSize) : "—"}
                            </td>
                            <td className="px-3 py-2 hidden md:table-cell text-gray-500 dark:text-gray-400">
                              {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDocument(doc)}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="Visualizar"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                {doc.downloadUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handleDownload(doc.downloadUrl!, doc.fileName || "document")}
                                    className="p-1 text-gray-400 hover:text-emerald-600"
                                    title="Baixar"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(doc.id)}
                                    className="p-1 text-gray-400 hover:text-red-600"
                                    title="Excluir"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
              /* View cards (legado + noCard com viewMode='cards') */
              <div className="space-y-2">
                {getSortedDocuments().map((doc) => (
                  <div
                    key={doc.id}
                    className={`flex flex-col gap-3 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer sm:flex-row sm:items-center sm:justify-between sm:gap-2 ${
                      selectedDocument?.id === doc.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                      <div className="text-2xl flex-shrink-0">{getFileIcon(doc)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white break-words">
                          {doc.title}
                        </p>
                        {doc.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 break-words line-clamp-2">
                            {doc.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-500 flex-wrap">
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                            {getFileTypeName(doc)}
                          </span>
                          {doc.fileSize && (
                            <span>• {formatFileSize(doc.fileSize)}</span>
                          )}
                          <span>• {new Date(doc.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto sm:ml-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant={selectedDocument?.id === doc.id ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDocument(doc);
                        }}
                        title="Visualizar documento"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {doc.downloadUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(doc.downloadUrl!, doc.fileName || "document");
                          }}
                          title="Baixar documento"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                          title="Excluir documento (apenas administrador)"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              )}
            </>
          )}

          {documents.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipos de arquivos suportados:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-6">
                <li>E-books (PDF, EPUB)</li>
                <li>Documentos de texto (DOC, DOCX, TXT)</li>
                <li>Planilhas Excel (XLSX, XLS)</li>
                <li>Arquivos PDF</li>
                <li>Vídeos (MP4, AVI, MOV)</li>
                <li>URLs de vídeo (YouTube, Vimeo)</li>
              </ul>
            </div>
          )}
        </Content>
      </Wrapper>

      {/* Visualização do documento selecionado */}
      {selectedDocument && (
        <DocumentPreview
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {/* Dialog de Upload */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Adicionar Documento ou Vídeo</DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo ou adicione um link de vídeo
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={uploadType} onValueChange={(value) => setUploadType(value as "file" | "video")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload de Arquivo
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                URL de Vídeo
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="file">
                  Arquivos <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="file"
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setSelectedFiles(files);
                  }}
                  accept=".pdf,.doc,.docx,.txt,.epub,.mp4,.avi,.mov,.xlsx,.xls"
                />
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {selectedFiles.length} arquivo(s) selecionado(s):
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                      {selectedFiles.map((file, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              ({formatFileSize(file.size)})
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(file.name)}
                            className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Formatos aceitos: PDF, DOC, DOCX, TXT, EPUB, MP4, AVI, MOV, XLSX, XLS
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  💡 Você pode selecionar múltiplos arquivos de uma vez
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title-file">
                  Título {selectedFiles.length > 1 && <span className="text-xs text-gray-500">(opcional - será usado o nome do arquivo)</span>}
                </Label>
                <Input
                  id="title-file"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={selectedFiles.length > 1 ? "Deixe em branco para usar o nome dos arquivos" : "Ex: Guia de Sensibilização LGPD"}
                />
                {selectedFiles.length > 1 && title && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    O título será numerado automaticamente: "{title} (1/{selectedFiles.length})", "{title} (2/{selectedFiles.length})", etc.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description-file">Descrição (opcional)</Label>
                <Textarea
                  id="description-file"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva brevemente o conteúdo do documento"
                  rows={3}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="video" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="video-url">
                  URL do Vídeo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="video-url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  type="url"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Plataformas suportadas: YouTube, Vimeo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title-video">
                  Título <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title-video"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Introdução à LGPD"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description-video">Descrição (opcional)</Label>
                <Textarea
                  id="description-video"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva brevemente o conteúdo do vídeo"
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                resetForm();
              }}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={
                uploading || 
                (uploadType === "file" && selectedFiles.length === 0) || 
                (uploadType === "video" && (!videoUrl || !title))
              }
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadType === "file" 
                    ? `Enviando ${selectedFiles.length} arquivo(s)...` 
                    : "Adicionando..."}
                </>
              ) : (
                <>
                  {uploadType === "file" ? (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Enviar {selectedFiles.length > 0 ? `${selectedFiles.length} Arquivo(s)` : "Arquivos"}
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Adicionar Vídeo
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Componente de Preview do Documento
function DocumentPreview({ document, onClose }: { document: PhaseDocument; onClose: () => void }) {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loadingView, setLoadingView] = useState(false);

  useEffect(() => {
    // Carregar URL de visualização para PDFs e vídeos
    if (document.viewUrl && (document.mimeType === "application/pdf" || document.mimeType?.startsWith("video/"))) {
      loadViewUrl();
    }
  }, [document.viewUrl, document.mimeType]);

  async function loadViewUrl() {
    if (!document.viewUrl) return;
    
    try {
      setLoadingView(true);
      const response = await fetch(document.viewUrl);
      if (response.ok) {
        const data = await response.json();
        setViewUrl(data.url);
      }
    } catch (error) {
      console.error("Erro ao obter URL de visualização:", error);
    } finally {
      setLoadingView(false);
    }
  }

  function extractVideoId(url: string): string | null {
    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) return youtubeMatch[1];
    
    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) return vimeoMatch[1];
    
    return null;
  }

  function getEmbedUrl(url: string): string {
    const videoId = extractVideoId(url);
    
    // YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Vimeo
    if (url.includes("vimeo.com")) {
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    return url;
  }

  return (
    <Card className="border-2 border-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Visualização: {document.title}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {document.description && (
          <CardDescription>{document.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {loadingView ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">Carregando visualização...</p>
          </div>
        ) : (
          <>
            {/* Vídeo do YouTube/Vimeo */}
            {document.isVideoUrl && document.videoUrl && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={getEmbedUrl(document.videoUrl)}
                  className="w-full h-full"
                  allowFullScreen
                  title={document.title}
                />
              </div>
            )}

            {/* PDF com visualização embutida */}
            {document.mimeType === "application/pdf" && viewUrl && (
              <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                <iframe
                  src={viewUrl}
                  className="w-full h-full"
                  title={document.title}
                />
              </div>
            )}

            {/* Vídeo MP4/MOV com visualização embutida */}
            {document.mimeType?.startsWith("video/") && viewUrl && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={viewUrl}
                  controls
                  className="w-full h-full"
                >
                  Seu navegador não suporta a reprodução de vídeo.
                </video>
              </div>
            )}

            {/* Documento sem visualização embutida */}
            {!document.isVideoUrl && !document.mimeType?.startsWith("video/") && document.mimeType !== "application/pdf" && (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Visualização não disponível para este tipo de arquivo
                </p>
                {document.downloadUrl && (
                  <Button
                    onClick={() => {
                      const link = window.document.createElement("a");
                      link.href = document.downloadUrl!;
                      link.target = "_blank";
                      link.download = document.fileName || "document";
                      window.document.body.appendChild(link);
                      link.click();
                      window.document.body.removeChild(link);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Arquivo
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

