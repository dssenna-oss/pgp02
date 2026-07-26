// Modelo do Pacote — versão PÚBLICA (/modelos/<slug>). QR do slide abre aqui.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getModeloPacote, MODELOS_PACOTE } from "@/lib/modelos-pacote";
import { ModeloView } from "@/components/modelos/modelo-view";

export function generateStaticParams() {
  return MODELOS_PACOTE.map((m) => ({ slug: m.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const modelo = getModeloPacote(params.slug);
  if (!modelo) return {};
  return { title: `Modelo ${String(modelo.numero).padStart(2, "0")} — ${modelo.titulo}` };
}

export default function ModeloPacotePublicoPage({ params }: { params: { slug: string } }) {
  const modelo = getModeloPacote(params.slug);
  if (!modelo) notFound();
  return <ModeloView modelo={modelo} base="/modelos" />;
}
