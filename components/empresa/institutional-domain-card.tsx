"use client";

/**
 * Card de edição do "Domínio institucional" (Etapa 28, 2026-05-11).
 *
 * Campo opcional cadastrado UMA VEZ por organização. Alimenta:
 *   - Botão "🔍 Buscar no Google" no modal de Pré-preencher por Carta
 *   - Auto-descobrir URLs via Firecrawl /v1/map
 *
 * Por que separado dos outros campos da Empresa (que ainda são
 * placeholders): esse aqui já tem CRUD funcional contra o banco.
 * Dá pra refatorar a tela de Empresa inteira em outra fatia.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Globe2,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function InstitutionalDomainCard() {
  const [loaded, setLoaded] = useState(false);
  const [value, setValue] = useState("");
  const [savedValue, setSavedValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  /** Erro persistente visível inline (não some como o toast). */
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/company/institutional-domain", {
          cache: "no-store",
        });
        if (r.ok) {
          const j = await r.json();
          const dom = j?.institutionalDomain ?? "";
          setValue(dom);
          setSavedValue(dom || null);
        } else {
          // Logar pra debug — não bloqueia UX
          console.warn(
            "[institutional-domain] GET falhou",
            r.status,
            await r.text().catch(() => ""),
          );
        }
      } catch (e) {
        console.warn("[institutional-domain] GET erro de rede", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Botão "Salvar" habilita quando há texto (mesmo igual ao salvo) OU
  // quando user limpou o campo pra remover. Antes era "só se diferente
  // do salvo" — confundia se o GET inicial falhasse silencioso.
  const hasText = (value || "").trim().length > 0;
  const dirty = (value || "").trim() !== (savedValue ?? "");
  const canSave = loaded && !saving && (dirty || (hasText && !savedValue));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/company/institutional-domain", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionalDomain: value || null }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg =
          j?.error ?? `Erro ao salvar (HTTP ${r.status}). Tente recarregar a página.`;
        console.error("[institutional-domain] PATCH falhou", r.status, j);
        setError(msg);
        toast.error(msg);
        return;
      }
      const next = j?.institutionalDomain ?? null;
      setSavedValue(next);
      setValue(next ?? "");
      toast.success(next ? "Domínio salvo" : "Domínio removido");
    } catch (e: any) {
      const msg = e?.message ?? "Erro de rede ao salvar";
      console.error("[institutional-domain] erro inesperado", e);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-violet-600" />
          Domínio institucional
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          O endereço do site público da organização. Usado pra orientar
          buscas e auto-descobrir URLs ao preencher o Inventário a partir
          da Carta de Serviços. Cadastre uma vez e reuse.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="institutional-domain">
            Domínio (sem https:// nem www.)
          </Label>
          <Input
            id="institutional-domain"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ex: tcees.tc.br, prefeitura.sp.gov.br"
            disabled={!loaded || saving}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Se você colar uma URL completa, o sistema extrai o domínio
            automaticamente ao salvar.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2 text-sm text-red-800 dark:text-red-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong>Não foi possível salvar.</strong>
              <div className="text-xs mt-0.5">{error}</div>
              <div className="text-[11px] mt-1 text-red-700 dark:text-red-400">
                Abra o console do navegador (F12 → Console) pra ver detalhes
                ou tire um print da resposta da rede.
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            {savedValue ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Salvo: <code className="text-gray-800 dark:text-gray-200">{savedValue}</code>
              </>
            ) : (
              <span className="italic">Nenhum domínio cadastrado ainda.</span>
            )}
          </div>
          <Button
            size="sm"
            onClick={save}
            disabled={!canSave}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Salvando…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
