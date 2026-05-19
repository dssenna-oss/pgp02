"use client";

// Seção PRI (Plano de Resposta a Incidentes) no /dashboard/incidentes.
// Componente client-side com:
//   - Cadastro de membros da Equipe de Tratamento de Incidentes (ETIR/CSIRT)
//   - Matriz RACI 5 etapas × N papéis editável
//   - Indicador de completude
//
// Padrão visual: <details> colapsável (igual o card "Como responder").
// Padrão pedagógico: começa com "Aplicar RACI sugerido" pra DPO ver o modelo
// recomendado por NIST + boas práticas, e editar depois.

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Users, Grid3x3, CheckCircle2, AlertCircle, Sparkles, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  ETAPAS_NIST, PAPEIS_EQUIPE, TIPOS_RACI, RACI_DEFAULT,
  rotuloPapel, emojiPapel, completudePri,
  type EtapaNistId, type PapelEquipeId, type TipoRaci,
} from "@/lib/pri-catalogo";
import { salvarMembroEquipe, deletarMembroEquipe, salvarRaci, aplicarRaciDefault } from "./pri-actions";
import toast from "react-hot-toast";

type Membro = {
  id: string;
  nome: string;
  papel: string;
  contato24h: string | null;
  email: string | null;
  cobertura: string | null;
  observacao: string | null;
};

type RaciEntry = { etapaNist: string; papel: string; tipo: string };

