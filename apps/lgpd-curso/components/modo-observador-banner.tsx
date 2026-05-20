import { Eye } from "lucide-react";

// Banner exibido pro Contribuidor (MEMBER) nas Fases 4-7. Explica por que os
// campos estão bloqueados e que ele continua acompanhando o trabalho do DPO.
export function ModoObservadorBanner() {
  return (
    <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
      <Eye className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-sm text-amber-900 leading-relaxed">
        <strong>👁 Modo Observador.</strong> A partir da Fase 4, a execução é conduzida pelo{" "}
        <strong>DPO / Encarregado</strong> do seu grupo. Você acompanha tudo em tempo real —
        os dados aparecem aqui conforme o DPO trabalha — mas os campos ficam bloqueados pra você.
        Se o DPO precisar da sua ajuda, ele vai te acionar. Continue atento ao seu grupo na mesa.
      </div>
    </div>
  );
}
