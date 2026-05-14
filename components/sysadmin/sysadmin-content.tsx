"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Building2,
  Plus,
  Shield,
  Users,
  ClipboardList,
  KeyRound,
  Copy,
  Check,
  ArrowLeft,
  LogOut,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SysadminContentProps {
  session: any;
}

interface OrgRow {
  id: string;
  companyName: string;
  dpoName: string | null;
  dpoEmail: string | null;
  createdAt: string;
  users: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
    isActive: boolean;
  }>;
  _count: {
    users: number;
    dataInventories: number;
  };
}

export default function SysadminContent({ session }: SysadminContentProps) {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    orgName: string;
    dpoEmail: string;
    tempPassword: string;
    intent: "created" | "reset";
  } | null>(null);
  const [resetTargetOrg, setResetTargetOrg] = useState<OrgRow | null>(null);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [dpoName, setDpoName] = useState("");
  const [dpoEmail, setDpoEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Contagem de cadastros pendentes — mostrada como badge no link "Aprovações"
  // do header. Polling de 60s pra refletir cadastros novos sem precisar de F5.
  const [pendingCount, setPendingCount] = useState(0);

  const loadOrgs = async () => {
    try {
      setLoading(true);
      const r = await fetch("/api/sysadmin/orgs");
      if (!r.ok) throw new Error("erro");
      const data = await r.json();
      setOrgs(data.orgs);
    } catch {
      toast.error("Erro ao carregar organizações");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingCount = useCallback(async () => {
    try {
      const r = await fetch("/api/sysadmin/aprovacoes/pending-count", {
        cache: "no-store",
      });
      if (!r.ok) return;
      const data = await r.json();
      setPendingCount(data.count ?? 0);
    } catch {
      // silencioso — badge cai pra 0 em caso de falha de rede
    }
  }, []);

  useEffect(() => {
    loadOrgs();
    loadPendingCount();
    const interval = setInterval(loadPendingCount, 60_000);
    return () => clearInterval(interval);
  }, [loadPendingCount]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await fetch("/api/sysadmin/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, dpoName, dpoEmail }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error ?? "Erro ao criar organização");
        return;
      }
      toast.success("Organização criada!");
      setShowCreateDialog(false);
      setCompanyName("");
      setDpoName("");
      setDpoEmail("");
      setCreatedCredentials({
        orgName: data.org.companyName,
        dpoEmail: data.dpo.email,
        tempPassword: data.tempPassword,
        intent: "created",
      });
      loadOrgs();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (org: OrgRow) => {
    try {
      const r = await fetch(`/api/sysadmin/orgs/${org.id}/reset-password`, {
        method: "POST",
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error ?? "Erro ao resetar senha");
        return;
      }
      setResetTargetOrg(null);
      setCreatedCredentials({
        orgName: org.companyName,
        dpoEmail: data.dpo.email,
        tempPassword: data.tempPassword,
        intent: "reset",
      });
    } catch {
      toast.error("Erro de rede");
    }
  };

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
                Gerenciar organizações e DPOs Principais
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-gray-200 hover:text-white hover:bg-white/10 relative"
            >
              <Link href="/sysadmin/aprovacoes">
                <ClipboardList className="h-4 w-4 mr-1.5" /> Aprovações
                {pendingCount > 0 && (
                  <Badge className="ml-2 bg-amber-500 hover:bg-amber-500 text-white border-0">
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-gray-200 hover:text-white hover:bg-white/10">
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
        {/* Topbar com info + botão criar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Logado como{" "}
              <span className="font-mono font-semibold">{session?.user?.email}</span>
            </p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              Organizações cadastradas
            </h2>
          </div>
          <Button
            size="lg"
            onClick={() => setShowCreateDialog(true)}
            className="shadow-md"
          >
            <Plus className="h-5 w-5 mr-1.5" />
            Nova organização
          </Button>
        </div>

        {/* Lista */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Carregando...
            </CardContent>
          </Card>
        ) : orgs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Nenhuma organização cadastrada ainda. Clique em "Nova organização" pra começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orgs.map((org) => (
              <OrgCard
                key={org.id}
                org={org}
                onResetPassword={() => setResetTargetOrg(org)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ===== Dialog: criar organização ===== */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Nova organização + DPO Principal
            </DialogTitle>
            <DialogDescription>
              Cria uma nova organização e a conta do DPO Principal numa só
              operação. Uma senha temporária será gerada — copie e repasse
              ao DPO via canal seguro.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div>
              <Label htmlFor="org-name">Nome da organização *</Label>
              <Input
                id="org-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: PGP PM Vila Velha"
                required
                disabled={submitting}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dpo-name">Nome do DPO Principal *</Label>
              <Input
                id="dpo-name"
                value={dpoName}
                onChange={(e) => setDpoName(e.target.value)}
                placeholder="Ex: Maria Silva"
                required
                disabled={submitting}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dpo-email">Email do DPO Principal *</Label>
              <Input
                id="dpo-email"
                type="email"
                value={dpoEmail}
                onChange={(e) => setDpoEmail(e.target.value)}
                placeholder="dpo@orgao.gov.br"
                required
                disabled={submitting}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Esse email será o login do DPO Principal.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Criando..." : "Criar organização"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== Dialog: senha temporária (criação ou reset) ===== */}
      <Dialog
        open={!!createdCredentials}
        onOpenChange={(open) => !open && setCreatedCredentials(null)}
      >
        {createdCredentials && (
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-600" />
                {createdCredentials.intent === "created"
                  ? "Organização criada!"
                  : "Senha resetada"}
              </DialogTitle>
              <DialogDescription>
                {createdCredentials.intent === "created"
                  ? `A organização "${createdCredentials.orgName}" foi criada. Repasse essas credenciais ao DPO via canal seguro:`
                  : `Nova senha temporária gerada pra ${createdCredentials.orgName}. Repasse ao DPO:`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs text-gray-500">Email</Label>
                <CopyableField value={createdCredentials.dpoEmail} />
              </div>
              <div>
                <Label className="text-xs text-gray-500">
                  Senha temporária
                </Label>
                <CopyableField
                  value={createdCredentials.tempPassword}
                  monospace
                />
              </div>
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-3">
                <p className="text-xs text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Esta senha aparece <strong>uma única vez</strong>. Copie
                    agora — depois você só pode resetar (gera uma nova).
                  </span>
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setCreatedCredentials(null)}>
                <Check className="h-4 w-4 mr-1.5" />
                Já copiei
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ===== Confirmar reset ===== */}
      <AlertDialog
        open={!!resetTargetOrg}
        onOpenChange={(open) => !open && setResetTargetOrg(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar senha do DPO Principal?</AlertDialogTitle>
            <AlertDialogDescription>
              Vai gerar uma nova senha temporária pro DPO de{" "}
              <strong>{resetTargetOrg?.companyName}</strong>. A senha atual
              deixa de funcionar imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                resetTargetOrg && handleResetPassword(resetTargetOrg)
              }
              className="bg-amber-600 hover:bg-amber-700"
            >
              Resetar senha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// Componentes auxiliares
// ============================================================

function OrgCard({
  org,
  onResetPassword,
}: {
  org: OrgRow;
  onResetPassword: () => void;
}) {
  const principalDpo = org.users.find(
    (u) => u.role === "DPO_PRINCIPAL" || u.role === "admin"
  );
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Building2 className="h-5 w-5 text-blue-600 shrink-0" />
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {org.companyName}
              </h3>
              {principalDpo?.isActive === false && (
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                  DPO inativo
                </Badge>
              )}
            </div>

            {principalDpo ? (
              <div className="ml-7 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500">DPO Principal:</span>{" "}
                  <span className="font-medium">{principalDpo.name}</span>{" "}
                  <span className="font-mono text-xs text-gray-500">
                    ({principalDpo.email})
                  </span>
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {org._count.users} usuário{org._count.users !== 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ClipboardList className="h-3.5 w-3.5" />
                    {org._count.dataInventories} processo
                    {org._count.dataInventories !== 1 ? "s" : ""}
                  </span>
                  <span className="text-gray-400">
                    Criada em {new Date(org.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm italic text-amber-700 ml-7">
                Sem DPO Principal cadastrado
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={onResetPassword}
              className="border-amber-200 text-amber-700 hover:bg-amber-50"
              disabled={!principalDpo}
            >
              <KeyRound className="h-4 w-4 mr-1.5" />
              Resetar senha do DPO
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CopyableField({
  value,
  monospace,
}: {
  value: string;
  monospace?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };
  return (
    <div className="flex items-center gap-2 mt-1">
      <code
        className={cn(
          "flex-1 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-sm border border-gray-200 dark:border-gray-700 break-all",
          monospace && "font-mono font-semibold text-base tracking-wide"
        )}
      >
        {value}
      </code>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={copy}
        className="shrink-0"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-1" /> Copiado
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-1" /> Copiar
          </>
        )}
      </Button>
    </div>
  );
}
