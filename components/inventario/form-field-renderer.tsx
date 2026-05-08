"use client";

import { useId, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HelpCircle, MinusCircle, RotateCcw } from "lucide-react";
import type { FormField } from "@/lib/inventario-form-schema";
import { cn } from "@/lib/utils";
import { FieldHelp } from "./field-help";

/**
 * Sentinel pra marcar campo opcional explicitamente como "Não se aplica".
 * Diferencia "vazio porque esqueci" de "vazio porque marquei N/A propositalmente".
 *
 * Storage:
 *   - text-short/text-long/single-choice: string `"__NAO_APLICA__"`
 *   - multi-choice: array `["__NAO_APLICA__"]`
 */
export const NAO_APLICA_SENTINEL = "__NAO_APLICA__";

export function isNotApplied(v: string | string[] | undefined): boolean {
  if (typeof v === "string") return v === NAO_APLICA_SENTINEL;
  if (Array.isArray(v))
    return v.length === 1 && v[0] === NAO_APLICA_SENTINEL;
  return false;
}

export function isFieldEmpty(v: string | string[] | undefined): boolean {
  if (v == null) return true;
  if (typeof v === "string") return !v.trim();
  if (Array.isArray(v)) return v.length === 0;
  return true;
}

interface FormFieldRendererProps {
  field: FormField;
  /** Valor atual: string (text/single) ou string[] (multi). */
  value: string | string[] | undefined;
  /** Setter — recebe string ou string[] conforme o type. */
  onChange: (value: string | string[]) => void;
  /** Trava o input (autoFillFrom). */
  readOnly?: boolean;
  /** Marca visual de erro. */
  error?: string;
  disabled?: boolean;
  /** Esconde label/description internos (útil quando o wrapper já mostra). */
  hideLabel?: boolean;
}

/**
 * Renderer único pra todos os tipos de campo do form de Inventário.
 * Decide a UI baseado em `field.type`:
 *
 *   text-short    → Input
 *   text-long     → Textarea
 *   single-choice → RadioGroup com options
 *   multi-choice  → Lista de Checkboxes (com suporte opcional a "Outro")
 */
