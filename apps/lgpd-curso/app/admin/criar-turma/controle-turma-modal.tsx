"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings, CalendarDays, Users, Mail, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { normalizarParticipantes, parseEmails } from "@/lib/participantes-turma";
import toast from "react-hot-toast";

type Turma = {
  id: string;
  nome: string;
  acessoInicio?: string | Date | null;
  acessoFim?: string | Date | null;
  participantes?: unknown;
};

// Converte um instante (ISO) para "YYYY-MM-DD" no fuso de Brasília — formato
// aceito pelo <input type="date">.
function paraInputDate(valor: string | Date | null | undefined): string {
  if (!valor) return "";
  const d = new Date(valor);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export function ControleTurmaModal({ turma }: { turma: Turma }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();

  const salvos = useMemo(() => normalizarParticipantes(turma.participantes), [turma.participantes]);

  const [inicio, setInicio] = useState(() => paraInputDate(turma.acessoInicio));
  const [fim, setFim] = useState(() => paraInputDate(turma.acessoFim));
  const [emailsTexto, setEmailsTexto] = useState(() => salvos.map((p) => p.email).join("\n"));

  // Prévia ao vivo de quantos e-mails válidos o texto colado contém.
  const emailsValidos = useMemo(() => parseEmails(emailsTexto), [emailsTexto]);
  const confirmados = salvos.filter((p) => p.confirmado).length;

  function salvar() {
    if (inicio && fim && inicio > fim) {
      toast.error("A data inicial não pode ser depois da data final.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/curso/atualizar-turma", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            turmaId: turma.id,
            acessoInicio: inicio,
            acessoFim: fim,
            participantesTexto: emailsTexto,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          toast.error(data?.error || `Erro ${res.status}`);
          return;
        }
        toast.success(`Turma atualizada · ${data.totalInscritos} inscrito(s)`);
        setAberto(false);
        router.refresh();
      } catch (e: any) {
        toast.error(e.message || "Erro de rede");
      }
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="Gerenciar turma — período de acesso e inscritos">
          <Settings className="h-4 w-4 text-gray-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Gerenciar turma — {turma.nome}</DialogTitle>
          <DialogDescription>
            Defina o período de acesso ao app e registre os e-mails dos inscritos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Período de acesso */}
          <section>
            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-1">
              <CalendarDays className="h-4 w-4 text-brand-600" />
              Período de acesso ao app
            </h3>
            <p className="text-[11px] text-gray-500 mb-2">
              Fora deste período os participantes não conseguem entrar no app. Você (Facilitador)
              entra sempre. Deixe em branco para não restringir.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Data inicial</Label>
                <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
              </div>
              <div>
                <Label>Data final</Label>
                <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
              </div>
            </div>
          </section>

          {/* Participantes inscritos */}
          <section>
            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-1">
              <Users className="h-4 w-4 text-brand-600" />
              Participantes inscritos
            </h3>
            <p className="text-[11px] text-gray-500 mb-2">
              Cole os e-mails dos inscritos — um por linha, ou separados por vírgula. Se a lista
              estiver no Excel, basta selecionar a coluna, copiar e colar. O sistema limpa
              duplicados e ignora o que não for e-mail válido.
            </p>
            <Textarea
              rows={6}
              value={emailsTexto}
              onChange={(e) => setEmailsTexto(e.target.value)}
              placeholder={"maria.silva@email.com\njoao.souza@email.com\n..."}
              className="font-mono text-xs"
            />
            <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-600">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" /> {emailsValidos.length} e-mail(s) válido(s)
              </span>
              {salvos.length > 0 && (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> {confirmados} de {salvos.length} confirmaram
                </span>
              )}
            </div>

            {/* Status das confirmações já salvas */}
            {salvos.length > 0 && (
              <div className="mt-2 border rounded-md max-h-40 overflow-y-auto divide-y bg-gray-50">
                {salvos.map((p) => (
                  <div
                    key={p.email}
                    className="flex items-center justify-between px-2.5 py-1.5 text-xs"
                  >
                    <span className="font-mono truncate mr-2">{p.email}</span>
                    {p.confirmado ? (
                      <span className="shrink-0 inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Confirmou
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 text-gray-400">
                        <Clock className="h-3.5 w-3.5" /> Pendente
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1 text-[10px] text-gray-400">
              A lista de status atualiza depois de salvar. Remover um e-mail do texto acima o
              retira da turma.
            </p>
          </section>

          {/* E-mail de convite */}
          <section>
            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-1">
              <Mail className="h-4 w-4 text-brand-600" />
              E-mail de convite
            </h3>
            <p className="text-[11px] text-gray-500 mb-2">
              Modelo pronto e editável para enviar aos inscritos reforçando o início do curso e
              pedindo a confirmação de presença.
            </p>
            <Button size="sm" variant="outline" asChild>
              <a href={`/admin/email-convite/${turma.id}`} target="_blank" rel="noreferrer">
                <Mail className="h-4 w-4" /> Abrir modelo de e-mail de convite
              </a>
            </Button>
          </section>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={pending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={salvar} disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
