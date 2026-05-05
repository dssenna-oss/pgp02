"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Upload,
  FileText,
  Sparkles,
  AlertCircle,
  Check,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface ExtractionResult {
  noText: boolean;
  textLength: number;
  cnpjs: string[];
  suggestedNames: string[];
  contractOriginalDate: string | null;
  contractExpiresAt: string | null;
  hasPrivacyClause: boolean;
  hasIncidentClause: boolean;
  detectedKeywords: string[];
}

interface BlobInfo {
  url: string;
  size: number;
  name: string;
  uploadedAt: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

/**
 * Modal de importação de contrato em PDF (Checkpoint 14 H1 / D2).
 *
 * Fluxo em 2 etapas:
 *   1. UPLOAD: DPO sobe o PDF, sistema processa via regex e devolve
 *      preview editável (CNPJ, razão social, datas, cláusulas LGPD).
 *   2. CONFIRM: DPO revisa/edita, clica "Cadastrar e abrir detalhes" →
 *      sistema cria Operator com os dados confirmados + anexa o PDF
 *      como contractAttachments[0] e marca lgpdComplianceStatus =
 *      NAO_AVALIADO.
 *
 * Aceita só PDFs pesquisáveis (com camada de texto). Escaneados sem OCR
 * são rejeitados com mensagem clara.
 */
export default function TerceiroPdfImportModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"upload" | "preview">("upload");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Após extração
  const [blob, setBlob] = useState<BlobInfo | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);

  // Form editável (preenchido pela extração)
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contractOriginalDate, setContractOriginalDate] = useState("");
  const [contractExpiresAt, setContractExpiresAt] = useState("");
  const [hasPrivacyClause, setHasPrivacyClause] = useState(false);
  const [hasIncidentClause, setHasIncidentClause] = useState(false);

  const reset = () => {
    setStage("upload");
    setBlob(null);
    setExtraction(null);
    setName("");
    setCnpj("");
    setContractOriginalDate("");
    setContractExpiresAt("");
    setHasPrivacyClause(false);
    setHasIncidentClause(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (uploading || creating) return;
    reset();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Apenas PDFs são aceitos");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máximo 10 MB)");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/operadores/extract-pdf", {
        method: "POST",
        body: fd,
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao processar PDF");
        return;
      }
      const j = await r.json();
      setBlob(j.blob);
      setExtraction(j.extraction);
      // Pré-preenche campos do form com sugestões
      setName(j.extraction.suggestedNames[0] ?? "");
      setCnpj(j.extraction.cnpjs[0] ?? "");
      setContractOriginalDate(j.extraction.contractOriginalDate ?? "");
      setContractExpiresAt(j.extraction.contractExpiresAt ?? "");
      setHasPrivacyClause(j.extraction.hasPrivacyClause);
      setHasIncidentClause(j.extraction.hasIncidentClause);
      setStage("preview");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Razão social é obrigatória");
      return;
    }
    setCreating(true);
    try {
      const r = await fetch("/api/operadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          cnpj: cnpj.trim() || null,
          contractOriginalDate: contractOriginalDate || null,
          contractExpiresAt: contractExpiresAt || null,
          hasPrivacyClause,
          hasIncidentClause,
          contractAttachments: blob
            ? [
                {
                  name: blob.name,
                  url: blob.url,
                  uploadedAt: blob.uploadedAt,
                  kind: "CONTRATO",
                },
              ]
            : [],
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao cadastrar");
        return;
      }
      const j = await r.json();
      toast.success("Operador cadastrado a partir do PDF");
      reset();
      onCreated(j.operator.id);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Importar contrato (PDF)
          </DialogTitle>
          <DialogDescription>
            Suba um contrato vigente em PDF pesquisável. O sistema extrai
            CNPJ, razão social, datas e detecta cláusulas LGPD existentes
            via regex. PDFs escaneados sem OCR não são suportados.
          </DialogDescription>
        </DialogHeader>

        {/* Etapa 1: upload */}
        {stage === "upload" && (
          <div className="py-6 space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                "border-blue-200 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900",
                uploading && "opacity-50 pointer-events-none"
              )}
            >
              <FileText className="h-12 w-12 mx-auto text-blue-400 mb-3" />
              <p className="font-medium mb-2">
                {uploading
                  ? "Processando PDF…"
                  : "Selecione um PDF de contrato"}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Máximo 10 MB. Apenas PDFs pesquisáveis (com texto).
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
                id="pdf-upload-input"
              />
              <Button
                asChild
                variant="outline"
                disabled={uploading}
              >
                <label htmlFor="pdf-upload-input" className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Selecionar arquivo
                </label>
              </Button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md p-3 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-amber-800 dark:text-amber-200">
                <p className="font-medium">PDFs escaneados não funcionam</p>
                <p className="text-xs mt-0.5">
                  A extração depende de camada de texto. Se o PDF foi
                  digitalizado, rode OCR antes (Acrobat, Adobe Scan, etc.)
                  ou cadastre o operador manualmente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Etapa 2: preview */}
        {stage === "preview" && extraction && blob && (
          <div className="py-2 space-y-4">
            {/* Sumário do que foi extraído */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-md p-3 text-sm">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-emerald-900 dark:text-emerald-200">
                    Extração concluída ({extraction.textLength.toLocaleString("pt-BR")} caracteres lidos)
                  </p>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {extraction.cnpjs.length > 0 && (
                      <Badge variant="outline" className="text-xs bg-white">
                        {extraction.cnpjs.length} CNPJ(s)
                      </Badge>
                    )}
                    {extraction.suggestedNames.length > 0 && (
                      <Badge variant="outline" className="text-xs bg-white">
                        {extraction.suggestedNames.length} nome(s) candidato(s)
                      </Badge>
                    )}
                    {extraction.detectedKeywords.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-white text-blue-700"
                      >
                        Cláusulas LGPD detectadas
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sugestões alternativas (caso a primeira esteja errada) */}
            {extraction.suggestedNames.length > 1 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  Outros candidatos a razão social:
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {extraction.suggestedNames.slice(1).map((n) => (
                    <Button
                      key={n}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setName(n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {extraction.cnpjs.length > 1 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  Outros CNPJs encontrados:
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {extraction.cnpjs.slice(1).map((c) => (
                    <Button
                      key={c}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setCnpj(c)}
                    >
                      {c}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Campos editáveis */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="ext-name">Razão social *</Label>
                <Input
                  id="ext-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Acme Tecnologia Ltda."
                  maxLength={200}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ext-cnpj">CNPJ</Label>
                <Input
                  id="ext-cnpj"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  maxLength={30}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ext-original">Data do contrato original</Label>
                  <Input
                    id="ext-original"
                    type="date"
                    value={contractOriginalDate}
                    onChange={(e) => setContractOriginalDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ext-expires">Vigência (término)</Label>
                  <Input
                    id="ext-expires"
                    type="date"
                    value={contractExpiresAt}
                    onChange={(e) => setContractExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Cláusulas LGPD detectadas no PDF
                </Label>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      checked={hasPrivacyClause}
                      onCheckedChange={(v) => setHasPrivacyClause(!!v)}
                    />
                    <div className="text-sm">
                      <p>Cláusula de privacidade / LGPD presente</p>
                      <p className="text-xs text-muted-foreground">
                        Detecção por keyword (LGPD, Lei 13.709, ANPD,
                        encarregado…). Confirme após ler o contrato.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      checked={hasIncidentClause}
                      onCheckedChange={(v) => setHasIncidentClause(!!v)}
                    />
                    <div className="text-sm">
                      <p>Cláusula de notificação de incidente presente</p>
                      <p className="text-xs text-muted-foreground">
                        Keyword: "notificação de incidente", "72 horas",
                        "comunicação à ANPD".
                      </p>
                    </div>
                  </label>
                </div>
                {extraction.detectedKeywords.length > 0 && (
                  <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-900 rounded p-2 mt-2">
                    <strong>Trechos detectados:</strong>{" "}
                    {extraction.detectedKeywords.slice(0, 6).join(" · ")}
                    {extraction.detectedKeywords.length > 6 &&
                      ` · +${extraction.detectedKeywords.length - 6}`}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md p-3 text-sm flex items-start gap-2">
                <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-blue-800 dark:text-blue-200">
                  <p className="font-medium">{blob.name}</p>
                  <p className="text-xs mt-0.5">
                    {(blob.size / 1024).toFixed(0)} KB · será anexado
                    automaticamente como evidência do contrato original.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-2 justify-between pt-2 border-t">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={uploading || creating}
          >
            Cancelar
          </Button>
          {stage === "preview" && (
            <Button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cadastrando…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Cadastrar e abrir detalhes
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