export function FormFieldRenderer({
  field,
  value,
  onChange,
  readOnly,
  error,
  disabled,
  hideLabel,
}: FormFieldRendererProps) {
  const fieldId = useId();

  // Pergunta = label do campo. Destaque visual: ícone + negrito + cor de
  // acento, pra distinguir das labels das opções (checkbox/radio).
  // Quando há `field.help`, aparece também o botão "?" do FieldHelp ao lado.
  // Campos !required ganham tag "Opcional" pra reduzir ambiguidade visual.
  const labelEl = (
    <div className="flex items-start gap-2 pt-1 pb-1 border-l-4 border-blue-500 dark:border-blue-400 pl-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-r-md">
      <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
      <Label
        htmlFor={fieldId}
        className="block text-sm font-bold leading-snug text-gray-900 dark:text-gray-100 flex-1"
      >
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
        {!field.required && (
          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 align-middle">
            Opcional
          </span>
        )}
      </Label>
      {field.help && (
        <div className="mt-0.5">
          <FieldHelp
            help={field.help}
            fieldLabel={field.label}
            fieldId={field.id}
          />
        </div>
      )}
    </div>
  );

  const descEl = field.description ? (
    <p className="text-xs text-gray-500 dark:text-gray-400 ml-9 -mt-1">
      {field.description}
    </p>
  ) : null;

  const errorEl = error ? <p className="text-xs text-red-500">{error}</p> : null;

  // N/A: só faz sentido pra opcionais. Quando ativo, esconde input e mostra
  // banner "Marcado como não se aplica" + botão "Reverter".
  const naApplied = isNotApplied(value);
  const isOptional = !field.required;
  const valueIsEmpty = isFieldEmpty(value);

  function applyNA() {
    if (field.type === "multi-choice") {
      onChange([NAO_APLICA_SENTINEL]);
    } else {
      onChange(NAO_APLICA_SENTINEL);
    }
  }
  function revertNA() {
    if (field.type === "multi-choice") {
      onChange([]);
    } else {
      onChange("");
    }
  }

  /** Bloco visual quando N/A está ativo. */
  const naBannerEl = naApplied ? (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-sm text-gray-600 dark:text-gray-400">
      <MinusCircle className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        Marcado como <strong>não se aplica</strong>
      </span>
      <button
        type="button"
        onClick={revertNA}
        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
      >
        <RotateCcw className="h-3 w-3" />
        Reverter
      </button>
    </div>
  ) : null;

  /** Botão "Não se aplica" abaixo de input vazio em campo opcional. */
  const naButtonEl =
    isOptional && !naApplied && valueIsEmpty && !readOnly && !disabled ? (
      <button
        type="button"
        onClick={applyNA}
        className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
      >
        <MinusCircle className="h-3 w-3" />
        Marcar como "Não se aplica"
      </button>
    ) : null;

  return (
    <div className={cn("space-y-2", error && "ring-red-200")}>
      {!hideLabel && labelEl}
      {!hideLabel && descEl}

      {naApplied && naBannerEl}

      {!naApplied && field.type === "text-short" && (
        <Input
          id={fieldId}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          disabled={disabled}
          placeholder={field.placeholder}
          className={cn(
            readOnly && "bg-gray-50 dark:bg-gray-900 cursor-not-allowed",
            error && "border-red-500"
          )}
        />
      )}

      {!naApplied && field.type === "text-long" && (
        <Textarea
          id={fieldId}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          disabled={disabled}
          placeholder={field.placeholder}
          rows={3}
          className={cn(
            readOnly && "bg-gray-50 dark:bg-gray-900 cursor-not-allowed",
            error && "border-red-500"
          )}
        />
      )}

      {!naApplied && field.type === "single-choice" && field.options && (
        <RadioGroup
          value={(value as string) ?? ""}
          onValueChange={onChange}
          disabled={disabled || readOnly}
          className="gap-2"
        >
          {field.options.map((opt) => (
            <div key={opt} className="flex items-start gap-2">
              <RadioGroupItem
                value={opt}
                id={`${fieldId}-${opt}`}
                className="mt-1"
              />
              <Label
                htmlFor={`${fieldId}-${opt}`}
                className="text-sm font-normal cursor-pointer leading-snug"
              >
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {!naApplied && field.type === "multi-choice" && field.options && (
        <MultiChoiceField
          field={field}
          value={normalizeMultiValue(value)}
          onChange={onChange as (v: string[]) => void}
          fieldId={fieldId}
          disabled={disabled || readOnly}
        />
      )}

      {naButtonEl}
      {errorEl}
    </div>
  );
}

/**
 * Garante que o valor é sempre array — drafts antigos podem ter sido
 * salvos como string num campo que virou multi-choice (ex: process_volume
 * era single-choice antes da revisão pra ficar 100% literal ao GF).
 */
function normalizeMultiValue(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.trim()) return [v];
  return [];
}

interface MultiChoiceFieldProps {
  field: FormField;
  value: string[];
  onChange: (v: string[]) => void;
  fieldId: string;
  disabled?: boolean;
}

/**
 * Multi-choice = N checkboxes com toggle.
 * Se `field.allowOther`, exibe um "Outro" que abre um input de texto livre;
 * o valor digitado é gravado como `Outro: <texto>` no array.
 */
function MultiChoiceField({
  field,
  value,
  onChange,
  fieldId,
  disabled,
}: MultiChoiceFieldProps) {
  const otherPrefix = "Outro: ";
  const existingOther = value.find((v) => v.startsWith(otherPrefix));
  const [otherChecked, setOtherChecked] = useState(!!existingOther);
  const [otherText, setOtherText] = useState(
    existingOther?.slice(otherPrefix.length) ?? ""
  );

  // Mantém otherChecked/otherText em sync se o pai resetar value
  useEffect(() => {
    const cur = value.find((v) => v.startsWith(otherPrefix));
    setOtherChecked(!!cur);
    setOtherText(cur?.slice(otherPrefix.length) ?? "");
  }, [value]);

  const isChecked = (opt: string) => value.includes(opt);

  const toggle = (opt: string) => {
    const next = isChecked(opt) ? value.filter((v) => v !== opt) : [...value, opt];
    onChange(next);
  };

  const setOther = (checked: boolean, text: string) => {
    setOtherChecked(checked);
    setOtherText(text);
    const withoutOther = value.filter((v) => !v.startsWith(otherPrefix));
    if (checked) {
      // NÃO chamar text.trim() aqui: o useEffect (linhas 282-286)
      // re-sincroniza otherText a partir do `value` recebido, e o trim
      // descartava espaços intermediários durante a digitação — bug
      // reportado pelo user em 2026-05-08 ("documentosaosorgãos").
      // Trim só faz sentido em blur/save final, não em onChange.
      onChange([...withoutOther, otherPrefix + text]);
    } else {
      onChange(withoutOther);
    }
  };

  return (
    <div className="space-y-2">
      {field.options!.map((opt) => (
        <div key={opt} className="flex items-start gap-2">
          <Checkbox
            id={`${fieldId}-${opt}`}
            checked={isChecked(opt)}
            onCheckedChange={() => toggle(opt)}
            disabled={disabled}
            className="mt-1"
          />
          <Label
            htmlFor={`${fieldId}-${opt}`}
            className="text-sm font-normal cursor-pointer leading-snug"
          >
            {opt}
          </Label>
        </div>
      ))}

      {field.allowOther && (
        <div className="flex items-start gap-2">
          <Checkbox
            id={`${fieldId}-other`}
            checked={otherChecked}
            onCheckedChange={(c) => setOther(!!c, otherText)}
            disabled={disabled}
            className="mt-1"
          />
          <div className="flex-1 space-y-1">
            <Label
              htmlFor={`${fieldId}-other`}
              className="text-sm font-normal cursor-pointer"
            >
              Outro
            </Label>
            {otherChecked && (
              <Input
                value={otherText}
                onChange={(e) => setOther(true, e.target.value)}
                placeholder="Especifique"
                disabled={disabled}
                className="h-8"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
