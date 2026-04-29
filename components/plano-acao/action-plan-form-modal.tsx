
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
}

interface ActionPlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingPlan: ActionPlan | null;
}

export default function ActionPlanFormModal({
  isOpen,
  onClose,
  onSave,
  editingPlan,
}: ActionPlanFormModalProps) {
  const [formData, setFormData] = useState({
    action: "",
    description: "",
    objective: "",
    responsibleArea: "",
    responsible: "",
    startDate: "",
    endDate: "",
    priority: "Média",
    status: "Não Iniciado",
    progress: 0,
    resources: "",
    budget: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingPlan) {
      setFormData({
        action: editingPlan.action,
        description: editingPlan.description,
        objective: editingPlan.objective,
        responsibleArea: editingPlan.responsibleArea,
        responsible: editingPlan.responsible,
        startDate: editingPlan.startDate.split("T")[0],
        endDate: editingPlan.endDate.split("T")[0],
        priority: editingPlan.priority,
        status: editingPlan.status,
        progress: editingPlan.progress,
        resources: editingPlan.resources || "",
        budget: editingPlan.budget?.toString() || "",
      });
    } else {
      setFormData({
        action: "",
        description: "",
        objective: "",
        responsibleArea: "",
        responsible: "",
        startDate: "",
        endDate: "",
        priority: "Média",
        status: "Não Iniciado",
        progress: 0,
        resources: "",
        budget: "",
      });
    }
  }, [editingPlan, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingPlan
        ? `/api/action-plans/${editingPlan.id}`
        : "/api/action-plans";
      const method = editingPlan ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingPlan
            ? "Plano de ação atualizado com sucesso!"
            : "Plano de ação criado com sucesso!"
        );
        onSave();
      } else {
        toast.error("Erro ao salvar plano de ação");
      }
    } catch (error) {
      console.error("Erro ao salvar plano de ação:", error);
      toast.error("Erro ao salvar plano de ação");
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPlan ? "Editar Plano de Ação" : "Novo Plano de Ação"}
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do plano de ação
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="action">Ação *</Label>
              <Input
                id="action"
                name="action"
                value={formData.action}
                onChange={handleChange}
                required
                placeholder="Nome da ação"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Descreva a ação"
              />
            </div>

            <div>
              <Label htmlFor="objective">Objetivo *</Label>
              <Textarea
                id="objective"
                name="objective"
                value={formData.objective}
                onChange={handleChange}
                required
                rows={2}
                placeholder="Objetivo da ação"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="responsibleArea">Área Responsável *</Label>
                <Input
                  id="responsibleArea"
                  name="responsibleArea"
                  value={formData.responsibleArea}
                  onChange={handleChange}
                  required
                  placeholder="Ex: TI, Compliance, etc"
                />
              </div>

              <div>
                <Label htmlFor="responsible">Responsável *</Label>
                <Input
                  id="responsible"
                  name="responsible"
                  value={formData.responsible}
                  onChange={handleChange}
                  required
                  placeholder="Nome do responsável"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endDate">Data de Término *</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="priority">Prioridade *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                    <SelectItem value="Não Iniciado">Não Iniciado</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="progress">Progresso (%) *</Label>
                <Input
                  id="progress"
                  name="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="resources">Recursos Necessários</Label>
              <Textarea
                id="resources"
                name="resources"
                value={formData.resources}
                onChange={handleChange}
                rows={2}
                placeholder="Recursos humanos, materiais, tecnológicos, etc"
              />
            </div>

            <div>
              <Label htmlFor="budget">Orçamento (R$)</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                step="0.01"
                min="0"
                value={formData.budget}
                onChange={handleChange}
                placeholder="0.00"
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
      </DialogContent>
    </Dialog>
  );
}
