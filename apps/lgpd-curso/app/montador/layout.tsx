// Layout do segmento público /montador — injeta a barra "Voltar à
// apresentação" (AhaSlides) em TODAS as páginas do montador de uma vez.
import { VoltarAhaSlides } from "@/components/voltar-ahaslides";

export default function MontadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <VoltarAhaSlides />
    </>
  );
}
