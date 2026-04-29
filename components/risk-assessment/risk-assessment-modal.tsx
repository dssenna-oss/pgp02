
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RiskAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
}

export default function RiskAssessmentModal({
  isOpen,
  onClose,
  onSave,
  editData
}: RiskAssessmentModalProps) {
  const [formData, setFormData] = useState({
    processName: "",
    riskDescription: "",
    likelihood: "Médio",
    impact: "Médio",
    riskLevel: "Médio",
    controls: "",
    recommendations: "",
    responsibleArea: "",
    deadline: "",
    status: "Pendente"
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        processName: editData.processName || "",
        riskDescription: editData.riskDescription || "",
        likelihood: editData.likelihood || "Médio",
        impact: editData.impact || "Médio",
        riskLevel: editData.riskLevel || "Médio",
        controls: editData.controls || "",
        recommendations: editData.recommendations || "",
        responsibleArea: editData.responsibleArea || "",
        deadline: editData.deadline ? new Date(editData.deadline).toISOString().split('T')[0] : "",
        status: editData.status || "Pendente"
      });
    } else {
      setFormData({
        processName: "",
        riskDescription: "",
        likelihood: "Médio",
        impact: "Médio",
        riskLevel: "Médio",
        controls: "",
        recommendations: "",
        responsibleArea: "",
        deadline: "",
        status: "Pendente"
      });
    }
  }, [editData, isOpen]);

  // Calcular nível de risco automaticamente
  useEffect(() => {
    const calculateRiskLevel = () => {
      const likelihoodValue = formData.likelihood === "Alto" ? 3 : formData.likelihood === "Médio" ? 2 : 1;
      const impactValue = formData.impact === "Alto" ? 3 : formData.impact === "Médio" ? 2 : 1;
      const riskValue = likelihoodValue * impactValue;

      if (riskValue >= 6) return "Crítico";
      if (riskValue >= 4) return "Alto";
      if (riskValue >= 2) return "Médio";
      return "Baixo";
    };

    setFormData(prev => ({
      ...prev,
      riskLevel: calculateRiskLevel()
    }));
  }, [formData.likelihood, formData.impact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editData ? "Editar Análise de Risco" : "Nova Análise de Risco"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="processName">Nome do Processo *</Label>
              <Input
                id="processName"
                value={formData.processName}
                onChange={(e) => setFormData({ ...formData, processName: e.target.value })}
                required
                placeholder="Ex: Processamento de pagamentos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibleArea">Área Responsável *</Label>
              <Input
                id="responsibleArea"
                value={formData.responsibleArea}
                onChange={(e) => setFormData({ ...formData, responsibleArea: e.target.value })}
                required
                placeholder="Ex: TI, Financeiro, RH"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="riskDescription">Descrição do Risco *</Label>
            <Textarea
              id="riskDescription"
              value={formData.riskDescription}
              onChange={(e) => setFormData({ ...formData, riskDescription: e.target.value })}
              required
              rows={3}
              placeholder="Descreva o risco identificado"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="likelihood">Probabilidade *</Label>
              <Select
                value={formData.likelihood}
                onValueChange={(value) => setFormData({ ...formData, likelihood: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixo">Baixo</SelectItem>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="impact">Impacto *</Label>
              <Select
                value={formData.impact}
                onValueChange={(value) => setFormData({ ...formData, impact: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixo">Baixo</SelectItem>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nível de Risco (Calculado)</Label>
              <div className={`px-3 py-2 rounded-md text-center font-medium ${
                formData.riskLevel === "Crítico" ? "bg-red-100 text-red-900" :
                formData.riskLevel === "Alto" ? "bg-orange-100 text-orange-900" :
                formData.riskLevel === "Médio" ? "bg-yellow-100 text-yellow-900" :
                "bg-green-100 text-green-900"
              }`}>
                {formData.riskLevel}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="controls">Controles Existentes *</Label>
            <Textarea
              id="controls"
              value={formData.controls}
              onChange={(e) => setFormData({ ...formData, controls: e.target.value })}
              required
              rows={3}
              placeholder="Descreva os controles já implementados"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommendations">Recomendações *</Label>
            <Textarea
              id="recommendations"
              value={formData.recommendations}
              onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
              required
              rows={3}
              placeholder="Recomendações para mitigação do risco"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {editData ? "Atualizar" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
