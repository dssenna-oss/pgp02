"use client";

import { useState } from "react";
import { Pencil, Mail, ShieldCheck, Send, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  pedirConfirmacaoIdentidade,
  responderDsrDireto,
  negarDsrPorFaltaId,
} from "./actions";
import { templatePedirConfirmacao, type CenarioDsr } from "@/lib/dsr-game";
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

export function DsrList({ items }: { items: Dsr[] }) {
  const [loading, setLoading] = useState(false);

  // Modal de ação — único caminho do DPO: escolher Pedir confirmação /
  // Responder / Negar pra cada pedido que chegou pelo canal.
  const [acaoOpen, setAcaoOpen] = useState(false);
  const [acaoDsr, setAcaoDsr] = useState<Dsr | null>(null);
  const [acaoTipo, setAcaoTipo] = useState<"PEDIR_CONFIRMACAO" | "RESPONDER" | "NEGAR" | null>(null);
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

  function escolherAcao(tipo: "PEDIR_CONFIRMACAO" | "RESPONDER" | "NEGAR") {
    setAcaoTipo(tipo);
    if (!acaoDsr) return;
    if (tipo === "PEDIR_CONFIRMACAO") {
      const cenario: CenarioDsr = {
        orgao: "PM",
        titularNome: acaoDsr.titularNome,
        titularContato: acaoDsr.titularContato,
        tipoSolicitacao: acaoDsr.tipoSolicitacao,
        descricao: acaoDsr.descricao || "",
        pegadinha: "",
      };
      setAcaoTexto(templatePedirConfirmacao(cenario));
    } else if (tipo === "RESPONDER") {
      setAcaoTexto(
        `Prezado(a) ${acaoDsr.titularNome},\n\nSua solicitação foi atendida. ` +
        `[Descreva aqui o que foi feito — ex: dados excluídos / endereço atualizado / cópia dos dados anexada]\n\n` +
        `Atenciosamente,\nEncarregado(a) pela Proteção de Dados`
      );
    } else if (tipo === "NEGAR") {
      setAcaoTexto(
        `Prezado(a) ${acaoDsr.titularNome},\n\nNão foi possível atender sua solicitação ` +
        `porque não recebemos a comprovação de sua identidade, conforme exige o art. 19, §1º da ` +
        `LGPD. Para nova tentativa, envie cópia de documento oficial com foto e selfie segurando o ` +
        `documento.\n\nAtenciosamente,\nEncarregado(a) pela Proteção de Dados`
      );
    }
  }

  async function confirmarAcao() {
    if (!acaoDsr || !acaoTipo) return;
    setLoading(true);
    try {
      let r: any;
      if (acaoTipo === "PEDIR_CONFIRMACAO") {
        r = await pedirConfirmacaoIdentidade({ id: acaoDsr.id, textoMensagem: acaoTexto });
      } else if (acaoTipo === "RESPONDER") {
        r = await responderDsrDireto({ id: acaoDsr.id, textoResposta: acaoTexto });
      } else {
        r = await negarDsrPorFaltaId({ id: acaoDsr.id, justificativa: acaoTexto });
      }
      if (handlePhaseSkipResult(r)) return;
      toast.success(
        acaoTipo === "PEDIR_CONFIRMACAO"
          ? "Pedido de confirmação enviado"
          : acaoTipo === "RESPONDER"
          ? "Resposta enviada"
          : "Solicitação negada"
      );
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
            Clique no lápis ✏️ de cada linha pra escolher a resposta (Pedir confirmação · Responder · Negar).
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

      {/* Modal DSR Surpresa — 3 botões grandes */}
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
            <div className="space-y-3">
              <div className="text-sm text-gray-700">
                <strong>O que você vai fazer?</strong> Escolha com cuidado — a LGPD é exigente
                sobre quem recebe dados do titular.
              </div>
              <button
                type="button"
                onClick={() => escolherAcao("PEDIR_CONFIRMACAO")}
                className="w-full text-left p-4 rounded-lg border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-7 w-7 text-blue-700 shrink-0" />
                  <div>
                    <div className="font-semibold text-blue-900">Pedir confirmação de identidade</div>
                    <div className="text-xs text-blue-800 mt-0.5">
                      Solicito documento + selfie antes de atender (art. 19, §1º LGPD).
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => escolherAcao("RESPONDER")}
                className="w-full text-left p-4 rounded-lg border-2 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Send className="h-7 w-7 text-emerald-700 shrink-0" />
                  <div>
                    <div className="font-semibold text-emerald-900">Responder agora</div>
                    <div className="text-xs text-emerald-800 mt-0.5">
                      Atendo o pedido (excluo, corrijo, envio dados). Prazo: 15 dias úteis (art. 19, II).
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => escolherAcao("NEGAR")}
                className="w-full text-left p-4 rounded-lg border-2 border-red-300 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Ban className="h-7 w-7 text-red-700 shrink-0" />
                  <div>
                    <div className="font-semibold text-red-900">Negar por falta de identificação</div>
                    <div className="text-xs text-red-800 mt-0.5">
                      Recuso o pedido formalmente porque não foi possível verificar quem é o solicitante.
                    </div>
                  </div>
                </div>
              </button>

              {acaoDsr?.gameAction && (
                <div className="text-xs text-gray-500 italic pt-2 border-t">
                  Esta solicitação já teve uma ação registrada anteriormente
                  ({acaoDsr.gameAction === "CONFIRMATION_REQUESTED" ? "Pedido de confirmação enviado" : acaoDsr.gameAction}).
                  Você pode atualizar a resposta abaixo.
                </div>
              )}
            </div>
          )}

          {acaoTipo && (
            <div className="space-y-3">
              <div>
                <Label>
                  {acaoTipo === "PEDIR_CONFIRMACAO"
                    ? "Mensagem de confirmação (editável)"
                    : acaoTipo === "RESPONDER"
                    ? "Texto da resposta"
                    : "Justificativa da negativa"}
                </Label>
                <Textarea
                  value={acaoTexto}
                  onChange={(e) => setAcaoTexto(e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAcaoTipo(null)}>
                  ← Trocar ação
                </Button>
                <Button type="button" onClick={confirmarAcao} disabled={loading || !acaoTexto.trim()}>
                  {loading ? "Enviando..." :
                    acaoTipo === "PEDIR_CONFIRMACAO" ? "Enviar pedido de confirmação" :
                    acaoTipo === "RESPONDER" ? "Enviar resposta" : "Confirmar negativa"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
