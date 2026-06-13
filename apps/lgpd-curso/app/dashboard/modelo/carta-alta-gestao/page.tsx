// Modelo demonstrativo da Carta para a Alta Gestão (Fase Preliminar).
// Projetável no Telão Comandado (conteudo:modelo-carta-alta-gestao). Espelha o
// Modelo 02 do Pacote, com [colchetes] no lugar dos dados do órgão — é exemplo
// pra mostrar a estrutura na sala. A versão editável (form) fica em
// /dashboard/fase-preliminar/carta-alta-gestao (Modalidade A) e no Pacote.

import { ModeloDocumento } from "@/components/modelo-documento";

export const dynamic = "force-dynamic";

export default function ModeloCartaAltaGestaoPage() {
  return (
    <ModeloDocumento titulo="Carta para a Alta Gestão (modelo)">
      <p>
        À <strong>[Excelentíssimo(a) Senhor(a) Prefeito(a) / Presidente da Câmara de [município]]</strong>
      </p>
      <p className="font-bold">
        Assunto: Patrocínio Institucional ao Programa de Governança em Privacidade (PGP)
      </p>

      <p className="font-bold pt-2">1. Justificativa legal</p>
      <p>
        A Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD) está em vigor desde
        setembro de 2020 e é plenamente aplicável aos órgãos da Administração Pública.{" "}
        <strong>[seu órgão]</strong> trata, no exercício de suas atribuições, volume expressivo de
        dados pessoais de cidadãos, servidores e fornecedores — incluindo dados sensíveis. A
        adequação tornou-se obrigação institucional, com responsabilização direta do(a) gestor(a)
        máximo(a) em caso de descumprimento.
      </p>

      <p className="font-bold pt-2">2. Riscos de não-cumprimento</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Sanções administrativas pela ANPD (advertência, publicização da infração, dano à imagem).</li>
        <li>Responsabilização civil em caso de incidente (art. 42 LGPD), com indenizações.</li>
        <li>Repercussão midiática e perda de confiança da população.</li>
        <li>Apontamentos em auditorias do Tribunal de Contas e do Ministério Público.</li>
      </ul>

      <p className="font-bold pt-2">3. Pedido</p>
      <p>
        Solicitamos formalmente o apoio institucional de Vossa Excelência para a implementação do
        PGP de <strong>[seu órgão]</strong>, especificamente:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Designação formal do(a) Encarregado(a) pelo Tratamento de Dados Pessoais (art. 41 LGPD);</li>
        <li>Constituição do Comitê Gestor de Privacidade, com representação multidisciplinar;</li>
        <li>Alocação de recursos humanos e orçamentários compatíveis com os tratamentos;</li>
        <li>Inclusão da adequação à LGPD como pauta recorrente das reuniões de gestão.</li>
      </ul>

      <p className="pt-2">
        Comprometemo-nos a apresentar, no prazo de <strong>[30 dias]</strong> após o início formal
        dos trabalhos, o cronograma de implementação e a lista priorizada de processos a mapear.
      </p>

      <p className="pt-4">Respeitosamente,</p>
      <p className="pt-6">_______________________________________</p>
      <p className="font-bold">[NOME DO RESPONSÁVEL PELA CONDUÇÃO / ENCARREGADO]</p>
      <p className="italic text-sm text-gray-600">Encarregado(a) pelo Tratamento de Dados Pessoais</p>
    </ModeloDocumento>
  );
}
