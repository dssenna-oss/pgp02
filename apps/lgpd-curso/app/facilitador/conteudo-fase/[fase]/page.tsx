import { notFound } from "next/navigation";
import { getConteudoFase, CONTEUDO_FASES } from "@/lib/conteudo-fases";
import { ConteudoFaseView } from "@/components/conteudo-fase-view";

export function generateStaticParams() {
  return CONTEUDO_FASES.map((f) => ({ fase: f.slug }));
}

export default function ConteudoFaseSlugPage({ params }: { params: { fase: string } }) {
  const fase = getConteudoFase(params.fase);
  if (!fase) notFound();
  return <ConteudoFaseView fase={fase} />;
}
