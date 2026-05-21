"use client";

// Modal "Classificar severidade" (Frente 2 — PRI). O DPO responde fatores
// objetivos e a severidade é calculada pela régua da Res. CD/ANPD nº 15/2024.

import { useState, useEffect } from "react";
import { Scale } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { classificarSeveridade } from "./actions";
import {
  FATORES_AGRAVANTES, FATORES_VAZIOS, calcularSeveridade, contarAgravantes,
  prefillFatores, parseFatores, type SeveridadeFatores,
} from "@/lib/incidente-severidade";
import { handlePhaseSkipResult } from "@/lib/phase-skip-handler";
import toast from "react-hot-toast";

type Inc = any;

const SEV_INFO: Record<string, { label: string; cls: string }> = {
  BAIXA:   { label: "BAIXA",   cls: "bg-gray-100 text-gray-700 border-gray-300" },
  MEDIA:   { label: "MÉDIA",   cls: "bg-amber-100 text-amber-800 border-amber-300" },
  ALTA:    { label: "ALTA",    cls: "bg-orange-100 text-orange-800 border-orange-300" },
  CRITICA: { label: "CRÍTICA", cls: "bg-red-100 text-red-800 border-red-300" },
};

export function ClassificarSeveridadeModal({
  incidente,
  open,
  onClose,
}: {
  incidente: Inc | null;
  open: boolean;
  onClose: () => void;
}) {
  const [fatores, setFatores] = useState<SeveridadeFatores>(FATORES_VAZIOS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !incidente) return;
    const salvos = parseFatores(incidente.severidadeFatores);
    setFatores(
      salvos ?? prefillFatores({ ...FATORES_VAZIOS, houveAcesso: true }, incidente.formularioAnpd)
    );
  }, [open, incidente]);

  if (!incidente) return null;

  const resultado = calcularSeveridade(fatores);
  const nAgravantes = contarAgravantes(fatores);
  const info = SEV_INFO[resultado];

  function set(patch: Partial<SeveridadeFatores>) {
    setFatores((f) => ({ ...f, ...patch }));
  }

  async function aplicar() {
    if (!incidente) return;
    setLoading(true);
    try {
      const r = await classificarSeveridade(incidente.id, fatores);
      if (handlePhaseSkipResult(r)) return;
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`Severidade classificada: ${r.severidade}`);
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Erro ao classificar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-brand-600" /> Classificar severidade
          </DialogTitle>
          <DialogDescription>
            Responda os fatores objetivos — a severidade é calculada pela régua da
            Resolução CD/ANPD nº 15/2024. Incidente: {incidente.titulo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {/* Pergunta de base */}
          <div className="border rounded-lg p-3">
            <div className="font-medium mb-2">
              Houve acesso, perda ou exposição efetiva de dados?
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set({ houveAcesso: true })}
                className={`flex-1 text-sm border rounded px-3 py-2 transition-colors ${
                  fatores.houveAcesso
                    ? "border-brand-500 bg-brand-50 font-medium text-brand-900"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                Sim, houve
              </button>
              <button
                type="button"
                onClick={() => set({ houveAcesso: false })}
                className={`flex-1 text-sm border rounded px-3 py-2 transition-colors ${
                  !fatores.houveAcesso
                    ? "border-brand-500 bg-brand-50 font-medium text-brand-900"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                Não — contido a tempo
              </button>
            </div>
          </div>

          {/* Fatores agravantes */}
          {fatores.houveAcesso ? (
            <div className="border rounded-lg p-3">
              <div className="font-medium mb-2">Fatores agravantes</div>
              <div className="space-y-1">
                {FATORES_AGRAVANTES.map((fa) => (
                  <label
                    key={fa.id}
                    className="flex items-start gap-2 cursor-pointer rounded p-1.5 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 mt-0.5 shrink-0"
                      checked={!!fatores[fa.id]}
                      onChange={(e) => set({ [fa.id]: e.target.checked } as Partial<SeveridadeFatores>)}
                    />
                    <span>
                      <span className="font-medium text-gray-800">{fa.rotulo}</span>
                      <span className="block text-xs text-gray-500">{fa.descricao}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 border border-dashed rounded-lg p-3">
              Quase-incidente contido — sem acesso efetivo a dados. Os fatores agravantes
              não se aplicam.
            </div>
          )}

          {/* Resultado */}
          <div className={`border rounded-lg p-3 text-center ${info.cls}`}>
            <div className="text-[11px] uppercase tracking-wide font-semibold opacity-80">
              Severidade calculada
            </div>
            <div className="text-2xl font-bold mt-0.5">{info.label}</div>
            <div className="text-xs mt-1">
              {!fatores.houveAcesso
                ? "Quase-incidente contido."
                : nAgravantes === 0
                  ? "Houve incidente, sem fatores agravantes."
                  : `${nAgravantes} fator(es) agravante(s) marcado(s).`}
            </div>
          </div>

          <p className="text-[11px] text-gray-500">
            A severidade calculada é um piso. Se o contexto pedir, você ainda pode ajustá-la
            manualmente no botão Editar do incidente — na dúvida, classifique pra cima.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={aplicar} disabled={loading}>
            {loading ? "Aplicando…" : "Aplicar classificação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
