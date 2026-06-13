// Modelo demonstrativo da Portaria de Instituição do Comitê Gestor de
// Privacidade e Proteção de Dados (Fase 1 — "Formação das equipes de
// trabalho"). Projetável no Telão Comandado (conteudo:modelo-portaria-comite).
// Composição derivada dos papéis do grupo (o grupo É o comitê); competências
// ancoradas no art. 50 (Programa de Governança) e art. 41 (Encarregado) da LGPD.

import { ModeloDocumento } from "@/components/modelo-documento";
import { composicaoComite, COMPETENCIAS_COMITE, PORQUE_COMITE } from "@/lib/comite-lgpd";

export const dynamic = "force-dynamic";

export default function ModeloPortariaComitePage() {
  // Composição-exemplo (PM): o conjunto de áreas que tratam dados no órgão.
  // Na Câmara, troque pelas áreas equivalentes (Cerimonial, Ouvidoria,
  // Procuradoria…). O grupo do curso JÁ representa esses papéis.
  const membros = composicaoComite("PM");

  return (
    <ModeloDocumento titulo="Portaria do Comitê Gestor de Privacidade (modelo)">
      <p className="text-center font-bold text-lg">PORTARIA Nº [__/____]</p>
      <p className="text-center italic text-gray-600">
        (Institui o Comitê Gestor de Privacidade e Proteção de Dados Pessoais)
      </p>

      <p className="italic text-gray-700 pt-2">
        Institui o Comitê Gestor de Privacidade e Proteção de Dados Pessoais de{" "}
        <strong>[seu órgão]</strong> e define sua composição e competências, em consonância com
        a Lei nº 13.709/2018 (LGPD).
      </p>

      <p className="pt-2">
        <strong>[A AUTORIDADE MÁXIMA DO ÓRGÃO]</strong>, no uso de suas atribuições legais e
        regimentais,
      </p>
      <p>
        <strong>CONSIDERANDO</strong> o art. 50 da LGPD, que dispõe sobre a adoção de Programa de
        Governança em Privacidade pelos agentes de tratamento;
      </p>
      <p>
        <strong>CONSIDERANDO</strong> que a proteção de dados é tema transversal, exigindo
        atuação coordenada das áreas que tratam dados pessoais no órgão;
      </p>
      <p>
        <strong>CONSIDERANDO</strong> o art. 41 da LGPD e a necessidade de apoio institucional ao
        Encarregado pelo Tratamento de Dados Pessoais;
      </p>

      <p className="text-center font-bold pt-2">RESOLVE:</p>

      <p>
        <strong>Art. 1º</strong> Fica instituído o <strong>Comitê Gestor de Privacidade e
        Proteção de Dados Pessoais</strong> de <strong>[seu órgão]</strong>, com a finalidade de
        coordenar a implementação da LGPD e do Programa de Governança em Privacidade.
      </p>

      <p>
        <strong>Art. 2º</strong> O Comitê é composto pelos seguintes membros, representando as
        áreas que tratam dados pessoais no órgão:
      </p>
      <ul className="list-none pl-2 space-y-1">
        {membros.map((m, i) => (
          <li key={i} className={m.encarregado ? "font-semibold" : ""}>
            • <strong>{m.area}</strong> — {m.cargo}
          </li>
        ))}
      </ul>
      <p className="italic text-sm text-gray-600">
        (Composição de exemplo. Cada órgão indica os titulares de cada área por nome.)
      </p>

      <p>
        <strong>Art. 3º</strong> Compete ao Comitê Gestor de Privacidade:
      </p>
      <ul className="list-none pl-2 space-y-1">
        {COMPETENCIAS_COMITE.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>

      <p>
        <strong>Art. 4º</strong> O Comitê reunir-se-á <strong>[periodicidade — ex.: trimestralmente]</strong>{" "}
        e, extraordinariamente, sempre que convocado por seu Coordenador.
      </p>
      <p>
        <strong>Art. 5º</strong> Esta portaria entra em vigor na data de sua publicação.
      </p>

      <p className="text-right pt-4">[Município], [data].</p>
      <p className="text-center pt-6">_______________________________________</p>
      <p className="text-center font-bold">[AUTORIDADE MÁXIMA DO ÓRGÃO]</p>
      <p className="text-center italic text-sm text-gray-600">(Prefeito(a) / Presidente da Câmara)</p>

      <p className="rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm px-4 py-3 mt-6 not-italic">
        💡 <strong>Por que um Comitê (e não só o Encarregado)?</strong> {PORQUE_COMITE}
      </p>
    </ModeloDocumento>
  );
}
