
"use client";

import { useState, useEffect } from "react";
import { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, FileSpreadsheet, Pencil, Trash2, Eye, BookOpen, Save, Trash } from "lucide-react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import RipdFormModal from "./ripd-form-modal";
import RipdViewModal from "./ripd-view-modal";
import RipdChecklist from "./ripd-checklist";

interface RIPD {
  id: string;
  processName: string;
  processDescription: string;
  dataTypes: string;
  dataSubjects: string;
  purpose: string;
  legalBasis: string;
  necessityAssessment: string;
  proportionalityAssessment: string;
  riskIdentification: string;
  riskMitigation: string;
  safeguards: string;
  consultationDetails?: string | null;
  monitoring: string;
  createdAt: string;
  updatedAt: string;
}

interface RipdContentProps {
  session: Session;
}

export default function RipdContent({ session }: RipdContentProps) {
  const [ripds, setRipds] = useState<RIPD[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingRipd, setEditingRipd] = useState<RIPD | null>(null);
  const [viewingRipd, setViewingRipd] = useState<RIPD | null>(null);
  
  // Estados para o ebook
  const [ebookUrl, setEbookUrl] = useState("");
  const [savedEbookUrl, setSavedEbookUrl] = useState("");
  const [isEditingEbook, setIsEditingEbook] = useState(false);
  const [savingEbook, setSavingEbook] = useState(false);
  
  // Verificar se o usuário é admin
  const isAdmin = session?.user?.role === "admin";

  const fetchRipds = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ripds");
      if (response.ok) {
        const data = await response.json();
        setRipds(data);
      } else {
        toast.error("Erro ao carregar RIPDs");
      }
    } catch (error) {
      console.error("Erro ao buscar RIPDs:", error);
      toast.error("Erro ao carregar RIPDs");
    } finally {
      setLoading(false);
    }
  };

  const fetchEbookUrl = async () => {
    try {
      const response = await fetch("/api/ripd-ebook");
      if (response.ok) {
        const data = await response.json();
        if (data.ripdEbookUrl) {
          setSavedEbookUrl(data.ripdEbookUrl);
          setEbookUrl(data.ripdEbookUrl);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar URL do ebook:", error);
    }
  };

  const handleSaveEbook = async () => {
    if (!ebookUrl.trim()) {
      toast.error("Por favor, insira a URL do ebook");
      return;
    }

    try {
      setSavingEbook(true);
      const response = await fetch("/api/ripd-ebook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ripdEbookUrl: ebookUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setSavedEbookUrl(data.ripdEbookUrl);
        setIsEditingEbook(false);
        toast.success("Ebook salvo com sucesso!");
      } else {
        toast.error("Erro ao salvar ebook");
      }
    } catch (error) {
      console.error("Erro ao salvar ebook:", error);
      toast.error("Erro ao salvar ebook");
    } finally {
      setSavingEbook(false);
    }
  };

  const handleRemoveEbook = async () => {
    if (!confirm("Tem certeza que deseja remover o ebook?")) {
      return;
    }

    try {
      const response = await fetch("/api/ripd-ebook", {
        method: "DELETE",
      });

      if (response.ok) {
        setSavedEbookUrl("");
        setEbookUrl("");
        setIsEditingEbook(false);
        toast.success("Ebook removido com sucesso!");
      } else {
        toast.error("Erro ao remover ebook");
      }
    } catch (error) {
      console.error("Erro ao remover ebook:", error);
      toast.error("Erro ao remover ebook");
    }
  };

  useEffect(() => {
    fetchRipds();
    fetchEbookUrl();
  }, []);

  const handleAdd = () => {
    setEditingRipd(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (ripd: RIPD) => {
    setEditingRipd(ripd);
    setIsFormModalOpen(true);
  };

  const handleView = (ripd: RIPD) => {
    setViewingRipd(ripd);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este RIPD?")) {
      return;
    }

    try {
      const response = await fetch(`/api/ripds/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("RIPD excluído com sucesso!");
        fetchRipds();
      } else {
        toast.error("Erro ao excluir RIPD");
      }
    } catch (error) {
      console.error("Erro ao excluir RIPD:", error);
      toast.error("Erro ao excluir RIPD");
    }
  };

  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchRipds();
  };

  const exportToExcel = () => {
    if (ripds.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    const dataForExport = ripds.map((ripd) => ({
      "Processo": ripd.processName,
      "Descrição do Processo": ripd.processDescription,
      "Tipos de Dados": ripd.dataTypes,
      "Titulares": ripd.dataSubjects,
      "Finalidade": ripd.purpose,
      "Base Legal": ripd.legalBasis,
      "Avaliação de Necessidade": ripd.necessityAssessment,
      "Avaliação de Proporcionalidade": ripd.proportionalityAssessment,
      "Identificação de Riscos": ripd.riskIdentification,
      "Medidas de Mitigação": ripd.riskMitigation,
      "Salvaguardas": ripd.safeguards,
      "Consulta aos Titulares": ripd.consultationDetails || "",
      "Monitoramento": ripd.monitoring,
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RIPD");

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 25 }, // Processo
      { wch: 40 }, // Descrição
      { wch: 30 }, // Tipos de Dados
      { wch: 25 }, // Titulares
      { wch: 30 }, // Finalidade
      { wch: 25 }, // Base Legal
      { wch: 40 }, // Avaliação de Necessidade
      { wch: 40 }, // Avaliação de Proporcionalidade
      { wch: 40 }, // Identificação de Riscos
      { wch: 40 }, // Medidas de Mitigação
      { wch: 40 }, // Salvaguardas
      { wch: 30 }, // Consulta aos Titulares
      { wch: 30 }, // Monitoramento
    ];
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `RIPD_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.xlsx`);
    toast.success("Arquivo Excel exportado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">RIPD</h1>
          <p className="text-muted-foreground mt-2">
            Relatório de Impacto à Proteção de Dados
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportToExcel} variant="outline">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Card do Ebook Heyzine */}
      {/* Mostra o card se existe um ebook salvo OU se o usuário é admin */}
      {(savedEbookUrl || isAdmin) && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle>E-book Heyzine - Material de Apoio</CardTitle>
              </div>
              {isAdmin && savedEbookUrl && !isEditingEbook && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingEbook(true)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar URL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveEbook}
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                </div>
              )}
            </div>
            <CardDescription>
              {isAdmin 
                ? "Adicione a URL do seu ebook Heyzine para visualização como material de apoio"
                : "Material de apoio para criação de RIPD"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAdmin && (!savedEbookUrl || isEditingEbook) ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ebook-url">URL do Ebook Heyzine</Label>
                  <div className="flex gap-2">
                    <Input
                      id="ebook-url"
                      type="url"
                      placeholder="https://heyzine.com/flip-book/..."
                      value={ebookUrl}
                      onChange={(e) => setEbookUrl(e.target.value)}
                    />
                    <Button
                      onClick={handleSaveEbook}
                      disabled={savingEbook}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {savingEbook ? "Salvando..." : "Salvar"}
                    </Button>
                    {isEditingEbook && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingEbook(false);
                          setEbookUrl(savedEbookUrl);
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cole aqui a URL completa do seu ebook publicado no Heyzine. O ebook será exibido
                  como um flipbook interativo para todos os usuários.
                </p>
              </div>
            ) : savedEbookUrl ? (
              <div className="space-y-4">
                <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-muted">
                  <iframe
                    src={savedEbookUrl}
                    className="w-full h-full"
                    style={{ border: "none" }}
                    allowFullScreen
                    title="E-book Heyzine"
                  />
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Checklist de Construção do RIPD */}
      <RipdChecklist />

      {/* Botão de Novo RIPD */}
      <div className="flex justify-end">
        <Button onClick={handleAdd} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Novo RIPD
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : ripds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground text-center mb-4">
              Nenhum RIPD cadastrado ainda.
            </p>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro RIPD
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {ripds.map((ripd) => (
            <Card key={ripd.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{ripd.processName}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {ripd.processDescription}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(ripd)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(ripd)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(ripd.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tipos de Dados</p>
                    <p className="font-medium line-clamp-2">{ripd.dataTypes}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Base Legal</p>
                    <p className="font-medium">{ripd.legalBasis}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Última atualização</p>
                    <p className="font-medium">
                      {new Date(ripd.updatedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RipdFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSave}
        editingRipd={editingRipd}
      />

      <RipdViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        ripd={viewingRipd}
      />
    </div>
  );
}
