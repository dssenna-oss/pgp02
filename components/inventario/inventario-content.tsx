
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Plus, Search, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
// @ts-ignore
import * as XLSX from "xlsx";
import InventarioFormModal from "./inventario-form-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InventarioContentProps {
  session?: any;
}

export default function InventarioContent({ session }: InventarioContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [inventarios, setInventarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInventario, setSelectedInventario] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadInventarios();
  }, []);

  const loadInventarios = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/inventario");
      if (!response.ok) throw new Error("Erro ao carregar inventários");
      const data = await response.json();
      setInventarios(data);
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao carregar inventários");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/inventario/${deleteId}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Erro ao excluir inventário");

      toast.success("Inventário excluído com sucesso!");
      loadInventarios();
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao excluir inventário");
    } finally {
      setDeleteId(null);
    }
  };

  const exportToExcel = () => {
    if (inventarios.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    // Preparar dados para exportação
    const dataToExport = filteredInventarios.map((item) => ({
      "Processo/Serviço": item.serviceName,
      "Categoria de Dados": item.dataCategory,
      "Dados Pessoais": item.personalData,
      "Base Legal": item.legalBasis,
      "Finalidade": item.purpose,
      "Titulares": item.dataSubjects,
      "Retenção": item.retention,
      "Armazenamento": item.storage,
      "Compartilhamento": item.sharing || "Não há",
      "Medidas de Segurança": item.security,
      "Data de Criação": new Date(item.createdAt).toLocaleDateString("pt-BR")
    }));

    // Criar planilha
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventário de Dados");

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 30 }, // Processo/Serviço
      { wch: 25 }, // Categoria
      { wch: 40 }, // Dados Pessoais
      { wch: 25 }, // Base Legal
      { wch: 40 }, // Finalidade
      { wch: 25 }, // Titulares
      { wch: 30 }, // Retenção
      { wch: 25 }, // Armazenamento
      { wch: 35 }, // Compartilhamento
      { wch: 40 }, // Segurança
      { wch: 15 }  // Data
    ];
    ws['!cols'] = colWidths;

    // Baixar arquivo
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `inventario-dados-pessoais-${timestamp}.xlsx`);
    
    toast.success("Arquivo Excel exportado com sucesso!");
  };

  const filteredInventarios = inventarios.filter((item) => {
    const search = searchTerm.toLowerCase();
    return (
      item.serviceName?.toLowerCase().includes(search) ||
      item.dataCategory?.toLowerCase().includes(search) ||
      item.personalData?.toLowerCase().includes(search) ||
      item.legalBasis?.toLowerCase().includes(search) ||
      item.purpose?.toLowerCase().includes(search)
    );
  });

  // Calcular estatísticas
  const stats = {
    total: inventarios.length,
    categories: new Set(inventarios.map(i => i.dataCategory)).size,
    purposes: new Set(inventarios.map(i => i.purpose)).size,
    legalBases: new Set(inventarios.map(i => i.legalBasis)).size
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Inventário de Dados Pessoais
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Mapeamento completo dos dados pessoais tratados pela organização
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setSelectedInventario(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Inventário
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar no inventário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total de Registros
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Categorias
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.categories}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Finalidades
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.purposes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Bases Legais
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.legalBases}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventário Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tratamentos de Dados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Carregando inventários...
              </p>
            </div>
          ) : filteredInventarios.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm
                  ? "Nenhum registro encontrado para a busca."
                  : "Nenhum inventário cadastrado. Clique em 'Novo Inventário' para começar."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInventarios.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {item.serviceName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {item.personalData}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{item.dataCategory}</Badge>
                          <Badge variant="secondary">{item.legalBasis}</Badge>
                        </div>
                      </div>
                      <div className="min-w-[200px]">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Finalidade
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {item.purpose}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedInventario(item);
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      <InventarioFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedInventario(null);
        }}
        onSuccess={loadInventarios}
        inventario={selectedInventario}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este inventário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
