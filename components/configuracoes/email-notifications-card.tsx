"use client";

/**
 * Card de preferências de notificação por email do user (Etapa 26 + 27).
 *
 * Mostra até 4 toggles:
 *   - DM no Fórum
 *   - Comunicados oficiais do DPO
 *   - Digest diário de Tarefas vencendo
 *   - Digest diário de ações atrasadas no Plano (DPO-only — escondido
 *     pra Contribuidor)
 *
 * Lê e atualiza via /api/me/email-prefs (GET/PATCH).
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bell,
  MessageSquare,
  Megaphone,
  ListChecks,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

interface Prefs {
  dm: boolean;
  announcements: boolean;
  taskDue: boolean;
  actionPlan: boolean;
}

interface PrefsResponse extends Prefs {
  role: string | null;
}

const DPO_ROLES = new Set([
  "admin",
  "DPO_PRINCIPAL",
  "DPO_SUBSTITUTO",
  "DPO_AUXILIAR",
]);

export default function EmailNotificationsCard() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [saving, setSaving] = useState<keyof Prefs | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/me/email-prefs", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as PrefsResponse;
        setPrefs({
          dm: j.dm,
          announcements: j.announcements,
          taskDue: j.taskDue,
          actionPlan: j.actionPlan,
        });
        setRole(j.role);
      } catch {
        // silencioso
      }
    })();
  }, []);

  const isDpoUser = role !== null && DPO_ROLES.has(role);

  const update = async (key: keyof Prefs, value: boolean) => {
    if (!prefs) return;
    const prev = prefs;
    // Otimista
    setPrefs({ ...prev, [key]: value });
    setSaving(key);
    try {
      const r = await fetch("/api/me/email-prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!r.ok) {
        setPrefs(prev);
        toast.error("Erro ao salvar preferência");
      } else {
        toast.success(value ? "Notificação ativada" : "Notificação desativada");
      }
    } catch {
      setPrefs(prev);
      toast.error("Erro de rede");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações por email
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Escolha quando o sistema deve te enviar emails. Você sempre pode
          alterar essas preferências aqui.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {prefs === null ? (
          <p className="text-sm text-gray-500">Carregando preferências...</p>
        ) : (
          <>
            <NotifRow
              icon={<MessageSquare className="h-4 w-4 text-blue-600" />}
              label="Mensagens diretas no Fórum"
              hint="Receber email quando alguém te envia uma DM."
              checked={prefs.dm}
              disabled={saving === "dm"}
              onChange={(v) => update("dm", v)}
            />
            <NotifRow
              icon={<Megaphone className="h-4 w-4 text-amber-600" />}
              label="Comunicados oficiais do DPO"
              hint="Receber email quando o Encarregado publica um comunicado importante."
              checked={prefs.announcements}
              disabled={saving === "announcements"}
              onChange={(v) => update("announcements", v)}
            />
            <NotifRow
              icon={<ListChecks className="h-4 w-4 text-emerald-600" />}
              label="Tarefas vencendo (digest diário)"
              hint="Receber resumo às 9h com tarefas que vencem hoje ou amanhã. Opt-in — pode ser desativado se quiser usar só o painel."
              checked={prefs.taskDue}
              disabled={saving === "taskDue"}
              onChange={(v) => update("taskDue", v)}
            />
            {isDpoUser && (
              <NotifRow
                icon={<ClipboardList className="h-4 w-4 text-rose-600" />}
                label="Plano de Ação — ações atrasadas (DPO)"
                hint="Receber resumo às 9h com ações do Plano da organização que estão atrasadas, vencem hoje ou vencem amanhã. Disponível só pra DPO."
                checked={prefs.actionPlan}
                disabled={saving === "actionPlan"}
                onChange={(v) => update("actionPlan", v)}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function NotifRow({
  icon,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-0.5 flex-shrink-0">{icon}</div>
        <div className="min-w-0">
          <Label className="text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </Label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
            {hint}
          </p>
        </div>
      </div>
      <div className="flex-shrink-0 pt-1">
        <Switch
          checked={checked}
          disabled={disabled}
          onCheckedChange={onChange}
        />
      </div>
    </div>
  );
}
