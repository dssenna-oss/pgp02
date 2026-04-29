"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CheckCircle, AlertCircle, XCircle, Plus, Download, Edit, Trash2 } from "lucide-react";
import GapAnalysisModal from "./gap-analysis-modal";
import { toast } from "react-hot-toast";
import * as XLSX from 'xlsx';

interface GapAnalysisContentProps {
  session?: any;
}

export default function GapAnalysisContent({ session }: GapAnalysisContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [gapAnalyses, setGapAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGapAnalyses();
  }, []);

  const fetchGapAnalyses = async () => {
    try {
      const response = await fetch('/api/gap-analyses');
      if (response.ok) {
        const data = await response.json();
        setGapAnalyses(data);
      }
    } catch (error) {
      console.error('Erro ao buscar análises GAP:', error);
      toast.error('Erro ao carregar análises GAP');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      const url = editData
        ? `/api/gap-analyses/${editData.id}`
        : '/api/gap-analyses';
      
      const method = editData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast.success(editData ? 'Análise atualizada com sucesso!' : 'Análise criada com sucesso!');
        setIsModalOpen(false);
        setEditData(null);
        fetchGapAnalyses();
      } else {
        toast.error('Erro ao salvar análise');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar análise');
    }
  };

  const handleEdit = (item: any) => {
    setEditData(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta análise GAP?')) return;

    try {
      const response = await fetch(`/api/gap-analyses/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Análise excluída com sucesso!');
        fetchGapAnalyses();
      } else {
        toast.error('Erro ao excluir análise');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir análise');
    }
  };

  const exportToExcel = () => {
    if (gapAnalyses.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    const exportData = gapAnalyses.map((item) => ({
      'Requisito': item.requirement,
      'Status Atual': item.currentStatus,
      'Evidências': item.evidence || '',
      'Lacuna': item.gap || '',
      'Recomendação': item.recommendation || '',
      'Prioridade': item.priority,
      'Área Responsável': item.responsibleArea,
      'Prazo': item.deadline ? new Date(item.deadline).toLocaleDateString('pt-BR') : '',
      'Criado em': new Date(item.createdAt).toLocaleDateString('pt-BR')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'GAP Analysis');

    // Auto-ajustar largura das colunas
    const colWidths = [
      { wch: 35 }, // Requisito
      { wch: 20 }, // Status Atual
      { wch: 40 }, // Evidências
      { wch: 40 }, // Lacuna
      { wch: 40 }, // Recomendação
      { wch: 15 }, // Prioridade
      { wch: 20 }, // Área Responsável
      { wch: 15 }, // Prazo
      { wch: 15 }  // Criado em
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `GAP_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Arquivo exportado com sucesso!');
  };

  // Calcular estatísticas
  const stats = {
    total: gapAnalyses.length,
    implementado: gapAnalyses.filter(g => g.currentStatus === 'Implementado').length,
    parcial: gapAnalyses.filter(g => g.currentStatus === 'Parcialmente Implementado').length,
    naoImplementado: gapAnalyses.filter(g => g.currentStatus === 'Não Implementado').length,
    alta: gapAnalyses.filter(g => g.priority === 'Alta').length
  };

  const conformidadePercentual = stats.total > 0 
    ? Math.round(((stats.implementado + stats.parcial * 0.5) / stats.total) * 100)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Implementado':
        return 'bg-green-100 text-green-900 border-green-300';
      case 'Parcialmente Implementado':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300';
      case 'Não Implementado':
        return 'bg-red-100 text-red-900 border-red-300';
      default:
        return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'destructive';
      case 'Média':
        return 'secondary';
      case 'Baixa':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            GAP Analysis - LGPD
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Análise de lacunas em conformidade com os requisitos da LGPD
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} disabled={gapAnalyses.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={() => {
            setEditData(null);
            setIsModalOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Análise
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Progresso Geral de Conformidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Conformidade LGPD</span>
              <span className="text-sm text-gray-600">{conformidadePercentual}%</span>
            </div>
            <Progress value={conformidadePercentual} className="h-2" />
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Implementado</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.implementado}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Parcial</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{stats.parcial}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Não Implementado</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{stats.naoImplementado}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Análises GAP */}
      <Card>
        <CardHeader>
          <CardTitle>Análises GAP Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando...</p>
            </div>
          ) : gapAnalyses.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Nenhuma análise GAP cadastrada.</p>
              <p className="text-sm text-gray-500 mt-2">
                Clique em "Nova Análise" para começar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {gapAnalyses.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {item.requirement}
                        </h3>
                        <Badge className={getStatusColor(item.currentStatus)}>
                          {item.currentStatus}
                        </Badge>
                        <Badge variant={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Área Responsável:</span>
                          <p className="font-medium">{item.responsibleArea}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Prazo:</span>
                          <p className="font-medium">
                            {item.deadline ? new Date(item.deadline).toLocaleDateString('pt-BR') : 'Não definido'}
                          </p>
                        </div>
                      </div>

                      {(item.evidence || item.gap || item.recommendation) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <details className="text-sm">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                              Ver detalhes completos
                            </summary>
                            <div className="mt-3 space-y-2 pl-4">
                              {item.evidence && (
                                <div>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">Evidências:</span>
                                  <p className="text-gray-600 dark:text-gray-400">{item.evidence}</p>
                                </div>
                              )}
                              {item.gap && (
                                <div>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">Lacuna:</span>
                                  <p className="text-gray-600 dark:text-gray-400">{item.gap}</p>
                                </div>
                              )}
                              {item.recommendation && (
                                <div>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">Recomendação:</span>
                                  <p className="text-gray-600 dark:text-gray-400">{item.recommendation}</p>
                                </div>
                              )}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <GapAnalysisModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditData(null);
        }}
        onSave={handleSave}
        editData={editData}
      />
    </div>
  );
}