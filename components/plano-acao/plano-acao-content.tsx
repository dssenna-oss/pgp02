
"use client";

import { useState, useEffect } from "react";
import { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileSpreadsheet, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import ActionPlanFormModal from "./action-plan-form-modal";

interface ActionPlan {
  id: string;
  action: string;
  description: string;
  objective: string;
  responsibleArea: string;
  responsible: string;
  startDate: string;
  endDate: string;
  priority: string;
  status: string;
  progress: number;
  resources?: string | null;
  budget?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface PlanoAcaoContentProps {
  session: Session;
}

export default function PlanoAcaoContent({ session }: PlanoAcaoContentProps) {
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ActionPlan | null>(null);

  const fetchActionPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/action-plans");
      if (response.ok) {
        const data = await response.json();
        setActionPlans(data);
      } else {
        toast.error("Erro ao carregar planos de ação");
      }
    } catch (error) {
      console.error("Erro ao buscar planos de ação:", error);
      toast.error("Erro ao carregar planos de ação");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActionPlans();
  }, []);

  const handleAdd = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleEdit = (plan: ActionPlan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano de ação?")) {
      return;
    }

    try {
      const response = await fetch(`/api/action-plans/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Plano de ação excluído com sucesso!");
        fetchActionPlans();
      } else {
        toast.error("Erro ao excluir plano de ação");
      }
    } catch (error) {
      console.error("Erro ao excluir plano de ação:", error);
      toast.error("Erro ao excluir plano de ação");
    }
  };

  const handleSave = () => {
    setIsModalOpen(false);
    fetchActionPlans();
  };

  const exportToExcel = () => {
    if (actionPlans.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    const dataForExport = actionPlans.map((plan) => ({
      "Ação": plan.action,
      "Descrição": plan.description,
      "Objetivo": plan.objective,
      "Área Responsável": plan.responsibleArea,
      "Responsável": plan.responsible,
      "Data Início": new Date(plan.startDate).toLocaleDateString("pt-BR"),
      "Data Fim": new Date(plan.endDate).toLocaleDateString("pt-BR"),
      "Prioridade": plan.priority,
      "Status": plan.status,
      "Progresso (%)": plan.progress,
      "Recursos": plan.resources || "",
      "Orçamento (R$)": plan.budget ? plan.budget.toFixed(2) : "",
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plano de Ação");

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 30 }, // Ação
      { wch: 40 }, // Descrição
      { wch: 30 }, // Objetivo
      { wch: 20 }, // Área Responsável
      { wch: 20 }, // Responsável
      { wch: 12 }, // Data Início
      { wch: 12 }, // Data Fim
      { wch: 12 }, // Prioridade
      { wch: 15 }, // Status
      { wch: 12 }, // Progresso
      { wch: 30 }, // Recursos
      { wch: 15 }, // Orçamento
    ];
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `Plano_de_Acao_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.xlsx`);
    toast.success("Arquivo Excel exportado com sucesso!");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "text-red-600 bg-red-50";
      case "Média":
        return "text-yellow-600 bg-yellow-50";
      case "Baixa":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Concluído":
        return "text-green-600 bg-green-50";
      case "Em Andamento":
        return "text-blue-600 bg-blue-50";
      case "Atrasado":
        return "text-red-600 bg-red-50";
      case "Não Iniciado":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Plano de Ação</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as ações do programa de governança em privacidade
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportToExcel} variant="outline">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Ação
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : actionPlans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground text-center mb-4">
              Nenhum plano de ação cadastrado ainda.
            </p>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeira Ação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {actionPlans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{plan.action}</CardTitle>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
                          plan.priority
                        )}`}
                      >
                        {plan.priority}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          plan.status
                        )}`}
                      >
                        {plan.status}
                      </span>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(plan)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(plan.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Objetivo</p>
                    <p className="font-medium">{plan.objective}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Área Responsável</p>
                    <p className="font-medium">{plan.responsibleArea}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Responsável</p>
                    <p className="font-medium">{plan.responsible}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data Início</p>
                    <p className="font-medium">
                      {new Date(plan.startDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data Fim</p>
                    <p className="font-medium">
                      {new Date(plan.endDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Progresso</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${plan.progress}%` }}
                        />
                      </div>
                      <span className="font-medium">{plan.progress}%</span>
                    </div>
                  </div>
                  {plan.budget && (
                    <div>
                      <p className="text-muted-foreground">Orçamento</p>
                      <p className="font-medium">
                        R$ {plan.budget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  {plan.resources && (
                    <div className="col-span-2 md:col-span-3">
                      <p className="text-muted-foreground">Recursos</p>
                      <p className="font-medium">{plan.resources}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ActionPlanFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingPlan={editingPlan}
      />
    </div>
  );
}
