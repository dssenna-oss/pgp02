/**
 * Motor da Autoavaliação TCU (iadLGPD). Mescla respostas manuais do Comitê
 * (TcuAnswer) com auto-respostas do app, pontua no padrão TCU (Sim=1/Parcial=
 * 0,5/Não=0; soma ÷ nº de questões aplicáveis), classifica nos 4 níveis e
 * compara com a média nacional (382 órgãos).
 */

import { prisma } from "@/lib/prisma";
import {
  TCU_QUESTOES, TCU_DIMENSOES, TCU_NOTA, TCU_MEDIA_GERAL, tcuNivel,
  type TcuResposta,
} from "@/lib/tcu-catalog";
import { calcularTcuAuto } from "@/lib/tcu-auto";

export type TcuQuestaoResult = {
  code: string;
  texto: string;
  ref: string;
  escala: "SPN" | "SN";
  permiteNA: boolean;
  media: number;
  resposta: TcuResposta | null;
  nota: number | null; // null se NA ou pendente
  origem: "manual" | "auto" | "pendente";
  autoFonte: string | null;
  observacao: string | null;
};

export type TcuDimResult = {
  key: string;
  nome: string;
  perspectiva: 1 | 2;
  valor: number; // 0-1 (org)
  media: number; // 0-1 (nacional)
  respondidas: number;
  total: number;
  questoes: TcuQuestaoResult[];
};

export type TcuDiagnostico = {
  indicador: number; // 0-1
  nivel: { label: string; cor: string };
  mediaGeral: number;
  totalQuestoes: number;
  respondidas: number;
  autoCount: number;
  dimensoes: TcuDimResult[];
};

export async function calcularTcuDiagnostico(): Promise<TcuDiagnostico> {
  const [manuais, auto] = await Promise.all([
    prisma.tcuAnswer.findMany({ select: { questionCode: true, resposta: true, observacao: true } }),
    calcularTcuAuto(),
  ]);
  const manualMap = new Map(manuais.map((m) => [m.questionCode, m]));

  let somaNotas = 0;
  let denom = 0; // questões aplicáveis (exclui NA)
  let respondidas = 0;
  let autoCount = 0;

  const dims: TcuDimResult[] = TCU_DIMENSOES.map((d) => ({
    key: d.key, nome: d.nome, perspectiva: d.perspectiva, valor: 0, media: d.media,
    respondidas: 0, total: 0, questoes: [],
  }));
  const dimByKey = new Map(dims.map((d) => [d.key, d]));

  for (const q of TCU_QUESTOES) {
    const dim = dimByKey.get(q.dim)!;
    dim.total += 1;

    const manual = manualMap.get(q.code);
    const autoVal = q.autoKey ? auto[q.autoKey] : undefined;

    let resposta: TcuResposta | null = null;
    let origem: TcuQuestaoResult["origem"] = "pendente";
    if (manual) { resposta = manual.resposta as TcuResposta; origem = "manual"; respondidas += 1; }
    else if (autoVal) { resposta = autoVal.resposta; origem = "auto"; autoCount += 1; respondidas += 1; }

    let nota: number | null = null;
    if (resposta && resposta !== "NA") nota = TCU_NOTA[resposta] ?? 0;

    // Indicador: NA sai do denominador; pendente conta como 0 (Não), igual ao TCU.
    if (resposta === "NA") {
      // não entra no cálculo
    } else {
      denom += 1;
      somaNotas += nota ?? 0;
    }

    const r: TcuQuestaoResult = {
      code: q.code, texto: q.texto, ref: q.ref, escala: q.escala, permiteNA: !!q.permiteNA,
      media: q.media, resposta, nota, origem,
      autoFonte: autoVal?.fonte ?? null,
      observacao: manual?.observacao ?? null,
    };
    dim.questoes.push(r);
  }

  // valor por dimensão (média das notas aplicáveis da dimensão)
  for (const d of dims) {
    const aplic = d.questoes.filter((q) => q.resposta !== "NA");
    const soma = aplic.reduce((acc, q) => acc + (q.nota ?? 0), 0);
    d.valor = aplic.length ? soma / aplic.length : 0;
    d.respondidas = d.questoes.filter((q) => q.origem !== "pendente").length;
  }

  const indicador = denom > 0 ? somaNotas / denom : 0;

  return {
    indicador,
    nivel: tcuNivel(indicador),
    mediaGeral: TCU_MEDIA_GERAL,
    totalQuestoes: TCU_QUESTOES.length,
    respondidas,
    autoCount,
    dimensoes: dims,
  };
}
