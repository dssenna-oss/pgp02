"use client";

// Central de Chamados SOS — drawer lateral aberto pelo sino do header.
// Lista todos chamados ativos (PENDING + ATTENDED) com botões "Atendendo" e "Resolvido".

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LifeBuoy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SosItem = {
  id: string;
  status: "PENDING" | "ATTENDED" | "RESOLVED";
  requestedByName: string | null;
  createdAt: string;
  attendedAt: string | null;
};

type GrupoComSos = {
  grupoId: string;
  numero: number;
  orgao: string;
  sos: SosItem[];
};

export function CentralSos({
  open,
  onClose,
  grupos,
  onAtender,
}: {
  open: boolean;
  onClose: () => void;
  grupos: GrupoComSos[];
  onAtender: (id: string, status: "ATTENDED" | "RESOLVED") => void;
}) {
  const todosAtivos = grupos.flatMap((g) =>
    g.sos.filter((s) => s.status !== "RESOLVED").map((s) => ({ ...s, grupo: g })),
  );

  // Ordena: PENDING primeiro (mais antigo no topo), depois ATTENDED
  todosAtivos.sort((a, b) => {
    if (a.status !== b.status) return a.status === "PENDING" ? -1 : 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-red-600" />
            Central de Chamados SOS
            {todosAtivos.length > 0 && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded">
                {todosAtivos.length} ativo{todosAtivos.length > 1 ? "s" : ""}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Grupos que pediram sua presença. Clique &quot;Atendendo&quot; pra avisar que tá indo, ou &quot;Resolvido&quot; quando concluir.
          </DialogDescription>
        </DialogHeader>

        {todosAtivos.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            Nenhum chamado ativo. Quando um grupo clicar &quot;Chamar facilitador&quot;, aparece aqui.
          </div>
        ) : (
          <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
            {todosAtivos.map((item) => {
              const min = Math.max(0, Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 60000));
              const isPending = item.status === "PENDING";
              return (
                <li
                  key={item.id}
                  className={`border rounded-lg p-3 ${
                    isPending
                      ? "bg-red-50 border-red-300 animate-pulse-strong"
                      : "bg-amber-50 border-amber-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <div className="font-semibold text-sm">
                        G{item.grupo.numero} · {item.grupo.orgao}
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${
                          isPending ? "bg-red-200 text-red-900" : "bg-amber-200 text-amber-900"
                        }`}>
                          {isPending ? "🆘 PEDINDO" : "A CAMINHO"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        Por {item.requestedByName || "—"} · há {min}min
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {isPending && (
                        <Button size="sm" variant="outline" onClick={() => onAtender(item.id, "ATTENDED")}>
                          <Check className="h-3.5 w-3.5" /> Atendendo
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => onAtender(item.id, "RESOLVED")}>
                        <X className="h-3.5 w-3.5" /> Encerrar
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
