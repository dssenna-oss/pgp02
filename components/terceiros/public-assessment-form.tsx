"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  Send,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  type FormQuestion,
  type FormResponses,
  type FormResponseItem,
  type FormAnswer,
} from "@/lib/operadores-formulario";

interface ApiData {
  assessment: {
    id: string;
    label: string | null;
    status: string;
    operatorName: string;
    controllerName: string;
    thirdPartyAnswers: FormResponses;
    thirdPartyStartedAt: string | null;
    thirdPartyCompletedAt: string | null;
  };
  questions: FormQuestion[];
}

interface Props {
  token: string;
}

export default function PublicAssessmentForm({ token }: Props) {
  const [data, setData] = useState<ApiData | null>(null);
  const [responses, setResponses] = useState<FormResponses>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  // Carrega dados
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/avaliacao-terceiro/${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          setError(err.error ?? "Erro ao carregar formulário");
          return;
        }
        const j: ApiData = await r.json();
        setData(j);
        setResponses(j.assessment.thirdPartyAnswers ?? {});
        if (j.assessment.thirdPartyCompletedAt) {
          setSubmitted(true);
        }
      } catch {
        setError("Erro de rede");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Auto-save (debounce 1.5s) — só roda se dirty=true
  useEffect(() => {
    if (!dirtyRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        const r = await fetch(`/api/avaliacao-terceiro/${encodeURIComponent(token)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: responses }),
        });
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          toast.error(err.error ?? "Erro ao salvar");
          return;
        }
        dirtyRef.current = false;
      } finally {
        setSaving(false);
      }
    }, 1500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [responses, token]);

  const setResponse = (qid: string, patch: Partial<FormResponseItem>) => {
    setResponses((prev) => {
      const cur = prev[qid] ?? { answer: "S" as FormAnswer };
      return { ...prev, [qid]: { ...cur, ...patch } as FormResponseItem };
    });
    dirtyRef.current = true;
  };

  const blocks = useMemo(() => {
    if (!data) return [];
    const map = new Map<number, { block: number; name: string; questions: FormQuestion[] }>();
    for (const q of data.questions) {
      if (!map.has(q.block)) {
        map.set(q.block, { block: q.block, name: q.blockName, questions: [] });
      }
      map.get(q.block)!.questions.push(q);
    }
    return [...map.values()].sort((a, b) => a.block - b.block);
  }, [data]);

  const totalScorable = useMemo(
    () => data?.questions.filter((q) => !q.isParent).length ?? 0,
    [data]
  );
  const answeredCount = useMemo(
    () => Object.values(responses).filter((r) => r?.answer).length,
    [responses]
  );
  const completeness =
    totalScorable > 0 ? Math.round((answeredCount / totalScorable) * 100) : 0;

  const handleSubmit = async () => {
    if (!confirm(`Você respondeu ${answeredCount} de ${totalScorable} perguntas (${completeness}%). Tem certeza que quer finalizar? Após enviar, não dá mais pra ajustar.`)) {
      return;
    }
    setSaving(true);
    try {
      // Garante que o último estado foi salvo
      const r1 = await fetch(`/api/avaliacao-terceiro/${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: responses }),
      });
      if (!r1.ok) {
        const err = await r1.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao salvar respostas");
        return;
      }
      const r2 = await fetch(`/api/avaliacao-terceiro/${encodeURIComponent(token)}`, {
        method: "POST",
      });
      if (!r2.ok) {
        const err = await r2.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao finalizar");
        return;
      }
      setSubmitted(true);
      toast.success("Avaliação enviada — obrigado!");
    } finally {
      setSaving(false);
    }
  };

  // ========== Renders ==========

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Carregando formulário…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center gap-3">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h1 className="text-xl font-semibold">Não foi possível abrir o formulário</h1>
        <p className="text-muted-foreground max-w-md">{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center gap-4 bg-emerald-50 dark:bg-emerald-950/10">
        <CheckCircle2 className="h-16 w-16 text-emerald-600" />
        <h1 className="text-2xl font-bold">Avaliação enviada com sucesso</h1>
        <p className="text-muted-foreground max-w-md">
          A {data.assessment.controllerName} foi notificada e o
          encarregado de proteção de dados (DPO) fará a revisão das suas
          respostas. Você pode fechar esta janela.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            Avaliação de Risco — Privacidade e Cibersegurança
          </div>
          <h1 className="text-2xl font-bold">
            Formulário de avaliação para fornecedores
          </h1>
          <p className="text-muted-foreground text-sm">
            Solicitado por <strong>{data.assessment.controllerName}</strong> —
            empresa avaliada: <strong>{data.assessment.operatorName}</strong>
          </p>
        </div>

        {/* Aviso */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
          <CardContent className="p-4 text-sm space-y-2">
            <p>
              Este formulário tem 52 perguntas em 7 blocos. Suas respostas
              ajudam o controlador a avaliar o nível de adequação da sua
              empresa à LGPD e a controles de segurança da informação.
            </p>
            <p>
              <strong>Você pode salvar e voltar depois</strong> — todas as
              respostas são salvas automaticamente conforme você preenche.
              Ao terminar, clique em <strong>"Enviar avaliação"</strong> no
              fim da página.
            </p>
          </CardContent>
        </Card>

        {/* Progresso + auto-save status */}
        <div className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur py-3 -mx-4 px-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">
                Respondido: {answeredCount} de {totalScorable} ({completeness}%)
              </p>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              {saving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Salvando…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Salvo
                </>
              )}
            </div>
          </div>
        </div>

        {/* Blocos de perguntas */}
        {blocks.map((b) => (
          <Card key={b.block}>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-lg font-bold border-b pb-2">{b.name}</h2>
              {b.questions.map((q) => (
                <QuestionItem
                  key={q.id}
                  question={q}
                  response={responses[q.id]}
                  onChange={(patch) => setResponse(q.id, patch)}
                />
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Submit */}
        <Card>
          <CardContent className="p-5 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Verifique se respondeu todas as perguntas antes de finalizar.
              Após o envio, não dá mais pra ajustar.
            </p>
            <Button
              onClick={handleSubmit}
              disabled={saving || answeredCount === 0}
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar avaliação ({answeredCount}/{totalScorable})
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground py-4">
          Formulário gerado pelo PGP — Programa de Governança em Privacidade.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Item de pergunta
// ============================================================

function QuestionItem({
  question,
  response,
  onChange,
}: {
  question: FormQuestion;
  response: FormResponseItem | undefined;
  onChange: (patch: Partial<FormResponseItem>) => void;
}) {
  if (question.isParent) {
    return (
      <p className="text-sm font-semibold mt-3 text-gray-700 dark:text-gray-300">
        {question.question}
      </p>
    );
  }

  const isSub = !!question.subOf;
  const tagLabel =
    question.tag === "CYBER"
      ? "Cyber"
      : question.tag === "LGPD"
      ? "LGPD"
      : "Cyber + LGPD";

  return (
    <div className={cn("space-y-2 pb-3 border-b last:border-b-0", isSub && "ml-6 pt-2")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm flex-1">
          {question.question}
          {question.tag && (
            <Badge variant="outline" className="text-[10px] ml-2 align-middle">
              {tagLabel}
            </Badge>
          )}
        </p>
      </div>

      <div className="flex gap-1.5">
        {(["S", "N", "NA"] as const).map((opt) => (
          <Button
            key={opt}
            size="sm"
            variant={response?.answer === opt ? "default" : "outline"}
            onClick={() => onChange({ answer: opt })}
            type="button"
          >
            {opt === "S" ? "Sim" : opt === "N" ? "Não" : "N/A"}
          </Button>
        ))}
      </div>

      {response?.answer && response.answer !== "NA" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
          {question.needsEvidence && (
            <div className="space-y-1">
              <Label className="text-xs">Evidência (link, página de anexo)</Label>
              <Input
                value={response.evidence ?? ""}
                onChange={(e) => onChange({ evidence: e.target.value })}
                placeholder="Ex: política XYZ, página 5"
                className="text-sm"
                maxLength={500}
              />
            </div>
          )}
          <div className={cn("space-y-1", !question.needsEvidence && "md:col-span-2")}>
            <Label className="text-xs">Comentário (opcional)</Label>
            <Textarea
              value={response.comment ?? ""}
              onChange={(e) => onChange({ comment: e.target.value })}
              placeholder="Justificativa, contexto, restrições aplicáveis"
              rows={2}
              maxLength={1000}
              className="text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
