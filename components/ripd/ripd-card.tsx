"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, FileText, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type RipdDTO,
  ripdStatusLabel,
  ripdStatusBadgeClass,
} from "@/lib/ripd-helpers";

interface RipdCardProps {
  ripd: RipdDTO;
  /** Indica se o usuário pode excluir esta RIPD (calculado no client a
   *  partir do papel + ownership). Se `false`, esconde o botão de excluir. */
  canDelete: boolean;
  onDelete: (id: string, title: string) => void;
}

export default function RipdCard({ ripd, canDelete, onDelete }: RipdCardProps) {
  const updated = new Date(ripd.updatedAt);
  const updatedStr = updated.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const isAwaitingReview = ripd.status === "EM_REVISAO";
  const isRejected =
    ripd.status === "RASCUNHO" && (ripd.rejectionNote ?? "").length > 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <Badge
                variant="outline"
                className={cn("text-xs", ripdStatusBadgeClass(ripd.status))}
              >
                {ripdStatusLabel(ripd.status)}
              </Badge>
              {ripd.publishedVersionNum != null && (
                <Badge variant="outline" className="text-xs">
                  v{ripd.publishedVersionNum}
                </Badge>
              )}
              {isAwaitingReview && (
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
                >
                  <Clock className="h-3 w-3 mr-1 inline" />
                  Aguardando revisão
                </Badge>
              )}
              {isRejected && (
                <Badge
                  variant="outline"
                  className="text-xs bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                >
                  <AlertCircle className="h-3 w-3 mr-1 inline" />
                  Devolvido pra ajustes
                </Badge>
              )}
            </div>
            <Link href={`/dashboard/ripd/${ripd.id}`} className="hover:underline">
              <h3 className="font-semibold text-base truncate">{ripd.title}</h3>
            </Link>
            {ripd.inventory && (
              <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                Processo: <span className="font-medium">{ripd.inventory.serviceName}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Atualizado em {updatedStr}
              {ripd.createdBy?.name && <> · por {ripd.createdBy.name}</>}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/ripd/${ripd.id}`}>
                <Edit className="h-3.5 w-3.5 mr-1" />
                Abrir
              </Link>
            </Button>
            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={() => onDelete(ripd.id, ripd.title)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {isRejected && ripd.rejectionNote && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md p-2.5 text-sm">
            <p className="font-medium text-red-800 dark:text-red-300 text-xs mb-1">
              Motivo da devolução:
            </p>
            <p className="text-red-700 dark:text-red-200 text-sm">
              {ripd.rejectionNote}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
