"use client";

import { useState } from "react";
import { Pencil, Trash2, Clock, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { saveIncidente, deletarIncidente } from "./actions";
import { FormularioAnpdModal } from "./formulario-anpd-modal";
import { FormularioTitularesModal } from "./formulario-titulares-modal";
import {
  completudeAnpd, completudeTitulares,
  type FormularioAnpd, type FormularioTitulares,
} from "@/lib/incidente-formulario";
import toast from "react-hot-toast";
import { handlePhaseSkipResult } from "@/lib/phase-skip-handler";

type Inc = any;

function sevBadge(s: string) {
  if (s === "CRITICA") return <Badge variant="destructive">CRÍTICA</Badge>;
  if (s === "ALTA") return <Badge variant="destructive">ALTA</Badge>;
  if (s === "MEDIA") return <Badge variant="warning">MÉDIA</Badge>;
  return <Badge variant="default">BAIXA</Badge>;
}

// `qtdInventariosAprovados` segue na assinatura pra manter compat com a page.tsx
// e com o action publicarAviso (Inventário aprovado é pré-requisito de criação
// manual no servidor). Não é mais usado na UI porque a criação manual saiu.
export function IncidentesList({ items }: { items: Inc[]; qtdInventariosAprovados?: number }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Inc | null>(null);
  const [loading, setLoading] = useState(false);

  // Modais dos formulários (Comunicação ANPD + Carta Titulares)
  const [anpdOpen, setAnpdOpen] = useState(false);
  const [anpdAlvo, setAnpdAlvo] = useState<Inc | null>(null);
  const [titularesOpen, setTitularesOpen] = useState(false);
  const [titularesAlvo, setTitularesAlvo] = useState<Inc | null>(null);

  function abrirEdicao(i: Inc) { setEditing(i); setOpen(true); }
  function abrirAnpd(i: Inc) { setAnpdAlvo(i); setAnpdOpen(true); }
  function abrirTitulares(i: Inc) { setTitularesAlvo(i); setTitularesOpen(true); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const r = await saveIncidente({
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
      if (handlePhaseSkipResult(r)) return;
      toast.success(editing ? "Incidente atualizado" : "Incidente registrado");
      setOpen(false);
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  }

  async function deletar(id: string) {
    if (!confirm("Remover este incidente?")) return;
    try {
      const r = await deletarIncidente(id);
      if (handlePhaseSkipResult(r)) return;
      toast.success("Removido");
    } catch (e: any) { toast.error(e.message); }
  }

  // Funções de download removidas — agora o DPO preenche e edita inline
  // via FormularioAnpdModal + FormularioTitularesModal. Texto final fica
  // disponível em "Salvar + Ver texto final" dentro de cada modal.

  return (
    <>
      {/* Card de orientações ao DPO — sempre disponível pra consulta */}
      <details className="mb-3 border border-blue-200 bg-blue-50 rounded-lg overflow-hidden group">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-blue-900 hover:bg-blue-100 flex items-center gap-2 select-none">
          <span className="text-base">📋</span>
          <span className="flex-1">Como responder a um incidente — 7 etapas</span>
          <span className="text-xs text-blue-600 group-open:hidden">Mostrar</span>
          <span className="text-xs text-blue-600 hidden group-open:inline">Esconder</span>
        </summary>
        <div className="px-4 py-3 border-t border-blue-200 bg-white text-xs text-gray-800 space-y-2">
          <ol className="space-y-2 list-none">
            <li className="flex gap-2">
              <span className="font-bold text-blue-700 shrink-0">1.</span>
              <div>
                <strong>Validar severidade.</strong> Baseie-se em: volume de titulares, sensibilidade dos dados,
                potencial de dano (discriminação, reputação, integridade física). Dados sensíveis sempre puxam pra ALTA/CRÍTICA.
              </div>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-700 shrink-0">2.</span>
              <div>
                <strong>Mudar status pra &quot;Em análise&quot;.</strong> Isso é o gatilho pedagógico que <em>libera os botões
                de download</em> dos documentos. Sem análise, sem comunicação.
              </div>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-700 shrink-0">3.</span>
              <div>
                <strong>Confirmar a cronologia.</strong> Preencher <em>Ocorrido em</em> e <em>Detectado em</em>.
                A diferença entre os 2 mede a maturidade da detecção (quanto menor, melhor).
              </div>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-700 shrink-0">4.</span>
              <div>
                <strong>Clicar &quot;Atualizar&quot;.</strong> Salva. Modal fecha. Volta pra lista.
              </div>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-700 shrink-0">5.</span>
              <div>
                <strong>Baixar os 2 documentos.</strong> Aparecem 2 ícones na linha:
                <span className="inline-block mx-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">📄 Comunicação ANPD</span>
                (Art. 48 LGPD + Res. CD/ANPD nº 15/2024) e
                <span className="inline-block mx-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">📄 Carta Titulares</span>
                (em linguagem clara). Preencher os campos <code className="bg-gray-100 px-1">[a preencher]</code> em conjunto com Procuradoria + TI.
              </div>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-700 shrink-0">6.</span>
              <div>
                <strong>Marcar os checkboxes.</strong> Voltar a editar e marcar
                ☑ <em>Comunicado à ANPD</em> e ☑ <em>Comunicado aos titulares</em> conforme os DOCX foram enviados.
              </div>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-700 shrink-0">7.</span>
              <div>
                <strong>Encerrar.</strong> Status: <em>Encerrado</em>. O banner vermelho some, sirene para,
                e a missão M5 ganha tick verde na sidebar.
              </div>
            </li>
          </ol>
          <div className="mt-2 pt-2 border-t border-gray-200 text-[11px] text-gray-600 italic">
            ⏱ Tempo esperado pelo roteiro: ~25 minutos. Prazo legal pra comunicar à ANPD:
            até 3 dias úteis (Res. CD/ANPD nº 15/2024).
          </div>
        </div>
      </details>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhum incidente registrado"
          description="Quando um incidente ocorrer (e não tenha dúvida que vai, só não sabemos quando!), lembrar que o prazo de comunicação à ANPD é muito curto (notificação em até 3 dias úteis). A notificação é obrigatória sempre que o incidente puder acarretar risco ou dano relevante aos titulares, como nos casos de discriminação ou danos à reputação."
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
                    <div className="flex justify-end gap-1 items-center flex-wrap">
                      {/* Formulários só liberam após análise (status != RASCUNHO).
                          Sem análise prévia, abrir o form é compliance fake. */}
                      {i.status === "RASCUNHO" ? (
                        <span className="text-[10px] text-gray-500 italic mr-1" title="Mude status pra EM_ANÁLISE antes de comunicar ANPD/Titulares">
                          🔒 Comunicações liberam após análise
                        </span>
                      ) : (
                        <>
                          {(() => {
                            const cAnpd = completudeAnpd(i.formularioAnpd as FormularioAnpd | null);
                            const cTit = completudeTitulares(i.formularioTitulares as FormularioTitulares | null);
                            return (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => abrirAnpd(i)}
                                  title="Comunicação ANPD"
                                  className="text-[11px]"
                                >
                                  <Mail className="h-3.5 w-3.5 text-brand-600" />
                                  <span className="hidden sm:inline ml-1">ANPD</span>
                                  <span className={`ml-1 text-[9px] px-1 rounded ${
                                    cAnpd.preenchidos === cAnpd.total ? "bg-emerald-100 text-emerald-700"
                                    : cAnpd.preenchidos > 0 ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-500"
                                  }`}>
                                    {cAnpd.preenchidos}/{cAnpd.total}
                                  </span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => abrirTitulares(i)}
                                  title="Carta aos Titulares"
                                  className="text-[11px]"
                                >
                                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                                  <span className="hidden sm:inline ml-1">Titulares</span>
                                  <span className={`ml-1 text-[9px] px-1 rounded ${
                                    cTit.preenchidos === cTit.total ? "bg-emerald-100 text-emerald-700"
                                    : cTit.preenchidos > 0 ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-500"
                                  }`}>
                                    {cTit.preenchidos}/{cTit.total}
                                  </span>
                                </Button>
                              </>
                            );
                          })()}
                        </>
                      )}
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

          {/* Faixa contextual com a sequência de etapas */}
          <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-900 -mt-2">
            <div className="font-semibold mb-1">📋 Sequência sugerida:</div>
            <ol className="list-decimal list-inside space-y-0.5 ml-1">
              <li>Validar <strong>Severidade</strong></li>
              <li>Mudar <strong>Status</strong> pra &quot;Em análise&quot; (libera DOCX)</li>
              <li>Confirmar <strong>Cronologia</strong></li>
              <li>Clicar <strong>Atualizar</strong></li>
              <li>Voltar à lista, baixar <strong>Comunicação ANPD</strong> + <strong>Carta Titulares</strong></li>
              <li>Marcar <strong>checkboxes</strong> de comunicação após envio</li>
              <li>Mudar <strong>Status</strong> pra &quot;Encerrado&quot;</li>
            </ol>
          </div>

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

      {/* Modais dos formulários inline (Comunicação ANPD + Carta Titulares) */}
      {anpdAlvo && (
        <FormularioAnpdModal
          incidenteId={anpdAlvo.id}
          incidenteTitulo={anpdAlvo.titulo}
          initial={anpdAlvo.formularioAnpd as FormularioAnpd | null}
          open={anpdOpen}
          onClose={() => setAnpdOpen(false)}
        />
      )}
      {titularesAlvo && (
        <FormularioTitularesModal
          incidenteId={titularesAlvo.id}
          incidenteTitulo={titularesAlvo.titulo}
          initial={titularesAlvo.formularioTitulares as FormularioTitulares | null}
          open={titularesOpen}
          onClose={() => setTitularesOpen(false)}
        />
      )}
    </>
  );
}
