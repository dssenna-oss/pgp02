"use client";

import { useEffect, useMemo, useState } from "react";
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
  Users,
  UserPlus,
  KeyRound,
  Copy,
  Check,
  Trash2,
  Mail,
  Briefcase,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { canManageContributors } from "@/lib/auth-helpers";
import { cn } from "@/lib/utils";

interface Props {
  session: any;
}

interface Contribuidor {
  id: string;
  name: string | null;
  email: string;
  setor: string | null;
  isActive: boolean;
  createdAt: string;
  invitedBy: { name: string | null; email: string } | null;
  _count: { createdInventories: number };
}

export default function ContribuidoresContent({ session }: Props) {
  const canManage = canManageContributors(session?.user?.role);
  const [list, setList] = useState<Contribuidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [tempCreds, setTempCreds] = useState<{
    intent: "created" | "reset";
    name: string;
    email: string;
    tempPassword: string;
  } | null>(null);
  const [resetTarget, setResetTarget] = useState<Contribuidor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contribuidor | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [setor, setSetor] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const r = await fetch("/api/dpo/contribuidores");
      if (!r.ok) throw new Error();
      const data = await r.json();
      setList(data.contribuidores);
    } catch {
      toast.error("Erro ao carregar contribuidores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await fetch("/api/dpo/contribuidores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, setor }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error ?? "Erro ao criar contribuidor");
        return;
      }
      toast.success("Contribuidor criado!");
      setShowCreate(false);
      setName("");
      setEmail("");
      setSetor("");
      setTempCreds({
        intent: "created",
        name: data.contribuidor.name,
        email: data.contribuidor.email,
        tempPassword: data.tempPassword,
      });
      load();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (c: Contribuidor) => {
    try {
      const r = await fetch(`/api/dpo/contribuidores/${c.id}/reset-password`, {
        method: "POST",
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error ?? "Erro ao resetar senha");
        return;
      }
      setResetTarget(null);
      setTempCreds({
        intent: "reset",
        name: c.name ?? "",
        email: c.email,
        tempPassword: data.tempPassword,
      });
    } catch {
      toast.error("Erro de rede");
    }
  };

  const handleDelete = async (c: Contribuidor) => {
    try {
      const r = await fetch(`/api/dpo/contribuidores/${c.id}`, {
        method: "DELETE",
      });
      if (!r.ok) {
        const data = await r.json();
        toast.error(data.error ?? "Erro ao excluir");
        return;
      }
      toast.success("Contribuidor excluído");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Erro de rede");
    }
  };

  // Agrupa por setor (info útil pro DPO ter ideia de cobertura)
  const stats = useMemo(() => {
    const setores = new Set<string>();
    let active = 0;
    for (const c of list) {
      if (c.setor) setores.add(c.setor);
      if (c.isActive) active++;
    }
    return {
      total: list.length,
      active,
      setores: setores.size,
    };
  }, [list]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2.5 mt-1">
            <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Contribuidores
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Pessoas dos setores da sua organização que preenchem processos
              de tratamento de dados.
            </p>
          </div>
        </div>
        {canManage && (
          <Button
            size="lg"
            onClick={() => setShowCreate(true)}
            className="shadow-md"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Convidar Contribuidor
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Users className="h-7 w-7" />}
          label="Total"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={<Check className="h-7 w-7" />}
          label="Ativos"
          value={stats.active}
          color="emerald"
        />
        <StatCard
          icon={<Briefcase className="h-7 w-7" />}
          label="Setores distintos"
          value={stats.setores}
          color="purple"
        />
      </div>

      {/* Aviso pra DPO Auxiliar */}
      {!canManage && (
        <div className="rounded-md border border-blue-200 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 p-3 text-sm text-blue-800 dark:text-blue-200">
          Você é DPO Auxiliar — pode visualizar os contribuidores mas não
          tem permissão pra criar, excluir ou resetar senhas. Peça pro DPO
          Principal ou Substituto.
        </div>
      )}

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            Lista de Contribuidores
            <Badge variant="secondary" className="ml-1">
              {list.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-6">Carregando...</p>
          ) : list.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Nenhum contribuidor cadastrado ainda.
              </p>
              {canManage && (
                <p className="text-sm text-gray-500 mt-2">
                  Clique em "Convidar Contribuidor" pra começar.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((c) => (
                <ContribuidorCard
                  key={c.id}
                  c={c}
                  canManage={canManage}
                  onReset={() => setResetTarget(c)}
                  onDelete={() => setDeleteTarget(c)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Dialog: criar contribuidor ===== */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Convidar Contribuidor
            </DialogTitle>
            <DialogDescription>
              Cria a conta do contribuidor com uma senha temporária. A senha
              aparece UMA VEZ — copie e repasse via canal seguro (em pessoa,
              mensagem direta, etc.).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div>
              <Label htmlFor="contrib-name">Nome *</Label>
              <Input
                id="contrib-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva"
                required
                disabled={submitting}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contrib-email">Email *</Label>
              <Input
                id="contrib-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao.silva@orgao.gov.br"
                required
                disabled={submitting}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contrib-setor">Setor</Label>
              <Input
                id="contrib-setor"
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                placeholder="Ex: RH, Ouvidoria, Capacitação"
                disabled={submitting}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Texto livre. Aparece nos filtros e relatórios.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreate(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Criando..." : "Criar contribuidor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== Dialog: senha temporária ===== */}
      <Dialog
        open={!!tempCreds}
        onOpenChange={(open) => !open && setTempCreds(null)}
      >
        {tempCreds && (
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-600" />
                {tempCreds.intent === "created"
                  ? "Contribuidor criado!"
                  : "Senha resetada"}
              </DialogTitle>
              <DialogDescription>
                {tempCreds.intent === "created"
                  ? `Conta de ${tempCreds.name} foi criada. Repasse essas credenciais via canal seguro:`
                  : `Nova senha temporária pra ${tempCreds.name}. Repasse:`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs text-gray-500">Email</Label>
                <CopyableField value={tempCreds.email} />
              </div>
              <div>
                <Label className="text-xs text-gray-500">
                  Senha temporária
                </Label>
                <CopyableField value={tempCreds.tempPassword} monospace />
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
              <Button onClick={() => setTempCreds(null)}>
                <Check className="h-4 w-4 mr-1.5" /> Já copiei
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ===== Confirmar reset ===== */}
      <AlertDialog
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar senha?</AlertDialogTitle>
            <AlertDialogDescription>
              Vai gerar uma nova senha temporária pra{" "}
              <strong>{resetTarget?.name ?? resetTarget?.email}</strong>. A
              senha atual deixa de funcionar imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetTarget && handleReset(resetTarget)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Resetar senha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Confirmar exclusão ===== */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contribuidor?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name ?? deleteTarget?.email}</strong>{" "}
              perderá acesso ao sistema.
              {deleteTarget && deleteTarget._count.createdInventories > 0 && (
                <span className="block mt-2 text-amber-700 dark:text-amber-300">
                  ⚠ Os {deleteTarget._count.createdInventories} processo(s)
                  criados por ele serão preservados, mas ficam sem dono.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
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

const TONES: Record<string, { iconBg: string; iconColor: string }> = {
  blue: {
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  emerald: {
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  purple: {
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
};

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: keyof typeof TONES;
}) {
  const tone = TONES[color];
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-lg p-2.5", tone.iconBg)}>
            <span className={tone.iconColor}>{icon}</span>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContribuidorCard({
  c,
  canManage,
  onReset,
  onDelete,
}: {
  c: Contribuidor;
  canManage: boolean;
  onReset: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {c.name ?? <span className="italic text-gray-500">sem nome</span>}
            </h3>
            {!c.isActive && (
              <Badge variant="outline" className="border-amber-300 text-amber-700">
                Inativo
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              <span className="font-mono text-xs">{c.email}</span>
            </span>
            {c.setor && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {c.setor}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <ClipboardList className="h-3.5 w-3.5" />
              {c._count.createdInventories} processo
              {c._count.createdInventories !== 1 ? "s" : ""}
            </span>
          </div>
          {c.invitedBy && (
            <p className="text-xs text-gray-400 mt-1.5">
              Convidado por {c.invitedBy.name ?? c.invitedBy.email} ·{" "}
              {new Date(c.createdAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>

        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={onReset}
              className="border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              <KeyRound className="h-4 w-4 mr-1" />
              Resetar senha
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
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
