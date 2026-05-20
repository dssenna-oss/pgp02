import { ApresentacaoFacilitadorPage } from "@/components/apresentacao-facilitador";

export const dynamic = "force-dynamic";

export default function Fase2Page() {
  return (
    <ApresentacaoFacilitadorPage
      faseKey="escopo"
      titulo="🚩 Fase 2 — Diagnóstico Inicial"
      subtitulo="Escopo + levantamento preliminar"
      duracaoMin={20}
      topicos={[
        {
          titulo: "O que é Diagnóstico Inicial?",
          descricao: "Fotografia do ponto de partida — quais setores tratam dados pessoais, com que sistemas, quais riscos óbvios. Não é Inventário detalhado (isso vem na Fase 3); é mapa macro.",
        },
        {
          titulo: "Identificar setores que tratam dados",
          descricao: "DPO + Comitê fazem o varredura: Saúde, Educação, RH, Procuradoria, TI, Ouvidoria, Cerimonial... Cada setor sinaliza os principais processos que envolvem dados de cidadãos ou servidores.",
        },
        {
          titulo: "Definir ordem de prioridade",
          descricao: "Nem todos os processos são detalhados ao mesmo tempo. Os que envolvem dados sensíveis, volumes maiores ou riscos óbvios vêm primeiro. Os outros entram em ondas seguintes.",
        },
        {
          titulo: "O que isso entrega pra Fase 3",
          descricao: "Lista pré-priorizada do que catalogar. Os 2 processos pré-cadastrados que vocês vão detalhar no curso (Posto de Saúde + Estagiários, ou Tribuna Livre + Ouvidoria) VIERAM desse levantamento da Fase 2.",
        },
      ]}
    />
  );
}
