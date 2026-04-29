
"use client";

import { useState, useEffect } from "react";
import { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Pencil, Trash2, Eye, Download } from "lucide-react";
import { toast } from "react-hot-toast";
import DocumentFormModal from "./document-form-modal";
import DocumentViewModal from "./document-view-modal";

interface Document {
  id: string;
  title: string;
  type: string;
  content: string;
  version: string;
  status: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentosContentProps {
  session: Session;
}

const documentTypes: { [key: string]: string } = {
  privacy_policy: "Política de Privacidade",
  terms_of_use: "Termos de Uso",
  cookie_notice: "Aviso de Cookies",
  data_processing_agreement: "Contrato de Processamento de Dados",
  consent_form: "Formulário de Consentimento",
  data_subject_rights: "Direitos dos Titulares",
  security_policy: "Política de Segurança",
  retention_policy: "Política de Retenção",
  other: "Outro",
};

export default function DocumentosContent({ session }: DocumentosContentProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        toast.error("Erro ao carregar documentos");
      }
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
      toast.error("Erro ao carregar documentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleAdd = () => {
    setEditingDocument(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setIsFormModalOpen(true);
  };

  const handleView = (document: Document) => {
    setViewingDocument(document);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Documento excluído com sucesso!");
        fetchDocuments();
      } else {
        toast.error("Erro ao excluir documento");
      }
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
      toast.error("Erro ao excluir documento");
    }
  };

  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchDocuments();
  };

  const downloadDocument = (document: Document) => {
    const blob = new Blob([document.content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document.title.replace(/\s+/g, "_")}_v${document.version}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Documento baixado com sucesso!");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Publicado":
        return "text-green-600 bg-green-50";
      case "Revisão":
        return "text-yellow-600 bg-yellow-50";
      case "Draft":
        return "text-gray-600 bg-gray-50";
      case "Arquivado":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie políticas, termos e documentos de privacidade
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Documento
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground text-center mb-4">
              Nenhum documento cadastrado ainda.
            </p>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Documento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg line-clamp-1">
                        {document.title}
                      </CardTitle>
                    </div>
                    <CardDescription>
                      {documentTypes[document.type] || document.type}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        document.status
                      )}`}
                    >
                      {document.status}
                    </span>
                    <span className="text-muted-foreground">
                      v{document.version}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Atualizado em{" "}
                    {new Date(document.updatedAt).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleView(document)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(document)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(document)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(document.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DocumentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSave}
        editingDocument={editingDocument}
      />

      <DocumentViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        document={viewingDocument}
      />
    </div>
  );
}
