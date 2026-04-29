
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GapAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
}

export default function GapAnalysisModal({
  isOpen,
  onClose,
  onSave,
  editData
}: GapAnalysisModalProps) {
  const [formData, setFormData] = useState({
    requirement: "",
    currentStatus: "Não Implementado",
    evidence: "",
    gap: "",
    recommendation: "",
    priority: "Média",
    responsibleArea: "",
    deadline: ""
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        requirement: editData.requirement || "",
        currentStatus: editData.currentStatus || "Não Implementado",
        evidence: editData.evidence || "",
        gap: editData.gap || "",
        recommendation: editData.recommendation || "",
        priority: editData.priority || "Média",
        responsibleArea: editData.responsibleArea || "",
        deadline: editData.deadline ? new Date(editData.deadline).toISOString().split('T')[0] : ""
      });
    } else {
      setFormData({
        requirement: "",
        currentStatus: "Não Implementado",
        evidence: "",
        gap: "",
        recommendation: "",
        priority: "Média",
        responsibleArea: "",
        deadline: ""
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Lista de requisitos comuns da LGPD
  const lgpdRequirements = [
    "Art. 6º - Princípios para tratamento de dados",
    "Art. 7º - Base legal para tratamento",
    "Art. 8º - Consentimento",
    "Art. 9º - Tratamento de dados sensíveis",
    "Art. 11 - Dados de crianças e adolescentes",
    "Art. 18 - Direitos dos titulares",
    "Art. 37 - Controlador e operador",
    "Art. 38 - Relatório de impacto (RIPD)",
    "Art. 41 - Encarregado (DPO)",
    "Art. 46 - Medidas de segurança",
    "Art. 48 - Comunicação de incidente",
    "Art. 50 - Responsabilidade e sanções"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editData ? "Editar Análise GAP" : "Nova Análise GAP"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="requirement">Requisito da LGPD *</Label>
            <Select
              value={formData.requirement}
              onValueChange={(value) => setFormData({ ...formData, requirement: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um requisito" />
              </SelectTrigger>
              <SelectContent>
                {lgpdRequirements.map((req) => (
                  <SelectItem key={req} value={req}>
                    {req}
                  </SelectItem>
                ))}
                <SelectItem value="Outro">Outro (especifique abaixo)</SelectItem>
              </SelectContent>
            </Select>
            {formData.requirement === "Outro" && (
              <Input
                placeholder="Especifique o requisito"
                value={formData.requirement}
                onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                className="mt-2"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentStatus">Status Atual *</Label>
              <Select
                value={formData.currentStatus}
                onValueChange={(value) => setFormData({ ...formData, currentStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Implementado">Implementado</SelectItem>
                  <SelectItem value="Parcialmente Implementado">Parcialmente Implementado</SelectItem>
                  <SelectItem value="Não Implementado">Não Implementado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence">Evidências</Label>
            <Textarea
              id="evidence"
              value={formData.evidence}
              onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
              rows={3}
              placeholder="Descreva as evidências de conformidade ou não conformidade"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gap">Lacuna Identificada</Label>
            <Textarea
              id="gap"
              value={formData.gap}
              onChange={(e) => setFormData({ ...formData, gap: e.target.value })}
              rows={3}
              placeholder="Descreva a lacuna ou problema identificado"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommendation">Recomendação</Label>
            <Textarea
              id="recommendation"
              value={formData.recommendation}
              onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
              rows={3}
              placeholder="Recomendações para implementação ou melhoria"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsibleArea">Área Responsável *</Label>
              <Input
                id="responsibleArea"
                value={formData.responsibleArea}
                onChange={(e) => setFormData({ ...formData, responsibleArea: e.target.value })}
                required
                placeholder="Ex: TI, Jurídico, Compliance"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
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
