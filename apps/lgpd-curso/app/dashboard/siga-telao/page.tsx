// Landing "👀 Siga o telão" LIMPA — destino do celular do participante quando o
// facilitador projeta um conteúdo SÓ-TELÃO (sem página própria no celular).
//
// Em Modo Cards, o TelaoAvisoBanner manda o celular pra cá nesses casos, em vez
// de deixar a última atividade carregada e clicável competindo com a faixa
// "acompanhe pelo telão". Aqui o hero aparece SEM os botões de Quiz/Termômetro
// (acoes ausente) — tela neutra de espera.

import { SigaTelaoHero } from "@/components/siga-telao-hero";

export const dynamic = "force-dynamic";

export default function SigaTelaoPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <SigaTelaoHero />
    </div>
  );
}