export function PriSecao({ membrosIniciais, raciInicial }: {
  membrosIniciais: Membro[];
  raciInicial: RaciEntry[];
}) {
  const [membros, setMembros] = useState<Membro[]>(membrosIniciais);
  const [raci, setRaci] = useState<RaciEntry[]>(raciInicial);
  const [pending, startTransition] = useTransition();

  // Modal de membro
  const [membroOpen, setMembroOpen] = useState(false);
  const [editingMembro, setEditingMembro] = useState<Membro | null>(null);

  // Modal RACI
  const [raciOpen, setRaciOpen] = useState(false);

  const status = completudePri(membros, raci);

  function abrirNovoMembro() { setEditingMembro(null); setMembroOpen(true); }
  function abrirEditMembro(m: Membro) { setEditingMembro(m); setMembroOpen(true); }

  async function handleSalvarMembro(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await salvarMembroEquipe({
        id: editingMembro?.id,
        nome: String(fd.get("nome") || ""),
        papel: String(fd.get("papel") || ""),
        contato24h: String(fd.get("contato24h") || ""),
        email: String(fd.get("email") || ""),
        cobertura: String(fd.get("cobertura") || ""),
        observacao: String(fd.get("observacao") || ""),
      });
      if (r.ok === false) { toast.error(r.error); return; }
      toast.success(editingMembro ? "Membro atualizado" : "Membro adicionado");
      setMembroOpen(false);
      // Refresca local
      window.location.reload();
    });
  }

  async function handleDeletarMembro(id: string) {
    if (!confirm("Remover este membro da equipe?")) return;
    startTransition(async () => {
      const r = await deletarMembroEquipe(id);
      if (r.ok === false) { toast.error(r.error); return; }
      toast.success("Membro removido");
      setMembros((arr) => arr.filter((m) => m.id !== id));
    });
  }

  async function handleAplicarDefault() {
    if (!confirm(
      "Vai aplicar a matriz RACI sugerida (NIST + boas práticas). " +
      "Funciona se a matriz atual estiver vazia. Pode editar depois."
    )) return;
    startTransition(async () => {
      const r = await aplicarRaciDefault();
      if (r.ok === false) { toast.error(r.error); return; }
      toast.success(`Matriz RACI default aplicada (${r.aplicados} entradas)`);
      window.location.reload();
    });
  }

  function toggleRaci(etapaNist: EtapaNistId, papel: PapelEquipeId, tipo: TipoRaci) {
    setRaci((arr) => {
      const existe = arr.find((r) => r.etapaNist === etapaNist && r.papel === papel && r.tipo === tipo);
      if (existe) {
        return arr.filter((r) => !(r.etapaNist === etapaNist && r.papel === papel && r.tipo === tipo));
      }
      return [...arr, { etapaNist, papel, tipo }];
    });
  }

  async function handleSalvarRaci() {
    startTransition(async () => {
      const r = await salvarRaci(raci);
      if (r.ok === false) { toast.error(r.error); return; }
      toast.success("Matriz RACI salva");
      setRaciOpen(false);
    });
  }

  const raciVazio = raci.length === 0;

  return (
    <details className="mb-3 border border-purple-300 bg-purple-50 rounded-lg overflow-hidden group" open={!status.equipeOk || !status.raciOk}>
      <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-purple-900 hover:bg-purple-100 flex items-center gap-2 select-none">
        <span className="text-base">📋</span>
        <span className="flex-1">
          Plano de Resposta a Incidentes (PRI) · Equipe + Matriz RACI
        </span>
        {status.equipeOk && status.raciOk ? (
          <Badge variant="success" className="text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Completo</Badge>
        ) : (
          <Badge variant="warning" className="text-[10px]"><AlertCircle className="h-3 w-3 mr-1" /> Incompleto</Badge>
        )}
        <span className="text-xs text-purple-600 group-open:hidden">Mostrar</span>
        <span className="text-xs text-purple-600 hidden group-open:inline">Esconder</span>
      </summary>

      <div className="px-4 py-3 border-t border-purple-200 bg-white text-xs space-y-4">
        <p className="text-gray-700 leading-relaxed">
          O PRI é o &quot;manual de bombeiro&quot; da organização. Define <strong>QUEM faz O QUÊ</strong> ANTES do
          incidente acontecer. Equipe sem PRI pré-aprovado entra em pânico — vira improvisação.
          A Res. CD/ANPD nº 15/2024 pressupõe que o controlador TEM um plano pronto.
        </p>

        {/* === Subseção 1: Equipe ETIR/CSIRT === */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-purple-700" />
            <h3 className="font-semibold text-sm text-purple-900 flex-1">
              Equipe de Tratamento de Incidentes (ETIR/CSIRT)
            </h3>
            <Button size="sm" variant="outline" onClick={abrirNovoMembro}>
              <Plus className="h-3.5 w-3.5" /> Adicionar membro
            </Button>
          </div>

          {membros.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-900">
              ⚠ Nenhum membro cadastrado. Mínimo recomendado: <strong>DPO + TI</strong>.
              Sem equipe definida, ninguém sabe a quem ligar às 2h da manhã quando o incidente acontecer.
            </div>
          ) : (
            <div className="border rounded overflow-hidden">
              <table className="w-full text-[11px]">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-2 py-1.5">Membro</th>
                    <th className="px-2 py-1.5">Papel</th>
                    <th className="px-2 py-1.5">Contato 24h</th>
                    <th className="px-2 py-1.5">Cobertura</th>
                    <th className="px-2 py-1.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {membros.map((m) => (
                    <tr key={m.id} className="border-t hover:bg-gray-50">
                      <td className="px-2 py-1.5">
                        <div className="font-medium">{m.nome}</div>
                        {m.email && <div className="text-gray-500 text-[10px]">{m.email}</div>}
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="inline-flex items-center gap-1">
                          <span>{emojiPapel(m.papel)}</span>
                          <span>{rotuloPapel(m.papel)}</span>
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-gray-700">{m.contato24h || "—"}</td>
                      <td className="px-2 py-1.5 text-gray-500 italic">{m.cobertura || "—"}</td>
                      <td className="px-2 py-1.5">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => abrirEditMembro(m)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeletarMembro(m.id)}>
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {status.papeisFaltantes.length > 0 && (
            <div className="mt-2 text-amber-700 text-[11px]">
              ⚠ Faltam papéis essenciais: <strong>{status.papeisFaltantes.map(rotuloPapel).join(", ")}</strong>
            </div>
          )}
        </div>

        {/* === Subseção 2: Matriz RACI === */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Grid3x3 className="h-4 w-4 text-purple-700" />
            <h3 className="font-semibold text-sm text-purple-900 flex-1">
              Matriz RACI por etapa NIST
            </h3>
            {raciVazio ? (
              <Button size="sm" variant="outline" onClick={handleAplicarDefault} disabled={pending}>
                <Sparkles className="h-3.5 w-3.5" /> Aplicar sugestão (NIST)
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setRaciOpen(true)}>
                <Grid3x3 className="h-3.5 w-3.5" /> Editar matriz
              </Button>
            )}
          </div>

          {raciVazio ? (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-900">
              ⚠ Matriz RACI vazia. Clique em <strong>&quot;Aplicar sugestão (NIST)&quot;</strong> pra
              começar com um modelo pré-aprovado (DPO=Aprovador, TI=Responsável, Jurídico=Consultado...).
              Você pode editar depois.
            </div>
          ) : (
            <div className="border rounded overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Etapa NIST</th>
                    {PAPEIS_EQUIPE.map((p) => (
                      <th key={p.id} className="px-2 py-1.5 text-center" title={p.descricao}>
                        <div>{p.emoji}</div>
                        <div className="text-[9px] font-normal">{p.id}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ETAPAS_NIST.map((etapa) => (
                    <tr key={etapa.id} className="border-t">
                      <td className="px-2 py-1.5">
                        <div className="font-medium">{etapa.emoji} {etapa.rotulo}</div>
                        <div className="text-gray-500 text-[10px]">{etapa.resumo.slice(0, 80)}...</div>
                      </td>
                      {PAPEIS_EQUIPE.map((p) => {
                        const tipos = raci
                          .filter((r) => r.etapaNist === etapa.id && r.papel === p.id)
                          .map((r) => r.tipo);
                        return (
                          <td key={p.id} className="px-2 py-1.5 text-center">
                            <div className="flex gap-0.5 justify-center">
                              {tipos.map((t) => (
                                <Badge key={t} variant={
                                  t === "R" ? "success"
                                  : t === "A" ? "primary"
                                  : t === "C" ? "warning"
                                  : "default"
                                } className="text-[9px] font-bold px-1 py-0">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {status.etapasSemRaci.length > 0 && raci.length > 0 && (
            <div className="mt-2 text-amber-700 text-[11px]">
              ⚠ Etapas sem RACI definida: <strong>{status.etapasSemRaci.join(", ")}</strong>
            </div>
          )}
        </div>

        <div className="text-[10px] text-gray-500 italic border-t pt-2">
          📚 R = Responsável (executa) · A = Aprovador (decide) · C = Consultado (opina antes) ·
          I = Informado (avisa depois). Cada etapa pode ter VÁRIOS R/C/I mas idealmente UM só A.
        </div>
      </div>

      {/* === Modal: cadastrar/editar membro === */}
      <Dialog open={membroOpen} onOpenChange={setMembroOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMembro ? "Editar membro da equipe" : "Adicionar membro da equipe"}</DialogTitle>
            <DialogDescription className="text-[11px]">
              Inclua TODOS os contatos 24h. Quando o incidente acontece, esse telefone é o ouro.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalvarMembro} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Nome completo</Label>
                <Input name="nome" required defaultValue={editingMembro?.nome || ""} />
              </div>
              <div className="col-span-2">
                <Label>Papel</Label>
                <Select name="papel" required defaultValue={editingMembro?.papel || ""}>
                  <option value="">— selecione —</option>
                  {PAPEIS_EQUIPE.map((p) => (
                    <option key={p.id} value={p.id}>{p.emoji} {p.rotulo}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Contato 24h (celular/WhatsApp)</Label>
                <Input name="contato24h" defaultValue={editingMembro?.contato24h || ""} placeholder="(27) 99999-9999" />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input name="email" type="email" defaultValue={editingMembro?.email || ""} />
              </div>
              <div className="col-span-2">
                <Label>Cobertura</Label>
                <Input name="cobertura" defaultValue={editingMembro?.cobertura || ""} placeholder="Ex: primário, backup quando férias do DPO" />
              </div>
              <div className="col-span-2">
                <Label>Observação</Label>
                <Textarea name="observacao" rows={2} defaultValue={editingMembro?.observacao || ""} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMembroOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando..." : (editingMembro ? "Atualizar" : "Adicionar")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* === Modal: editar matriz RACI === */}
      <Dialog open={raciOpen} onOpenChange={setRaciOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Matriz RACI</DialogTitle>
            <DialogDescription className="text-[11px]">
              Marque os tipos (R/A/C/I) que cada papel tem em cada etapa.
              Clique no tipo pra adicionar/remover.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left border">Etapa</th>
                  {PAPEIS_EQUIPE.map((p) => (
                    <th key={p.id} className="px-2 py-2 text-center border" title={p.descricao}>
                      <div>{p.emoji}</div>
                      <div className="text-[9px] font-normal">{p.id.replace("_", " ")}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ETAPAS_NIST.map((etapa) => (
                  <tr key={etapa.id} className="border-t">
                    <td className="px-2 py-2 border">
                      <div className="font-medium">{etapa.emoji} {etapa.rotulo}</div>
                    </td>
                    {PAPEIS_EQUIPE.map((p) => {
                      const tipos = new Set(
                        raci.filter((r) => r.etapaNist === etapa.id && r.papel === p.id).map((r) => r.tipo)
                      );
                      return (
                        <td key={p.id} className="px-1 py-2 text-center border">
                          <div className="flex gap-0.5 justify-center flex-wrap">
                            {TIPOS_RACI.map((t) => {
                              const ativo = tipos.has(t.id);
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => toggleRaci(etapa.id, p.id, t.id)}
                                  title={t.rotulo + " — " + t.descricao}
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-all ${
                                    ativo
                                      ? t.id === "R" ? "bg-emerald-500 text-white"
                                        : t.id === "A" ? "bg-blue-500 text-white"
                                        : t.id === "C" ? "bg-amber-500 text-white"
                                        : "bg-gray-500 text-white"
                                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                  }`}
                                >
                                  {t.id}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DialogFooter className="border-t pt-3">
            <Button variant="outline" onClick={() => setRaciOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvarRaci} disabled={pending}>
              <Save className="h-4 w-4" /> {pending ? "Salvando..." : "Salvar matriz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </details>
  );
}
