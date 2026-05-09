"use client";

import { useMemo } from "react";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { FormFieldRenderer } from "./form-field-renderer";
import { FieldHelp } from "./field-help";
import { getSectionMeta } from "./section-meta";
import {
  type FormField,
  type FormSection,
  isFieldVisible,
} from "@/lib/inventario-form-schema";
import { cn } from "@/lib/utils";

interface SectionStepProps {
  section: FormSection;
  /** Respostas dessa seção (slice do `answers` global). */
  sectionAnswers: Record<string, string | string[]>;
  /** Atualiza uma resposta. */
  onFieldChange: (fieldId: string, value: string | string[]) => void;
  /** Erros por field id. */
  errors?: Record<string, string>;
  /**
   * Origem por campo dessa seção (`{ fieldId: "template:<id>" }`).
   * Usado pra exibir badge "📋 Modelo" nos campos pré-preenchidos.
   */
  provenance?: Record<string, string>;
}

/**
 * Renderiza uma seção do wizard — todos os fields visíveis dela.
 * Campos com `autoFillFrom` vêm marcados como readonly; com `dependsOn`
 * só aparecem quando o campo dependência tem o valor esperado.
 */
export function SectionStep({
  section,
  sectionAnswers,
  onFieldChange,
  errors,
  provenance,
}: SectionStepProps) {
  // Visíveis filtrados (dependsOn)
  const visibleFields = useMemo(
    () => section.fields.filter((f) => isFieldVisible(f, sectionAnswers)),
    [section.fields, sectionAnswers]
  );

  // Lista de ids que devem estar abertos (force-open quando há erro)
  const forceOpenIds = useMemo(
    () => Object.keys(errors ?? {}),
    [errors]
  );

  const meta = getSectionMeta(section.id);
  const SectionIcon = meta.Icon;

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <span className={cn("rounded-md p-1.5", meta.bg)}>
            <SectionIcon className={cn("h-5 w-5", meta.color)} />
          </span>
          {section.title}
        </CardTitle>
        {section.description && (
          <CardDescription>{section.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className={section.collapseFields ? "p-0" : "space-y-6"}>
        {section.collapseFields ? (
          <Accordion
            type="multiple"
            defaultValue={forceOpenIds}
            className="w-full"
          >
            {visibleFields.map((field) => (
              <FieldAccordionItem
                key={field.id}
                field={field}
                value={sectionAnswers[field.id]}
                onChange={(v) => onFieldChange(field.id, v)}
                error={errors?.[field.id]}
                provenance={provenance?.[field.id]}
              />
            ))}
          </Accordion>
        ) : (
          visibleFields.map((field) => (
            <FormFieldRenderer
              key={field.id}
              field={field}
              value={sectionAnswers[field.id]}
              onChange={(v) => onFieldChange(field.id, v)}
              readOnly={!!field.autoFillFrom}
              error={errors?.[field.id]}
              provenance={provenance?.[field.id]}
            />
          ))
        )}
      </CardContent>
    </>
  );
}

/**
 * Wrapper de um campo dentro de um AccordionItem.
 * Header mostra: label + indicador de status (preenchido ✓, com erro ⚠).
 */
function FieldAccordionItem({
  field,
  value,
  onChange,
  error,
  provenance,
}: {
  field: FormField;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
  error?: string;
  provenance?: string;
}) {
  const fromTemplate = provenance?.startsWith("template:") ?? false;
  const filled = Array.isArray(value)
    ? value.length > 0
    : !!value?.toString().trim();
  const count = Array.isArray(value) ? value.length : 0;
  /** Pra single-choice mostramos o valor escolhido em vez do count zero. */
  const singleLabel =
    !Array.isArray(value) && filled ? value!.toString().trim() : null;

  return (
    <AccordionItem
      value={field.id}
      className={cn(
        "border-b last:border-b-0 px-4",
        error && "bg-red-50/40 dark:bg-red-950/20"
      )}
    >
      <AccordionTrigger className="hover:no-underline py-3 text-left">
        <div className="flex items-center gap-3 flex-1">
          {/* Indicador de status (preenchido / erro / pendente) */}
          {error ? (
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          ) : filled ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          ) : (
            <span className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0" />
          )}
          {/* Ícone "pergunta" + label em negrito — match com o padrão visual
              das perguntas das demais seções (não-accordion). */}
          <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
            {fromTemplate && (
              <span
                className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 align-middle"
                title="Pré-preenchido por um modelo padronizado. Você pode editar livremente."
              >
                📋 Modelo
              </span>
            )}
          </span>
          {count > 0 && (
            <Badge variant="secondary" className="ml-auto mr-2 text-xs">
              {count} selecionado{count !== 1 ? "s" : ""}
            </Badge>
          )}
          {singleLabel && (
            <Badge variant="secondary" className="ml-auto mr-2 text-xs">
              {singleLabel}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pt-2 pb-2">
          {field.help && (
            // Em sections com accordion (collapseFields), o label é escondido
            // dentro do FormFieldRenderer (`hideLabel`) e por consequência
            // o botão "?" também sumiria. Renderizamos aqui no topo do
            // conteúdo do accordion pra manter a ajuda acessível.
            <div className="flex items-center gap-2 mb-2">
              <FieldHelp
                help={field.help}
                fieldLabel={field.label}
                fieldId={field.id}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Dúvida sobre esta pergunta?
              </span>
            </div>
          )}
          {field.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {field.description}
            </p>
          )}
          <FormFieldRenderer
            field={field}
            value={value}
            onChange={onChange}
            error={error}
            hideLabel
            provenance={provenance}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
