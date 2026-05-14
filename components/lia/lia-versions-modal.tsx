"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface VersionItem {
  id: string;
  version: number;
  changeLog: string | null;
  approvedAt: string;
  approvedBy: { id: string; name: string | null; email: string } | null;
}

interface LiaVersionsModalProps {
  liaId: string;
  open: boolean;
  onClose: () => void;
  /** Versão considerada "atual publicada" (vinda da Lia.publishedVersionNum). */
  currentVersionNum: number | null;
}

export default function LiaVersionsModal({
  liaId,
  open,
  onClose,
  currentVersionNum,
}: LiaVersionsModalProps) {
  const [items, setItems] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/lia/${liaId}/versions`, {
          cache: "no-store",
        });
        if (!r.ok) {
          toast.error("Erro ao carregar histórico");
          return;
        }
        const j = await r.json();
        if (!cancelled) setItems(j.items ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, liaId]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-violet-600" />
            Histórico de versões
          </DialogTitle>
          <DialogDescription>
            Cada aprovação cria uma versão congelada (snapshot) do conteúdo.
            Use o botão "Comparar" do editor pra ver o que mudou entre versões.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Carregando…
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto opacity-30 mb-2" />
                <p className="text-sm">
                  Ainda não há versões aprovadas. Versões são criadas
                  automaticamente quando o DPO aprova a LIA.
                </p>
              </CardContent>
            </Card>
          ) : (
            items.map((v) => {
              const isCurrent = v.version === currentVersionNum;
              return (
                <Card
                  key={v.id}
                  className={cn(
                    isCurrent &&
                      "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-900"
                  )}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono">
                        v{v.version}
                      </Badge>
                      {isCurrent && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                          Atual publicada
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground ml-auto">
                        {new Date(v.approvedAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {v.approvedBy?.name && (
                      <p className="text-xs text-muted-foreground">
                        Aprovado por {v.approvedBy.name}
                      </p>
                    )}
                    {v.changeLog && (
                      <p className="text-sm whitespace-pre-wrap border-l-2 border-violet-300 pl-3 py-0.5">
                        {v.changeLog}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
