
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, FileText, Trash2, Edit, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Image from "next/image";
import CategoryFormModal from "./category-form-modal";
import ContentListModal from "./content-list-modal";

interface ContentCategory {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  order: number;
  _count?: {
    contentItems: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CategoryWithSignedUrl extends ContentCategory {
  signedImageUrl?: string | null;
}

export default function ConteudosDidaticosContent() {
  const { data: session } = useSession() || {};
  const [categories, setCategories] = useState<CategoryWithSignedUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ContentCategory | null>(null);
  const [showContentListModal, setShowContentListModal] = useState(false);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/content-categories");
      if (response.ok) {
        const data: ContentCategory[] = await response.json();
        
        // Gerar URLs assinadas para as imagens
        const categoriesWithSignedUrls = await Promise.all(
          data.map(async (category) => {
            if (category.imageUrl) {
              try {
                const urlResponse = await fetch(`/api/documents/signed-url?key=${encodeURIComponent(category.imageUrl)}`);
                if (urlResponse.ok) {
                  const { url } = await urlResponse.json();
                  return { ...category, signedImageUrl: url };
                }
              } catch (error) {
                console.error("Erro ao gerar URL assinada:", error);
              }
            }
            return { ...category, signedImageUrl: null };
          })
        );
        
        setCategories(categoriesWithSignedUrls);
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta categoria? Todos os conteúdos associados também serão removidos.")) {
      return;
    }

    try {
      const response = await fetch(`/api/content-categories/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Categoria deletada com sucesso!");
        fetchCategories();
      } else {
        toast.error("Erro ao deletar categoria");
      }
    } catch (error) {
      console.error("Erro ao deletar categoria:", error);
      toast.error("Erro ao deletar categoria");
    }
  };

  const handleOpenCategory = (category: ContentCategory) => {
    setSelectedCategory(category);
    setShowContentListModal(true);
  };

  const handleEditCategory = (category: ContentCategory) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleCloseModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const handleCloseContentListModal = () => {
    setShowContentListModal(false);
    setSelectedCategory(null);
    fetchCategories();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando conteúdos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📚 Conteúdos Didáticos
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Material educativo e recursos para auxiliar na conformidade com a LGPD
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCategoryModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        )}
      </div>

      {/* Lista de Categorias */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma categoria criada
            </h3>
            <p className="text-gray-500 mb-4 text-center">
              {isAdmin
                ? "Comece criando uma categoria para organizar seus conteúdos didáticos"
                : "Aguarde o administrador criar as categorias de conteúdo"}
            </p>
            {isAdmin && (
              <Button onClick={() => setShowCategoryModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Categoria
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleOpenCategory(category)}
            >
              <CardHeader className="pb-3">
                {category.signedImageUrl && (
                  <div className="relative w-full aspect-video mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={category.signedImageUrl}
                      alt={category.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{category.name}</span>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2" />
                </CardTitle>
                {category.description && (
                  <CardDescription className="line-clamp-2">
                    {category.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{category._count?.contentItems || 0} conteúdos</span>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategory(category);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modais */}
      {showCategoryModal && (
        <CategoryFormModal
          category={editingCategory}
          onClose={handleCloseModal}
        />
      )}

      {showContentListModal && selectedCategory && (
        <ContentListModal
          category={selectedCategory}
          onClose={handleCloseContentListModal}
        />
      )}
    </div>
  );
}
