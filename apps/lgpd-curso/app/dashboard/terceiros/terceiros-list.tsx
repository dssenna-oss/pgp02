"use client";

import { useState } from "react";
import { Pencil, Trash2, FileText, Download, AlertTriangle, ShieldCheck, FileSignature, Clock4 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { saveOperador, deletarOperador, salvarSelecaoClausulas } from "./actions";
import { CATALOGO_CLAUSULAS, clausulasSugeridasPorRisco } from "@/lib/clausulas-lgpd";
import { TIPO_OPERACAO_INFO, NIVEL_RISCO_INFO } from "@/lib/seeds/terceiros-vegas";
import toast from "react-hot-toast";
import { handlePhaseSkipResult } from "@/lib/phase-skip-handler";

type Op = any;

export function TerceirosList({ items }: { items: Op[] }) {
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Op | null>(null);
  const [loading, setLoading] = useState(false);

  // Drawer de gerenciamento de cláusulas
  const [clausulasOpen, setClausulasOpen] = useState(false);
  const [clausulasOp, setClausulasOp] = useState<Op | null>(null);
  const [clausulasSel, setClausulasSel] = useState<string[]>([]);
  const [tipoOpcao, setTipoOpcao] = useState<string>("");
  const [nivelRisco, setNivelRisco] = useState<string>("");

  function abrirEdicao(op: Op) { setEditing(op); setEditOpen(true); }

  function abrirClausulas(op: Op) {
    setClausulasOp(op);
    const c = op.contracts?.[0];
    const selecionadasAtuais: string[] = c?.clausulasSelecionadas || [];
    // Se ainda não tem nada selecionado, sugere baseado no risco
    const inicial = selecionadasAtuais.length > 0
      ? selecionadasAtuais
      : clausulasSugeridasPorRisco(c?.nivelRisco);
    setClausulasSel(inicial);
    setTipoOpcao(c?.tipoOperacao || "");
    setNivelRisco(c?.nivelRisco || "");
    setClausulasOpen(true);
  }

  function toggleClausula(id: string) {
    setClausulasSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  async function salvarClausulas() {
    if (!clausulasOp) return;
    setLoading(true);
    try {
      const r = await salvarSelecaoClausulas({
        operatorId: clausulasOp.id,
        clausulasSelecionadas: clausulasSel,
        tipoOperacao: tipoOpcao || undefined,
        nivelRisco: nivelRisco || undefined,
      });
      if (handlePhaseSkipResult(r)) return;
      toast.success("Cláusulas salvas");
      setClausulasOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  function baixarDocx() {
    if (!clausulasOp) return;
    if (clausulasSel.length === 0) {
      toast.error("Selecione pelo menos uma cláusula.");
      return;
    }
    // Salva primeiro pra garantir que o DOCX reflita a seleção atual
    salvarClausulas().then(() => {
      window.open(`/api/curso/terceiros/${clausulasOp.id}/clausulas-docx`, "_blank");
    });
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
            const totalCatalogo = CATALOGO_CLAUSULAS.length;

            const bordaPorTipo: Record<string, string> = {
              ADITIVO_NECESSARIO: "border-l-red-500",
              CONTRATO_NOVO_CLAUSULAS: "border-l-blue-500",
              RENOVACAO_ADITIVAR: "border-l-amber-500",
              CONTRATO_NOVO_ALTO_RISCO: "border-l-purple-500",
            };
            const borda = ct?.tipoOperacao ? bordaPorTipo[ct.tipoOperacao] : "border-l-gray-300";

            // Classes do badge de tipo — Tailwind precisa enxergar as classes COMPLETAS
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

                {/* Ação de Cláusulas */}
                <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-xs text-gray-600">
                    {qtdSelecionadas > 0 ? (
                      <span>📝 <strong>{qtdSelecionadas}/{totalCatalogo}</strong> cláusulas selecionadas</span>
                    ) : (
                      <span className="text-amber-700">⚠️ Nenhuma cláusula selecionada ainda</span>
                    )}
                  </div>
                  <Button size="sm" variant={qtdSelecionadas > 0 ? "outline" : "primary"} onClick={() => abrirClausulas(op)}>
                    <FileText className="h-3.5 w-3.5" /> Gerenciar cláusulas
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer: gerenciar cláusulas + gerar DOCX */}
      <Dialog open={clausulasOpen} onOpenChange={setClausulasOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-700" />
              Cláusulas LGPD — {clausulasOp?.nome}
            </DialogTitle>
            <DialogDescription>
              Selecione as cláusulas que vão para o documento. Quanto maior o risco, mais cláusulas
              recomendadas. Você pode ajustar o tipo de operação e o nível de risco abaixo se a
              avaliação automática não bater com a realidade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[65vh] overflow-y-auto">
            {/* Ajuste rápido de tipo e risco */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded bg-gray-50 border">
              <div>
                <Label className="text-xs">Tipo de operação</Label>
                <Select value={tipoOpcao} onChange={(e) => setTipoOpcao(e.target.value)}>
                  <option value="">— não definido —</option>
                  {Object.entries(TIPO_OPERACAO_INFO).map(([k, v]) => (
                    <option key={k} value={k}>{v.emoji} {v.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label className="text-xs">Nível de risco (Res. ANPD nº 2/2022)</Label>
                <Select value={nivelRisco} onChange={(e) => {
                  setNivelRisco(e.target.value);
                  // Re-sugere cláusulas se nada foi customizado ainda
                  const c = clausulasOp?.contracts?.[0];
                  const customizado = (c?.clausulasSelecionadas?.length || 0) > 0;
                  if (!customizado) setClausulasSel(clausulasSugeridasPorRisco(e.target.value));
                }}>
                  <option value="">— não definido —</option>
                  {Object.entries(NIVEL_RISCO_INFO).map(([k, v]) => (
                    <option key={k} value={k}>{v.label} — {v.sugestao}</option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Lista de cláusulas agrupadas por nível */}
            <div className="space-y-2">
              {(["essencial", "simples", "robusta"] as const).map((nivel) => {
                const grupo = CATALOGO_CLAUSULAS.filter((c) => c.nivel === nivel);
                const labelNivel = nivel === "essencial" ? "Essenciais (sempre incluir)"
                                : nivel === "simples"  ? "Simples (recomendadas no risco MÉDIO+)"
                                                       : "Robustas (obrigatórias no risco ALTO)";
                const corHeader = nivel === "essencial" ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                               : nivel === "simples"   ? "bg-blue-50 text-blue-800 border-blue-200"
                                                       : "bg-purple-50 text-purple-800 border-purple-200";
                return (
                  <div key={nivel}>
                    <div className={`text-[11px] font-semibold uppercase px-2 py-1 rounded border ${corHeader}`}>
                      {labelNivel}
                    </div>
                    <div className="mt-1 space-y-1">
                      {grupo.map((cl) => {
                        const selected = clausulasSel.includes(cl.id);
                        return (
                          <label
                            key={cl.id}
                            className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                              selected ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleClausula(cl.id)}
                              className="h-4 w-4 mt-0.5 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium flex items-center gap-1.5 flex-wrap">
                                {cl.titulo}
                                {cl.transferenciaInternacional && (
                                  <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                                    🌐 transferência internacional
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-600 mt-0.5">{cl.resumo}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="flex-wrap gap-2">
            <div className="text-xs text-gray-500 flex-1">
              {clausulasSel.length} de {CATALOGO_CLAUSULAS.length} cláusulas selecionadas
            </div>
            <Button variant="outline" onClick={() => setClausulasOpen(false)}>Cancelar</Button>
            <Button variant="outline" onClick={salvarClausulas} disabled={loading}>
              {loading ? "Salvando..." : "Salvar seleção"}
            </Button>
            <Button onClick={baixarDocx} disabled={loading || clausulasSel.length === 0}>
              <Download className="h-4 w-4" /> Salvar + Gerar DOCX
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edição de dados básicos (legado — pra fix manual se preciso) */}
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
    </>
  );
}
