// Layout do segmento público /jogos — injeta a barra "Voltar à
// apresentação" (AhaSlides) em todos os jogos de uma vez.
import { VoltarAhaSlides } from "@/components/voltar-ahaslides";

export default function JogosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <VoltarAhaSlides />
    </>
  );
}
