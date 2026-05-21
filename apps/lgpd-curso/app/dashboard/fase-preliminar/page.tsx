import { VisualizadorSlides } from "@/components/visualizador-slides";
import { BaseLegalCard } from "@/components/base-legal-card";
import { getFaseSlides } from "@/lib/slides-fases";

export const dynamic = "force-dynamic";

export default function FasePreliminarPage() {
  const fase = getFaseSlides("fase-preliminar")!;
  return (
    <div className="max-w-4xl mx-auto">
      <VisualizadorSlides fase={fase} />
      {fase.faseKey && (
        <div className="mt-6">
          <BaseLegalCard faseKey={fase.faseKey} />
        </div>
      )}
    </div>
  );
}
