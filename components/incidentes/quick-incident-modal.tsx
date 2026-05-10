"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { notifySidebarRefresh } from "@/lib/sidebar-events";

/**
 * Modal compacto de registro emergencial de incidente (Checkpoint 16 / H).
 *
 * Apenas campos essenciais pra criar o incidente em segundos. Após criar,
 * redireciona pro editor completo pra preencher o resto (dados afetados,
 * técnico, risco, comunicações, encerramento).
 *
 * Defaults agressivos pra emergência:
 *   - severity: ALTO (dispara obrigatoriedade ANPD)
 *   - detectedAt: agora
 *   - status: DETECTADO
 */
export default function QuickIncidentModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    incidentType: "VAZAMENTO",
    severity: "ALTO",
    detectedAt: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM
  });

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      const r = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || "Pendente de detalhamento.",
          incidentType: form.incidentType,
          severity: form.severity,
          detectedAt: new Date(form.detectedAt).toISOString(),
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error ?? "Erro ao criar incidente");
        return;
      }
      const created = await r.json();
      notifySidebarRefresh();
      onClose();
      // Redireciona pro editor completo pra preencher o resto.
      // API retorna { incident: { id, ... } } — fallback `created.id`
      // por compatibilidade caso o formato mude.
      const newId = created?.incident?.id ?? created?.id;
      router.push(`/dashboard/incidentes/${newId}`);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
            Registrar Incidente Urgente
          </DialogTitle>
          <DialogDescription>
            Cadastre só o essencial agora — o prazo de 72h pra ANPD começa
            no momento da detecção. Os outros campos podem ser preenchidos
            depois no editor completo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="qi-title">Título do incidente *</Label>
            <Input
              id="qi-title"
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Vazamento de e-mail RH"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select
                value={form.incidentType}
                onValueChange={(v) => setForm({ ...form, incidentType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VAZAMENTO">Vazamento de dados</SelectItem>
                  <SelectItem value="ACESSO_NAO_AUTORIZADO">
                    Acesso não autorizado
                  </SelectItem>
                  <SelectItem value="PERDA">Perda</SelectItem>
                  <SelectItem value="ALTERACAO_INDEVIDA">
                    Alteração indevida
                  </SelectItem>
                  <SelectItem value="INDISPONIBILIDADE">
                    Indisponibilidade
                  </SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severidade</Label>
              <Select
                value={form.severity}
                onValueChange={(v) => setForm({ ...form, severity: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALTO">Alto (dispara ANPD)</SelectItem>
                  <SelectItem value="MEDIO">Médio (dispara ANPD)</SelectItem>
                  <SelectItem value="BAIXO">Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Data/hora da detecção *</Label>
            <Input
              type="datetime-local"
              value={form.detectedAt}
              onChange={(e) =>
                setForm({ ...form, detectedAt: e.target.value })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Inicia o prazo regressivo de 72h pra notificação à ANPD (Art. 48 §1º).
            </p>
          </div>

          <div>
            <Label htmlFor="qi-desc">Descrição (opcional agora)</Label>
            <Textarea
              id="qi-desc"
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="O que aconteceu? (pode preencher depois)"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={saving || !form.title.trim()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Registrar e abrir editor
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
