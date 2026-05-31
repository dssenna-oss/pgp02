/**
 * Auto-preenchimento da Autoavaliação TCU a partir dos dados que o app já tem.
 * Devolve um mapa autoKey → { resposta, fonte }. Conservador: na dúvida,
 * sugere o valor mais baixo. O Comitê pode sempre sobrescrever manualmente.
 */

import { prisma } from "@/lib/prisma";
import type { TcuResposta } from "@/lib/tcu-catalog";

export type AutoVal = { resposta: TcuResposta; fonte: string };
export type TcuAutoMap = Record<string, AutoVal>;

export async function calcularTcuAuto(): Promise<TcuAutoMap> {
  const [
    planoCount, inv, riscosCount, instrumentos, encarregado, policies,
    documentos, incidentesExiste,
  ] = await Promise.all([
    prisma.actionPlan.count(),
    prisma.dataInventory.findMany({
      select: { unidadeGestora: true, tiposDados: true, finalidade: true, retencao: true, baseLegal: true, compartilhamento: true },
    }),
    prisma.processRisk.count(),
    prisma.instrumento.findMany({ select: { nome: true, status: true } }),
    prisma.membro.findFirst({ where: { funcao: { contains: "Encarregado" } }, select: { id: true } }),
    prisma.policy.findMany({ select: { type: true, status: true } }),
    prisma.documento.findMany({ select: { nome: true } }),
    prisma.incident.count().then(() => true).catch(() => true),
  ]);

  const total = inv.length;
  const pctResp = (pred: (i: (typeof inv)[number]) => boolean): TcuResposta => {
    if (total === 0) return "NAO";
    const n = inv.filter(pred).length;
    if (n === 0) return "NAO";
    return n >= total ? "SIM" : "PARCIAL";
  };
  const algumPreenchido = (pred: (i: (typeof inv)[number]) => boolean) =>
    inv.some(pred);

  const instrPronto = (termo: string) =>
    instrumentos.some((x) => x.nome.toLowerCase().includes(termo) && (x.status === "APROVADO" || x.status === "PUBLICADO"));
  const policyExiste = (termoType: string) => policies.some((p) => p.type.includes(termoType));
  const policyPublicada = (termoType: string) => policies.some((p) => p.type.includes(termoType) && p.status === "PUBLICADA");
  const docExiste = (termo: string) => documentos.some((d) => d.nome.toLowerCase().includes(termo));

  const preench = (campo: keyof (typeof inv)[number]) => (i: (typeof inv)[number]) => !!(i[campo] && String(i[campo]).trim());

  const map: TcuAutoMap = {
    // Preparação
    comite_iniciativa: { resposta: "SIM", fonte: "Comitê instituído + Plano de Trabalho" },
    plano_acao: { resposta: planoCount > 0 ? "SIM" : "NAO", fonte: `${planoCount} ação(ões) no Plano de Ação` },

    // Contexto
    operadores: { resposta: algumPreenchido(preench("compartilhamento")) ? "PARCIAL" : "NAO", fonte: "Compartilhamento no Inventário" },
    inv_processos: { resposta: pctResp(() => true), fonte: `${total} processos no Inventário` },
    inv_responsaveis: { resposta: pctResp(preench("unidadeGestora")), fonte: "Unidade gestora no Inventário" },
    inv_dados: { resposta: pctResp(preench("tiposDados")), fonte: "Tipos de dados no Inventário" },
    riscos: { resposta: riscosCount > 0 ? "SIM" : "NAO", fonte: `${riscosCount} riscos avaliados` },

    // Liderança
    psi: { resposta: instrPronto("segurança da informação") || instrPronto("psi") ? "SIM" : "NAO", fonte: "Central de Instrumentos (PSI)" },
    politica_protecao: { resposta: instrPronto("política interna") || policyPublicada("NORMA_PRIVACIDADE") ? "SIM" : "NAO", fonte: "Política Interna de Proteção de Dados" },
    encarregado: { resposta: encarregado ? "SIM" : "NAO", fonte: "Encarregado nos Membros" },
    encarregado_publico: { resposta: encarregado ? "SIM" : "NAO", fonte: "Página pública /direitos-titulares divulga o Encarregado" },

    // Conformidade
    inv_finalidade: { resposta: pctResp(preench("finalidade")), fonte: "Finalidade no Inventário" },
    inv_retencao: { resposta: inv.filter(preench("retencao")).length >= total / 2 && total > 0 ? "SIM" : "NAO", fonte: "Retenção no Inventário" },
    inv_baselegal: { resposta: pctResp(preench("baseLegal")), fonte: "Base legal no Inventário" },
    inv_existe: { resposta: total > 0 ? "SIM" : "NAO", fonte: `Inventário com ${total} registros (ROPA)` },

    // Direitos do Titular
    aviso: { resposta: policyExiste("AVISO_PRIVACIDADE") || policyExiste("POLITICA_PRIVACIDADE") ? "SIM" : "NAO", fonte: "Editor de Políticas (Aviso)" },
    aviso_publicado: { resposta: policyPublicada("AVISO_PRIVACIDADE") || policyPublicada("POLITICA_PRIVACIDADE") ? "SIM" : "NAO", fonte: "Política publicada (URL pública)" },
    dsr: { resposta: "PARCIAL", fonte: "Orientação pública + painel de Direitos do Titular" },

    // Compartilhamento
    compartilhamento: { resposta: pctResp(preench("compartilhamento")), fonte: "Compartilhamento no Inventário" },

    // Violação (o app É o sistema → estrutural)
    pri: { resposta: docExiste("resposta a incidentes") || docExiste("pri") ? "SIM" : "PARCIAL", fonte: "Documento PRI + ferramenta de Incidentes" },
    incidentes_sistema: { resposta: "SIM", fonte: "Ferramenta de Incidentes (registro)" },
    incidentes_acoes: { resposta: "SIM", fonte: "Incidentes registra medidas de mitigação" },
    incidentes_anpd: { resposta: "SIM", fonte: "Relógio 72h ANPD + campo comunicação na ferramenta" },
  };

  return map;
}
