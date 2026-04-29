
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

interface Incident {
  id: string;
  title: string;
  description: string;
  incidentType: string;
  severity: string;
  affectedData: string;
  affectedSubjects?: number | null;
  cause?: string | null;
  detectionDate: string;
  reportDate: string;
  containmentActions?: string | null;
  correctiveActions?: string | null;
  preventiveActions?: string | null;
  status: string;
  reportedToAnpd: boolean;
  anpdReportDate?: string | null;
}

interface IncidentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingIncident: Incident | null;
}

export default function IncidentFormModal({
  isOpen,
  onClose,
  onSave,
  editingIncident,
}: IncidentFormModalProps) {
  const initialFormData = {
    title: "",
    description: "",
    incidentType: "Vazamento de Dados",
    severity: "Média",
    affectedData: "",
    affectedSubjects: "",
    cause: "",
    detectionDate: "",
    reportDate: "",
    containmentActions: "",
    correctiveActions: "",
    preventiveActions: "",
    status: "Aberto",
    reportedToAnpd: false,
    anpdReportDate: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [originalData, setOriginalData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  // Verifica se há mudanças não salvas
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);

  // Hook para gerenciar mudanças não salvas
  const {
    showConfirmDialog,
    handleClose,
    confirmClose,
    cancelClose
  } = useUnsavedChanges({
    hasUnsavedChanges,
    onConfirmClose: onClose
  });

  useEffect(() => {
    if (editingIncident) {
      const data = {
        title: editingIncident.title,
        description: editingIncident.description,
        incidentType: editingIncident.incidentType,
        severity: editingIncident.severity,
        affectedData: editingIncident.affectedData,
        affectedSubjects: editingIncident.affectedSubjects?.toString() || "",
        cause: editingIncident.cause || "",
        detectionDate: editingIncident.detectionDate.split("T")[0],
        reportDate: editingIncident.reportDate.split("T")[0],
        containmentActions: editingIncident.containmentActions || "",
        correctiveActions: editingIncident.correctiveActions || "",
        preventiveActions: editingIncident.preventiveActions || "",
        status: editingIncident.status,
        reportedToAnpd: editingIncident.reportedToAnpd,
        anpdReportDate: editingIncident.anpdReportDate
          ? editingIncident.anpdReportDate.split("T")[0]
          : "",
      };
      setFormData(data);
      setOriginalData(data);
    } else {
      const today = new Date().toISOString().split("T")[0];
      const data = {
        title: "",
        description: "",
        incidentType: "Vazamento de Dados",
        severity: "Média",
        affectedData: "",
        affectedSubjects: "",
        cause: "",
        detectionDate: today,
        reportDate: today,
        containmentActions: "",
        correctiveActions: "",
        preventiveActions: "",
        status: "Aberto",
        reportedToAnpd: false,
        anpdReportDate: "",
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [editingIncident, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingIncident
        ? `/api/incidents/${editingIncident.id}`
        : "/api/incidents";
      const method = editingIncident ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingIncident
            ? "Incidente atualizado com sucesso!"
            : "Incidente registrado com sucesso!"
        );
        // Atualiza originalData para evitar prompt de mudanças não salvas
        setOriginalData(formData);
        onSave();
      } else {
        toast.error("Erro ao salvar incidente");
      }
    } catch (error) {
      console.error("Erro ao salvar incidente:", error);
      toast.error("Erro ao salvar incidente");
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

  // Intercepta o fechamento do modal
  const handleModalClose = (open: boolean) => {
    if (!open) {
      if (!handleClose()) {
        return; // Não fecha se houver mudanças não salvas
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {editingIncident ? "Editar Incidente" : "Novo Incidente"}
          </DialogTitle>
          <DialogDescription>
            Registre as informações do incidente de segurança ou privacidade
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Informações Básicas</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="title">Título do Incidente *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="Ex: Vazamento de dados de clientes"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição Detalhada *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={4}
                      placeholder="Descreva detalhadamente o incidente..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="incidentType">Tipo de Incidente *</Label>
                      <Select
                        value={formData.incidentType}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, incidentType: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Vazamento de Dados">
                            Vazamento de Dados
                          </SelectItem>
                          <SelectItem value="Acesso Não Autorizado">
                            Acesso Não Autorizado
                          </SelectItem>
                          <SelectItem value="Perda de Dados">Perda de Dados</SelectItem>
                          <SelectItem value="Phishing">Phishing</SelectItem>
                          <SelectItem value="Ransomware">Ransomware</SelectItem>
                          <SelectItem value="Ataque DDoS">Ataque DDoS</SelectItem>
                          <SelectItem value="Violação de Política">
                            Violação de Política
                          </SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="severity">Severidade *</Label>
                      <Select
                        value={formData.severity}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, severity: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Baixa">Baixa</SelectItem>
                          <SelectItem value="Média">Média</SelectItem>
                          <SelectItem value="Alta">Alta</SelectItem>
                          <SelectItem value="Crítica">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Impacto</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="affectedData">Dados Afetados *</Label>
                    <Textarea
                      id="affectedData"
                      name="affectedData"
                      value={formData.affectedData}
                      onChange={handleChange}
                      required
                      rows={2}
                      placeholder="Liste os tipos de dados pessoais afetados..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="affectedSubjects">
                      Número de Titulares Afetados
                    </Label>
                    <Input
                      id="affectedSubjects"
                      name="affectedSubjects"
                      type="number"
                      min="0"
                      value={formData.affectedSubjects}
                      onChange={handleChange}
                      placeholder="Ex: 100"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Cronologia</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="detectionDate">Data de Detecção *</Label>
                      <Input
                        id="detectionDate"
                        name="detectionDate"
                        type="date"
                        value={formData.detectionDate}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="reportDate">Data de Reporte *</Label>
                      <Input
                        id="reportDate"
                        name="reportDate"
                        type="date"
                        value={formData.reportDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cause">Causa Identificada</Label>
                    <Textarea
                      id="cause"
                      name="cause"
                      value={formData.cause}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Descreva a causa do incidente..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Ações e Respostas</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="containmentActions">Ações de Contenção</Label>
                    <Textarea
                      id="containmentActions"
                      name="containmentActions"
                      value={formData.containmentActions}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Ações imediatas tomadas para conter o incidente..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="correctiveActions">Ações Corretivas</Label>
                    <Textarea
                      id="correctiveActions"
                      name="correctiveActions"
                      value={formData.correctiveActions}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Ações para corrigir as vulnerabilidades..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="preventiveActions">Ações Preventivas</Label>
                    <Textarea
                      id="preventiveActions"
                      name="preventiveActions"
                      value={formData.preventiveActions}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Ações para prevenir recorrência..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Status e Comunicação</h3>
                <div className="space-y-3">
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
                        <SelectItem value="Aberto">Aberto</SelectItem>
                        <SelectItem value="Em Investigação">
                          Em Investigação
                        </SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Resolvido">Resolvido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="reportedToAnpd"
                      checked={formData.reportedToAnpd}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          reportedToAnpd: checked === true,
                        }))
                      }
                    />
                    <Label htmlFor="reportedToAnpd" className="cursor-pointer">
                      Incidente reportado à ANPD
                    </Label>
                  </div>

                  {formData.reportedToAnpd && (
                    <div>
                      <Label htmlFor="anpdReportDate">
                        Data do Reporte à ANPD
                      </Label>
                      <Input
                        id="anpdReportDate"
                        name="anpdReportDate"
                        type="date"
                        value={formData.anpdReportDate}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose() && onClose()}>
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

    <UnsavedChangesDialog
      open={showConfirmDialog}
      onConfirm={confirmClose}
      onCancel={cancelClose}
    />
    </>
  );
}
