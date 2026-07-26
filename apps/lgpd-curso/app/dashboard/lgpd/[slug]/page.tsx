// Módulo "A LGPD, artigo por artigo" — versão pro CELULAR do participante
// LOGADO (/dashboard/lgpd/<slug>), dentro da moldura do app.
//
// É o hrefAluno dos conteúdos "lgpd-*" do Telão Comandado: quando o
// facilitador projeta um módulo, o celular em Modo Cards espelha pra cá e
// segue sozinho quando ele avança (mesmo mecanismo do /dashboard/guia-art-1-11).
// Rota liberada pro ADMIN no middleware (lista ADMIN_DASHBOARD_PERMITIDO).

import { notFound } from "next/navigation";
import { getModuloLgpd } from "@/lib/estrutura-lgpd";
import { ModuloLgpdFrame } from "@/components/lgpd/modulo-frame";

export default function ModuloLgpdDashboardPage({ params }: { params: { slug: string } }) {
  const modulo = getModuloLgpd(params.slug);
  if (!modulo) notFound();
  return <ModuloLgpdFrame modulo={modulo} modo="dashboard" />;
}
