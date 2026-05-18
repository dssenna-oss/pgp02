"use client";

// Drawer único pra gerenciar um operador — 3 abas:
//   1. Análise de Risco (Res. ANPD nº 2, art. 4º)
//   2. Due Diligence (questionário Cyber+LGPD)
//   3. Cláusulas Contratuais + Gerar DOCX
//
// O nível de risco da aba 1 alimenta a sugestão automática da aba 3.
// O resultado do DD não trava nada, é só recomendação ao DPO.

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ShieldAlert, FileSearch, FileText, Download, CheckCircle2, Mail, BookOpen } from "lucide-react";
import { salvarAvaliacaoRisco, salvarDueDiligence, salvarSelecaoClausulas } from "./actions";
import { CATALOGO_CLAUSULAS, clausulasSugeridasPorRisco } from "@/lib/clausulas-lgpd";
import { TIPO_OPERACAO_INFO } from "@/lib/seeds/terceiros-vegas";
import { FATORES_RISCO_ANPD, explicarRisco } from "@/lib/risco-anpd";
import { PERGUNTAS_DD, BLOCOS_DD, calcularDueDiligence, RECOMENDACAO_INFO, type RespostaDD } from "@/lib/due-diligence";
import toast from "react-hot-toast";
import { handlePhaseSkipResult } from "@/lib/phase-skip-handler";

type Op = any;
type Aba = "RISCO" | "DD" | "CLAUSULAS";

const NIVEL_BADGE: Record<string, string> = {
  BAIXO: "bg-green-100 text-green-800 border-green-300",
  MEDIO: "bg-amber-100 text-amber-800 border-amber-300",
  ALTO:  "bg-red-100 text-red-800 border-red-300",
};

const RECOM_BADGE: Record<string, string> = {
  APROVADO: "bg-emerald-100 text-emerald-800 border-emerald-300",
  APROVADO_COM_RESSALVAS: "bg-amber-100 text-amber-800 border-amber-300",
  REPROVADO: "bg-red-100 text-red-800 border-red-300",
  INCOMPLETO: "bg-gray-100 text-gray-700 border-gray-300",
};

