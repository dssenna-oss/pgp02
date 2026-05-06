"use client";

/**
 * Placeholder do editor de LIA — Fatia 1 do Checkpoint 21.
 *
 * Estrutura completa do editor (3 abas + workflow + DOCX + diff)
 * vem na Fatia 2. Esta tela apenas mostra o status atual da LIA e
 * permite voltar pra lista.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Scale, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  type LiaDTO,
  liaStatusLabel,
  liaStatusBadgeClass,
} from "@/lib/lia-helpers";

export default function LiaEditorPlaceholder({ liaId }: { liaId: string }) {
  const [lia, setLia] = useState<LiaDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/lia/${liaId}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          toast.error(err.error ?? "LIA não encontrada");
          return null;
        }
        const j = await r.json();
        return j.lia as LiaDTO;
      })
      .then((l) => setLia(l))
      .finally(() => setLoading(false));
  }, [liaId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Carregando LIA…
      </div>
    );
  }

  if (!lia) {
    return (
      <div className="container mx-auto py-6 max-w-3xl space-y-4">
        <Link href="/dashboard/lia">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar à lista
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            LIA não encontrada ou sem permissão de acesso.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-4">
      <Link href="/dashboard/lia">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar à lista
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-start gap-3 flex-wrap">
            <div className="bg-violet-100 dark:bg-violet-950/40 p-2 rounded-lg flex-shrink-0">
              <Scale className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-semibold">{lia.title}</div>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span
                  className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${liaStatusBadgeClass(
                    lia.status
                  )}`}
                >
                  {liaStatusLabel(lia.status)}
                </span>
                {lia.blocked && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-red-100 text-red-800 border-red-300">
                    <AlertTriangle className="h-3 w-3" />
                    Bloqueada (Art. 11/14)
                  </span>
                )}
                {lia.publishedVersionNum && (
                  <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full border bg-gray-100 text-gray-700 border-gray-300">
                    v{lia.publishedVersionNum}
                  </span>
                )}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>📝 Editor em construção:</strong> A interface completa do
            editor (3 abas — Finalidade · Necessidade · Balanceamento — com
            workflow de aprovação, DOCX e diff word-level) virá na próxima
            entrega. Por enquanto, esta tela apenas mostra o status da LIA.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Field label="Processo do Inventário">
              {lia.inventory ? (
                <Link
                  href={`/dashboard/inventario/${lia.inventory.id}`}
                  className="text-violet-700 hover:underline"
                >
                  {lia.inventory.serviceName}
                </Link>
              ) : (
                <span className="text-muted-foreground">Sem vínculo</span>
              )}
            </Field>
            <Field label="Completude">
              <span className="font-bold">
                {Math.round(lia.completeness * 100)}%
              </span>
            </Field>
            <Field label="Criada por">
              {lia.createdBy?.name ?? lia.createdBy?.email ?? "—"}
            </Field>
            <Field label="Última atualização">
              {new Date(lia.updatedAt).toLocaleString("pt-BR")}
            </Field>
            {lia.approvedBy && (
              <Field label="Aprovada por">{lia.approvedBy.name}</Field>
            )}
            {lia.approvedAt && (
              <Field label="Aprovada em">
                {new Date(lia.approvedAt).toLocaleString("pt-BR")}
              </Field>
            )}
          </div>

          {lia.rejectionNote && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              <strong>Devolvida pelo DPO:</strong> {lia.rejectionNote}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}
