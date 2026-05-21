import { VisualizadorSlides } from "@/components/visualizador-slides";
import { getFaseSlides } from "@/lib/slides-fases";

export const dynamic = "force-dynamic";

export default function Fase1Page() {
  const fase = getFaseSlides("fase-1")!;
  return (
    <div className="max-w-4xl mx-auto">
      <VisualizadorSlides fase={fase} />
    </div>
  );
}
