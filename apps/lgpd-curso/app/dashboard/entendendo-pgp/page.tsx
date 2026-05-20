import { ApresentacaoFacilitadorPage } from "@/components/apresentacao-facilitador";

export const dynamic = "force-dynamic";

export default function EntendendoPgpPage() {
  return (
    <ApresentacaoFacilitadorPage
      faseKey="fundacao"
      titulo="📚 Entendendo o PGP"
      subtitulo="Conceitos e fundamentos do Programa de Governança em Privacidade"
      duracaoMin={45}
      topicos={[
        {
          titulo: "O que é PGP?",
          descricao: "Programa de Governança em Privacidade — não é projeto com início, meio e fim. É PROGRAMA CONTÍNUO que evolui com a organização. Boas práticas previstas no Art. 50 da LGPD + Resolução CD/ANPD nº 2/2022.",
        },
        {
          titulo: "As 8 etapas do PGP",
          descricao: "Fase Preliminar (sensibilização) → Fase 1 (formação de equipes) → Fase 2 (diagnóstico) → Fase 3 (mapeamento e riscos) → Fase 4 (GAP Analysis) → Fase 5 (Plano de Ação) → Fase 6 (execução) → Fase 7 (monitoramento contínuo).",
        },
        {
          titulo: "Política do PGP — documento mater",
          descricao: "A Política do PGP é a declaração formal da instituição: define escopo, papéis, governança, e cita os outros 10 instrumentos (Aviso, RIPD, DSR, etc.) como anexos. É o que prova maturidade.",
        },
        {
          titulo: "Por que adequar à LGPD?",
          descricao: "Risco regulatório (multa ANPD até 2% do faturamento, limitada a R$50M por infração) + risco reputacional + responsabilidade civil + boa governança pública.",
        },
      ]}
    />
  );
}
