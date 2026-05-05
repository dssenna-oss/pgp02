"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Building2,
  AlertCircle,
  Clock,
  FileText,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type OperatorDTO,
  relationTypeLabel,
  relationTypeBadgeClass,
  contractStatusLabel,
  contractStatusBadgeClass,
  contractRiskClassLabel,
  contractRiskBadgeClass,
  operatorTypeLabel,
} from "@/lib/operadores-helpers";

interface Props {
  operator: OperatorDTO;
  canDelete: boolean;
  onDelete: (id: string, name: string) => void;
}

export default function TerceiroCard({ operator, canDelete, onDelete }: Props) {
  const expDate = operator.contractExpiresAt
    ? new Date(operator.contractExpiresAt)
    : null;
  const expStr = expDate
    ? expDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const showRiskWarning =
    operator.contractStatus === "VENCIDO" ||
    operator.contractStatus === "SEM_CONTRATO" ||
    operator.contractRiskClass === "ALTO";

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-shadow border-l-4",
        operator.contractRiskClass === "ALTO"
          ? "border-l-red-400"
          : operator.contractRiskClass === "MEDIO"
          ? "border-l-amber-400"
          : "border-l-emerald-400"
      )}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <Badge
                variant="outline"
                className={cn("text-xs", relationTypeBadgeClass(operator.relationType))}
              >
                {relationTypeLabel(operator.relationType)}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-xs", contractRiskBadgeClass(operator.contractRiskClass))}
              >
                Risco {contractRiskClassLabel(operator.contractRiskClass)}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-xs", contractStatusBadgeClass(operator.contractStatus))}
              >
                {contractStatusLabel(operator.contractStatus)}
              </Badge>
              {operator.operatorType && (
                <Badge variant="outline" className="text-xs">
                  {operatorTypeLabel(operator.operatorType)}
                </Badge>
              )}
            </div>
            <Link
              href={`/dashboard/terceiros/${operator.id}`}
              className="hover:underline"
            >
              <h3 className="font-semibold text-base truncate flex items-center gap-2">
                <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                {operator.name}
              </h3>
            </Link>
            {operator.tradeName && operator.tradeName !== operator.name && (
              <p className="text-sm text-muted-foreground truncate ml-6">
                {operator.tradeName}
              </p>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              {operator.cnpj && <span>CNPJ {operator.cnpj}</span>}
              {operator.processLinks.length > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {operator.processLinks.length} processo(s) vinculado(s)
                </span>
              )}
              {expStr && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Vence {expStr}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/terceiros/${operator.id}`}>
                <Edit className="h-3.5 w-3.5 mr-1" />
                Abrir
              </Link>
            </Button>
            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={() => onDelete(operator.id, operator.name)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {showRiskWarning && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md p-2.5 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 dark:text-amber-200">
              {operator.contractStatus === "SEM_CONTRATO"
                ? "Sem contrato celebrado — pendência alta."
                : operator.contractStatus === "VENCIDO"
                ? "Contrato vencido. Renovar com urgência."
                : operator.contractStatus === "VENCENDO_90D"
                ? "Contrato vencendo em ≤90 dias."
                : "Risco alto identificado — revisão necessária."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
