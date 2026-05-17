"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, FileDown, AlertTriangle, Clock, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { saveIncidente, deletarIncidente, gerarComunicacaoAnpd, gerarCartaTitulares } from "./actions";
import toast from "react-hot-toast";
import { handlePhaseSkip } from "@/lib/phase-skip-handler";

type Inc = any;

function sevBadge(s: string) {
  if (s === "CRITICA") return <Badge variant="destructive">CRÍTICA</Badge>;
  if (s === "ALTA") return <Badge variant="destructive">ALTA</Badge>;
  if (s === "MEDIA") return <Badge variant="warning">MÉDIA</Badge>;
  return <Badge variant="default">BAIXA</Badge>;
}

export function IncidentesList({ items, qtdInventariosAprovados }: { items: Inc[]; qtdInventariosAprovados: number }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Inc | null>(null);
  const [loading, setLoading] = useState(false);

  // Bloqueio firme APENAS pra criar novo manualmente. Incidentes disparados
  // pelo facilitador (M5) continuam aparecendo e sendo editáveis.
  const bloqueadoCriarNovo = qtdInventariosAprovados === 0;

  function abrirNovo() {
    if (bloqueadoCriarNovo) {
      toast.error("Aprove ao menos 1 processo no Inventário antes de registrar incidente manualmente");
      return;
    }
    setEditing(null); setOpen(true);
  }
  function abrirEdicao(i: Inc) { setEditing(i); setOpen(true); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await saveIncidente({
        id: editing?.id,
        titulo: String(fd.get("titulo") || ""),
        descricao: String(fd.get("descricao") || ""),
        severidade: String(fd.get("severidade") || "MEDIA") as any,
        status: String(fd.get("status") || "RASCUNHO"),
        ocorridoEm: String(fd.get("ocorridoEm") || ""),
        detectadoEm: String(fd.get("detectadoEm") || ""),
        comunicadoAnpd: fd.get("comunicadoAnpd") === "on",
        comunicadoTitular: fd.get("comunicadoTitular") === "on",
      });
      toast.success(editing ? "Incidente atualizado" : "Incidente registrado");
      setOpen(false);
    } catch (err: any) { if (!handlePhaseSkip(err)) toast.error(err.message); } finally { setLoading(false); }
  }

  async function deletar(id: string) {
    if (!confirm("Remover este incidente?")) return;
    try { await deletarIncidente(id); toast.success("Removido"); }
    catch (e: any) { if (!handlePhaseSkip(e)) toast.error(e.message); }
  }

  async function gerarAnpd(id: string) {
    try {
      const texto = await gerarComunicacaoAnpd(id);
      downloadTxt(texto, "comunicacao-anpd.txt");
      toast.success("Texto da Comunicação ANPD baixado");
    } catch (e: any) { if (!handlePhaseSkip(e)) toast.error(e.message); }
  }
  async function gerarCarta(id: string) {
    try {
      const texto = await gerarCartaTitulares(id);
      downloadTxt(texto, "carta-titulares.txt");
      toast.success("Carta aos titulares baixada");
    } catch (e: any) { if (!handlePhaseSkip(e)) toast.error(e.message); }
  }

  return (
    <>
      {/* Banner explicativo quando o registro manual está bloqueado */}
      {bloqueadoCriarNovo && (
        <div className="border-l-4 border-red-500 bg-red-50 rounded p-3 mb-3">
          <div className="flex items-start gap-2">
            <Lock className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-red-900 text-sm mb-1">
                Registro manual de incidente bloqueado
              </div>
              <p className="text-red-900 text-xs leading-relaxed mb-2">
                O <strong>Art. 48 §1º LGPD</strong> exige que a comunicação de incidente descreva a <em>"natureza dos dados pessoais afetados"</em> e os <em>"tipos de titulares afetados"</em> — informações que vêm do Inventário. Aprove ao menos 1 processo no Inventário antes de registrar incidente manualmente.
              </p>
              <Link
                href="/dashboard/inventario"
                className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-2 rounded"
              >
                Ir pro Inventário (Missão 1) <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <div className="text-[11px] text-red-700 mt-2">
                💡 Incidentes <strong>já existentes</strong> (incluindo os disparados pelo facilitador na M5) continuam visíveis e editáveis abaixo — o bloqueio é só pra criar novos.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end mb-3">
        <Button
          onClick={abrirNovo}
          variant="destructive"
          disabled={bloqueadoCriarNovo}
          title={bloqueadoCriarNovo ? "Aprove ao menos 1 processo no Inventário antes" : undefined}
        >
          {bloqueadoCriarNovo ? <Lock className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />} Registrar incidente
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhum incidente registrado"
          description="Quando um incidente ocorrer (real ou simulado pelo facilitador), registre aqui. O prazo de comunicação à ANPD é razoável conforme art. 48 LGPD + Res. CD/ANPD nº 15/2024."
        />
      ) : (
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Incidente</TH>
                <TH>Severidade</TH>
                <TH>Ocorrido em</TH>
                <TH>Comunicado</TH>
                <TH className="text-right">Ações</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((i: any) => (
                <TR key={i.id}>
                  <TD>
                    <div className="font-medium">{i.titulo}</div>
                    {i.descricao && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{i.descricao}</div>}
                  </TD>
                  <TD>{sevBadge(i.severidade)}</TD>
                  <TD className="text-xs">
                    {i.ocorridoEm
                      ? new Date(i.ocorridoEm).toLocaleString("pt-BR")
                      : <span className="text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" /> sem data</span>}
                  </TD>
                  <TD>
                    <div className="flex gap-1">
                      {i.comunicadoAnpd && <Badge variant="success">ANPD</Badge>}
                      {i.comunicadoTitular && <Badge variant="success">Titular</Badge>}
                      {!i.comunicadoAnpd && !i.comunicadoTitular && <Badge variant="warning">pendente</Badge>}
                    </div>
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => gerarAnpd(i.id)} title="Comunicação ANPD">
                        <FileDown className="h-4 w-4 text-brand-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => gerarCarta(i.id)} title="Carta titulares">
                        <FileDown className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => abrirEdicao(i)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => deletar(i.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar incidente" : "Registrar incidente"}</DialogTitle>
            <DialogDescription>
              Velocidade + qualidade ganham. A LGPD exige comunicação "em prazo razoável" (Res. CD/ANPD nº 15/2024).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Título do incidente</Label>
                <Input name="titulo" required defaultValue={editing?.titulo || ""} placeholder="Ex: Vazamento da base de prontuários" />
              </div>
              <div className="col-span-2">
                <Label>Descrição</Label>
                <Textarea name="descricao" rows={3} defaultValue={editing?.descricao || ""} placeholder="O que aconteceu, dados afetados, suspeita inicial..." />
              </div>
              <div>
                <Label>Severidade</Label>
                <Select name="severidade" required defaultValue={editing?.severidade || "MEDIA"}>
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta</option>
                  <option value="CRITICA">Crítica</option>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue={editing?.status || "RASCUNHO"}>
                  <option value="RASCUNHO">Rascunho</option>
                  <option value="EM_ANALISE">Em análise</option>
                  <option value="ENCERRADO">Encerrado</option>
                </Select>
              </div>
              <div>
                <Label>Ocorrido em</Label>
                <Input
                  type="datetime-local"
                  name="ocorridoEm"
                  defaultValue={editing?.ocorridoEm ? new Date(editing.ocorridoEm).toISOString().slice(0, 16) : ""}
                />
              </div>
              <div>
                <Label>Detectado em</Label>
                <Input
                  type="datetime-local"
                  name="detectadoEm"
                  defaultValue={editing?.detectadoEm ? new Date(editing.detectadoEm).toISOString().slice(0, 16) : ""}
                />
              </div>
              <div className="col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="comunicadoAnpd" defaultChecked={editing?.comunicadoAnpd ?? false} className="h-4 w-4" />
                  Comunicado à ANPD
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="comunicadoTitular" defaultChecked={editing?.comunicadoTitular ?? false} className="h-4 w-4" />
                  Comunicado aos titulares
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? "Salvando..." : (editing ? "Atualizar" : "Registrar")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function downloadTxt(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
