"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Loader2, FileText } from "lucide-react";
import toast from "react-hot-toast";

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  order: number;
  embedUrl: string | null;
  fileName: string | null;
}

interface ContentFormModalProps {
  categoryId: string;
  item?: ContentItem | null;
  onClose: () => void;
}

export default function ContentFormModal({ categoryId, item, onClose }: ContentFormModalProps) {
  const [title, setTitle] = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [type, setType] = useState(item?.type || "ebook");
  const [order, setOrder] = useState(item?.order?.toString() || "0");
  const [embedUrl, setEmbedUrl] = useState(item?.embedUrl || "");
  const [file, setFile] = useState<File | null>(null);
  const [deleteFile, setDeleteFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const needsFile = ["word", "pdf", "excel"].includes(type);
  const needsUrl = ["ebook", "url", "video"].includes(type);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validação de tipo baseado no tipo selecionado
    const validExtensions: Record<string, string[]> = {
      word: [".doc", ".docx"],
      pdf: [".pdf"],
      excel: [".xls", ".xlsx"],
    };

    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf("."));
    const validExts = validExtensions[type] || [];
    
    if (validExts.length > 0 && !validExts.includes(fileExtension)) {
      toast.error(`Arquivo inválido. Use: ${validExts.join(", ")}`);
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Tamanho máximo: 50MB");
      return;
    }

    setFile(selectedFile);
    setDeleteFile(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setDeleteFile(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (needsFile && !item && !file) {
      toast.error("Arquivo é obrigatório para este tipo de conteúdo");
      return;
    }

    if (needsUrl && !embedUrl.trim()) {
      toast.error("URL é obrigatória para este tipo de conteúdo");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      if (!item) {
        formData.append("categoryId", categoryId);
      }
      formData.append("title", title);
      formData.append("description", description);
      formData.append("type", type);
      formData.append("order", order);
      
      if (needsUrl) {
        formData.append("embedUrl", embedUrl);
      }
      
      if (file) {
        formData.append("file", file);
      }
      
      if (deleteFile) {
        formData.append("deleteFile", "true");
      }

      const url = item
        ? `/api/content-items/${item.id}`
        : "/api/content-items";
      const method = item ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (response.ok) {
        toast.success(
          item ? "Conteúdo atualizado com sucesso!" : "Conteúdo criado com sucesso!"
        );
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao salvar conteúdo");
      }
    } catch (error) {
      console.error("Erro ao salvar conteúdo:", error);
      toast.error("Erro ao salvar conteúdo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? "Editar Conteúdo" : "Novo Conteúdo"}
          </DialogTitle>
          <DialogDescription>
            {item
              ? "Edite as informações do conteúdo"
              : "Adicione um novo conteúdo didático à categoria"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Tipo de Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Tipo de Conteúdo <span className="text-red-500">*</span>
            </Label>
            <Select value={type} onValueChange={setType} disabled={!!item}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ebook">E-book Heyzine</SelectItem>
                <SelectItem value="word">Documento Word</SelectItem>
                <SelectItem value="pdf">Documento PDF</SelectItem>
                <SelectItem value="excel">Planilha Excel</SelectItem>
                <SelectItem value="url">URL Externa</SelectItem>
                <SelectItem value="video">Vídeo (YouTube/Vimeo)</SelectItem>
              </SelectContent>
            </Select>
            {item && (
              <p className="text-xs text-gray-500">
                O tipo não pode ser alterado após criação
              </p>
            )}
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do conteúdo"
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do conteúdo..."
              rows={3}
            />
          </div>

          {/* URL (para ebook, url, video) */}
          {needsUrl && (
            <div className="space-y-2">
              <Label htmlFor="embedUrl">
                {type === "ebook" && "URL de Embed do Heyzine"}
                {type === "url" && "URL da Página"}
                {type === "video" && "URL do Vídeo"}
                <span className="text-red-500"> *</span>
              </Label>
              <Input
                id="embedUrl"
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
                placeholder={
                  type === "ebook"
                    ? "https://heyzine.com/flip-book/..."
                    : type === "url"
                    ? "https://..."
                    : "https://youtube.com/watch?v=... ou https://vimeo.com/..."
                }
                required={needsUrl}
              />
              {type === "video" && (
                <p className="text-xs text-gray-500">
                  Suporta YouTube, Vimeo e outras plataformas de vídeo
                </p>
              )}
            </div>
          )}

          {/* Arquivo (para word, pdf, excel) */}
          {needsFile && (
            <div className="space-y-2">
              <Label>
                Arquivo {!item && <span className="text-red-500">*</span>}
              </Label>
              <div className="space-y-3">
                {/* Preview do arquivo atual */}
                {item?.fileName && !file && !deleteFile && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.fileName}</p>
                      <p className="text-xs text-gray-500">Arquivo atual</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Preview do novo arquivo */}
                {file && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Upload Button */}
                {(!item?.fileName || deleteFile) && !file && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
                  >
                    <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Clique para selecionar um arquivo
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {type === "word" && "Formatos: DOC, DOCX - Máx. 50MB"}
                      {type === "pdf" && "Formato: PDF - Máx. 50MB"}
                      {type === "excel" && "Formatos: XLS, XLSX - Máx. 50MB"}
                    </p>
                  </div>
                )}

                {/* Botão para selecionar novo arquivo se já existe um */}
                {item?.fileName && !deleteFile && !file && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Substituir Arquivo
                  </Button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={
                    type === "word"
                      ? ".doc,.docx"
                      : type === "pdf"
                      ? ".pdf"
                      : ".xls,.xlsx"
                  }
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Ordem */}
          <div className="space-y-2">
            <Label htmlFor="order">Ordem de Exibição</Label>
            <Input
              id="order"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-gray-500">
              Conteúdos com ordem menor aparecem primeiro
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>{item ? "Atualizar" : "Criar"} Conteúdo</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
