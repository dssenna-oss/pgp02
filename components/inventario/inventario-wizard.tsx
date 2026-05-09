"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Compass,
  ClipboardList,
  BookOpen,
  AlertTriangle,
  BookMarked,
  User as UserIcon,
  FileText,
  Database,
  Activity,
  Inbox,
  Share2,
  Server,
  Printer,
  ListChecks,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  INVENTARIO_FORM_SCHEMA,
  TOTAL_STEPS,
  type WizardStep,
  type FormAnswers,
  type FormSection,
  isFieldVisible,
} from "@/lib/inventario-form-schema";
import { deriveLegacyFields } from "@/lib/inventario-derive";
import {
  applyTemplate,
  type InventarioTemplate,
} from "@/lib/inventario-templates-publicos";
import { SectionStep } from "./section-step";
import { isFieldEmpty, isNotApplied } from "./form-field-renderer";
import { PrintableInventory } from "./printable-inventory";
import { MiniAppsMap } from "./mini-apps-map";
import { CompletionDialog } from "./completion-dialog";
import InventarioEntryScreen from "./inventario-entry-screen";
import TemplatePicker from "./template-picker";
import CartaServicosPicker, {
  type AiPrefillSummary,
} from "./carta-servicos-picker";

interface InventarioWizardProps {
  userName: string;
  userEmail: string;
  /** Se passado, o wizard hidrata as respostas desse draft. (Checkpoint 7) */
  initialDraft?: { id: string; formAnswers: FormAnswers };
}

/**
 * Wizard de Mapeamento Completo de Dados (Inventário).
 *
 * Skeleton — navegação + draft save funcionando. Renderização real dos
 * fields vem nos checkpoints 4-6.
 */
