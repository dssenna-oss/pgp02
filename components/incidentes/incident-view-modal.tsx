
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
import { AlertTriangle, CheckCircle2 } from "lucide-react";

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
  createdAt: string;
  updatedAt: string;
}

interface IncidentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
}

export default function IncidentViewModal({
  isOpen,
  onClose,
  incident,
}: IncidentViewModalProps) {
  if (!incident) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Crítica":
        return "text-red-600 bg-red-50 border-red-200";
      case "Alta":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "Média":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Baixa":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            {incident.title}
          </DialogTitle>
          <DialogDescription>
            Detalhes do Incidente - {incident.incidentType}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-150px)] pr-4">
          <div className="space-y-6">
            <div className="flex gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold border ${getSeverityColor(
                  incident.severity
                )}`}
              >
                {incident.severity}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-semibold text-blue-600 bg-blue-50">
                {incident.status}
              </span>
              {incident.reportedToAnpd && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold text-purple-600 bg-purple-50 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Reportado à ANPD
                </span>
              )}
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-primary">
                Descrição do Incidente
              </h3>
              <p className="text-sm whitespace-pre-wrap">{incident.description}</p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-primary">Impacto</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Dados Afetados
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{incident.affectedData}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Titulares Afetados
                  </p>
                  <p className="text-sm">{incident.affectedSubjects || "Não informado"}</p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-primary">Cronologia</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Data de Detecção
                  </p>
                  <p className="text-sm">
                    {new Date(incident.detectionDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Data de Reporte
                  </p>
                  <p className="text-sm">
                    {new Date(incident.reportDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {incident.anpdReportDate && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Data de Reporte à ANPD
                    </p>
                    <p className="text-sm">
                      {new Date(incident.anpdReportDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
              </div>
              {incident.cause && (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground mb-1">
                    Causa Identificada
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{incident.cause}</p>
                </div>
              )}
            </div>

            {incident.containmentActions && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-primary">
                  Ações de Contenção
                </h3>
                <p className="text-sm whitespace-pre-wrap">
                  {incident.containmentActions}
                </p>
              </div>
            )}

            {incident.correctiveActions && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-primary">
                  Ações Corretivas
                </h3>
                <p className="text-sm whitespace-pre-wrap">
                  {incident.correctiveActions}
                </p>
              </div>
            )}

            {incident.preventiveActions && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-primary">
                  Ações Preventivas
                </h3>
                <p className="text-sm whitespace-pre-wrap">
                  {incident.preventiveActions}
                </p>
              </div>
            )}

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-primary">
                Informações Adicionais
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Data de Criação</p>
                  <p>{new Date(incident.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Última Atualização</p>
                  <p>{new Date(incident.updatedAt).toLocaleDateString("pt-BR")}</p>
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
