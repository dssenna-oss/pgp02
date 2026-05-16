"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Printer, Users } from "lucide-react";
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
            <TH>Cidade</TH>
            <TH>Grupos</TH>
            <TH>Status</TH>
            <TH>Criada em</TH>
            <TH className="text-right">Ações</TH>
          </TR>
        </THead>
        <TBody>
          {turmas.map((t: any) => (
            <TR key={t.id}>
              <TD className="font-medium">{t.nome}</TD>
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
                    onClick={() => window.open(`/api/curso/cartoes-login.pdf?turmaId=${t.id}`, "_blank")}
                    title="Cartões de login"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => deletarTurma(t.id, t.nome)}
                    disabled={pending}
                    title="Resetar turma"
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
