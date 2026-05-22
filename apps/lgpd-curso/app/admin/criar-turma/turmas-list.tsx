"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Printer, Target, KeyRound, CalendarDays, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ControleTurmaModal } from "./controle-turma-modal";
import { normalizarParticipantes } from "@/lib/participantes-turma";
import toast from "react-hot-toast";

type Turma = any;

// Formata um instante ISO como "DD/MM" no fuso de Brasília.
function diaMes(valor: string | null | undefined): string {
  if (!valor) return "";
  const d = new Date(valor);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

export function TurmasList({ turmas }: { turmas: Turma[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function deletarTurma(id: string, nome: string) {
    if (!confirm(`Resetar (deletar) a turma "${nome}"? Todos os dados dos grupos e dos logins serão removidos. Esta ação é irreversível.`)) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/curso/reset-turma", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ turmaId: id }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error || "Erro"); return; }
        toast.success(`Turma "${nome}" removida`);
        router.refresh();
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  function toggleProximoCurso(id: string, nome: string, marcado: boolean) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/curso/marcar-proximo-curso", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ turmaId: id, marcar: !marcado }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error || "Erro"); return; }
        toast.success(
          marcado
            ? `Marca 🎯 removida de "${nome}"`
            : `"${nome}" marcada como 🎯 próximo curso`
        );
        router.refresh();
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  if (turmas.length === 0) {
    return (
      <div className="border border-dashed rounded-lg p-6 text-center text-sm text-gray-500">
        Nenhuma turma criada ainda.
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <Table>
        <THead>
          <TR>
            <TH>Turma</TH>
            <TH>Slug (isolamento)</TH>
            <TH>Cidade</TH>
            <TH>Grupos</TH>
            <TH>Status</TH>
            <TH>Criada em</TH>
            <TH className="text-right">Ações</TH>
          </TR>
        </THead>
        <TBody>
          {turmas.map((t: any) => (
            <TR
              key={t.id}
              className={t.proximoCurso ? "bg-amber-50" : ""}
            >
              <TD className="font-medium">
                <div className="flex items-center gap-1.5">
                  {t.proximoCurso && (
                    <span title="Próximo curso a rodar" className="text-amber-600">🎯</span>
                  )}
                  {t.nome}
                </div>
                {(() => {
                  const inscritos = normalizarParticipantes(t.participantes);
                  const confirmados = inscritos.filter((p) => p.confirmado).length;
                  const temJanela = t.acessoInicio || t.acessoFim;
                  if (!temJanela && inscritos.length === 0) return null;
                  return (
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] font-normal text-gray-500">
                      {temJanela && (
                        <span className="inline-flex items-center gap-1" title="Período de acesso ao app">
                          <CalendarDays className="h-3 w-3" />
                          {t.acessoInicio ? diaMes(t.acessoInicio) : "…"} a{" "}
                          {t.acessoFim ? diaMes(t.acessoFim) : "…"}
                        </span>
                      )}
                      {inscritos.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {inscritos.length} inscrito(s)
                        </span>
                      )}
                      {confirmados > 0 && (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" />
                          {confirmados} confirmado(s)
                        </span>
                      )}
                    </div>
                  );
                })()}
              </TD>
              <TD className="text-xs font-mono text-gray-600">
                {t.slug ? (
                  <span title={`Emails: dpo.g1.${t.slug}@curso.lgpd, etc`}>{t.slug}</span>
                ) : (
                  <span className="text-amber-600 italic" title="Turma antiga sem slug — rode /api/curso/migrar-slug-turmas">
                    sem slug
                  </span>
                )}
              </TD>
              <TD>{t.cidade}</TD>
              <TD className="text-xs">
                <div className="flex flex-wrap gap-1">
                  {t.grupos.map((g: any) => (
                    <Badge key={g.id} variant={g.orgao === "PM" ? "success" : "primary"}>
                      G{g.numero} {g.orgao}
                    </Badge>
                  ))}
                </div>
              </TD>
              <TD>
                <Badge variant={t.status === "ATIVA" ? "success" : "default"}>{t.status}</Badge>
              </TD>
              <TD className="text-xs">{new Date(t.createdAt).toLocaleDateString("pt-BR")}</TD>
              <TD>
                <div className="flex justify-end gap-1">
                  <ControleTurmaModal turma={t} />
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => toggleProximoCurso(t.id, t.nome, t.proximoCurso)}
                    disabled={pending}
                    title={t.proximoCurso ? "Remover marca 🎯" : "Marcar como 🎯 próximo curso"}
                  >
                    <Target className={`h-4 w-4 ${t.proximoCurso ? "text-amber-600 fill-amber-200" : "text-gray-400"}`} />
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => window.open(`/api/curso/lista-logins?turmaId=${t.id}`, "_blank")}
                    title="Lista de logins reais desta turma (folha de consulta do facilitador)"
                  >
                    <KeyRound className="h-4 w-4 text-emerald-600" />
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => window.open(`/api/curso/crachas.pdf?turmaId=${t.id}`, "_blank")}
                    title="Crachás físicos com QR Code (PDF A4 paisagem · 36 papéis + 10 Observadores)"
                  >
                    <Printer className="h-4 w-4 text-purple-600" />
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => deletarTurma(t.id, t.nome)}
                    disabled={pending}
                    title="Resetar turma (só afeta esta — isolamento por slug)"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
