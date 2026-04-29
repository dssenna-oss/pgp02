
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, FileText, FileSpreadsheet, File, Link as LinkIcon, Video, BookOpen, Eye, Download, Edit, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import ContentFormModal from "./content-form-modal";
import ContentViewerModal from "./content-viewer-modal";

interface ContentCategory {
  id: string;
  name: string;
  description: string | null;
}

interface ContentItem {
  id: string;
  categoryId: string;
  title: string;
  description: string | null;
  type: string;
  order: number;
  embedUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  cloud_storage_path: string | null;
}

interface ContentListModalProps {
  category: ContentCategory;
  onClose: () => void;
}

export default function ContentListModal({ category, onClose }: ContentListModalProps) {
  const { data: session } = useSession() || {};
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContentForm, setShowContentForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [viewingItem, setViewingItem] = useState<ContentItem | null>(null);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    fetchItems();
  }, [category.id]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/content-items?categoryId=${category.id}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      toast.error("Erro ao carregar conteúdos");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este conteúdo?")) {
      return;
    }

    try {
      const response = await fetch(`/api/content-items/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Conteúdo deletado com sucesso!");
        fetchItems();
      } else {
        toast.error("Erro ao deletar conteúdo");
      }
    } catch (error) {
      console.error("Erro ao deletar conteúdo:", error);
      toast.error("Erro ao deletar conteúdo");
    }
  };

  const handleViewItem = (item: ContentItem) => {
    setViewingItem(item);
    setShowViewer(true);
  };

  const handleEditItem = (item: ContentItem) => {
    setEditingItem(item);
    setShowContentForm(true);
  };

  const handleDownloadItem = async (item: ContentItem) => {
    try {
      const response = await fetch(`/api/content-items/download/${item.id}`);
      if (response.ok) {
        const data = await response.json();
        const link = document.createElement("a");
        link.href = data.url;
        link.target = "_blank";
        link.click();
      } else {
        toast.error("Erro ao baixar arquivo");
      }
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error);
      toast.error("Erro ao baixar arquivo");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ebook":
        return <BookOpen className="h-5 w-5" />;
      case "word":
        return <FileText className="h-5 w-5" />;
      case "pdf":
        return <File className="h-5 w-5" />;
      case "excel":
        return <FileSpreadsheet className="h-5 w-5" />;
      case "url":
        return <LinkIcon className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ebook: "E-book Heyzine",
      word: "Documento Word",
      pdf: "Documento PDF",
      excel: "Planilha Excel",
      url: "URL Externa",
      video: "Vídeo",
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleCloseContentForm = () => {
    setShowContentForm(false);
    setEditingItem(null);
    fetchItems();
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setViewingItem(null);
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando conteúdos...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={!showContentForm && !showViewer} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">{category.name}</DialogTitle>
                {category.description && (
                  <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                )}
              </div>
              {isAdmin && (
                <Button onClick={() => setShowContentForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Conteúdo
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhum conteúdo adicionado
                </h3>
                <p className="text-gray-500 mb-4">
                  {isAdmin
                    ? "Adicione conteúdos educativos para esta categoria"
                    : "Aguarde o administrador adicionar conteúdos"}
                </p>
                {isAdmin && (
                  <Button onClick={() => setShowContentForm(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Conteúdo
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg flex-shrink-0">
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {getTypeLabel(item.type)}
                          </span>
                          {item.fileName && (
                            <span className="truncate max-w-xs">{item.fileName}</span>
                          )}
                          {item.fileSize && (
                            <span>{formatFileSize(item.fileSize)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewItem(item)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {["word", "pdf", "excel"].includes(item.type) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadItem(item)}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItem(item)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Deletar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showContentForm && (
        <ContentFormModal
          categoryId={category.id}
          item={editingItem}
          onClose={handleCloseContentForm}
        />
      )}

      {showViewer && viewingItem && (
        <ContentViewerModal
          item={viewingItem}
          onClose={handleCloseViewer}
        />
      )}
    </>
  );
}
