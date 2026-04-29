
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Document {
  id: string;
  title: string;
  type: string;
  content: string;
  version: string;
  status: string;
  language: string;
}

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingDocument: Document | null;
}

const documentTypes = [
  { value: "privacy_policy", label: "Política de Privacidade" },
  { value: "terms_of_use", label: "Termos de Uso" },
  { value: "cookie_notice", label: "Aviso de Cookies" },
  { value: "data_processing_agreement", label: "Contrato de Processamento de Dados" },
  { value: "consent_form", label: "Formulário de Consentimento" },
  { value: "data_subject_rights", label: "Direitos dos Titulares" },
  { value: "security_policy", label: "Política de Segurança" },
  { value: "retention_policy", label: "Política de Retenção" },
  { value: "other", label: "Outro" },
];

export default function DocumentFormModal({
  isOpen,
  onClose,
  onSave,
  editingDocument,
}: DocumentFormModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    type: "privacy_policy",
    content: "",
    version: "1.0",
    status: "Draft",
    language: "pt-BR",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingDocument) {
      setFormData({
        title: editingDocument.title,
        type: editingDocument.type,
        content: editingDocument.content,
        version: editingDocument.version,
        status: editingDocument.status,
        language: editingDocument.language,
      });
    } else {
      setFormData({
        title: "",
        type: "privacy_policy",
        content: "",
        version: "1.0",
        status: "Draft",
        language: "pt-BR",
      });
    }
  }, [editingDocument, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingDocument
        ? `/api/documents/${editingDocument.id}`
        : "/api/documents";
      const method = editingDocument ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingDocument
            ? "Documento atualizado com sucesso!"
            : "Documento criado com sucesso!"
        );
        onSave();
      } else {
        toast.error("Erro ao salvar documento");
      }
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
      toast.error("Erro ao salvar documento");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {editingDocument ? "Editar Documento" : "Novo Documento"}
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do documento
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="title">Título do Documento *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Política de Privacidade 2025"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo de Documento *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="version">Versão *</Label>
                  <Input
                    id="version"
                    name="version"
                    value={formData.version}
                    onChange={handleChange}
                    required
                    placeholder="1.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Revisão">Revisão</SelectItem>
                      <SelectItem value="Publicado">Publicado</SelectItem>
                      <SelectItem value="Arquivado">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">Idioma *</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Conteúdo do Documento *</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  rows={15}
                  placeholder="Digite ou cole o conteúdo do documento aqui..."
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
