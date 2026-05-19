"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Printer, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import toast from "react-hot-toast";

type Turma = any;

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
                    onClick={() => window.open(`/api/curso/cartoes-login.pdf?turmaId=${t.id}`, "_blank")}
                    title="Cartões de login (PDF A4)"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => window.open(`/api/curso/crachas.pdf?turmaId=${t.id}`, "_blank")}
                    title="Crachás físicos (PDF A4 paisagem · com 10 Observadores)"
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
