"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileText, X, ExternalLink } from "lucide-react";
import { toast } from "react-hot-toast";

export interface AttachmentItem {
  url: string;
  name: string;
  uploadedAt: string;
  kind?: string;
  size?: number;
  mimeType?: string;
}

interface Props {
  operatorId: string;
  /** "CONTRATO" | "DPA" | "EVIDENCIA" | "TERMO_CONFIDENCIALIDADE" | "OUTRO" */
  kind: string;
  /** Lista atual de anexos (pode ser vazia). */
  current: ReadonlyArray<AttachmentItem>;
  /** Modo: lista (várias) ou single (um só, substitui). */
  mode?: "list" | "single";
  /** Label do botão. */
  label?: string;
  disabled?: boolean;
  /** Callback quando lista muda — retorna nova lista (em "single", lista de 0..1). */
  onChange: (next: AttachmentItem[]) => void;
}

export default function TerceiroAttachmentUpload({
  operatorId,
  kind,
  current,
  mode = "list",
  label,
  disabled,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const r = await fetch(`/api/operadores/${operatorId}/upload`, {
        method: "POST",
        body: fd,
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao enviar arquivo");
        return;
      }
      const j = await r.json();
      const newItem: AttachmentItem = {
        url: j.url,
        name: j.name,
        uploadedAt: j.uploadedAt,
        kind: j.kind,
        size: j.size,
        mimeType: j.mimeType,
      };
      const next = mode === "single" ? [newItem] : [...current, newItem];
      onChange(next);
      toast.success("Arquivo enviado");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (idx: number) => {
    if (!confirm(`Remover ${current[idx].name}? O arquivo permanece no Vercel Blob mas deixa de aparecer aqui.`)) return;
    const next = [...current];
    next.splice(idx, 1);
    onChange(next);
  };

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {current.length > 0 && (
        <ul className="space-y-1">
          {current.map((a, idx) => (
            <li
              key={idx}
              className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-md px-2.5 py-1.5"
            >
              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 truncate hover:underline"
              >
                {a.name}
              </a>
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
                title="Abrir em nova aba"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              {!disabled && (
                <button
                  onClick={() => handleRemove(idx)}
                  className="text-red-600 hover:text-red-700"
                  title="Remover"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {(mode === "list" || current.length === 0) && (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.png,.jpg,.jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
            onChange={onSelect}
            disabled={disabled || uploading}
          />
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5 mr-1.5" />
            )}
            {label ?? "Enviar arquivo"}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            PDF, DOCX, PNG ou JPG (máx 10MB)
          </p>
        </div>
      )}
    </div>
  );
}
