
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
import { toast } from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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
}

interface RipdFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingRipd: RIPD | null;
}

export default function RipdFormModal({
  isOpen,
  onClose,
  onSave,
  editingRipd,
}: RipdFormModalProps) {
  const [formData, setFormData] = useState({
    processName: "",
    processDescription: "",
    dataTypes: "",
    dataSubjects: "",
    purpose: "",
    legalBasis: "",
    necessityAssessment: "",
    proportionalityAssessment: "",
    riskIdentification: "",
    riskMitigation: "",
    safeguards: "",
    consultationDetails: "",
    monitoring: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingRipd) {
      setFormData({
        processName: editingRipd.processName,
        processDescription: editingRipd.processDescription,
        dataTypes: editingRipd.dataTypes,
        dataSubjects: editingRipd.dataSubjects,
        purpose: editingRipd.purpose,
        legalBasis: editingRipd.legalBasis,
        necessityAssessment: editingRipd.necessityAssessment,
        proportionalityAssessment: editingRipd.proportionalityAssessment,
        riskIdentification: editingRipd.riskIdentification,
        riskMitigation: editingRipd.riskMitigation,
        safeguards: editingRipd.safeguards,
        consultationDetails: editingRipd.consultationDetails || "",
        monitoring: editingRipd.monitoring,
      });
    } else {
      setFormData({
        processName: "",
        processDescription: "",
        dataTypes: "",
        dataSubjects: "",
        purpose: "",
        legalBasis: "",
        necessityAssessment: "",
        proportionalityAssessment: "",
        riskIdentification: "",
        riskMitigation: "",
        safeguards: "",
        consultationDetails: "",
        monitoring: "",
      });
    }
  }, [editingRipd, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingRipd ? `/api/ripds/${editingRipd.id}` : "/api/ripds";
      const method = editingRipd ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingRipd
            ? "RIPD atualizado com sucesso!"
            : "RIPD criado com sucesso!"
        );
        onSave();
      } else {
        toast.error("Erro ao salvar RIPD");
      }
    } catch (error) {
      console.error("Erro ao salvar RIPD:", error);
      toast.error("Erro ao salvar RIPD");
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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {editingRipd ? "Editar RIPD" : "Novo RIPD"}
          </DialogTitle>
          <DialogDescription>
            Relatório de Impacto à Proteção de Dados - Preencha todas as seções
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">1. Identificação do Processo</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="processName">Nome do Processo *</Label>
                    <Input
                      id="processName"
                      name="processName"
                      value={formData.processName}
                      onChange={handleChange}
                      required
                      placeholder="Ex: Gestão de Cadastro de Clientes"
                    />
                  </div>

                  <div>
                    <Label htmlFor="processDescription">Descrição do Processo *</Label>
                    <Textarea
                      id="processDescription"
                      name="processDescription"
                      value={formData.processDescription}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="Descreva detalhadamente o processo..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">2. Dados Tratados</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="dataTypes">Tipos de Dados Pessoais *</Label>
                    <Textarea
                      id="dataTypes"
                      name="dataTypes"
                      value={formData.dataTypes}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="Liste os tipos de dados pessoais tratados..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="dataSubjects">Categorias de Titulares *</Label>
                    <Textarea
                      id="dataSubjects"
                      name="dataSubjects"
                      value={formData.dataSubjects}
                      onChange={handleChange}
                      required
                      rows={2}
                      placeholder="Ex: Clientes, Colaboradores, Fornecedores..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">3. Finalidade e Base Legal</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="purpose">Finalidades do Tratamento *</Label>
                    <Textarea
                      id="purpose"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="Descreva as finalidades do tratamento..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="legalBasis">Base Legal *</Label>
                    <Input
                      id="legalBasis"
                      name="legalBasis"
                      value={formData.legalBasis}
                      onChange={handleChange}
                      required
                      placeholder="Ex: Consentimento, Execução de Contrato, Interesse Legítimo..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">4. Avaliação de Necessidade e Proporcionalidade</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="necessityAssessment">Avaliação de Necessidade *</Label>
                    <Textarea
                      id="necessityAssessment"
                      name="necessityAssessment"
                      value={formData.necessityAssessment}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="Justifique a necessidade do tratamento..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="proportionalityAssessment">
                      Avaliação de Proporcionalidade *
                    </Label>
                    <Textarea
                      id="proportionalityAssessment"
                      name="proportionalityAssessment"
                      value={formData.proportionalityAssessment}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="Avalie a proporcionalidade do tratamento..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">5. Análise de Riscos</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="riskIdentification">Identificação de Riscos *</Label>
                    <Textarea
                      id="riskIdentification"
                      name="riskIdentification"
                      value={formData.riskIdentification}
                      onChange={handleChange}
                      required
                      rows={4}
                      placeholder="Identifique os riscos aos direitos e liberdades dos titulares..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="riskMitigation">Medidas de Mitigação *</Label>
                    <Textarea
                      id="riskMitigation"
                      name="riskMitigation"
                      value={formData.riskMitigation}
                      onChange={handleChange}
                      required
                      rows={4}
                      placeholder="Descreva as medidas para mitigar os riscos identificados..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">6. Salvaguardas e Controles</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="safeguards">Salvaguardas Implementadas *</Label>
                    <Textarea
                      id="safeguards"
                      name="safeguards"
                      value={formData.safeguards}
                      onChange={handleChange}
                      required
                      rows={4}
                      placeholder="Liste as salvaguardas técnicas e organizacionais..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="consultationDetails">Consulta aos Titulares</Label>
                    <Textarea
                      id="consultationDetails"
                      name="consultationDetails"
                      value={formData.consultationDetails}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Descreva se houve consulta aos titulares e os resultados..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">7. Monitoramento e Revisão</h3>
                <div>
                  <Label htmlFor="monitoring">Plano de Monitoramento *</Label>
                  <Textarea
                    id="monitoring"
                    name="monitoring"
                    value={formData.monitoring}
                    onChange={handleChange}
                    required
                    rows={3}
                    placeholder="Descreva como o processo será monitorado e revisado..."
                  />
                </div>
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
