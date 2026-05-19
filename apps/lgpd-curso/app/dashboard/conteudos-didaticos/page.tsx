import { ApresentacaoFacilitadorPage } from "@/components/apresentacao-facilitador";

export const dynamic = "force-dynamic";

export default function ConteudosDidaticosPage() {
  return (
    <ApresentacaoFacilitadorPage
      titulo="📚 Conteúdos Didáticos"
      subtitulo="Material educativo e recursos sobre LGPD"
      duracaoMin={30}
      topicos={[
        {
          titulo: "Vídeos didáticos",
          descricao: "Sequência de vídeos curtos sobre os conceitos fundamentais da LGPD — o que é dado pessoal, dado sensível, anonimização, pseudonimização.",
        },
        {
          titulo: "E-books e referências legais",
          descricao: "LGPD comentada (lei 13.709/2018), Resoluções CD/ANPD relevantes (2/2022, 15/2024, 18/2024, 20/2024), Decreto 11.137/2022, Guia da ANPD para Agentes de Tratamento.",
        },
        {
          titulo: "Glossário LGPD",
          descricao: "Definições rápidas dos termos-chave: titular, controlador, operador, encarregado, tratamento, eliminação, transferência internacional.",
        },
      ]}
    />
  );
}
