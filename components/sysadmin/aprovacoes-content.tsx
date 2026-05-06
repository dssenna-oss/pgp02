"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Shield,
  ArrowLeft,
  LogOut,
  CheckCircle2,
  XCircle,
  Building2,
  Mail,
  Calendar,
  Loader2,
  Inbox,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

interface PendingRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  company: {
    id: string;
    companyName: string;
    createdAt: string;
    _count: { users: number; dataInventories: number };
  } | null;
}

interface AprovacoesContentProps {
  session: any;
}

export default function AprovacoesContent({ session }: AprovacoesContentProps) {
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState<PendingRow | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/sysadmin/aprovacoes", { cache: "no-store" });
      if (!r.ok) {
        toast.error("Falha ao carregar pendentes");
        return;
      }
      const data = await r.json();
      setPending(data.pending ?? []);
    } catch {
      toast.error("Erro de rede");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(row: PendingRow) {
    setActionInFlight(row.id);
    try {
      const r = await fetch(`/api/users/${row.id}/toggle-active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error || "Erro ao aprovar");
        return;
      }
      toast.success(`Conta de ${row.email} aprovada — pode logar agora.`);
      await load();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setActionInFlight(null);
    }
  }

  async function handleReject(row: PendingRow) {
    setActionInFlight(row.id);
    try {
      const r = await fetch(`/api/sysadmin/aprovacoes/${row.id}`, {
        method: "DELETE",
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error || "Erro ao recusar");
        return;
      }
      const data = await r.json();
      const orgPart = data.deletedCompany
        ? ` e a empresa "${data.deletedCompany}"`
        : "";
      toast.success(`Cadastro de ${row.email} recusado${orgPart}.`);
      await load();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setActionInFlight(null);
      setConfirmReject(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-950 dark:to-blue-950/20">
      {/* Header — banda diferente pra deixar claro que é modo super admin */}
      <header className="bg-gray-900 dark:bg-black border-b border-amber-500/40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/20 p-2">
              <Shield className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                Painel do Super Admin · LGPD - PGP
              </h1>
              <p className="text-xs text-amber-200/80">
                Aprovações de cadastros pendentes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-gray-200 hover:text-white hover:bg-white/10"
            >
              <Link href="/sysadmin">
                <ClipboardList className="h-4 w-4 mr-1.5" /> Organizações
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-gray-200 hover:text-white hover:bg-white/10"
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar pro dashboard
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-red-300 hover:text-red-200 hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4 mr-1.5" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Logado como{" "}
              <span className="font-mono font-semibold">
                {session?.user?.email}
              </span>
            </p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              Cadastros pendentes
              {pending.length > 0 && (
                <Badge className="ml-2 bg-amber-500 hover:bg-amber-500 text-white">
                  {pending.length}
                </Badge>
              )}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Contas que se cadastraram via formulário público e aguardam sua
              aprovação. <strong>Aprovar</strong> ativa a conta.{" "}
              <strong>Recusar</strong> apaga a conta e a empresa do banco
              (irreversível).
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              load();
            }}
          >
            Atualizar lista
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
              Carregando pendentes...
            </CardContent>
          </Card>
        ) : pending.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              <Inbox className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Nenhum cadastro pendente
              </p>
              <p className="text-sm mt-1">
                Quando alguém se cadastrar via /signup, vai aparecer aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map((row) => {
              const busy = actionInFlight === row.id;
              return (
                <Card
                  key={row.id}
                  className="border-amber-200 dark:border-amber-800/40"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Linha 1: nome + email */}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-base">
                            {row.name ?? "(sem nome)"}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 break-all">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            {row.email}
                          </p>
                        </div>

                        {/* Linha 2: empresa */}
                        {row.company && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                            <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                            <span className="font-medium">
                              {row.company.companyName}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs ml-1"
                            >
                              {row.company._count.users} usuário
                              {row.company._count.users !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                        )}

                        {/* Linha 3: data */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
                          <Calendar className="h-3 w-3" />
                          Cadastrado em{" "}
                          {new Date(row.createdAt).toLocaleString("pt-BR")}
                        </div>
                      </div>

                      {/* Botões de ação */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(row)}
                          disabled={busy}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          )}
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmReject(row)}
                          disabled={busy}
                          className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Recusar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Dialog de confirmação de Recusa */}
      <AlertDialog
        open={!!confirmReject}
        onOpenChange={(open) => !open && setConfirmReject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recusar este cadastro?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Esta ação <strong>apaga permanentemente</strong> a conta{" "}
                <span className="font-mono">{confirmReject?.email}</span>
                {confirmReject?.company &&
                  confirmReject.company._count.users === 1 && (
                    <>
                      {" "}
                      e a empresa{" "}
                      <strong>"{confirmReject.company.companyName}"</strong>{" "}
                      (que só tem esse usuário).
                    </>
                  )}
                .
              </span>
              <span className="block text-red-600 dark:text-red-400 font-medium">
                Não tem como desfazer. Tem certeza?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmReject && handleReject(confirmReject)}
              className="bg-red-600 hover:bg-red-700"
            >
              Sim, recusar e apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