export function GerenciarOperadorDrawer({
  op,
  open,
  onClose,
}: {
  op: Op | null;
  open: boolean;
  onClose: () => void;
}) {
  const ct = op?.contracts?.[0];
  const [aba, setAba] = useState<Aba>("RISCO");
  const [loading, setLoading] = useState(false);

  // === Aba 1: Risco ===
  const [fatoresMarcados, setFatoresMarcados] = useState<string[]>([]);

  // === Aba 2: Due Diligence ===
  const [ddRespostas, setDdRespostas] = useState<Record<string, RespostaDD>>({});

  // === Aba 3: Cláusulas ===
  const [clausulasSel, setClausulasSel] = useState<string[]>([]);
  const [tipoOpcao, setTipoOpcao] = useState<string>("");

  // Sincroniza estado quando o operador muda
  useEffect(() => {
    if (!op || !ct) return;
    setFatoresMarcados(ct.riscoFatoresMarcados || []);
    setDdRespostas((ct.dueDiligenceRespostas as Record<string, RespostaDD>) || {});
    setTipoOpcao(ct.tipoOperacao || "");
    // Cláusulas: se nada selecionado, sugere baseado no risco atual
    const jaSelecionadas: string[] = ct.clausulasSelecionadas || [];
    setClausulasSel(
      jaSelecionadas.length > 0
        ? jaSelecionadas
        : clausulasSugeridasPorRisco(ct.nivelRisco),
    );
    setAba("RISCO"); // reset pra aba 1 ao abrir
  }, [op?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!op) return null;

  // Cálculo automático do risco em real-time conforme marca
  const explicacao = explicarRisco(fatoresMarcados);
  const nivelAtual = explicacao.nivel;

  // Cálculo do DD em real-time
  const ddCalc = calcularDueDiligence(ddRespostas);
  const recomendacaoInfo = RECOMENDACAO_INFO[ddCalc.recomendacao];

  // === Handlers ===
  function toggleFator(id: string) {
    setFatoresMarcados((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  function setDD(id: string, resp: RespostaDD) {
    setDdRespostas((s) => ({ ...s, [id]: resp }));
  }

  function toggleClausula(id: string) {
    setClausulasSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  async function salvarRisco() {
    setLoading(true);
    try {
      const r = await salvarAvaliacaoRisco({ operatorId: op.id, fatoresMarcados });
      if (handlePhaseSkipResult(r)) return;
      toast.success(`Risco salvo: ${nivelAtual}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  }

  async function salvarDD() {
    setLoading(true);
    try {
      const r = await salvarDueDiligence({ operatorId: op.id, respostas: ddRespostas });
      if (handlePhaseSkipResult(r)) return;
      toast.success("Due Diligence salvo");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  }

  async function salvarClausulas() {
    setLoading(true);
    try {
      const r = await salvarSelecaoClausulas({
        operatorId: op.id,
        clausulasSelecionadas: clausulasSel,
        tipoOperacao: tipoOpcao || undefined,
      });
      if (handlePhaseSkipResult(r)) return;
      toast.success("Cláusulas salvas");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  }

  function baixarDocx() {
    if (clausulasSel.length === 0) {
      toast.error("Selecione pelo menos uma cláusula.");
      return;
    }
    salvarClausulas().then(() => {
      window.open(`/api/curso/terceiros/${op.id}/clausulas-docx`, "_blank");
    });
  }

  // === Render ===
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-700" />
            Gestão do Operador — {op.nome}
          </DialogTitle>
          <DialogDescription>
            {ct?.numero && <span className="font-mono mr-2">{ct.numero}</span>}
            {ct?.objeto}
          </DialogDescription>
        </DialogHeader>

        {/* Abas */}
        <div className="flex border-b -mx-6 px-6 flex-wrap">
          {([
            { id: "RISCO", label: "1. Análise de Risco", icon: ShieldAlert },
            { id: "DD", label: "2. Due Diligence", icon: FileSearch },
            { id: "CLAUSULAS", label: "3. Cláusulas Contratuais", icon: FileText },
          ] as const).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAba(a.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                aba === a.id
                  ? "border-purple-600 text-purple-700"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <a.icon className="h-4 w-4" />
              {a.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          {aba === "RISCO" && (
            <RiscoTab
              fatoresMarcados={fatoresMarcados}
              toggleFator={toggleFator}
              explicacao={explicacao}
              nivelAtual={nivelAtual}
            />
          )}
          {aba === "DD" && (
            <DueDiligenceTab
              ddRespostas={ddRespostas}
              setDD={setDD}
              ddCalc={ddCalc}
              recomendacaoInfo={recomendacaoInfo}
            />
          )}
          {aba === "CLAUSULAS" && (
            <ClausulasTab
              clausulasSel={clausulasSel}
              toggleClausula={toggleClausula}
              tipoOpcao={tipoOpcao}
              setTipoOpcao={setTipoOpcao}
              nivelRiscoAtual={ct?.nivelRisco || nivelAtual}
            />
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2 border-t pt-3">
          <div className="text-xs text-gray-500 flex-1">
            {aba === "RISCO" && (
              <>Fatores marcados: <strong>{fatoresMarcados.length}</strong>/{FATORES_RISCO_ANPD.length}</>
            )}
            {aba === "DD" && (
              <>Respondidas: <strong>{ddCalc.respondidas}</strong>/{ddCalc.total} · {ddCalc.percentual}% aderência</>
            )}
            {aba === "CLAUSULAS" && (
              <>{clausulasSel.length}/{CATALOGO_CLAUSULAS.length} cláusulas selecionadas</>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          {aba === "RISCO" && (
            <Button onClick={salvarRisco} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Risco"}
            </Button>
          )}
          {aba === "DD" && (
            <Button onClick={salvarDD} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Due Diligence"}
            </Button>
          )}
          {aba === "CLAUSULAS" && (
            <>
              <Button variant="outline" onClick={salvarClausulas} disabled={loading}>
                {loading ? "Salvando..." : "Salvar seleção"}
              </Button>
              <Button onClick={baixarDocx} disabled={loading || clausulasSel.length === 0}>
                <Download className="h-4 w-4" /> Salvar + Gerar DOCX
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// === Aba 1: Risco ===
function RiscoTab({
  fatoresMarcados,
  toggleFator,
  explicacao,
  nivelAtual,
}: {
  fatoresMarcados: string[];
  toggleFator: (id: string) => void;
  explicacao: ReturnType<typeof explicarRisco>;
  nivelAtual: "BAIXO" | "MEDIO" | "ALTO";
}) {
  const gerais = FATORES_RISCO_ANPD.filter((f) => f.categoria === "geral");
  const especificos = FATORES_RISCO_ANPD.filter((f) => f.categoria === "especifico");

  return (
    <div className="space-y-3">
      {/* Régua + explicação atual */}
      <div className="p-3 rounded bg-gray-50 border text-xs space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <BookOpen className="h-3.5 w-3.5 text-gray-500 shrink-0" />
          <span className="font-medium">Régua do art. 4º · Res. CD/ANPD nº 2/2022:</span>
          <span>
            ≥1 critério geral + ≥1 específico = <strong>ALTO</strong>;
            só um lado = <strong>MÉDIO</strong>; nenhum = <strong>BAIXO</strong>.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t">
          <span className="font-medium">Resultado atual:</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${NIVEL_BADGE[nivelAtual]}`}>
            Risco {nivelAtual}
          </span>
          <span className="text-gray-700">{explicacao.explicacao}</span>
        </div>
      </div>

      {/* Critérios Gerais */}
      <div>
        <div className="text-[11px] font-semibold uppercase px-2 py-1 rounded border bg-blue-50 text-blue-800 border-blue-200">
          Critérios Gerais (art. 4º, I) — marque os que se aplicam
        </div>
        <div className="mt-1 space-y-1">
          {gerais.map((f) => {
            const checked = fatoresMarcados.includes(f.id);
            return (
              <label
                key={f.id}
                className={`flex items-start gap-2 p-3 rounded border cursor-pointer transition-colors ${
                  checked ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleFator(f.id)}
                  className="h-4 w-4 mt-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{f.rotulo}</div>
                  <div className="text-[11px] text-gray-600 mt-0.5">{f.descricao}</div>
                  <div className="text-[11px] text-gray-500 italic mt-1">{f.exemplo}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Critérios Específicos */}
      <div>
        <div className="text-[11px] font-semibold uppercase px-2 py-1 rounded border bg-purple-50 text-purple-800 border-purple-200">
          Critérios Específicos (art. 4º, II) — marque os que se aplicam
        </div>
        <div className="mt-1 space-y-1">
          {especificos.map((f) => {
            const checked = fatoresMarcados.includes(f.id);
            return (
              <label
                key={f.id}
                className={`flex items-start gap-2 p-3 rounded border cursor-pointer transition-colors ${
                  checked ? "bg-purple-50 border-purple-300" : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleFator(f.id)}
                  className="h-4 w-4 mt-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{f.rotulo}</div>
                  <div className="text-[11px] text-gray-600 mt-0.5">{f.descricao}</div>
                  <div className="text-[11px] text-gray-500 italic mt-1">{f.exemplo}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// === Aba 2: Due Diligence ===
function DueDiligenceTab({
  ddRespostas,
  setDD,
  ddCalc,
  recomendacaoInfo,
}: {
  ddRespostas: Record<string, RespostaDD>;
  setDD: (id: string, resp: RespostaDD) => void;
  ddCalc: ReturnType<typeof calcularDueDiligence>;
  recomendacaoInfo: { label: string; cor: string; mensagem: string };
}) {
  return (
    <div className="space-y-3">
      {/* Score + recomendação atual */}
      <div className="p-3 rounded bg-gray-50 border space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium">Aderência geral:</span>
          <span className="text-lg font-bold text-gray-900">{ddCalc.percentual}%</span>
          <span className="text-[11px] text-gray-500">
            ({ddCalc.pontosObtidos}/{ddCalc.pontosPossiveis} pontos · {ddCalc.respondidas}/{ddCalc.total} respondidas)
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${RECOM_BADGE[ddCalc.recomendacao]}`}>
            {recomendacaoInfo.label}
          </span>
        </div>
        <div className="text-[11px] text-gray-700">{recomendacaoInfo.mensagem}</div>
        {/* Barra de progresso */}
        <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
          <div
            className={`h-full transition-all ${
              ddCalc.percentual >= 80 ? "bg-emerald-500" :
              ddCalc.percentual >= 50 ? "bg-amber-500" :
              ddCalc.percentual > 0 ? "bg-red-500" : "bg-gray-300"
            }`}
            style={{ width: `${ddCalc.percentual}%` }}
          />
        </div>
      </div>

      {/* Perguntas agrupadas por bloco */}
      {BLOCOS_DD.map((bloco) => {
        const perguntas = PERGUNTAS_DD.filter((p) => p.bloco === bloco);
        const blocoStat = ddCalc.porBloco[bloco];
        return (
          <div key={bloco}>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase px-2 py-1 rounded border bg-gray-100 text-gray-700 border-gray-200">
              <span>{bloco}</span>
              {blocoStat && (
                <span className="font-normal normal-case">
                  {blocoStat.respondidas}/{blocoStat.total} respondidas
                </span>
              )}
            </div>
            <div className="mt-1 space-y-1">
              {perguntas.map((p) => {
                const resp = ddRespostas[p.id];
                const categoriaTag = p.categoria === "CYBER" ? "🛡️ CYBER"
                                  : p.categoria === "LGPD" ? "📜 LGPD"
                                  : "🛡️📜 CYBER+LGPD";
                return (
                  <div key={p.id} className="p-3 rounded border bg-white border-gray-200">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-[10px] font-mono text-gray-500 mt-0.5">{p.id}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                        {categoriaTag}
                      </span>
                    </div>
                    <div className="text-sm font-medium mb-1">{p.pergunta}</div>
                    {p.dica && <div className="text-[11px] text-gray-500 italic mb-2">💡 {p.dica}</div>}
                    <div className="flex items-center gap-2">
                      {(["S", "N", "NA"] as const).map((opt) => {
                        const label = opt === "S" ? "Sim" : opt === "N" ? "Não" : "N/A";
                        const color = opt === "S" ? "emerald" : opt === "N" ? "red" : "gray";
                        const selected = resp === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setDD(p.id, opt)}
                            className={`text-xs px-3 py-1.5 rounded border font-medium transition-colors ${
                              selected
                                ? color === "emerald" ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                                : color === "red"     ? "bg-red-100 border-red-400 text-red-800"
                                                      : "bg-gray-200 border-gray-400 text-gray-800"
                                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// === Aba 3: Cláusulas ===
function ClausulasTab({
  clausulasSel,
  toggleClausula,
  tipoOpcao,
  setTipoOpcao,
  nivelRiscoAtual,
}: {
  clausulasSel: string[];
  toggleClausula: (id: string) => void;
  tipoOpcao: string;
  setTipoOpcao: (v: string) => void;
  nivelRiscoAtual: "BAIXO" | "MEDIO" | "ALTO" | string;
}) {
  return (
    <div className="space-y-3">
      {/* Contexto + ajuste de tipo */}
      <div className="p-3 rounded bg-gray-50 border space-y-2">
        <div className="text-xs">
          <span className="font-medium">Nível de risco atual:</span>{" "}
          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${NIVEL_BADGE[nivelRiscoAtual] || "bg-gray-100"}`}>
            {nivelRiscoAtual || "Não definido"}
          </span>
          <span className="text-gray-500 ml-2">
            (definido na aba "1. Análise de Risco" — sugere automaticamente as cláusulas abaixo)
          </span>
        </div>
        <div>
          <Label className="text-xs">Tipo de operação contratual</Label>
          <Select value={tipoOpcao} onChange={(e) => setTipoOpcao(e.target.value)}>
            <option value="">— não definido —</option>
            {Object.entries(TIPO_OPERACAO_INFO).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Lista de cláusulas agrupadas por nível */}
      {(["essencial", "simples", "robusta"] as const).map((nivel) => {
        const grupo = CATALOGO_CLAUSULAS.filter((c) => c.nivel === nivel);
        const labelNivel = nivel === "essencial" ? "Essenciais (sempre incluir)"
                        : nivel === "simples"   ? "Simples (recomendadas no risco MÉDIO+)"
                                                : "Robustas (obrigatórias no risco ALTO)";
        const corHeader = nivel === "essencial" ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                       : nivel === "simples"    ? "bg-blue-50 text-blue-800 border-blue-200"
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
  );
}
