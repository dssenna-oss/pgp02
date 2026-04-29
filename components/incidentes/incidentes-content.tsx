
"use client";

import { useState, useEffect } from "react";
import { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileSpreadsheet, Pencil, Trash2, Eye, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import IncidentFormModal from "./incident-form-modal";
import IncidentViewModal from "./incident-view-modal";

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

interface IncidentesContentProps {
  session: Session;
}

export default function IncidentesContent({ session }: IncidentesContentProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [viewingIncident, setViewingIncident] = useState<Incident | null>(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/incidents");
      if (response.ok) {
        const data = await response.json();
        setIncidents(data);
      } else {
        toast.error("Erro ao carregar incidentes");
      }
    } catch (error) {
      console.error("Erro ao buscar incidentes:", error);
      toast.error("Erro ao carregar incidentes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleAdd = () => {
    setEditingIncident(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (incident: Incident) => {
    setEditingIncident(incident);
    setIsFormModalOpen(true);
  };

  const handleView = (incident: Incident) => {
    setViewingIncident(incident);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este incidente?")) {
      return;
    }

    try {
      const response = await fetch(`/api/incidents/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Incidente excluído com sucesso!");
        fetchIncidents();
      } else {
        toast.error("Erro ao excluir incidente");
      }
    } catch (error) {
      console.error("Erro ao excluir incidente:", error);
      toast.error("Erro ao excluir incidente");
    }
  };

  const handleSave = () => {
    setIsFormModalOpen(false);
    fetchIncidents();
  };

  const exportToExcel = () => {
    if (incidents.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    const dataForExport = incidents.map((incident) => ({
      "Título": incident.title,
      "Descrição": incident.description,
      "Tipo": incident.incidentType,
      "Severidade": incident.severity,
      "Dados Afetados": incident.affectedData,
      "Titulares Afetados": incident.affectedSubjects || 0,
      "Causa": incident.cause || "",
      "Data Detecção": new Date(incident.detectionDate).toLocaleDateString("pt-BR"),
      "Data Reporte": new Date(incident.reportDate).toLocaleDateString("pt-BR"),
      "Ações de Contenção": incident.containmentActions || "",
      "Ações Corretivas": incident.correctiveActions || "",
      "Ações Preventivas": incident.preventiveActions || "",
      "Status": incident.status,
      "Reportado à ANPD": incident.reportedToAnpd ? "Sim" : "Não",
      "Data Reporte ANPD": incident.anpdReportDate
        ? new Date(incident.anpdReportDate).toLocaleDateString("pt-BR")
        : "",
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Incidentes");

    const colWidths = [
      { wch: 30 }, // Título
      { wch: 40 }, // Descrição
      { wch: 25 }, // Tipo
      { wch: 12 }, // Severidade
      { wch: 30 }, // Dados Afetados
      { wch: 15 }, // Titulares Afetados
      { wch: 30 }, // Causa
      { wch: 12 }, // Data Detecção
      { wch: 12 }, // Data Reporte
      { wch: 40 }, // Ações de Contenção
      { wch: 40 }, // Ações Corretivas
      { wch: 40 }, // Ações Preventivas
      { wch: 12 }, // Status
      { wch: 15 }, // Reportado à ANPD
      { wch: 15 }, // Data Reporte ANPD
    ];
    ws["!cols"] = colWidths;

    XLSX.writeFile(
      wb,
      `Incidentes_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.xlsx`
    );
    toast.success("Arquivo Excel exportado com sucesso!");
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolvido":
        return "text-green-600 bg-green-50";
      case "Em Investigação":
        return "text-blue-600 bg-blue-50";
      case "Em Andamento":
        return "text-yellow-600 bg-yellow-50";
      case "Aberto":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Incidentes</h1>
          <p className="text-muted-foreground mt-2">
            Registre e acompanhe incidentes de segurança e privacidade
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportToExcel} variant="outline">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Incidente
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : incidents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground text-center mb-4">
              Nenhum incidente registrado ainda.
            </p>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Primeiro Incidente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {incidents.map((incident) => (
            <Card
              key={incident.id}
              className={`hover:shadow-md transition-shadow border-l-4 ${getSeverityColor(
                incident.severity
              )}`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle
                        className={`w-5 h-5 ${
                          incident.severity === "Crítica" || incident.severity === "Alta"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                      />
                      <CardTitle className="text-xl">{incident.title}</CardTitle>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(
                          incident.severity
                        )}`}
                      >
                        {incident.severity}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          incident.status
                        )}`}
                      >
                        {incident.status}
                      </span>
                      {incident.reportedToAnpd && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold text-blue-600 bg-blue-50">
                          Reportado à ANPD
                        </span>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {incident.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(incident)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(incident)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(incident.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tipo de Incidente</p>
                    <p className="font-medium">{incident.incidentType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data de Detecção</p>
                    <p className="font-medium">
                      {new Date(incident.detectionDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Titulares Afetados</p>
                    <p className="font-medium">{incident.affectedSubjects || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dados Afetados</p>
                    <p className="font-medium line-clamp-1">{incident.affectedData}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <IncidentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSave}
        editingIncident={editingIncident}
      />

      <IncidentViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        incident={viewingIncident}
      />
    </div>
  );
}
