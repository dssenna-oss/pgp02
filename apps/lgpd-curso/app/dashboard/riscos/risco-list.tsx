"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty";
import { RiscoForm } from "./risco-form";
import { MatrizRiscos } from "./matriz";
import { deletarRisco } from "./actions";
import toast from "react-hot-toast";

type Risco = {
  id: string;
  riscoTitulo: string;
  descricao: string | null;
  severityLevel: string | null;
  inventory: { id: string; nome: string } | null;
};

function severityBadge(level: string | null) {
  if (!level) return <Badge variant="ghost">—</Badge>;
  const sev = level.match(/S:(\w+)/)?.[1];
  if (sev === "ALTO") return <Badge variant="destructive">ALTO</Badge>;
  if (sev === "MEDIO") return <Badge variant="warning">MÉDIO</Badge>;
  return <Badge variant="success">BAIXO</Badge>;
}

export function RiscoList({ riscos, inventories }: { riscos: Risco[]; inventories: any[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  function abrirNovo() {
    setEditing(null);
    setOpen(true);
  }
  function abrirEdicao(r: any) {
    setEditing(r);
    setOpen(true);
  }
  async function deletar(id: string) {
    if (!confirm("Remover este risco?")) return;
    try {
      await deletarRisco(id);
      toast.success("Risco removido");
    } catch (e: any) { toast.error(e.message || "Erro"); }
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={abrirNovo}>
          <Plus className="h-4 w-4" /> Novo risco
        </Button>
      </div>

      {riscos.length > 0 && (
        <div className="mb-6">
          <MatrizRiscos riscos={riscos as any} />
        </div>
      )}

      {riscos.length === 0 ? (
        <EmptyState
          title="Nenhum risco registrado"
          description="Identifique os riscos por processo. Comece pelos mais críticos: vazamento de dados sensíveis, ausência de base legal, falhas de segurança."
          action={<Button onClick={abrirNovo}><Plus className="h-4 w-4" /> Registrar primeiro risco</Button>}
        />
      ) : (
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Risco</TH>
                <TH>Processo</TH>
                <TH>Severidade</TH>
                <TH className="text-right">Ações</TH>
              </TR>
            </THead>
            <TBody>
              {riscos.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <div className="font-medium">{r.riscoTitulo}</div>
                    {r.descricao && <div className="text-xs text-gray-500 mt-0.5">{r.descricao}</div>}
                  </TD>
                  <TD className="text-xs">{r.inventory?.nome || "—"}</TD>
                  <TD>{severityBadge(r.severityLevel)}</TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => abrirEdicao(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deletar(r.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      <RiscoForm risco={editing} inventories={inventories} open={open} onOpenChange={setOpen} />
    </>
  );
}
