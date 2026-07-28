// =============================================================================
// Motor de preenchimento — o coração da Jornada
// =============================================================================
// Substitui os [PLACEHOLDERS] dos templates por dados reais, em 3 camadas:
//   1. SEQUENCIAL — tokens repetidos posicionais (ex.: os 6 [NOME] da Portaria
//      do Comitê, um por membro), preenchidos na ordem configurada;
//   2. RESPOSTAS — o que o gestor respondeu nas perguntas específicas do
//      documento (documentos-config.ts), casadas por PREFIXO do placeholder;
//   3. PERFIL — os campos da instituição (regras globais por prefixo).
// O que não resolver fica [ENTRE COLCHETES] — âmbar na tela, vermelho no Word.

import type { Instituicao } from "@prisma/client";
import { getConfigDoc } from "./documentos-config";
import type { ModeloPacote } from "./modelos-pacote";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function dataPorExtenso(d: Date = new Date()): string {
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function dataCurta(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function limpo(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t.length ? t : null;
}

// Regras do PERFIL — casadas por prefixo do texto interno do placeholder.
// A ordem de teste é por prefixo MAIS LONGO primeiro (evita "E-MAIL" engolir
// "E-MAIL DO ENCARREGADO", "DATA" engolir "DATA POR EXTENSO" etc.).
function regrasPerfil(inst: Instituicao): { prefixo: string; valor: string | null }[] {
  const autoridadeMaxima =
    limpo(inst.autoridadeCargo) && limpo(inst.cidade)
      ? `${inst.autoridadeCargo} de ${inst.cidade}`.toUpperCase()
      : null;
  const destinatario = limpo(inst.autoridadeCargo)
    ? `Excelentíssimo(a) Senhor(a) ${inst.autoridadeCargo}` +
      (limpo(inst.autoridadeNome) ? `, ${inst.autoridadeNome}` : "")
    : null;

  return [
    { prefixo: "NOME DA INSTITUIÇÃO", valor: limpo(inst.nome) },
    { prefixo: "NOME DO ÓRGÃO", valor: limpo(inst.nome) },
    { prefixo: "NOME DO ENCARREGADO", valor: limpo(inst.dpoNome) },
    { prefixo: "E-MAIL DO ENCARREGADO", valor: limpo(inst.dpoEmail) },
    { prefixo: "E-MAIL", valor: limpo(inst.dpoEmail) },
    { prefixo: "TELEFONE", valor: limpo(inst.dpoTelefone) },
    { prefixo: "NOME DA AUTORIDADE MÁXIMA", valor: limpo(inst.autoridadeNome) },
    { prefixo: "NOME DA AUTORIDADE", valor: limpo(inst.autoridadeNome) },
    { prefixo: "A AUTORIDADE MÁXIMA", valor: autoridadeMaxima },
    // "CARGO DA AUTORIDADE..." é inequívoco; o [CARGO] solto NÃO entra aqui de
    // propósito — em docs como a Comunicação à ANPD ele é o cargo de quem
    // assina (nem sempre a autoridade máxima). Melhor âmbar do que errado.
    { prefixo: "CARGO DA AUTORIDADE MÁXIMA", valor: limpo(inst.autoridadeCargo) },
    { prefixo: "DESTINATÁRIO", valor: destinatario },
    { prefixo: "CIDADE", valor: limpo(inst.cidade) },
    { prefixo: "UF", valor: limpo(inst.uf) },
    { prefixo: "ENDEREÇO", valor: limpo(inst.endereco) },
    { prefixo: "CNPJ", valor: limpo(inst.cnpj) },
    { prefixo: "SITE", valor: limpo(inst.site) },
    { prefixo: "DATA POR EXTENSO", valor: dataPorExtenso() },
    { prefixo: "DATA", valor: dataCurta() },
  ].sort((a, b) => b.prefixo.length - a.prefixo.length);
}

export type ResultadoPreenchimento = {
  md: string;
  totalCampos: number; // placeholders no template original
  preenchidos: number; // quantos foram resolvidos
};

// Monta o documento preenchido de um modelo: perfil + respostas + sequenciais.
export function montarDocumentoPreenchido(
  modelo: ModeloPacote,
  inst: Instituicao,
  respostas: Record<string, string>,
): ResultadoPreenchimento {
  const config = getConfigDoc(modelo.numero);
  let md = modelo.template;
  const totalCampos = (md.match(/\[[^\]\n]+\]/g) ?? []).length;
  let preenchidos = 0;

  // 1) Sequencial (tokens repetidos posicionais)
  if (config?.sequencial) {
    const { token, ordem } = config.sequencial;
    const valores = ordem.map((o) =>
      o === "@dpoNome" ? limpo(inst.dpoNome) : limpo(respostas[o]),
    );
    let i = 0;
    md = md.split(token).reduce((acc, parte, idx, arr) => {
      if (idx === arr.length - 1) return acc + parte;
      const v = valores[i];
      i += 1;
      if (v) {
        preenchidos += 1;
        return acc + parte + v;
      }
      return acc + parte + token;
    }, "");
  }

  // 2) Respostas específicas (por prefixo) e 3) Perfil
  const extras = (config?.perguntas ?? [])
    .filter((p) => p.alvoPrefixo && limpo(respostas[p.id]))
    .map((p) => ({ prefixo: p.alvoPrefixo!, valor: respostas[p.id].trim() }));
  const regras = [...extras, ...regrasPerfil(inst)].sort(
    (a, b) => b.prefixo.length - a.prefixo.length,
  );

  md = md.replace(/\[([^\]\n]+)\]/g, (original, interno: string) => {
    const chave = interno.trim();
    const regra = regras.find((r) => chave.toUpperCase().startsWith(r.prefixo.toUpperCase()));
    if (regra?.valor) {
      preenchidos += 1;
      return regra.valor;
    }
    return original;
  });

  return { md, totalCampos, preenchidos };
}
