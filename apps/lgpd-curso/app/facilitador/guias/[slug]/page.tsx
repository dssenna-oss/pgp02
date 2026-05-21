import { notFound } from "next/navigation";
import { getGuia, GUIAS } from "@/lib/guias-apoio";
import { GuiaView } from "../guia-view";

export function generateStaticParams() {
  return GUIAS.map((g) => ({ slug: g.slug }));
}

export default function GuiaSlugPage({ params }: { params: { slug: string } }) {
  const guia = getGuia(params.slug);
  if (!guia) notFound();
  return <GuiaView guia={guia} />;
}
