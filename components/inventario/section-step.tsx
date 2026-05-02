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
import { CheckCircle2, AlertCircle } from "lucide-react";
import { FormFieldRenderer } from "./form-field-renderer";
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

  return (
    <>
      <CardHeader>
        <CardTitle>{section.title}</CardTitle>
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
}: {
  field: FormField;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
  error?: string;
}) {
  const filled = Array.isArray(value)
    ? value.length > 0
    : !!value?.toString().trim();
  const count = Array.isArray(value) ? value.length : 0;

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
          {error ? (
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          ) : filled ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          ) : (
            <span className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0" />
          )}
          <span className="font-medium text-sm">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </span>
          {count > 0 && (
            <Badge variant="secondary" className="ml-auto mr-2 text-xs">
              {count} selecionado{count !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pt-2 pb-2">
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
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
