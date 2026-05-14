/**
 * Consulta pública de protocolo de Requisição de Direitos do Titular.
 *
 * Exige protocolo + email do titular (dupla validação). Mostra status,
 * datas, decisão (se houver) e prazo restante calculado em tempo real.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Search } from "lucide-react";
import {
  DSR_STATUS_LABELS,
  DSR_STATUS_COLORS,
  DSR_DECISION_LABELS,
  daysUntilDue,
  deadlineUrgency,
  type DsrStatus,
  type DsrDecision,
} from "@/lib/data-subject-requests";

type Result = {
  protocolNumber: string;
  status: DsrStatus;
  decision: DsrDecision | null;
  createdAt: string;
  dueDate: string;
  responseDate: string | null;
  responseChannelUsed: string | null;
};

const URGENCY_COLORS: Record<
  ReturnType<typeof deadlineUrgency>,
  { bg: string; fg: string; label: string }
> = {
  overdue:   { bg: "bg-red-100",    fg: "text-red-800",    label: "Prazo vencido" },
  critical:  { bg: "bg-orange-100", fg: "text-orange-800", label: "Prazo crítico" },
  warning:   { bg: "bg-amber-100",  fg: "text-amber-800",  label: "Atenção ao prazo" },
  normal:    { bg: "bg-blue-100",   fg: "text-blue-800",   label: "Dentro do prazo" },
  concluded: { bg: "bg-green-100",  fg: "text-green-800",  label: "Concluído" },
};

export function DsrProtocolLookup({
  orgId,
  initialProtocol,
  initialEmail,
}: {
  orgId: string;
  initialProtocol?: string;
  initialEmail?: string;
}) {
  const [protocol, setProtocol] = useState(initialProtocol || "");
  const [email, setEmail] = useState(initialEmail || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const lookup = useCallback(async () => {
    setError(null);
    setResult(null);
    if (!protocol.trim() || !email.trim()) {
      setError("Informe o número de protocolo e o e-mail usado na requisição.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/direitos-titulares/protocolo/${encodeURIComponent(
          protocol.trim(),
        )}?email=${encodeURIComponent(email.trim())}`,
        { cache: "no-store" },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Não foi possível consultar o protocolo.");
        return;
      }
      setResult(json);
    } catch (e) {
      console.error(e);
      setError("Erro de rede ao consultar.");
    } finally {
      setLoading(false);
    }
  }, [protocol, email]);

  // Auto-lookup quando vem com protocolo + email na URL (redirect do /sucesso)
  useEffect(() => {
    if (initialProtocol && initialEmail) {
      void lookup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block text-sm font-medium">
              Número de protocolo
            </Label>
            <Input
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              placeholder="REQ-2026-0001"
              className="font-mono"
            />
          </div>
          <div>
            <Label className="mb-1 block text-sm font-medium">
              E-mail usado na requisição
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          <Button onClick={lookup} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Consultando…
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Consultar
              </>
            )}
          </Button>
        </div>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && <ProtocolResult result={result} />}
    </div>
  );
}

function ProtocolResult({ result }: { result: Result }) {
  const statusColors = DSR_STATUS_COLORS[result.status];
  const days = daysUntilDue(result.dueDate);
  const urg = deadlineUrgency(result.dueDate, result.status);
  const urgColors = URGENCY_COLORS[urg];

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-slate-50 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Protocolo
            </p>
            <p className="mt-1 font-mono text-lg font-bold">
              {result.protocolNumber}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${statusColors.bg} ${statusColors.fg} ${statusColors.ring}`}
          >
            {DSR_STATUS_LABELS[result.status]}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Info
            label="Recebida em"
            value={fmtDate(result.createdAt)}
          />
          <Info
            label="Prazo legal (15 dias)"
            value={fmtDate(result.dueDate)}
          />
          {result.responseDate && (
            <Info
              label="Respondida em"
              value={fmtDate(result.responseDate)}
            />
          )}
          {result.responseChannelUsed && (
            <Info
              label="Canal usado na resposta"
              value={result.responseChannelUsed}
            />
          )}
        </div>

        {/* Badge de urgência (oculto quando concluída) */}
        {urg !== "concluded" && (
          <div
            className={`rounded-md px-4 py-3 ${urgColors.bg} ${urgColors.fg}`}
          >
            <p className="text-sm font-medium">{urgColors.label}</p>
            <p className="mt-0.5 text-xs">
              {days >= 0
                ? `Faltam ${days} dia${days === 1 ? "" : "s"} para o prazo legal.`
                : `Prazo excedido em ${Math.abs(days)} dia${Math.abs(days) === 1 ? "" : "s"}.`}
            </p>
          </div>
        )}

        {result.decision && (
          <div className="rounded-md border bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Decisão
            </p>
            <p className="mt-1 font-medium">
              {DSR_DECISION_LABELS[result.decision]}
            </p>
            <p className="mt-2 text-xs text-slate-600">
              O conteúdo detalhado da resposta foi enviado pelo canal preferido
              que você indicou na requisição.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
