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
import { Globe2, Loader2, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function InstitutionalDomainCard() {
  const [loaded, setLoaded] = useState(false);
  const [value, setValue] = useState("");
  const [savedValue, setSavedValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
        }
      } catch {
        // silencioso
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const dirty = (value || "").trim() !== (savedValue ?? "");

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/company/institutional-domain", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionalDomain: value || null }),
      });
      const j = await r.json();
      if (!r.ok) {
        toast.error(j?.error ?? "Erro ao salvar");
        return;
      }
      const next = j?.institutionalDomain ?? null;
      setSavedValue(next);
      setValue(next ?? "");
      toast.success(
        next ? "Domínio salvo" : "Domínio removido",
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Erro de rede");
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
            disabled={!loaded || saving || !dirty}
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
