// Modelo do Comitê Gestor de Privacidade e Proteção de Dados — Fase 1
// ("Formação das equipes de trabalho"). A composição é derivada dos papéis do
// grupo (papeisPorOrgao): o grupo JÁ é o comitê — o Encarregado coordena e as
// áreas são membros. Usado como DOCUMENTO-MODELO demonstrativo (projetado no
// telão e disponível no Pacote de Modelos pra levar). NÃO persiste dado real
// no curso — é exemplo pra mostrar a estrutura.

import { papeisPorOrgao } from "@/lib/seeds/processos-vegas";

export type MembroComite = {
  cargo: string; // função no comitê
  area: string; // nome amigável do papel/setor
  encarregado: boolean;
};

// Monta a composição-modelo a partir dos papéis do órgão. O DPO vira
// Coordenador(a) do Comitê (acumula a função de Encarregado); os demais são
// membros representando suas áreas.
export function composicaoComite(orgao: "PM" | "CM"): MembroComite[] {
  return papeisPorOrgao(orgao).map((p) => ({
    cargo: p.role === "DPO" ? "Coordenador(a) — Encarregado(a) pelo Tratamento de Dados" : "Membro",
    area: p.nomeAmigavel,
    encarregado: p.role === "DPO",
  }));
}

// Competências do Comitê, ancoradas no Programa de Governança em Privacidade
// (art. 50 da LGPD) e no apoio à atuação do Encarregado (art. 41).
export const COMPETENCIAS_COMITE: string[] = [
  "I — coordenar a implementação e a revisão do Programa de Governança em Privacidade do órgão, nos termos do art. 50 da Lei nº 13.709/2018 (LGPD);",
  "II — propor, revisar e submeter à autoridade competente a Política de Proteção de Dados Pessoais e as normas internas correlatas;",
  "III — apoiar o(a) Encarregado(a) no atendimento às requisições dos titulares e às comunicações da Autoridade Nacional de Proteção de Dados — ANPD;",
  "IV — supervisionar o inventário dos tratamentos de dados pessoais (registro das operações) e a avaliação de riscos e de impacto (RIPD);",
  "V — promover a capacitação dos agentes públicos e a cultura de proteção de dados no âmbito do órgão;",
  "VI — deliberar sobre incidentes de segurança envolvendo dados pessoais e acompanhar as medidas corretivas e o plano de resposta.",
];

// Texto-guia pra projeção: por que o comitê (não só o Encarregado).
export const PORQUE_COMITE =
  "O Encarregado é o ponto focal, mas a proteção de dados é transversal: depende de TI (segurança), Jurídico (bases legais), RH e das áreas donas dos processos. O Comitê dá governança coletiva ao PGP — por isso a Fase 1 forma as EQUIPES de trabalho, não designa apenas uma pessoa.";
