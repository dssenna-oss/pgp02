
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

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
  createdAt: string;
  updatedAt: string;
}

interface RipdViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ripd: RIPD | null;
}

export default function RipdViewModal({
  isOpen,
  onClose,
  ripd,
}: RipdViewModalProps) {
  if (!ripd) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {ripd.processName}
          </DialogTitle>
          <DialogDescription>
            Relatório de Impacto à Proteção de Dados
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-150px)] pr-4">
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-primary">
                1. Identificação do Processo
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nome do Processo</p>
                  <p className="text-sm">{ripd.processName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm whitespace-pre-wrap">{ripd.processDescription}</p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-primary">2. Dados Tratados</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tipos de Dados Pessoais
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{ripd.dataTypes}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Categorias de Titulares
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{ripd.dataSubjects}</p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-primary">
                3. Finalidade e Base Legal
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Finalidades do Tratamento
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{ripd.purpose}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Base Legal</p>
                  <p className="text-sm">{ripd.legalBasis}</p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-primary">
                4. Avaliação de Necessidade e Proporcionalidade
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Avaliação de Necessidade
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {ripd.necessityAssessment}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Avaliação de Proporcionalidade
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {ripd.proportionalityAssessment}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-primary">5. Análise de Riscos</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Identificação de Riscos
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {ripd.riskIdentification}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Medidas de Mitigação
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{ripd.riskMitigation}</p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-primary">
                6. Salvaguardas e Controles
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Salvaguardas Implementadas
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{ripd.safeguards}</p>
                </div>
                {ripd.consultationDetails && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Consulta aos Titulares
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {ripd.consultationDetails}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-primary">
                7. Monitoramento e Revisão
              </h3>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Plano de Monitoramento
                </p>
                <p className="text-sm whitespace-pre-wrap">{ripd.monitoring}</p>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-primary">Informações Adicionais</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Data de Criação</p>
                  <p>{new Date(ripd.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Última Atualização</p>
                  <p>{new Date(ripd.updatedAt).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
