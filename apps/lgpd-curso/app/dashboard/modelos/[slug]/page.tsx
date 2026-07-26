// Modelo do Pacote — versão DENTRO do app (/dashboard/modelos/<slug>).

import { notFound } from "next/navigation";
import { getModeloPacote } from "@/lib/modelos-pacote";
import { ModeloView } from "@/components/modelos/modelo-view";

export default function ModeloPacoteDashboardPage({ params }: { params: { slug: string } }) {
  const modelo = getModeloPacote(params.slug);
  if (!modelo) notFound();
  return <ModeloView modelo={modelo} base="/dashboard/modelos" />;
}
