"use client";

import { useState } from "react";
import { Pencil, Trash2, Settings, AlertTriangle, ShieldCheck, FileSignature, Clock4, FileSearch, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveOperador, deletarOperador, tramitarOperador, encerrarTramitacaoOperador } from "./actions";
import { PAPEIS_APOIO, labelPapelApoio } from "@/lib/papeis-apoio";
import { TIPO_OPERACAO_INFO, NIVEL_RISCO_INFO } from "@/lib/seeds/terceiros-vegas";
import { calcularDueDiligence, RECOMENDACAO_INFO, type RespostaDD } from "@/lib/due-diligence";
import { GerenciarOperadorDrawer } from "./gerenciar-operador-drawer";
import toast from "react-hot-toast";
import { handlePhaseSkipResult } from "@/lib/phase-skip-handler";

type Op = any;

export function TerceirosList({ items, role }: { items: Op[]; role: string | null }) {
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Op | null>(null);
  const [loading, setLoading] = useState(false);

  // Drawer único com 3 abas (Risco / DD / Cláusulas)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerOp, setDrawerOp] = useState<Op | null>(null);

  function abrirEdicao(op: Op) { setEditing(op); setEditOpen(true); }

  function abrirDrawer(op: Op) {
    setDrawerOp(op);
    setDrawerOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const r = await saveOperador({
        id: editing?.id,
        nome: String(fd.get("nome") || ""),
        cnpj: String(fd.get("cnpj") || ""),
        servico: String(fd.get("servico") || ""),
        contato: String(fd.get("contato") || ""),
        contratoNumero: String(fd.get("contratoNumero") || ""),
        contratoObjeto: String(fd.get("contratoObjeto") || ""),
        clausulasLgpd: fd.get("clausulasLgpd") === "on",
      });
      if (handlePhaseSkipResult(r)) return;
      toast.success(editing ? "Operador atualizado" : "Operador registrado");
      setEditOpen(false);
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  }

  async function deletar(id: string) {
    if (!confirm("Remover este operador?")) return;
    try {
      const r = await deletarOperador(id);
      if (handlePhaseSkipResult(r)) return;
      toast.success("Operador removido");
    } catch (e: any) { toast.error(e.message); }
  }

  const isDpoOuAdmin = role === "DPO" || role === "ADMIN";

  // Tramitação multi-setor (Comitê LGPD)
  const [tramitandoOp, setTramitandoOp] = useState<Op | null>(null);
  const [setorDestino, setSetorDestino] = useState<string>("PROCURADORIA");
  const [notaTramitacao, setNotaTramitacao] = useState("");

  function abrirTramitacao(op: Op) {
    setTramitandoOp(op);
    setSetorDestino("PROCURADORIA");
    setNotaTramitacao("");
  }

  async function confirmarTramitacao() {
    if (!tramitandoOp) return;
    if (notaTramitacao.trim().length < 10) {
      toast.error("Escreva uma nota com ao menos 10 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await tramitarOperador(tramitandoOp.id, setorDestino, notaTramitacao);
      toast.success("Pedido de apoio enviado ao Comitê LGPD");
      setTramitandoOp(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function encerrarTramitacao(id: string) {
    if (!confirm("Encerrar a tramitação deste terceiro?")) return;
    setLoading(true);
    try {
      await encerrarTramitacaoOperador(id);
      toast.success("Tramitação encerrada");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  const c = editing?.contracts?.[0];

  return (
    <>
      {items.length === 0 ? (
        <EmptyState
          title="Aguardando cadastro de operadores"
          description="Operadores são terceiros que tratam dados em nome do controlador (art. 39 LGPD). No curso, vêm pré-cadastrados na criação da turma."
        />
      ) : (
        <div className="space-y-3">
          {items.map((op: any) => {
            const ct = op.contracts?.[0];
            const tipoInfo = ct?.tipoOperacao ? TIPO_OPERACAO_INFO[ct.tipoOperacao] : null;
            const riscoInfo = ct?.nivelRisco ? NIVEL_RISCO_INFO[ct.nivelRisco] : null;
            const qtdSelecionadas: number = (ct?.clausulasSelecionadas?.length) || 0;
            const fatoresRisco: number = (ct?.riscoFatoresMarcados?.length) || 0;
            const ddRespostas = (ct?.dueDiligenceRespostas || {}) as Record<string, RespostaDD>;
            const ddCalc = calcularDueDiligence(ddRespostas);

            const bordaPorTipo: Record<string, string> = {
              ADITIVO_NECESSARIO: "border-l-red-500",
              CONTRATO_NOVO_CLAUSULAS: "border-l-blue-500",
              RENOVACAO_ADITIVAR: "border-l-amber-500",
              CONTRATO_NOVO_ALTO_RISCO: "border-l-purple-500",
            };
            const borda = ct?.tipoOperacao ? bordaPorTipo[ct.tipoOperacao] : "border-l-gray-300";

            const tipoBadgeClass: Record<string, string> = {
              ADITIVO_NECESSARIO: "bg-red-50 border-red-200 text-red-800",
              CONTRATO_NOVO_CLAUSULAS: "bg-blue-50 border-blue-200 text-blue-800",
              RENOVACAO_ADITIVAR: "bg-amber-50 border-amber-200 text-amber-800",
              CONTRATO_NOVO_ALTO_RISCO: "bg-purple-50 border-purple-200 text-purple-800",
            };
            const riscoBadgeClass: Record<string, string> = {
              BAIXO: "bg-green-100 text-green-800 border-green-300",
              MEDIO: "bg-amber-100 text-amber-800 border-amber-300",
              ALTO:  "bg-red-100 text-red-800 border-red-300",
            };
            const ddBadgeClass: Record<string, string> = {
              APROVADO: "bg-emerald-100 text-emerald-800 border-emerald-300",
              APROVADO_COM_RESSALVAS: "bg-amber-100 text-amber-800 border-amber-300",
              REPROVADO: "bg-red-100 text-red-800 border-red-300",
              INCOMPLETO: "bg-gray-100 text-gray-600 border-gray-300",
            };

            return (
              <div key={op.id} className={`border border-l-4 ${borda} rounded-lg bg-white p-4 shadow-sm`}>
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h3 className="font-semibold text-base">{op.nome}</h3>
                      {tipoInfo && ct?.tipoOperacao && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${tipoBadgeClass[ct.tipoOperacao]}`}>
                          {tipoInfo.emoji} {tipoInfo.label}
                        </span>
                      )}
                      {riscoInfo && ct?.nivelRisco && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${riscoBadgeClass[ct.nivelRisco]}`}
                          title={riscoInfo.sugestao}>
                          Risco {riscoInfo.label}
                        </span>
                      )}
                    </div>
                    {op.cnpj && <div className="text-xs text-gray-500">CNPJ: {op.cnpj}</div>}
                    {op.servico && <div className="text-xs text-gray-700 mt-1">{op.servico}</div>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => abrirEdicao(op)} title="Editar dados básicos">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deletar(op.id)} title="Remover">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Contrato */}
                {ct && (
                  <div className="mt-3 p-3 rounded bg-gray-50 border text-xs space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileSignature className="h-3.5 w-3.5 text-gray-500" />
                      <span className="font-medium">{ct.numero || "Sem nº de contrato"}</span>
                      {ct.vigenciaInicio && (
                        <span className="text-gray-500">
                          Vigência: {new Date(ct.vigenciaInicio).toLocaleDateString("pt-BR")}
                          {ct.vigenciaFim && <> → {new Date(ct.vigenciaFim).toLocaleDateString("pt-BR")}</>}
                        </span>
                      )}
                      {ct.clausulasLgpd ? (
                        <Badge variant="success"><ShieldCheck className="h-3 w-3 mr-1" /> com cláusulas LGPD</Badge>
                      ) : (
                        <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> sem cláusulas LGPD</Badge>
                      )}
                    </div>
                    {ct.objeto && <div className="text-gray-700">{ct.objeto}</div>}
                    {ct.observacao && (
                      <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 mt-2 flex items-start gap-1.5">
                        <Clock4 className="h-3 w-3 mt-0.5 shrink-0" />
                        <div>{ct.observacao}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Painel de status: Risco · DD · Cláusulas */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded border bg-white">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">1. Risco ANPD</div>
                    {fatoresRisco > 0 ? (
                      <div className="font-medium">{fatoresRisco} fator(es) marcado(s)</div>
                    ) : (
                      <div className="text-amber-700">Não avaliado</div>
                    )}
                  </div>
                  <div className="p-2 rounded border bg-white">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">2. Due Diligence</div>
                    {ddCalc.respondidas > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{ddCalc.percentual}%</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${ddBadgeClass[ddCalc.recomendacao]}`}>
                          {RECOMENDACAO_INFO[ddCalc.recomendacao].label}
                        </span>
                      </div>
                    ) : (
                      <div className="text-amber-700">Não preenchido</div>
                    )}
                  </div>
                  <div className="p-2 rounded border bg-white">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">3. Cláusulas</div>
                    {qtdSelecionadas > 0 ? (
                      <div className="font-medium">{qtdSelecionadas} selecionada(s)</div>
                    ) : (
                      <div className="text-amber-700">Não selecionadas</div>
                    )}
                  </div>
                </div>

                {/* Tramitação multi-setor */}
                {op.tramitadoPara && !op.tramitacaoParecer && (
                  <div className="mt-3 text-xs bg-violet-50 border border-violet-200 rounded p-2.5">
                    <div className="flex items-center gap-1.5 text-violet-800 font-medium">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      Em tramitação — aguardando parecer de {labelPapelApoio(op.tramitadoPara)}
                    </div>
                    {op.tramitacaoNota && (
                      <div className="text-violet-900 italic mt-1">&quot;{op.tramitacaoNota}&quot;</div>
                    )}
                  </div>
                )}
                {op.tramitadoPara && op.tramitacaoParecer && (
                  <div className="mt-3 text-xs bg-emerald-50 border border-emerald-200 rounded p-2.5">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      Parecer recebido de {labelPapelApoio(op.tramitadoPara)}
                    </div>
                    {op.tramitacaoNota && (
                      <div className="text-gray-500 mt-1">Pedido: &quot;{op.tramitacaoNota}&quot;</div>
                    )}
                    <div className="text-emerald-900 mt-1 leading-relaxed whitespace-pre-wrap">{op.tramitacaoParecer}</div>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-end gap-2 flex-wrap">
                  {isDpoOuAdmin && !op.tramitadoPara && (
                    <Button size="sm" variant="ghost" onClick={() => abrirTramitacao(op)}
                      className="border border-violet-300 text-violet-700 hover:bg-violet-50">
                      <Users className="h-3.5 w-3.5" /> Pedir apoio do Comitê LGPD
                    </Button>
                  )}
                  {isDpoOuAdmin && op.tramitadoPara && (
                    <Button size="sm" variant="ghost" onClick={() => encerrarTramitacao(op.id)} disabled={loading}
                      className="border border-gray-300 text-gray-600 hover:bg-gray-50">
                      Encerrar tramitação
                    </Button>
                  )}
                  <Button size="sm" variant="primary" onClick={() => abrirDrawer(op)}>
                    <Settings className="h-3.5 w-3.5" /> Gerenciar operador
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer único com 3 abas */}
      <GerenciarOperadorDrawer
        op={drawerOp}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Edição de dados básicos (legado) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar operador" : "Novo operador"}</DialogTitle>
            <DialogDescription>
              Operador = terceiro que trata dados em nome do controlador. Sem cláusulas LGPD no contrato,
              o controlador responde pelo erro do operador.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Razão social</Label><Input name="nome" required defaultValue={editing?.nome || ""} /></div>
              <div><Label>CNPJ</Label><Input name="cnpj" defaultValue={editing?.cnpj || ""} placeholder="00.000.000/0000-00" /></div>
              <div><Label>Contato (e-mail/tel)</Label><Input name="contato" defaultValue={editing?.contato || ""} /></div>
              <div className="col-span-2"><Label>Serviço prestado</Label><Input name="servico" defaultValue={editing?.servico || ""} /></div>
              <div><Label>Nº do contrato</Label><Input name="contratoNumero" defaultValue={c?.numero || ""} /></div>
              <div className="col-span-2"><Label>Objeto do contrato</Label><Textarea name="contratoObjeto" rows={2} defaultValue={c?.objeto || ""} /></div>
              <div className="col-span-2 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
                <input type="checkbox" name="clausulasLgpd" id="clausulasLgpd" defaultChecked={c?.clausulasLgpd ?? false} className="h-4 w-4" />
                <Label htmlFor="clausulasLgpd" className="mb-0 text-amber-900">
                  Contrato contém cláusulas LGPD (art. 39 da LGPD)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Atualizar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: tramitação multi-setor */}
      <Dialog open={!!tramitandoOp} onOpenChange={(v) => { if (!v) setTramitandoOp(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>👥 Pedir apoio do Comitê LGPD</DialogTitle>
            <DialogDescription>
              Encaminhe &quot;{tramitandoOp?.nome}&quot; pra um setor de apoio dar um parecer. O setor
              responde com uma opinião — quem ajusta o cadastro do terceiro continua sendo você.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Setor de apoio</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {PAPEIS_APOIO.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSetorDestino(p.id)}
                    className={`text-left text-sm border rounded px-2.5 py-2 transition-colors ${
                      setorDestino === p.id
                        ? "border-violet-500 bg-violet-50 text-violet-900 font-medium"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>O que você precisa do setor?</Label>
              <Textarea
                rows={3}
                value={notaTramitacao}
                onChange={(e) => setNotaTramitacao(e.target.value)}
                placeholder="Ex: revisar se as cláusulas LGPD do contrato cobrem a transferência internacional…"
              />
              <p className="text-[11px] text-gray-500 mt-1">Mínimo 10 caracteres.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTramitandoOp(null)}>Cancelar</Button>
            <Button onClick={confirmarTramitacao} disabled={loading || notaTramitacao.trim().length < 10}>
              {loading ? "Enviando…" : "Enviar pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
