// Módulo do mini app "A LGPD, artigo por artigo" — versão PÚBLICA (/lgpd/<slug>).
// QR do slide abre direto aqui; a moldura adiciona a faixa "‹ Todos os módulos"
// e a barra "⬅️ Voltar à apresentação" (components/lgpd/modulo-frame.tsx).

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getModuloLgpd, MODULOS_LGPD } from "@/lib/estrutura-lgpd";
import { ModuloLgpdFrame } from "@/components/lgpd/modulo-frame";

export function generateStaticParams() {
  return MODULOS_LGPD.map((m) => ({ slug: m.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const modulo = getModuloLgpd(params.slug);
  if (!modulo) return {};
  // Histórico e Simulado já se explicam pelo título; as faixas ganham o intervalo.
  const ehFaixa = modulo.intervalo.startsWith("Arts.");
  return { title: ehFaixa ? `LGPD — ${modulo.intervalo}: ${modulo.titulo}` : modulo.titulo };
}

export default function ModuloLgpdPublicoPage({ params }: { params: { slug: string } }) {
  const modulo = getModuloLgpd(params.slug);
  if (!modulo) notFound();
  return <ModuloLgpdFrame modulo={modulo} modo="publico" />;
}
