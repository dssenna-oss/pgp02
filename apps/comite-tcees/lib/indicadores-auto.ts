/**
 * Etapa 3 — Indicadores auto-alimentados.
 *
 * Calcula AO VIVO o "valor atual" dos indicadores (Seção 9 do Plano) que
 * são deriváveis dos dados reais já mantidos pelas ferramentas das Fases
 * (Inventário, GAP, Riscos, Consultas, Reuniões, Documentos, Instrumentos,
 * Incidentes). Os demais continuam sendo preenchidos à mão na tela.
 *
 * Retorna um mapa codigo→{valor,fonte,href}. A tela de Indicadores e o
 * Relatório Anual sobrepõem esses valores aos do seed e marcam como
 * "automático". Sem schema novo: tudo é COUNT/score sobre tabelas existentes.
 */

import { prisma } from "@/lib/prisma";
import { scoreGeral, type RespostaMap } from "@/lib/gap-score";
import { INSTRUMENTO_PRONTO } from "@/lib/comite-ui";
import { calcularDiagnostico } from "@/lib/diagnostico";

export type IndicadorAuto = { valor: string; fonte: string; href: string };
export type IndicadoresAutoMap = Record<string, IndicadorAuto>;

const simNao = (b: boolean) => (b ? "Sim" : "Não");

/** Conta instrumentos "prontos" (APROVADO/PUBLICADO) cujo nome casa o termo. */
function instrumentoPronto(
  instrumentos: { nome: string; status: string }[],
  termo: string,
): boolean {
  const t = termo.toLowerCase();
  return instrumentos.some(
    (i) => i.nome.toLowerCase().includes(t) && INSTRUMENTO_PRONTO.has(i.status),
  );
}

export async function calcularIndicadoresAuto(): Promise<IndicadoresAutoMap> {
  const [
    consultasResp,
    reunioesReal,
    invPrioTotal,
    invPrioConcl,
    riscosCount,
    gapAnswers,
    documentos,
    instrumentos,
    incidentesTotal,
    incidentesAnpd,
    dsrTotal,
    dsrRespondidos,
  ] = await Promise.all([
    prisma.consultaPrevia.count({ where: { status: "RESPONDIDA" } }),
    prisma.reuniao.count({ where: { status: "REALIZADA" } }),
    prisma.dataInventory.count({ where: { prioritario: true } }),
    prisma.dataInventory.count({ where: { prioritario: true, status: "CONCLUIDO" } }),
    prisma.processRisk.count(),
    prisma.gapAnswer.findMany({ select: { controlCode: true, aderencia: true } }),
    prisma.documento.findMany({ select: { nome: true, tipo: true, status: true } }),
    prisma.instrumento.findMany({ select: { nome: true, status: true } }),
    prisma.incident.count(),
    prisma.incident.count({ where: { comunicadoAnpd: true } }),
    prisma.dataSubjectRequest.count(),
    prisma.dataSubjectRequest.findMany({
      where: { responseDate: { not: null } },
      select: { receivedAt: true, responseDate: true },
    }),
  ]);

  // E3: tempo médio (dias) entre recebimento e resposta dos pedidos atendidos.
  const tempoMedioDsr = dsrRespondidos.length
    ? Math.round(
        dsrRespondidos.reduce(
          (acc, d) => acc + (d.responseDate!.getTime() - d.receivedAt.getTime()) / 86400000,
          0,
        ) / dsrRespondidos.length,
      )
    : null;

  // GAP: % de aderência sobre os controles avaliados (exclui NA).
  const respostas: RespostaMap = {};
  for (const g of gapAnswers) respostas[g.controlCode] = { aderencia: g.aderencia };
  const gap = scoreGeral(respostas);
  const gapIniciado = gap.respondidos > 0;

  // A1: documentos mater do PGP homologados (PGP, Política Interna, PRI).
  const matchDoc = (termos: string[], status = "HOMOLOGADO") =>
    documentos.filter(
      (d) => d.status === status && termos.some((t) => d.nome.toLowerCase().includes(t)),
    ).length;
  const pgpAprovados =
    Math.min(1, matchDoc(["governança em privacidade", "pgp"])) +
    Math.min(1, matchDoc(["política interna"])) +
    Math.min(1, matchDoc(["resposta a incidentes", "pri"]));
  const normasHomologadas = documentos.filter(
    (d) => (d.tipo ?? "").toLowerCase().includes("norma") && d.status === "HOMOLOGADO",
  ).length;

  const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "—");

  // I2 — Score de Diagnóstico de Privacidade (Fase 2)
  const diag = await calcularDiagnostico();

  const map: IndicadoresAutoMap = {
    A1: { valor: `${pgpAprovados}/3`, fonte: "Documentos homologados", href: "/dashboard/documentos" },
    A4: { valor: String(normasHomologadas), fonte: "Normas internas homologadas", href: "/dashboard/documentos" },
    A5: { valor: String(consultasResp), fonte: "Consultas prévias respondidas", href: "/dashboard/consultas" },
    A8: { valor: String(reunioesReal), fonte: "Reuniões realizadas", href: "/dashboard/reunioes" },
    B1: { valor: pct(invPrioConcl, invPrioTotal), fonte: `${invPrioConcl}/${invPrioTotal} IDPs prioritários concluídos`, href: "/dashboard/inventario" },
    B6: { valor: simNao(gapIniciado), fonte: `${gap.respondidos} controles avaliados`, href: "/dashboard/gap" },
    B7: { valor: gap.score == null ? "—" : `${gap.score}%`, fonte: "Score de aderência GAP", href: "/dashboard/gap" },
    B8: { valor: simNao(riscosCount > 0), fonte: `${riscosCount} riscos mapeados`, href: "/dashboard/riscos" },
    C1: { valor: simNao(instrumentoPronto(instrumentos, "aviso de privacidade")), fonte: "Central de Instrumentos", href: "/dashboard/execucao" },
    C2: { valor: simNao(instrumentoPronto(instrumentos, "cookies")), fonte: "Central de Instrumentos", href: "/dashboard/execucao" },
    I2: { valor: String(diag.overall), fonte: `Diagnóstico de Privacidade — ${diag.nivel.label}`, href: "/dashboard/diagnostico" },
    E2: { valor: String(dsrTotal), fonte: "Solicitações de titulares registradas", href: "/dashboard/execucao/dsr" },
    E3: { valor: tempoMedioDsr == null ? "—" : `${tempoMedioDsr} dias`, fonte: "Tempo médio de resposta ao titular", href: "/dashboard/execucao/dsr" },
    E5: { valor: String(incidentesTotal), fonte: "Incidentes registrados", href: "/dashboard/incidentes" },
    E6: { valor: String(incidentesAnpd), fonte: "Incidentes comunicados à ANPD", href: "/dashboard/incidentes" },
  };

  return map;
}
