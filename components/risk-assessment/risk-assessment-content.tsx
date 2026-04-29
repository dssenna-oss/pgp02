
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Download, Edit, Trash2, TrendingUp } from "lucide-react";
import RiskAssessmentModal from "./risk-assessment-modal";
import { toast } from "react-hot-toast";
import * as XLSX from 'xlsx';

interface RiskAssessmentContentProps {
  session?: any;
}

export default function RiskAssessmentContent({ session }: RiskAssessmentContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [riskAssessments, setRiskAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiskAssessments();
  }, []);

  const fetchRiskAssessments = async () => {
    try {
      const response = await fetch('/api/risk-assessments');
      if (response.ok) {
        const data = await response.json();
        setRiskAssessments(data);
      }
    } catch (error) {
      console.error('Erro ao buscar análises de risco:', error);
      toast.error('Erro ao carregar análises de risco');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      const url = editData
        ? `/api/risk-assessments/${editData.id}`
        : '/api/risk-assessments';
      
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
        fetchRiskAssessments();
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
    if (!confirm('Deseja realmente excluir esta análise de risco?')) return;

    try {
      const response = await fetch(`/api/risk-assessments/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Análise excluída com sucesso!');
        fetchRiskAssessments();
      } else {
        toast.error('Erro ao excluir análise');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir análise');
    }
  };

  const exportToExcel = () => {
    if (riskAssessments.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    const exportData = riskAssessments.map((item) => ({
      'Processo': item.processName,
      'Descrição do Risco': item.riskDescription,
      'Probabilidade': item.likelihood,
      'Impacto': item.impact,
      'Nível de Risco': item.riskLevel,
      'Controles Existentes': item.controls,
      'Recomendações': item.recommendations,
      'Área Responsável': item.responsibleArea,
      'Prazo': item.deadline ? new Date(item.deadline).toLocaleDateString('pt-BR') : '',
      'Status': item.status,
      'Criado em': new Date(item.createdAt).toLocaleDateString('pt-BR')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Análise de Riscos');

    // Auto-ajustar largura das colunas
    const colWidths = [
      { wch: 25 }, // Processo
      { wch: 40 }, // Descrição do Risco
      { wch: 15 }, // Probabilidade
      { wch: 15 }, // Impacto
      { wch: 15 }, // Nível de Risco
      { wch: 40 }, // Controles
      { wch: 40 }, // Recomendações
      { wch: 20 }, // Área Responsável
      { wch: 15 }, // Prazo
      { wch: 15 }, // Status
      { wch: 15 }  // Criado em
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `Analise_Riscos_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Arquivo exportado com sucesso!');
  };

  // Calcular estatísticas
  const stats = {
    total: riskAssessments.length,
    critico: riskAssessments.filter(r => r.riskLevel === 'Crítico').length,
    alto: riskAssessments.filter(r => r.riskLevel === 'Alto').length,
    medio: riskAssessments.filter(r => r.riskLevel === 'Médio').length,
    baixo: riskAssessments.filter(r => r.riskLevel === 'Baixo').length,
    pendentes: riskAssessments.filter(r => r.status === 'Pendente').length
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Crítico':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'Alto':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'Médio':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300';
      case 'Baixo':
        return 'bg-green-100 text-green-900 border-green-300';
      default:
        return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Análise de Riscos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Identifique e gerencie riscos relacionados ao tratamento de dados pessoais
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} disabled={riskAssessments.length === 0}>
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

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Riscos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="h-8 w-8 mx-auto mb-2 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 font-bold">!</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Críticos</p>
              <p className="text-3xl font-bold text-red-600">{stats.critico}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="h-8 w-8 mx-auto mb-2 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-orange-600 font-bold">!</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Altos</p>
              <p className="text-3xl font-bold text-orange-600">{stats.alto}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="h-8 w-8 mx-auto mb-2 rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-yellow-600 font-bold">!</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Médios</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.medio}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
              <p className="text-3xl font-bold text-purple-600">{stats.pendentes}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Análises de Risco */}
      <Card>
        <CardHeader>
          <CardTitle>Análises de Risco Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando...</p>
            </div>
          ) : riskAssessments.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Nenhuma análise de risco cadastrada.</p>
              <p className="text-sm text-gray-500 mt-2">
                Clique em "Nova Análise" para começar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {riskAssessments.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {item.processName}
                        </h3>
                        <Badge className={getRiskLevelColor(item.riskLevel)}>
                          {item.riskLevel}
                        </Badge>
                        <Badge variant="outline">
                          {item.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        {item.riskDescription}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Probabilidade:</span>
                          <p className="font-medium">{item.likelihood}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Impacto:</span>
                          <p className="font-medium">{item.impact}</p>
                        </div>
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

                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                            Ver detalhes completos
                          </summary>
                          <div className="mt-3 space-y-2 pl-4">
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Controles Existentes:</span>
                              <p className="text-gray-600 dark:text-gray-400">{item.controls}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Recomendações:</span>
                              <p className="text-gray-600 dark:text-gray-400">{item.recommendations}</p>
                            </div>
                          </div>
                        </details>
                      </div>
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
      <RiskAssessmentModal
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
