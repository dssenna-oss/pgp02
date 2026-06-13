// Modelo demonstrativo do Ato de Designação do Encarregado (Fase 1).
// Projetável no Telão Comandado (conteudo:modelo-ato-designacao). Espelha a
// estrutura do DOCX gerado em /api/curso/ato-nomeacao, mas com [colchetes] no
// lugar dos dados do órgão — é exemplo pra mostrar a estrutura na sala.

import { ModeloDocumento } from "@/components/modelo-documento";

export const dynamic = "force-dynamic";

export default function ModeloAtoDesignacaoPage() {
  return (
    <ModeloDocumento titulo="Ato de Designação do Encarregado (modelo)">
      <p className="text-center font-bold text-lg">ATO DE DESIGNAÇÃO Nº [__/____]</p>
      <p className="text-center italic text-gray-600">
        (Designação do Encarregado pelo Tratamento de Dados Pessoais)
      </p>

      <p className="italic text-gray-700 pt-2">
        Designa o(a) Encarregado(a) pelo Tratamento de Dados Pessoais (DPO) de{" "}
        <strong>[seu órgão]</strong>, em cumprimento ao art. 41 da Lei nº 13.709/2018 — Lei
        Geral de Proteção de Dados Pessoais (LGPD).
      </p>

      <p className="pt-2">
        <strong>[A AUTORIDADE MÁXIMA DO ÓRGÃO]</strong>, no uso de suas atribuições legais e
        regimentais,
      </p>
      <p>
        <strong>CONSIDERANDO</strong> que a LGPD, em seu art. 41, determina ao controlador a
        indicação de Encarregado pelo Tratamento de Dados Pessoais;
      </p>
      <p>
        <strong>CONSIDERANDO</strong> a Resolução CD/ANPD nº 18, de 16 de julho de 2024, que
        regulamenta a atuação do Encarregado;
      </p>
      <p>
        <strong>CONSIDERANDO</strong> a necessidade de canal formal de comunicação com a ANPD e
        com os titulares de dados pessoais;
      </p>

      <p className="text-center font-bold pt-2">RESOLVE:</p>

      <p>
        <strong>Art. 1º</strong> Designar <strong>[NOME DO ENCARREGADO]</strong> como
        Encarregado(a) pelo Tratamento de Dados Pessoais de <strong>[seu órgão]</strong>, nos
        termos do art. 41 da LGPD.
      </p>
      <p className="italic">
        <strong>Parágrafo único.</strong> O canal de comunicação com o(a) Encarregado(a) fica
        estabelecido pelos meios: e-mail <strong>[e-mail institucional]</strong>, telefone{" "}
        <strong>[telefone]</strong>, com atendimento em <strong>[endereço]</strong>.
      </p>
      <p>
        <strong>Art. 2º</strong> A escolha considerou os seguintes fundamentos:{" "}
        <strong>[perfil técnico-jurídico, autonomia funcional e acesso à alta administração]</strong>,
        atendendo às recomendações da ANPD (Resolução CD/ANPD nº 18/2024) para órgãos públicos.
      </p>
      <p>
        <strong>Art. 3º</strong> Compete ao(à) Encarregado(a), conforme art. 41, §2º da LGPD:
        aceitar reclamações e comunicações dos titulares; receber comunicações da ANPD; orientar
        funcionários e contratados; executar as demais atribuições do controlador.
      </p>
      <p>
        <strong>Art. 4º</strong> Este ato entra em vigor na data de sua publicação, revogadas as
        disposições em contrário.
      </p>

      <p className="text-right pt-4">[Município], [data].</p>
      <p className="text-center pt-6">_______________________________________</p>
      <p className="text-center font-bold">[AUTORIDADE MÁXIMA DO ÓRGÃO]</p>
      <p className="text-center italic text-sm text-gray-600">(Prefeito(a) / Presidente da Câmara)</p>

      <p className="font-bold pt-4">CIENTE E DE ACORDO:</p>
      <p className="pt-4">_______________________________________</p>
      <p className="font-bold">[NOME DO ENCARREGADO]</p>
      <p className="italic text-sm text-gray-600">Encarregado(a) pelo Tratamento de Dados Pessoais</p>
    </ModeloDocumento>
  );
}
