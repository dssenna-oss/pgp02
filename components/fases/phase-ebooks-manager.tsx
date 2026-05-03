
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  BookOpen, 
  Edit2, 
  Trash2, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  X, 
  Loader2,
  Lock 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface Ebook {
  id: string;
  title: string;
  embedUrl: string;
  order: number;
}

interface PhaseEbooksManagerProps {
  phase: string;
}

export default function PhaseEbooksManager({ phase }: PhaseEbooksManagerProps) {
  const { data: session } = useSession() || {};
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEbook, setEditingEbook] = useState<Ebook | null>(null);
  const [formData, setFormData] = useState({ title: "", embedUrl: "" });
  
  // Verifica se o usuário é administrador
  const isAdmin = session?.user?.email === "clubedoservidor@protonmail.com";

  useEffect(() => {
    loadEbooks();
  }, [phase]);

  const loadEbooks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/phase-ebooks?phase=${phase}`);
      if (response.ok) {
        const data = await response.json();
        setEbooks(data);
      }
    } catch (error) {
      console.error("Erro ao carregar e-books:", error);
      toast.error("Erro ao carregar e-books");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (ebook?: Ebook) => {
    if (ebook) {
      setEditingEbook(ebook);
      setFormData({ title: ebook.title, embedUrl: ebook.embedUrl });
    } else {
      setEditingEbook(null);
      setFormData({ title: "", embedUrl: "" });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingEbook(null);
    setFormData({ title: "", embedUrl: "" });
  };

  const handleSaveEbook = async () => {
    if (!formData.title.trim() || !formData.embedUrl.trim()) {
      toast.error("Título e URL são obrigatórios");
      return;
    }

    try {
      setSaving(true);

      if (editingEbook) {
        // Atualizar e-book existente
        const response = await fetch(`/api/phase-ebooks/${editingEbook.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          toast.success("E-book atualizado com sucesso!");
          handleCloseDialog();
          loadEbooks();
        } else {
          const error = await response.json();
          toast.error(error.error || "Erro ao atualizar e-book");
        }
      } else {
        // Criar novo e-book
        const response = await fetch("/api/phase-ebooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phase,
            ...formData,
          }),
        });

        if (response.ok) {
          const newEbook = await response.json();
          toast.success("E-book adicionado no final da lista!");
          handleCloseDialog();
          // Recarregar lista para garantir ordenação correta
          await loadEbooks();
        } else {
          const error = await response.json();
          toast.error(error.error || "Erro ao criar e-book");
        }
      }
    } catch (error) {
      console.error("Erro ao salvar e-book:", error);
      toast.error("Erro ao salvar e-book");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEbook = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este e-book?")) {
      return;
    }

    try {
      const response = await fetch(`/api/phase-ebooks/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("E-book excluído com sucesso!");
        loadEbooks();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao excluir e-book");
      }
    } catch (error) {
      console.error("Erro ao excluir e-book:", error);
      toast.error("Erro ao excluir e-book");
    }
  };

  const handleMoveEbook = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === ebooks.length - 1)
    ) {
      return;
    }

    const newEbooks = [...ebooks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Trocar posições
    [newEbooks[index], newEbooks[targetIndex]] = [
      newEbooks[targetIndex],
      newEbooks[index],
    ];

    // Atualizar ordem baseado na nova posição
    const updatedEbooks = newEbooks.map((ebook, idx) => ({
      id: ebook.id,
      order: idx,
    }));

    try {
      const response = await fetch("/api/phase-ebooks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ebooks: updatedEbooks }),
      });

      if (response.ok) {
        // Recarregar a lista do banco de dados para garantir consistência
        await loadEbooks();
        toast.success("Ordem atualizada!");
      } else {
        toast.error("Erro ao reordenar e-books");
      }
    } catch (error) {
      console.error("Erro ao reordenar e-books:", error);
      toast.error("Erro ao reordenar e-books");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <CardTitle>E-books Interativos</CardTitle>
          </div>
          {isAdmin && (
            <Button onClick={() => handleOpenDialog()} size="sm" className="self-start sm:self-auto">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar E-book
            </Button>
          )}
          {!isAdmin && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lock className="h-4 w-4" />
              <span>Somente Administrador</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {ebooks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum e-book cadastrado para esta fase.
            </p>
          ) : (
            <div className="space-y-4">
              {ebooks.map((ebook, index) => (
                <Card key={ebook.id} className="overflow-hidden">
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <h3 className="font-semibold text-gray-900 break-words min-w-0">
                        {ebook.title}
                      </h3>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveEbook(index, "up")}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveEbook(index, "down")}
                          disabled={index === ebooks.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(ebook)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEbook(ebook.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                      <iframe
                        src={ebook.embedUrl}
                        className="absolute top-0 left-0 w-full h-full"
                        allowFullScreen
                        title={ebook.title}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar/editar e-book */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEbook ? "Editar E-book" : "Adicionar E-book"}
            </DialogTitle>
            <DialogDescription>
              Insira o título e a URL de embed do e-book interativo (Heyzine,
              etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título do E-book</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ex: Guia de Implementação LGPD"
              />
            </div>
            <div>
              <Label htmlFor="embedUrl">URL de Embed</Label>
              <Input
                id="embedUrl"
                value={formData.embedUrl}
                onChange={(e) =>
                  setFormData({ ...formData, embedUrl: e.target.value })
                }
                placeholder="https://heyzine.com/flip-book/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Cole a URL completa do embed do e-book
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveEbook} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
