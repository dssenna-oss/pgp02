
"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

interface InventarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  inventario?: any;
}

export default function InventarioFormModal({
  isOpen,
  onClose,
  onSuccess,
  inventario
}: InventarioFormModalProps) {
  const initialFormData = {
    serviceName: "",
    dataCategory: "",
    personalData: "",
    legalBasis: "",
    purpose: "",
    dataSubjects: "",
    retention: "",
    storage: "",
    sharing: "",
    security: ""
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
    if (inventario) {
      const data = {
        serviceName: inventario.serviceName || "",
        dataCategory: inventario.dataCategory || "",
        personalData: inventario.personalData || "",
        legalBasis: inventario.legalBasis || "",
        purpose: inventario.purpose || "",
        dataSubjects: inventario.dataSubjects || "",
        retention: inventario.retention || "",
        storage: inventario.storage || "",
        sharing: inventario.sharing || "",
        security: inventario.security || ""
      };
      setFormData(data);
      setOriginalData(data);
    } else {
      setFormData(initialFormData);
      setOriginalData(initialFormData);
    }
  }, [inventario, isOpen]);

  // Limpar base legal quando mudar a categoria para evitar incompatibilidades
  useEffect(() => {
    if (formData.dataCategory && formData.legalBasis) {
      const basesLegaisDadosSensiveis = [
        "I - consentimento",
        "II - cumprimento de obrigação legal ou regulatória pelo controlador",
        "III - execução de políticas públicas",
        "IV - estudos por órgão de pesquisa",
        "V - exercício regular de direitos",
        "VI - proteção da vida ou da incolumidade física",
        "VII - para a tutela da saúde",
        "VIII - garantia da prevenção à fraude e à segurança do titular"
      ];
      
      const basesLegaisOutrasCategorias = [
        "I - consentimento",
        "II - cumprimento de obrigação legal ou regulatória pelo controlador",
        "III - execução de políticas públicas",
        "IV - estudos por órgão de pesquisa",
        "V - execução de contrato",
        "VI - exercício regular de direitos",
        "VII - proteção da vida ou da incolumidade física",
        "VIII - para a tutela da saúde",
        "IX - interesses legítimos",
        "X - para a proteção do crédito"
      ];

      const basesValidas = formData.dataCategory === "Dados Sensíveis" 
        ? basesLegaisDadosSensiveis 
        : basesLegaisOutrasCategorias;

      if (!basesValidas.includes(formData.legalBasis)) {
        setFormData(prev => ({ ...prev, legalBasis: "" }));
      }
    }
  }, [formData.dataCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = inventario
        ? `/api/inventario/${inventario.id}`
        : "/api/inventario";
      
      const method = inventario ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar inventário");
      }

      toast.success(
        inventario
          ? "Inventário atualizado com sucesso!"
          : "Inventário criado com sucesso!"
      );
      
      // Atualiza originalData para evitar prompt de mudanças não salvas
      setOriginalData(formData);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao salvar inventário");
    } finally {
      setLoading(false);
    }
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {inventario ? "Editar Inventário" : "Novo Inventário"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceName">Nome do Processo/Serviço *</Label>
              <Input
                id="serviceName"
                value={formData.serviceName}
                onChange={(e) =>
                  setFormData({ ...formData, serviceName: e.target.value })
                }
                required
                placeholder="Ex: Sistema de RH"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataCategory">Categoria de Dados *</Label>
              <Select
                value={formData.dataCategory}
                onValueChange={(value) =>
                  setFormData({ ...formData, dataCategory: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dados de Identificação">Dados de Identificação</SelectItem>
                  <SelectItem value="Dados de Contato">Dados de Contato</SelectItem>
                  <SelectItem value="Dados Financeiros">Dados Financeiros</SelectItem>
                  <SelectItem value="Dados de Saúde">Dados de Saúde</SelectItem>
                  <SelectItem value="Dados Sensíveis">Dados Sensíveis</SelectItem>
                  <SelectItem value="Dados de Localização">Dados de Localização</SelectItem>
                  <SelectItem value="Dados Comportamentais">Dados Comportamentais</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="personalData">Dados Pessoais Tratados *</Label>
              <Textarea
                id="personalData"
                value={formData.personalData}
                onChange={(e) =>
                  setFormData({ ...formData, personalData: e.target.value })
                }
                required
                placeholder="Ex: Nome, CPF, E-mail, Telefone..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="legalBasis">Base Legal *</Label>
              <Select
                value={formData.legalBasis}
                onValueChange={(value) =>
                  setFormData({ ...formData, legalBasis: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a base legal" />
                </SelectTrigger>
                <SelectContent>
                  {formData.dataCategory === "Dados Sensíveis" ? (
                    // Bases legais para Dados Sensíveis
                    <>
                      <SelectItem value="I - consentimento">I - consentimento</SelectItem>
                      <SelectItem value="II - cumprimento de obrigação legal ou regulatória pelo controlador">II - cumprimento de obrigação legal ou regulatória pelo controlador</SelectItem>
                      <SelectItem value="III - execução de políticas públicas">III - execução de políticas públicas</SelectItem>
                      <SelectItem value="IV - estudos por órgão de pesquisa">IV - estudos por órgão de pesquisa</SelectItem>
                      <SelectItem value="V - exercício regular de direitos">V - exercício regular de direitos</SelectItem>
                      <SelectItem value="VI - proteção da vida ou da incolumidade física">VI - proteção da vida ou da incolumidade física</SelectItem>
                      <SelectItem value="VII - para a tutela da saúde">VII - para a tutela da saúde</SelectItem>
                      <SelectItem value="VIII - garantia da prevenção à fraude e à segurança do titular">VIII - garantia da prevenção à fraude e à segurança do titular</SelectItem>
                    </>
                  ) : (
                    // Bases legais para outras categorias
                    <>
                      <SelectItem value="I - consentimento">I - consentimento</SelectItem>
                      <SelectItem value="II - cumprimento de obrigação legal ou regulatória pelo controlador">II - cumprimento de obrigação legal ou regulatória pelo controlador</SelectItem>
                      <SelectItem value="III - execução de políticas públicas">III - execução de políticas públicas</SelectItem>
                      <SelectItem value="IV - estudos por órgão de pesquisa">IV - estudos por órgão de pesquisa</SelectItem>
                      <SelectItem value="V - execução de contrato">V - execução de contrato</SelectItem>
                      <SelectItem value="VI - exercício regular de direitos">VI - exercício regular de direitos</SelectItem>
                      <SelectItem value="VII - proteção da vida ou da incolumidade física">VII - proteção da vida ou da incolumidade física</SelectItem>
                      <SelectItem value="VIII - para a tutela da saúde">VIII - para a tutela da saúde</SelectItem>
                      <SelectItem value="IX - interesses legítimos">IX - interesses legítimos</SelectItem>
                      <SelectItem value="X - para a proteção do crédito">X - para a proteção do crédito</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataSubjects">Titulares dos Dados *</Label>
              <Input
                id="dataSubjects"
                value={formData.dataSubjects}
                onChange={(e) =>
                  setFormData({ ...formData, dataSubjects: e.target.value })
                }
                required
                placeholder="Ex: Clientes, Funcionários, Fornecedores"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="purpose">Finalidade do Tratamento *</Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value })
                }
                required
                placeholder="Descreva a finalidade do tratamento dos dados"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention">Período de Retenção *</Label>
              <Input
                id="retention"
                value={formData.retention}
                onChange={(e) =>
                  setFormData({ ...formData, retention: e.target.value })
                }
                required
                placeholder="Ex: 5 anos após término do contrato"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage">Local de Armazenamento *</Label>
              <Input
                id="storage"
                value={formData.storage}
                onChange={(e) =>
                  setFormData({ ...formData, storage: e.target.value })
                }
                required
                placeholder="Ex: Servidor AWS, Nuvem Google"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="sharing">Compartilhamento com Terceiros</Label>
              <Textarea
                id="sharing"
                value={formData.sharing}
                onChange={(e) =>
                  setFormData({ ...formData, sharing: e.target.value })
                }
                placeholder="Descreva se há compartilhamento e com quem"
                rows={2}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="security">Medidas de Segurança *</Label>
              <Textarea
                id="security"
                value={formData.security}
                onChange={(e) =>
                  setFormData({ ...formData, security: e.target.value })
                }
                required
                placeholder="Descreva as medidas de segurança implementadas"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose() && onClose()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
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
