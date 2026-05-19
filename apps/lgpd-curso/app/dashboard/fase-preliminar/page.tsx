import { ApresentacaoFacilitadorPage } from "@/components/apresentacao-facilitador";

export const dynamic = "force-dynamic";

export default function FasePreliminarPage() {
  return (
    <ApresentacaoFacilitadorPage
      titulo="🚩 Fase Preliminar"
      subtitulo="Sensibilização e Engajamento"
      duracaoMin={30}
      topicos={[
        {
          titulo: "Por que sensibilizar antes de tudo?",
          descricao: "Adequação à LGPD exige mudança cultural, não só técnica. Servidores precisam SABER o que é dado pessoal pra reconhecer quando estão tratando — caso contrário, o Inventário (Fase 3) vira 'encher formulário no escuro'.",
        },
        {
          titulo: "Capacitação inicial das equipes",
          descricao: "Aula teórica de ~4 horas com conceitos básicos: o que é dado pessoal e sensível, bases legais do Art. 7º e 11º, direitos dos titulares do Art. 18º, papéis (controlador, operador, encarregado).",
        },
        {
          titulo: "Comunicação institucional",
          descricao: "Antes da Fase 1 começar, a alta gestão precisa anunciar oficialmente o início da adequação — sem patrocínio, esforço morre. Comunicado interno + reunião com chefias.",
        },
        {
          titulo: "O que vocês vão fazer no curso",
          descricao: "Esta turma é o RESULTADO da Fase Preliminar — vocês foram capacitados e agora vão exercitar Fase 3 a 7 em ambiente fictício (município de Vegas).",
        },
      ]}
    />
  );
}
