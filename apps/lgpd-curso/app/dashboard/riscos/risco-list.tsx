"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, FileText, AlertTriangle, ArrowRight } from "lucide-react";
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
  inventoryId: string | null;
  inventory: { id: string; nome: string } | null;
};

type Inventory = {
  id: string;
  nome: string;
  setor: string | null;
  status: string;
  dadosSensiveis: boolean | null;
};

function severityBadge(level: string | null) {
  if (!level) return <Badge variant="ghost">—</Badge>;
  const sev = level.match(/S:(\w+)/)?.[1];
  if (sev === "ALTO") return <Badge variant="destructive">ALTO</Badge>;
  if (sev === "MEDIO") return <Badge variant="warning">MÉDIO</Badge>;
  return <Badge variant="success">BAIXO</Badge>;
}

export function RiscoList({ riscos, inventories }: { riscos: Risco[]; inventories: Inventory[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [inventarioPreSelecionado, setInventarioPreSelecionado] = useState<string | null>(null);

  const inventariosAprovados = inventories.filter((i) => i.status === "APROVADO");

  function abrirNovoParaProcesso(inventoryId: string) {
    setEditing(null);
    setInventarioPreSelecionado(inventoryId);
    setOpen(true);
  }
  function abrirNovoSemProcesso() {
    setEditing(null);
    setInventarioPreSelecionado(null);
    setOpen(true);
  }
  function abrirEdicao(r: any) {
    setEditing(r);
    setInventarioPreSelecionado(null);
    setOpen(true);
  }
  async function deletar(id: string) {
    if (!confirm("Remover este risco?")) return;
    try {
      await deletarRisco(id);
      toast.success("Risco removido");
    } catch (e: any) { toast.error(e.message || "Erro"); }
  }

  // Conta riscos por inventário
  const contagemPorInv = new Map<string, number>();
  for (const r of riscos) {
    if (r.inventoryId) {
      contagemPorInv.set(r.inventoryId, (contagemPorInv.get(r.inventoryId) || 0) + 1);
    }
  }
  const semVinculo = riscos.filter((r) => !r.inventoryId).length;

  return (
    <>
      {/* Cards por processo aprovado */}
      {inventariosAprovados.length === 0 ? (
        <div className="border-l-4 border-amber-400 bg-amber-50 rounded p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-amber-900 text-sm mb-1">
                Nenhum processo aprovado ainda
              </div>
              <p className="text-amber-900 text-xs leading-relaxed mb-2">
                A Análise de Riscos fica mais forte quando vinculada aos processos do Inventário. Aprove ao menos 1 processo na Missão 1 primeiro — você pode até criar riscos avulsos aqui, mas perde o vínculo.
              </p>
              <Link
                href="/dashboard/inventario"
                className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3 py-2 rounded"
              >
                Ir pro Inventário (Missão 1) <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
            Processos aprovados — clique no botão pra registrar risco vinculado
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inventariosAprovados.map((inv) => {
              const qtd = contagemPorInv.get(inv.id) || 0;
              return (
                <div key={inv.id} className="border-2 border-gray-200 hover:border-brand-300 rounded-lg p-3 bg-white transition-colors">
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm leading-snug">{inv.nome}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{inv.setor || "—"}</div>
                    </div>
                    {inv.dadosSensiveis && <Badge variant="destructive" className="shrink-0">SENSÍVEIS</Badge>}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-3">
                    <Badge variant={qtd > 0 ? "primary" : "ghost"}>
                      {qtd} risco{qtd !== 1 ? "s" : ""}
                    </Badge>
                    <Button size="sm" variant="primary" onClick={() => abrirNovoParaProcesso(inv.id)}>
                      <Plus className="h-3.5 w-3.5" /> Adicionar risco
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Linha de ação: risco sem vínculo */}
      <div className="flex items-center justify-between mb-4 text-xs flex-wrap gap-2">
        <span className="text-gray-500">
          Tem um risco transversal (sem processo específico)? {semVinculo > 0 && <span>· {semVinculo} já registrado{semVinculo > 1 ? "s" : ""}</span>}
        </span>
        <Button size="sm" variant="ghost" onClick={abrirNovoSemProcesso}>
          <Plus className="h-3.5 w-3.5" /> Risco sem vínculo a processo
        </Button>
      </div>

      {/* Matriz visual */}
      {riscos.length > 0 && (
        <div className="mb-6">
          <MatrizRiscos riscos={riscos as any} />
        </div>
      )}

      {/* Tabela completa */}
      {riscos.length === 0 ? (
        <EmptyState
          title="Nenhum risco registrado ainda"
          description={inventariosAprovados.length > 0
            ? "Use os cards de processos acima pra registrar o primeiro risco. Comece pelos mais críticos: vazamento de dados sensíveis, ausência de base legal, falhas de segurança."
            : "Aprove ao menos 1 processo no Inventário primeiro pra registrar riscos vinculados."}
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
                  <TD className="text-xs">{r.inventory?.nome || <span className="text-gray-400 italic">—</span>}</TD>
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

      <RiscoForm
        risco={editing}
        inventories={inventories}
        inventarioPreSelecionado={inventarioPreSelecionado}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
