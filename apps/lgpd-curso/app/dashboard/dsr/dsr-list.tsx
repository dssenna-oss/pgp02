"use client";

import { useState } from "react";
import { Pencil, Mail, Send, Hourglass, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { registrarAcaoDsr } from "./actions";
import toast from "react-hot-toast";
import { handlePhaseSkipResult } from "@/lib/phase-skip-handler";

type Dsr = any;

const TIPOS = [
  { v: "ACESSO",        l: "Acesso aos dados (art. 18, II)" },
  { v: "CORRECAO",      l: "Correção de dados incompletos/inexatos (art. 18, III)" },
  { v: "EXCLUSAO",      l: "Exclusão / anonimização (art. 18, IV)" },
  { v: "PORTABILIDADE", l: "Portabilidade a outro fornecedor (art. 18, V)" },
  { v: "OPOSICAO",      l: "Oposição ao tratamento (art. 18, § 2º)" },
  { v: "INFO",          l: "Informações sobre tratamento (art. 9º)" },
  { v: "OUTRO",         l: "Outro" },
];

type AcaoTipo = "RESPONDED" | "POSTPONED" | "OTHER";

export function DsrList({ items }: { items: Dsr[] }) {
  const [loading, setLoading] = useState(false);

  // Modal de ação — único caminho do DPO. 3 opções neutras (sem nenhuma
  // dica visual do que é "certo"). O texto da 3ª opção (Outros) é o ouro
  // pedagógico — facilitador lê no debrief pra ver quem teve a sacada de
  // pedir identidade.
  const [acaoOpen, setAcaoOpen] = useState(false);
  const [acaoDsr, setAcaoDsr] = useState<Dsr | null>(null);
  const [acaoTipo, setAcaoTipo] = useState<AcaoTipo | null>(null);
  const [acaoTexto, setAcaoTexto] = useState("");

  const surpresaPendentes = items.filter(
    (d: any) => d.disparoFacilitador && !d.gameAction
  ).length;

  function abrirAcao(d: Dsr) {
    setAcaoDsr(d);
    setAcaoTipo(null);
    setAcaoTexto("");
    setAcaoOpen(true);
  }

  function escolherAcao(tipo: AcaoTipo) {
    setAcaoTipo(tipo);
    if (!acaoDsr) return;
    if (tipo === "RESPONDED") {
      setAcaoTexto(
        `Prezado(a) ${acaoDsr.titularNome},\n\n` +
        `[Descreva aqui a resposta enviada — ex: dados excluídos / endereço atualizado / cópia anexada]\n\n` +
        `Atenciosamente,\nEncarregado(a) pela Proteção de Dados`
      );
    } else if (tipo === "POSTPONED") {
      setAcaoTexto(""); // sem template — quem postergou geralmente não escreve nada
    } else if (tipo === "OTHER") {
      setAcaoTexto(""); // texto livre — o DPO descreve o que decidiu fazer
    }
  }

  async function confirmarAcao() {
    if (!acaoDsr || !acaoTipo) return;
    // "Outros" exige texto — é o ponto da opção
    if (acaoTipo === "OTHER" && !acaoTexto.trim()) {
      toast.error("Descreva o que você decidiu fazer.");
      return;
    }
    setLoading(true);
    try {
      const r = await registrarAcaoDsr({
        id: acaoDsr.id,
        acao: acaoTipo,
        texto: acaoTexto.trim() || undefined,
      });
      if (handlePhaseSkipResult(r)) return;
      toast.success("Ação registrada");
      setAcaoOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {surpresaPendentes > 0 && (
        <div className="mb-3 p-3 rounded-md bg-amber-50 border border-amber-300 text-sm text-amber-900 flex items-start gap-2">
          <Mail className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <strong>{surpresaPendentes} pedido{surpresaPendentes > 1 ? "s" : ""} aguardando sua ação.</strong>{" "}
            Clique no lápis ✏️ de cada linha pra escolher o que fazer.
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="Aguardando pedidos do canal"
          description="Este é o canal pelo qual o titular exerce os direitos do art. 18 da LGPD (acesso, correção, exclusão, portabilidade…). Quando um pedido chegar, aparecerá aqui automaticamente."
        />
      ) : (
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Titular</TH>
                <TH>Tipo</TH>
                <TH>Status</TH>
                <TH>Recebida em</TH>
                <TH className="text-right">Ações</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((d: any) => (
                <TR key={d.id} className={d.disparoFacilitador ? "bg-amber-50/40" : ""}>
                  <TD>
                    <div className="font-medium flex items-center gap-1.5">
                      {d.titularNome}
                      {d.disparoFacilitador && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200"
                          title="Solicitação recebida pelo canal de DSR — chegou agora"
                        >
                          <Mail className="h-3 w-3" /> Recebido por e-mail
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{d.titularContato}</div>
                  </TD>
                  <TD className="text-xs">{TIPOS.find((t) => t.v === d.tipoSolicitacao)?.l || d.tipoSolicitacao}</TD>
                  <TD>
                    <Badge variant={d.status === "RESPONDIDA" ? "success" : d.status === "NEGADA" ? "destructive" : "warning"}>
                      {d.status}
                    </Badge>
                  </TD>
                  <TD className="text-xs">{new Date(d.createdAt).toLocaleDateString("pt-BR")}</TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => abrirAcao(d)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      {/* Modal DSR Surpresa — 3 opções neutras (sem cor que entregue qual é a certa) */}
      <Dialog open={acaoOpen} onOpenChange={setAcaoOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-amber-600" />
              Solicitação recebida — {acaoDsr?.titularNome}
            </DialogTitle>
            <DialogDescription>
              {acaoDsr && (
                <div className="mt-2 p-3 rounded bg-gray-50 border text-xs text-gray-800 whitespace-pre-wrap">
                  <div className="font-medium mb-1">De: {acaoDsr.titularContato}</div>
                  <div className="font-medium mb-2">
                    Tipo: {TIPOS.find((t) => t.v === acaoDsr.tipoSolicitacao)?.l || acaoDsr.tipoSolicitacao}
                  </div>
                  <div>{acaoDsr.descricao}</div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {!acaoTipo && (
            <div className="space-y-2.5">
              <div className="text-sm text-gray-700">
                <strong>O que você vai fazer?</strong>
              </div>
              <button
                type="button"
                onClick={() => escolherAcao("RESPONDED")}
                className="w-full text-left p-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Send className="h-6 w-6 text-gray-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Responder agora</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      Atendo o pedido (excluo, corrijo, envio os dados solicitados).
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => escolherAcao("POSTPONED")}
                className="w-full text-left p-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Hourglass className="h-6 w-6 text-gray-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Não responder agora, o vencimento tá longe</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      Deixo pra depois — temos 15 dias úteis pra responder (art. 19, II LGPD).
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => escolherAcao("OTHER")}
                className="w-full text-left p-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 text-gray-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Outros (especificar)</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      Outra ação — descreva no campo a seguir o que você decidiu fazer.
                    </div>
                  </div>
                </div>
              </button>

              {acaoDsr?.gameAction && (
                <div className="text-xs text-gray-500 italic pt-2 border-t">
                  Esta solicitação já teve uma ação registrada anteriormente. Escolher de novo substitui a anterior.
                </div>
              )}
            </div>
          )}

          {acaoTipo && (
            <div className="space-y-3">
              <div>
                <Label>
                  {acaoTipo === "RESPONDED"
                    ? "Texto da resposta enviada ao titular"
                    : acaoTipo === "POSTPONED"
                    ? "Observação (opcional)"
                    : "Descreva o que você decidiu fazer"}
                </Label>
                <Textarea
                  value={acaoTexto}
                  onChange={(e) => setAcaoTexto(e.target.value)}
                  rows={acaoTipo === "OTHER" ? 6 : 8}
                  className={acaoTipo === "OTHER" ? "" : "font-mono text-xs"}
                  placeholder={
                    acaoTipo === "OTHER"
                      ? "Ex: 'vou ligar para a paciente confirmar antes de atualizar', 'vou pedir cópia do RG por e-mail', 'vou conferir com o pessoal do RH', etc."
                      : acaoTipo === "POSTPONED"
                      ? "Pode deixar em branco se preferir."
                      : undefined
                  }
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAcaoTipo(null)}>
                  ← Trocar resposta
                </Button>
                <Button type="button" onClick={confirmarAcao} disabled={loading}>
                  {loading ? "Registrando..." : "Confirmar resposta"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
