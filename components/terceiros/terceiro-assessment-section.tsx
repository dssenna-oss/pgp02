"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ClipboardCheck,
  Send,
  Loader2,
  Copy,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  assessmentStatusLabel,
  assessmentStatusBadgeClass,
  assessmentRiskLabel,
  assessmentRiskBadgeClass,
  ASSESSMENT_STATUS,
  type AssessmentRiskClass,
} from "@/lib/operadores-pontuacao";
import {
  getFormBlocks,
  type FormQuestion,
  type FormResponses,
  type FormResponseItem,
} from "@/lib/operadores-formulario";

interface AssessmentItem {
  id: string;
  label: string | null;
  status: string;
  publicToken: string | null;
  publicUrl?: string | null;
  sentAt: string | null;
  thirdPartyStartedAt: string | null;
  thirdPartyCompletedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: { id: string; name: string | null; email: string } | null;
  cyberScore: number;
  cyberMax: number;
  cyberPercentage: number;
  cyberRiskClass: string | null;
  lgpdScore: number;
  lgpdMax: number;
  lgpdPercentage: number;
  lgpdRiskClass: string | null;
  overallPercentage: number;
  overallRiskClass: string | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
}

interface Props {
  operatorId: string;
  canEdit: boolean;
}

export default function TerceiroAssessmentSection({
  operatorId,
  canEdit,
}: Props) {
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `/api/operadores/${operatorId}/assessment`,
        { cache: "no-store" }
      );
      if (!r.ok) {
        toast.error("Erro ao carregar avaliações");
        return;
      }
      const j = await r.json();
      setItems(j.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operatorId]);

  const handleCreateAndSend = async () => {
    if (
      !confirm(
        "Criar nova avaliação e gerar link público pra o terceiro preencher?"
      )
    )
      return;
    setCreating(true);
    try {
      const r = await fetch(`/api/operadores/${operatorId}/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendNow: true }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao criar avaliação");
        return;
      }
      toast.success("Avaliação criada — copie o link abaixo pra enviar ao terceiro");
      refresh();
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/avaliacao-terceiro/${token}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado pra área de transferência");
    } else {
      prompt("Copie o link manualmente:", url);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancelar esta avaliação? O link público vai parar de funcionar.")) return;
    const r = await fetch(`/api/operadores/${operatorId}/assessment/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: ASSESSMENT_STATUS.CANCELADO }),
    });
    if (!r.ok) {
      toast.error("Erro ao cancelar");
      return;
    }
    toast.success("Avaliação cancelada");
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Excluir esta avaliação? Todas as respostas serão removidas. Não pode ser desfeito."
      )
    )
      return;
    const r = await fetch(`/api/operadores/${operatorId}/assessment/${id}`, {
      method: "DELETE",
    });
    if (!r.ok) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Avaliação excluída");
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-blue-600" />
            Avaliação de risco
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Formulário com 52 perguntas em 7 blocos enviado ao próprio
            terceiro pra avaliar maturidade em Cyber + LGPD. Pontuação
            calculada automaticamente após revisão pelo DPO.
          </p>
        </div>
        {canEdit && (
          <Button
            size="sm"
            onClick={handleCreateAndSend}
            disabled={creating}
          >
            {creating ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-1.5" />
            )}
            Nova avaliação
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando…
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <ClipboardCheck className="h-10 w-10 mx-auto opacity-30 mb-2" />
            <p className="text-sm">
              Nenhuma avaliação criada ainda. Clique em "Nova avaliação"
              pra gerar um link público pro terceiro preencher.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <AssessmentRow
              key={a.id}
              assessment={a}
              canEdit={canEdit}
              onCopyLink={handleCopyLink}
              onReview={() => setReviewingId(a.id)}
              onCancel={() => handleCancel(a.id)}
              onDelete={() => handleDelete(a.id)}
            />
          ))}
        </div>
      )}

      {reviewingId && (
        <ReviewModal
          operatorId={operatorId}
          assessmentId={reviewingId}
          onClose={() => setReviewingId(null)}
          onReviewed={() => {
            setReviewingId(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Linha de assessment
// ============================================================

function AssessmentRow({
  assessment: a,
  canEdit,
  onCopyLink,
  onReview,
  onCancel,
  onDelete,
}: {
  assessment: AssessmentItem;
  canEdit: boolean;
  onCopyLink: (token: string) => void;
  onReview: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const isReviewed = a.status === "REVISADO";
  const isResponded = a.status === "RESPONDIDO";
  const isWaiting = a.status === "AGUARDANDO_TERCEIRO";

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn("text-xs", assessmentStatusBadgeClass(a.status))}>
            {assessmentStatusLabel(a.status)}
          </Badge>
          <span className="font-medium text-sm">
            {a.label ?? "Avaliação"}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            Criada{" "}
            {new Date(a.createdAt).toLocaleDateString("pt-BR")}
          </span>
        </div>

        {/* Link público (se disponível) */}
        {isWaiting && a.publicToken && canEdit && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-2.5 text-sm flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <code className="text-xs font-mono flex-1 truncate">
              /avaliacao-terceiro/{a.publicToken.slice(0, 12)}…
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCopyLink(a.publicToken!)}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copiar link
            </Button>
          </div>
        )}

        {/* Scores (se revisado) */}
        {isReviewed && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <ScorePill
              label="Cyber"
              percentage={a.cyberPercentage}
              riskClass={a.cyberRiskClass as AssessmentRiskClass}
              detail={`${a.cyberScore}/${a.cyberMax} pts`}
            />
            <ScorePill
              label="LGPD"
              percentage={a.lgpdPercentage}
              riskClass={a.lgpdRiskClass as AssessmentRiskClass}
              detail={`${a.lgpdScore}/${a.lgpdMax} pts`}
            />
            <ScorePill
              label="Geral"
              percentage={a.overallPercentage}
              riskClass={a.overallRiskClass as AssessmentRiskClass}
              detail={assessmentRiskLabel(a.overallRiskClass as AssessmentRiskClass)}
            />
          </div>
        )}

        {/* Detalhes de progresso */}
        <p className="text-xs text-muted-foreground">
          {a.sentAt && (
            <>Enviado em {new Date(a.sentAt).toLocaleDateString("pt-BR")} · </>
          )}
          {a.thirdPartyStartedAt && (
            <>iniciado pelo terceiro em {new Date(a.thirdPartyStartedAt).toLocaleDateString("pt-BR")} · </>
          )}
          {a.thirdPartyCompletedAt && (
            <>finalizado em {new Date(a.thirdPartyCompletedAt).toLocaleDateString("pt-BR")} · </>
          )}
          {a.reviewedAt && (
            <>revisado em {new Date(a.reviewedAt).toLocaleDateString("pt-BR")}</>
          )}
        </p>

        {/* Ações */}
        {canEdit && (
          <div className="flex gap-2 pt-2 flex-wrap">
            {isResponded && (
              <Button size="sm" onClick={onReview}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Revisar respostas
              </Button>
            )}
            {(isReviewed || isResponded) && (
              <Button size="sm" variant="outline" onClick={onReview}>
                Ver respostas
              </Button>
            )}
            {isWaiting && (
              <Button size="sm" variant="outline" onClick={onCancel}>
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Cancelar
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 ml-auto"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScorePill({
  label,
  percentage,
  riskClass,
  detail,
}: {
  label: string;
  percentage: number;
  riskClass: AssessmentRiskClass | null;
  detail: string;
}) {
  return (
    <Card className={cn("border", riskClass ? assessmentRiskBadgeClass(riskClass) : "")}>
      <CardContent className="p-2.5">
        <p className="text-xs opacity-80">{label}</p>
        <p className="text-xl font-bold tabular-nums">{percentage.toFixed(1)}%</p>
        <p className="text-[10px] opacity-70">{detail}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Modal de revisão (DPO)
// ============================================================

function ReviewModal({
  operatorId,
  assessmentId,
  onClose,
  onReviewed,
}: {
  operatorId: string;
  assessmentId: string;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const [data, setData] = useState<{
    assessment: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(
          `/api/operadores/${operatorId}/assessment/${assessmentId}`,
          { cache: "no-store" }
        );
        if (!r.ok) {
          toast.error("Erro ao carregar avaliação");
          return;
        }
        setData(await r.json());
      } finally {
        setLoading(false);
      }
    })();
  }, [operatorId, assessmentId]);

  const handleFinalize = async () => {
    if (
      !confirm(
        "Finalizar revisão? A pontuação vai ser persistida e o assessment vira REVISADO."
      )
    )
      return;
    setFinalizing(true);
    try {
      const r = await fetch(
        `/api/operadores/${operatorId}/assessment/${assessmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: ASSESSMENT_STATUS.REVISADO }),
        }
      );
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao finalizar");
        return;
      }
      toast.success("Avaliação revisada e finalizada");
      onReviewed();
    } finally {
      setFinalizing(false);
    }
  };

  const blocks = getFormBlocks();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Revisar respostas do terceiro</DialogTitle>
          <DialogDescription>
            Confira as respostas + evidências antes de finalizar.
            A pontuação fica persistida quando você clicar em "Finalizar
            revisão".
          </DialogDescription>
        </DialogHeader>

        {loading || !data ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Carregando…
          </div>
        ) : (
          <>
            {/* Live score (preview do que vai ser persistido) */}
            <div className="grid grid-cols-3 gap-2 pb-3 border-b">
              <ScorePill
                label="Cyber"
                percentage={data.assessment.live.cyber.percentage}
                riskClass={data.assessment.live.cyber.riskClass}
                detail={`${data.assessment.live.cyber.score}/${data.assessment.live.cyber.max}`}
              />
              <ScorePill
                label="LGPD"
                percentage={data.assessment.live.lgpd.percentage}
                riskClass={data.assessment.live.lgpd.riskClass}
                detail={`${data.assessment.live.lgpd.score}/${data.assessment.live.lgpd.max}`}
              />
              <ScorePill
                label="Geral"
                percentage={data.assessment.live.overall.percentage}
                riskClass={data.assessment.live.overall.riskClass}
                detail={`Completude ${data.assessment.live.completeness}%`}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 -mx-1 px-1">
              {blocks.map((b) => (
                <div key={b.block}>
                  <h3 className="font-semibold text-sm mb-2">{b.name}</h3>
                  <div className="space-y-2">
                    {b.questions.map((q) => (
                      <ReviewQuestionRow
                        key={q.id}
                        question={q}
                        response={(data.assessment.thirdPartyAnswers ?? {})[q.id]}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={onClose} disabled={finalizing}>
                Fechar
              </Button>
              {data.assessment.status === "RESPONDIDO" && (
                <Button onClick={handleFinalize} disabled={finalizing}>
                  {finalizing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Finalizando…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Finalizar revisão
                    </>
                  )}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewQuestionRow({
  question,
  response,
}: {
  question: FormQuestion;
  response: FormResponseItem | undefined;
}) {
  if (question.isParent) {
    return <p className="text-xs font-semibold mt-2">{question.question}</p>;
  }
  const correct =
    response?.answer === question.expectedAnswer && response.answer !== "NA";
  const na = response?.answer === "NA";
  const hasResponse = !!response?.answer;

  return (
    <div
      className={cn(
        "border-l-4 pl-3 py-1.5 text-xs",
        !hasResponse && "border-l-gray-300 opacity-60",
        hasResponse && correct && "border-l-emerald-400",
        hasResponse && !correct && !na && "border-l-red-400",
        hasResponse && na && "border-l-gray-400"
      )}
    >
      <p className="font-medium">{question.question}</p>
      <p className="text-muted-foreground mt-0.5">
        Resposta:{" "}
        <strong>
          {hasResponse
            ? response.answer === "S"
              ? "Sim"
              : response.answer === "N"
              ? "Não"
              : "N/A"
            : "—"}
        </strong>
        {hasResponse && question.expectedAnswer && question.expectedAnswer !== "NA" && (
          <>
            {" "}
            (esperado:{" "}
            <em>{question.expectedAnswer === "S" ? "Sim" : "Não"}</em>)
          </>
        )}
      </p>
      {response?.evidence && (
        <p className="text-muted-foreground italic mt-0.5">
          Evidência: {response.evidence}
        </p>
      )}
      {response?.comment && (
        <p className="text-muted-foreground italic mt-0.5">
          Comentário: {response.comment}
        </p>
      )}
    </div>
  );
}