export default function InventarioWizard({
  userName,
  userEmail,
  initialDraft,
}: InventarioWizardProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(initialDraft?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  /** Exibe o dialog de conclusão (Próximos passos) ao terminar. */
  const [showCompletion, setShowCompletion] = useState(false);
  /** Erros por seção: { sec1: { fieldId: msg }, ... } */
  const [errorsBySection, setErrorsBySection] = useState<
    Record<string, Record<string, string>>
  >({});

  /**
   * Tela inicial de escolha do ponto de partida (2026-05-11).
   * - "entry": user ainda não escolheu como começar (3 cards)
   * - "wizard": user já escolheu, mostra o formulário
   * Inventários existentes (draft) pulam direto pra "wizard".
   */
  const [entryMode, setEntryMode] = useState<"entry" | "wizard">(
    initialDraft ? "wizard" : "entry",
  );
  /** Estado do dialog de seleção de modelo. */
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  /** Estado do dialog de pré-preencher por Carta de Serviços (Fatia b). */
  const [cartaPickerOpen, setCartaPickerOpen] = useState(false);
  /** ID do template aplicado (pra exibir no header + permitir trocar). */
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(
    () => {
      const meta = (initialDraft?.formAnswers?._meta ?? {}) as any;
      return meta?.templateApplied ?? null;
    },
  );

  // Pré-preenche Nome e E-mail do session no Sec 1.
  // Se for um draft existente, mantém respostas salvas; mas garante que
  // pelo menos os campos auto-fill (name/email) estão sempre populados.
  const [answers, setAnswers] = useState<FormAnswers>(() => {
    const incoming = (initialDraft?.formAnswers ?? {}) as FormAnswers;
    const incomingSec1 = ((incoming as any).sec1 ?? {}) as Record<string, string>;
    return {
      ...incoming,
      sec1: {
        respondent_name: userName,
        respondent_email: userEmail,
        respondent_role: "",
        respondent_department: "",
        ...incomingSec1, // se já havia algo salvo, sobrescreve auto-fill
      },
    };
  });

  /**
   * Aplica um template padronizado em `answers`. Mescla por camada (não
   * sobrescreve campos já preenchidos pelo user) e marca a origem em
   * `_meta.provenance`. Avança pra primeira seção do form.
   */
  const handlePickTemplate = useCallback((template: InventarioTemplate) => {
    setAnswers((prev) => {
      const { next } = applyTemplate(prev, template);
      return next;
    });
    setAppliedTemplateId(template.id);
    setEntryMode("wizard");
    // Pula onboarding pra mostrar logo o sec1 com info já contextual
    setStepIndex(1);
    toast.success(`Modelo "${template.nome}" aplicado. Revise os campos.`);
  }, []);

  /**
   * Aplica o resultado do AI Prefill (Fatia b — Carta de Serviços).
   * `next` já vem mesclado server-side com provenance preenchido.
   * Avança pra primeira seção do form se estávamos na entrada.
   */
  const handleApplyAiPrefill = useCallback(
    (next: FormAnswers, summary: AiPrefillSummary) => {
      setAnswers(next);
      if (entryMode === "entry") {
        setEntryMode("wizard");
        setStepIndex(1); // pula onboarding pra ir pro sec1 com info contextual
      }
      const n = summary.applied.length;
      if (n > 0) {
        toast.success(
          `${n} campo${n === 1 ? "" : "s"} pré-preenchido${n === 1 ? "" : "s"} por IA. Revise e ajuste.`,
        );
      } else {
        toast.info("Nenhum campo novo foi preenchido.");
      }
    },
    [entryMode],
  );

  /**
   * Reseta a escolha — volta pra tela inicial. Não apaga dados, só
   * permite trocar de ponto de partida. Confirma se já há respostas.
   */
  const handleResetEntry = useCallback(() => {
    const hasAnswers = Object.entries(answers)
      .filter(([k]) => k.startsWith("sec") && k !== "sec1")
      .some(([, v]) => {
        if (!v || typeof v !== "object") return false;
        return Object.values(v as Record<string, unknown>).some((val) => {
          if (Array.isArray(val)) return val.length > 0;
          return typeof val === "string" && val.trim().length > 0;
        });
      });
    if (hasAnswers) {
      const ok = confirm(
        "Você já preencheu campos. Voltar à tela inicial mantém o que você digitou — ao escolher outro modelo, ele só preenche os campos que estiverem vazios. Continuar?",
      );
      if (!ok) return;
    }
    setEntryMode("entry");
    setStepIndex(0);
  }, [answers]);

  /** Atualiza um único campo de uma seção. */
  const updateField = useCallback(
    (sectionId: string, fieldId: string, value: string | string[]) => {
      setAnswers((prev) => {
        const next: any = {
          ...prev,
          [sectionId]: {
            ...((prev as any)[sectionId] ?? {}),
            [fieldId]: value,
          },
        };
        // Limpa a marca de origem (provenance) quando o user edita —
        // valor não é mais "do template", virou input humano.
        const meta = next._meta;
        const path = `${sectionId}.${fieldId}`;
        if (meta?.provenance && meta.provenance[path]) {
          const newProv = { ...meta.provenance };
          delete newProv[path];
          next._meta = { ...meta, provenance: newProv };
        }
        return next;
      });
      // Limpa erro do campo ao começar a digitar
      setErrorsBySection((prev) => {
        if (!prev[sectionId]?.[fieldId]) return prev;
        const sec = { ...prev[sectionId] };
        delete sec[fieldId];
        return { ...prev, [sectionId]: sec };
      });
    },
    []
  );

  /** Valida campos required + visíveis da seção atual. Retorna {fieldId: msg}. */
  const validateSection = useCallback(
    (section: FormSection): Record<string, string> => {
      const sectionAnswers = ((answers as any)[section.id] ?? {}) as Record<
        string,
        string | string[]
      >;
      const errs: Record<string, string> = {};
      for (const field of section.fields) {
        if (!field.required) continue;
        if (!isFieldVisible(field, sectionAnswers)) continue;
        const v = sectionAnswers[field.id];
        const empty = Array.isArray(v)
          ? v.length === 0
          : !v?.toString().trim();
        if (empty) errs[field.id] = "Campo obrigatório";
      }
      return errs;
    },
    [answers]
  );

  const totalSteps = TOTAL_STEPS + 1; // +1 = tela de revisão final
  const isReviewStep = stepIndex >= TOTAL_STEPS;
  const currentSchemaStep: WizardStep | undefined = isReviewStep
    ? undefined
    : INVENTARIO_FORM_SCHEMA[stepIndex];

  const progressPct = useMemo(
    () => Math.round(((stepIndex + 1) / totalSteps) * 100),
    [stepIndex, totalSteps]
  );

  const saveDraft = useCallback(
    async (showToast = true): Promise<boolean> => {
      setSaving(true);
      try {
        const payload = {
          formAnswers: {
            ...answers,
            _meta: {
              ...(answers._meta ?? {}),
              startedAt: answers._meta?.startedAt ?? new Date().toISOString(),
              lastSavedAt: new Date().toISOString(),
              lastStepId: currentSchemaStep?.id,
            },
          },
          isDraft: true,
        };

        const url = draftId ? `/api/inventario/${draftId}` : "/api/inventario";
        const method = draftId ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Erro ao salvar rascunho");
        const saved = await res.json();
        if (!draftId && saved?.id) setDraftId(saved.id);
        setLastSavedAt(new Date());
        if (showToast) toast.success("Rascunho salvo");
        return true;
      } catch (e) {
        console.error(e);
        toast.error("Falha ao salvar rascunho");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [answers, currentSchemaStep, draftId]
  );

  const handleNext = async () => {
    // Validação ANTES do save: bloqueia avanço se faltar required visível
    if (currentSchemaStep && currentSchemaStep.kind === "section") {
      const errs = validateSection(currentSchemaStep);
      if (Object.keys(errs).length > 0) {
        setErrorsBySection((prev) => ({
          ...prev,
          [currentSchemaStep.id]: errs,
        }));
        toast.error("Preencha os campos obrigatórios marcados em vermelho");
        return;
      }
      setErrorsBySection((prev) => ({ ...prev, [currentSchemaStep.id]: {} }));

      // Soft confirm: avisar antes de avançar se há campos opcionais em branco
      // e NÃO marcados como N/A. Reduz dúvida "esqueci ou foi proposital?".
      const sectionAnswers =
        (answers[currentSchemaStep.id as keyof FormAnswers] as
          | Record<string, string | string[]>
          | undefined) ?? {};
      const blanks = currentSchemaStep.fields.filter((f) => {
        if (f.required) return false;
        if (!isFieldVisible(f, sectionAnswers)) return false;
        const v = sectionAnswers[f.id];
        if (isNotApplied(v)) return false;
        return isFieldEmpty(v);
      });
      if (blanks.length > 0) {
        const word =
          blanks.length === 1
            ? "campo opcional em branco"
            : "campos opcionais em branco";
        const ok = confirm(
          `Você deixou ${blanks.length} ${word}. Continuar mesmo assim ou revisar?\n\n` +
            `Dica: marque "Não se aplica" abaixo de cada campo pra deixar explícito que foi proposital.\n\n` +
            `[OK] continuar  ·  [Cancelar] revisar`,
        );
        if (!ok) return;
      }
    }

    // Sempre salva rascunho antes de avançar
    const ok = await saveDraft(false);
    if (!ok) return;
    // Usa valor (não updater) — React StrictMode em dev invoca updater
    // funcional 2x, o que com `i + 1` causa pulo duplo de step.
    setStepIndex(Math.min(stepIndex + 1, totalSteps - 1));
  };

  const handlePrev = () => setStepIndex(Math.max(0, stepIndex - 1));

  const handleCancel = () => {
    if (
      confirm(
        "Tem certeza? Suas respostas estão salvas como rascunho — você pode continuar mais tarde."
      )
    ) {
      router.push("/dashboard/inventario");
    }
  };

  const handleFinish = async () => {
    // Validar TODAS as seções antes de concluir (proteção extra — embora
    // handleNext já tenha validado cada uma na chegada).
    const allErrors: Record<string, Record<string, string>> = {};
    for (const step of INVENTARIO_FORM_SCHEMA) {
      if (step.kind !== "section") continue;
      const errs = validateSection(step);
      if (Object.keys(errs).length > 0) allErrors[step.id] = errs;
    }
    if (Object.keys(allErrors).length > 0) {
      setErrorsBySection(allErrors);
      const firstSec = Object.keys(allErrors)[0];
      const idx = INVENTARIO_FORM_SCHEMA.findIndex((s) => s.id === firstSec);
      if (idx >= 0) setStepIndex(idx);
      toast.error(
        `Há campos obrigatórios faltando em ${Object.keys(allErrors).length} seção(ões). Voltei pra primeira.`
      );
      return;
    }

    // Deriva os 10 campos resumo + marca isDraft=false
    const derived = deriveLegacyFields(answers);
    const payload = {
      ...derived,
      formAnswers: {
        ...answers,
        _meta: {
          ...(answers._meta ?? {}),
          completedAt: new Date().toISOString(),
        },
      },
      isDraft: false,
    };

    setSaving(true);
    try {
      const url = draftId ? `/api/inventario/${draftId}` : "/api/inventario";
      const method = draftId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Falha ao concluir mapeamento");
      toast.success("Mapeamento concluído!");
      // Em vez de navegar direto, abre dialog "Próximos passos" que mostra
      // os mini-apps alimentados + opções (mapear outro processo / voltar).
      setShowCompletion(true);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao concluir — tente salvar como rascunho e revisar");
    } finally {
      setSaving(false);
    }
  };

  // ===== Render =====
  // Tela de entrada (escolha do ponto de partida) — só aparece em
  // inventários novos sem respostas ainda. Inventários existentes pulam.
  if (entryMode === "entry") {
    return (
      <>
        <InventarioEntryScreen
          onChoose={(choice) => {
            if (choice === "templates") {
              setTemplatePickerOpen(true);
            } else if (choice === "carta") {
              setCartaPickerOpen(true);
            } else if (choice === "manual") {
              setEntryMode("wizard");
            }
          }}
        />
        <TemplatePicker
          open={templatePickerOpen}
          onOpenChange={setTemplatePickerOpen}
          onPick={handlePickTemplate}
        />
        <CartaServicosPicker
          open={cartaPickerOpen}
          onOpenChange={setCartaPickerOpen}
          currentAnswers={answers}
          onApply={handleApplyAiPrefill}
        />
      </>
    );
  }

  // No review usa layout mais largo (com TOC lateral); nas outras telas
  // mantém o max-w-4xl centrado pra leitura confortável.
  const containerClass = isReviewStep
    ? "max-w-6xl mx-auto space-y-6"
    : "max-w-4xl mx-auto space-y-6";
  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2.5 mt-1">
            <ClipboardList className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Mapeamento Completo</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Questionário detalhado — alimenta o Inventário e demais documentos.
            </p>
            {appliedTemplateId && (
              <button
                type="button"
                onClick={handleResetEntry}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 hover:underline"
              >
                <BookMarked className="h-3.5 w-3.5" />
                Modelo aplicado
                <span className="text-gray-500">·</span>
                <span>Trocar modelo / começar de novo</span>
              </button>
            )}
            {!appliedTemplateId && !initialDraft && (
              <button
                type="button"
                onClick={handleResetEntry}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:underline"
              >
                ← Voltar à tela inicial
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCartaPickerOpen(true)}
            title="Cole URL pública (carta de serviços, ato normativo) — IA preenche os campos vazios."
          >
            <Sparkles className="h-4 w-4 mr-1.5 text-violet-600" />
            Pré-preencher por URL
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </div>

      {/* Progresso */}
      <div className="space-y-2 print:hidden">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Passo {stepIndex + 1} de {totalSteps}
            {currentSchemaStep && ` — ${currentSchemaStep.title}`}
            {isReviewStep && " — Revisão"}
          </span>
          <span>
            {lastSavedAt
              ? `Salvo às ${lastSavedAt.toLocaleTimeString("pt-BR")}`
              : "Não salvo ainda"}
          </span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      {/* Conteúdo do passo */}
      {isReviewStep ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
          <div className="lg:col-span-9">
            <Card>
              <ReviewStepView
                answers={answers}
                onJumpToStep={(idx) => setStepIndex(idx)}
              />
            </Card>
          </div>
          <aside className="lg:col-span-3 print:hidden">
            <ReviewTOC answers={answers} onJumpTo={(secId) => {
              const el = document.getElementById(`review-${secId}`);
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }} />
          </aside>
        </div>
      ) : (
        <Card>
          {currentSchemaStep && currentSchemaStep.kind === "onboarding" && (
            <OnboardingStepView step={currentSchemaStep} />
          )}
          {currentSchemaStep && currentSchemaStep.kind === "section" && (
            <SectionStep
              section={currentSchemaStep}
              sectionAnswers={
                ((answers as any)[currentSchemaStep.id] ?? {}) as Record<
                  string,
                  string | string[]
                >
              }
              onFieldChange={(fieldId, value) =>
                updateField(currentSchemaStep.id, fieldId, value)
              }
              errors={errorsBySection[currentSchemaStep.id]}
              provenance={(() => {
                const meta = (answers._meta ?? {}) as any;
                const all: Record<string, string> = meta?.provenance ?? {};
                const prefix = `${currentSchemaStep.id}.`;
                const out: Record<string, string> = {};
                for (const [path, origin] of Object.entries(all)) {
                  if (path.startsWith(prefix)) {
                    out[path.slice(prefix.length)] = origin;
                  }
                }
                return out;
              })()}
            />
          )}
        </Card>
      )}

      {/* Navegação — no review fica sticky no rodapé pra acesso fácil */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 print:hidden",
          isReviewStep &&
            "sticky bottom-0 -mx-2 px-2 py-3 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 shadow-lg z-10 rounded-t-lg"
        )}
      >
        <Button variant="outline" onClick={handlePrev} disabled={stepIndex === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
        </Button>
        <div className="flex gap-2 flex-wrap">
          {isReviewStep && (
            <Button
              variant="outline"
              onClick={() => window.print()}
              title="Imprimir / Exportar PDF"
            >
              <Printer className="h-4 w-4 mr-2" /> Imprimir
            </Button>
          )}
          <Button variant="outline" onClick={() => saveDraft(true)} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar rascunho"}
          </Button>
          {isReviewStep ? (
            <Button onClick={handleFinish}>
              <CheckCircle className="h-4 w-4 mr-2" /> Concluir
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={saving}>
              Próximo <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Versão impressa: hidden no screen, visible em @media print.
          Renderiza TODAS as perguntas (mesmo as não respondidas) com
          header da org/respondente/data e rodapé do sistema. */}
      <PrintableInventory answers={answers} printedBy={userName} />

      {/* Dialog "Próximos passos" — abre depois do Concluir bem-sucedido */}
      <CompletionDialog
        open={showCompletion}
        answers={answers}
        onClose={() => {
          setShowCompletion(false);
          router.push("/dashboard/inventario");
        }}
      />

      {/* Picker de modelos — disponível também durante o wizard
          (acessível pelo botão "Trocar modelo" no header). */}
      <TemplatePicker
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onPick={handlePickTemplate}
      />

      {/* Carta de Serviços — Modelo 2 combinável: pode ser disparado
          a qualquer momento durante o wizard pra enriquecer campos vazios. */}
      <CartaServicosPicker
        open={cartaPickerOpen}
        onOpenChange={setCartaPickerOpen}
        currentAnswers={answers}
        onApply={handleApplyAiPrefill}
      />
    </div>
  );
}

/**
 * Mapeia título do bloco do onboarding pro ícone+cor correspondente.
 * Match exato pelo título (definido em lib/inventario-form-schema.ts).
 */
function blockIcon(title: string): { Icon: LucideIcon; color: string } {
  const t = title.trim().toLowerCase();
  if (t.startsWith("instru")) return { Icon: BookOpen, color: "text-blue-600 dark:text-blue-400" };
  if (t.startsWith("aten"))    return { Icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400" };
  if (t.startsWith("gloss"))   return { Icon: BookMarked, color: "text-emerald-600 dark:text-emerald-400" };
  return { Icon: BookOpen, color: "text-gray-600 dark:text-gray-400" };
}

/** Tela de Onboarding (3 blocos colapsáveis com texto). */
function OnboardingStepView({ step }: { step: Extract<WizardStep, { kind: "onboarding" }> }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0])); // primeiro aberto
  const toggle = (idx: number) => {
    const s = new Set(expanded);
    if (s.has(idx)) s.delete(idx);
    else s.add(idx);
    setExpanded(s);
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          {step.title}
        </CardTitle>
        <CardDescription>
          Leia as orientações antes de prosseguir. Cada processo da sua área deve ter um formulário separado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mapa visual dos 12 mini-apps que serão alimentados — orientação
            antes do user investir tempo nas 58 perguntas. */}
        <MiniAppsMap />

        {step.blocks.map((b, idx) => {
          const isOpen = expanded.has(idx);
          const { Icon, color } = blockIcon(b.title);
          return (
            <div
              key={idx}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Icon className={`h-4 w-4 ${color}`} />
                  {b.title}
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              {isOpen && (
                <div className="p-4 text-sm whitespace-pre-line leading-relaxed text-gray-700 dark:text-gray-300">
                  {b.body}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </>
  );
}

/**
 * Metadata visual por seção: ícone + classes de cor (acento, fundo,
 * texto). Mantém consistência visual entre wizard e revisão.
 */
const SECTION_META: Record<string, { Icon: LucideIcon; color: string; bg: string; border: string }> = {
  sec1: { Icon: UserIcon, color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-950/30",     border: "border-blue-500" },
  sec2: { Icon: FileText, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-500" },
  sec3: { Icon: Database, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-500" },
  sec4: { Icon: Activity, color: "text-pink-600 dark:text-pink-400",     bg: "bg-pink-50 dark:bg-pink-950/30",     border: "border-pink-500" },
  sec5: { Icon: Inbox,    color: "text-teal-600 dark:text-teal-400",     bg: "bg-teal-50 dark:bg-teal-950/30",     border: "border-teal-500" },
  sec6: { Icon: Share2,   color: "text-cyan-600 dark:text-cyan-400",     bg: "bg-cyan-50 dark:bg-cyan-950/30",     border: "border-cyan-500" },
  sec7: { Icon: Server,   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-500" },
};

/**
 * Combinações field/valor que merecem destaque amarelo na revisão —
 * pontos de risco LGPD que o usuário deve revisar com atenção.
 */
const ATTENTION_HIGHLIGHTS: Record<string, string[]> = {
  data_sensitive_yn: ["Sim"],
  use_automated_decision: ["Sim"],
  use_marketing: ["Sim"],
  share_international: ["Sim"],
  store_paper_external: ["Sim"],
};

function isAttention(fieldId: string, value: string | string[]): boolean {
  const triggers = ATTENTION_HIGHLIGHTS[fieldId];
  if (!triggers) return false;
  if (Array.isArray(value)) return value.some((v) => triggers.includes(v));
  return triggers.includes(value);
}

/** Tela de revisão final — mostra um resumo das respostas por seção. */
function ReviewStepView({
  answers,
  onJumpToStep,
}: {
  answers: FormAnswers;
  onJumpToStep: (stepIndex: number) => void;
}) {
  const sections = INVENTARIO_FORM_SCHEMA.filter(
    (s) => s.kind === "section"
  ) as Extract<WizardStep, { kind: "section" }>[];

  // Agregados pra card-resumo
  const stats = useMemo(() => {
    let totalVisible = 0;
    let totalFilled = 0;
    let completeSections = 0;
    let attentionPoints = 0;
    for (const sec of sections) {
      const sa = ((answers as any)[sec.id] ?? {}) as Record<string, any>;
      const visible = sec.fields.filter((f) => isFieldVisible(f, sa));
      const filled = visible.filter((f) => {
        const v = sa[f.id];
        return Array.isArray(v) ? v.length > 0 : !!v?.toString().trim();
      });
      totalVisible += visible.length;
      totalFilled += filled.length;
      if (filled.length === visible.length && visible.length > 0) completeSections++;
      for (const f of visible) {
        if (isAttention(f.id, sa[f.id])) attentionPoints++;
      }
    }
    return { totalVisible, totalFilled, completeSections, totalSections: sections.length, attentionPoints };
  }, [answers, sections]);

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Revisão e Conclusão
        </CardTitle>
        <CardDescription>
          Confira o resumo abaixo. Clique em <strong>Editar</strong> em cada seção pra voltar e ajustar.
          Quando estiver tudo certo, clique <strong>Concluir</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Card-resumo no topo */}
        <SummaryCard stats={stats} />

        {/* Lista de seções */}
        <div className="space-y-5">
          {sections.map((sec) => (
            <ReviewSectionCard
              key={sec.id}
              section={sec}
              answers={answers}
              onJumpToStep={onJumpToStep}
            />
          ))}
        </div>
      </CardContent>
    </>
  );
}

/** Card-resumo com totais agregados de completude + ponto de atenção. */
function SummaryCard({
  stats,
}: {
  stats: { totalVisible: number; totalFilled: number; completeSections: number; totalSections: number; attentionPoints: number };
}) {
  const pct = stats.totalVisible
    ? Math.round((stats.totalFilled / stats.totalVisible) * 100)
    : 0;
  const isComplete = stats.totalFilled === stats.totalVisible && stats.totalVisible > 0;
  return (
    <div
      className={cn(
        "rounded-lg border-l-4 p-4",
        isComplete
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
          : "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
      )}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <Sparkles
          className={cn(
            "h-6 w-6 shrink-0",
            isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
          )}
        />
        <div className="flex-1 min-w-[200px]">
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {stats.completeSections} de {stats.totalSections} seções concluídas ·{" "}
            {stats.totalFilled} de {stats.totalVisible} perguntas respondidas · {pct}%
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {isComplete
              ? "Tudo preenchido. Pronto pra concluir o mapeamento."
              : "Algumas perguntas opcionais ficaram em branco — você ainda pode concluir, mas considere voltar e completar."}
            {stats.attentionPoints > 0 && (
              <>
                {" "}
                <strong>{stats.attentionPoints} ponto(s) de atenção</strong> destacados em amarelo abaixo (transferência internacional, dados sensíveis, decisão automatizada, etc.).
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Card por seção. */
function ReviewSectionCard({
  section,
  answers,
  onJumpToStep,
}: {
  section: Extract<WizardStep, { kind: "section" }>;
  answers: FormAnswers;
  onJumpToStep: (stepIndex: number) => void;
}) {
  const sectionAnswers = ((answers as any)[section.id] ?? {}) as Record<string, any>;
  const visibleFields = section.fields.filter((f) => isFieldVisible(f, sectionAnswers));
  const filledFields = visibleFields.filter((f) => {
    const v = sectionAnswers[f.id];
    return Array.isArray(v) ? v.length > 0 : !!v?.toString().trim();
  });
  const stepIdx = INVENTARIO_FORM_SCHEMA.findIndex((s) => s.id === section.id);
  const meta = SECTION_META[section.id] ?? SECTION_META.sec1;
  const Icon = meta.Icon;
  const isComplete = filledFields.length === visibleFields.length && visibleFields.length > 0;

  return (
    <div
      id={`review-${section.id}`}
      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden scroll-mt-20"
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-3 border-l-4",
          meta.bg,
          meta.border
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className={cn("h-5 w-5 shrink-0", meta.color)} />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
            {section.title}
          </h3>
          <Badge
            variant={isComplete ? "default" : "secondary"}
            className={cn(
              "text-xs shrink-0",
              isComplete
                ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 hover:bg-amber-100"
            )}
          >
            {isComplete ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : null}
            {filledFields.length} de {visibleFields.length}
            {isComplete && " · Completo"}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onJumpToStep(stepIdx)}
          className="shrink-0 print:hidden"
        >
          Editar
        </Button>
      </div>
      <div className="p-4 space-y-3 text-sm">
        {filledFields.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Nenhum campo preenchido</p>
        ) : (
          filledFields.map((f) => {
            const v = sectionAnswers[f.id];
            const attention = isAttention(f.id, v);
            return (
              <div
                key={f.id}
                className={cn(
                  "grid grid-cols-1 md:grid-cols-3 gap-2 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 last:pb-0",
                  attention && "bg-yellow-50 dark:bg-yellow-950/20 -mx-2 px-2 py-2 rounded"
                )}
              >
                <div className="md:col-span-1 flex items-start gap-2">
                  {attention ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                  ) : (
                    <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  )}
                  <span className="font-bold text-gray-900 dark:text-gray-100 leading-snug">
                    {f.label}
                  </span>
                </div>
                <div className="md:col-span-2 text-gray-700 dark:text-gray-300 break-words">
                  <AnswerDisplay value={v} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Sumário lateral sticky com atalho pra cada seção.
 * Mostra ícone+cor + status (✓ completo, ◐ parcial) por seção.
 */
function ReviewTOC({
  answers,
  onJumpTo,
}: {
  answers: FormAnswers;
  onJumpTo: (secId: string) => void;
}) {
  const sections = INVENTARIO_FORM_SCHEMA.filter(
    (s) => s.kind === "section"
  ) as Extract<WizardStep, { kind: "section" }>[];

  return (
    <div className="lg:sticky lg:top-4 space-y-3">
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-900/50">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
          Navegar
        </h4>
        <ul className="space-y-1">
          {sections.map((sec) => {
            const sa = ((answers as any)[sec.id] ?? {}) as Record<string, any>;
            const visible = sec.fields.filter((f) => isFieldVisible(f, sa));
            const filled = visible.filter((f) => {
              const v = sa[f.id];
              return Array.isArray(v) ? v.length > 0 : !!v?.toString().trim();
            });
            const isComplete = filled.length === visible.length && visible.length > 0;
            const meta = SECTION_META[sec.id] ?? SECTION_META.sec1;
            const Icon = meta.Icon;
            return (
              <li key={sec.id}>
                <button
                  onClick={() => onJumpTo(sec.id)}
                  className="w-full flex items-center gap-2 px-2 py-2 text-left text-sm rounded hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                  <Icon className={cn("h-4 w-4 shrink-0", meta.color)} />
                  <span className="flex-1 truncate">{sec.title.replace(/^\d+\.\s*/, "")}</span>
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">
                      {filled.length}/{visible.length}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Renderiza valor da resposta — chips pra arrays, texto pra strings. */
function AnswerDisplay({ value }: { value: string | string[] }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="italic text-gray-400">—</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((v, i) => (
          <Badge
            key={`${v}-${i}`}
            variant="secondary"
            className={cn(
              "font-normal text-xs",
              v === "N/A" && "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            )}
          >
            {v}
          </Badge>
        ))}
      </div>
    );
  }
  return <span className="whitespace-pre-line">{value}</span>;
}
