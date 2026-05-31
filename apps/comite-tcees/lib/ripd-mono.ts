/**
 * Pré-preenchimento mono do RIPD a partir do Inventário + Riscos do TCEES.
 *
 * Monta um RipdData (8 seções) já preenchido com:
 *  - s1: controlador/DPO (perfil TCEES) — operadores em texto livre
 *  - s2-s5: dados do processo no Inventário (DataInventory)
 *  - s6: riscos do processo (ProcessRisk → matriz P×I)
 *  - s7/s8: vazios pro Encarregado complementar
 */

import { prisma } from "@/lib/prisma";
import { emptyRipdData, type RipdData } from "@/lib/ripd-helpers";
import { tceesPlaceholders } from "@/lib/policy-mono";
import { nivelRisco, PI_LABEL } from "@/lib/comite-ui";

/** Constrói o RipdData inicial de um processo do Inventário. */
export async function prepopRipdDoInventario(inventoryId: string): Promise<{ title: string; data: RipdData } | null> {
  const inv = await prisma.dataInventory.findUnique({
    where: { id: inventoryId },
    include: { riscos: { orderBy: { ordem: "asc" } } },
  });
  if (!inv) return null;

  const ph = await tceesPlaceholders();
  const d = emptyRipdData();

  // s1 — agentes
  d.s1.controller = {
    name: ph.companyName,
    cnpj: ph.cnpj ?? "",
    address: ph.address ?? "",
    legalRepresentative: ph.legalRepresentative ?? "",
  };
  d.s1.dpo = { name: ph.dpoName ?? "", email: ph.dpoEmail ?? "", phone: ph.dpoPhone ?? "" };
  d.s1.operators = inv.compartilhamento ?? "";

  // s2 — descrição do processo
  d.s2 = {
    name: inv.nome,
    description: inv.finalidade ?? "",
    objective: inv.finalidade ?? "",
    responsibleArea: inv.unidadeGestora ?? "",
  };

  // s3 — dados tratados
  d.s3 = {
    categories: inv.dadosSensiveis ? "Dados pessoais comuns + sensíveis" : "Dados pessoais comuns",
    personalData: inv.tiposDados ?? "",
    sensitiveDataNotes: inv.dadosSensiveis ? "Há tratamento de dados pessoais sensíveis (art. 11 da LGPD)." : "",
    subjects: "",
    volumeEstimate: "",
  };

  // s4 — finalidade e bases legais
  d.s4 = {
    purposes: inv.finalidade ?? "",
    legalBasis: inv.baseLegal ?? "",
    sensitiveBasis: inv.dadosSensiveis ? "Art. 11 da LGPD (verificar inciso aplicável)." : "",
    necessityJustification: "",
    proportionalityJustification: "",
  };

  // s5 — ciclo de vida
  d.s5 = {
    collection: "",
    storage: inv.medidasSeguranca ?? "",
    retention: inv.retencao ?? "",
    elimination: "",
    internationalTransfer: "",
  };

  // s6 — riscos (matriz P×I do processo)
  d.s6 = {
    risks: inv.riscos.map((r) => {
      const nv = nivelRisco(r.probabilidade, r.impacto);
      return {
        code: r.id.slice(-6),
        label: r.descricao,
        status: r.status,
        severityLevel: nv.nivel,
        severityDetail: `Probabilidade ${PI_LABEL[r.probabilidade]} × Impacto ${PI_LABEL[r.impacto]}`,
        description: r.descricao,
        mitigationSummary: r.recomendacao ?? "",
      };
    }),
    overallAssessment: "",
  };

  // s7/s8 ficam vazios pro Encarregado preencher
  d.s7.additionalSafeguards = inv.medidasSeguranca ?? "";

  return { title: `RIPD — ${inv.nome}`, data: d };
}
