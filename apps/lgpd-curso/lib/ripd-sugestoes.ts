// Geradores de sugestão de conteúdo pras 8 seções do RIPD.
// Lê o que já existe nas fases anteriores (Identidade do Encarregado, Inventário,
// Riscos) e monta um texto-base que o DPO edita antes de salvar.
//
// Cobre as seções 1, 2, 4, 5, 6 e 8. Seções 3 (necessidade) e 7 (compartilhamento)
// dependem demais de julgamento humano — ficam manuais.

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";

export type SecaoSugerivel = 1 | 2 | 4 | 5 | 6 | 8;

const SEVERIDADE_LABEL: Record<string, string> = {
  ALTO: "ALTA",
  MEDIO: "MÉDIA",
  BAIXO: "BAIXA",
};

function parseSeveridade(severityLevel: string | null): string {
  if (!severityLevel) return "—";
  const m = severityLevel.match(/S:(BAIXO|MEDIO|ALTO)/);
  return m ? SEVERIDADE_LABEL[m[1]] || m[1] : "—";
}

function parseProbImp(severityLevel: string | null): { p: string; i: string } {
  if (!severityLevel) return { p: "—", i: "—" };
  const p = severityLevel.match(/P:(B|M|A)/)?.[1];
  const ii = severityLevel.match(/I:(B|M|A)/)?.[1];
  const label = (v: string | undefined) => ({ B: "Baixa", M: "Média", A: "Alta" }[v || ""] || "—");
  return { p: label(p), i: label(ii) };
}

export async function sugerirSecaoRipd(ripdId: string, secao: SecaoSugerivel): Promise<string> {
  const { companyId } = await requireCompany();
  const ripd = await prisma.ripd.findFirst({
    where: { id: ripdId, companyId },
    select: { id: true, titulo: true, inventoryRef: true },
  });
  if (!ripd) throw new Error("RIPD não encontrado");

  const [company, inventario, riscos] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true, cnpj: true, orgao: true, cidade: true,
        dpoName: true, dpoEmail: true, dpoTelefone: true, dpoEndereco: true,
        dpoSubstitutoNome: true, dpoSubstitutoEmail: true, dpoSubstitutoTelefone: true,
      },
    }),
    ripd.inventoryRef
      ? prisma.dataInventory.findFirst({
          where: { id: ripd.inventoryRef, companyId },
          select: {
            nome: true, setor: true, finalidade: true, baseLegal: true,
            tiposDados: true, dadosSensiveis: true, retencao: true,
            compartilhamento: true, medidasSeguranca: true,
          },
        })
      : Promise.resolve(null),
    ripd.inventoryRef
      ? prisma.processRisk.findMany({
          where: { companyId, inventoryId: ripd.inventoryRef },
          select: { riscoTitulo: true, descricao: true, categoria: true, severityLevel: true, mitigationPlan: true },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  switch (secao) {
    case 1: return sugerirSecao1(company);
    case 2: return sugerirSecao2(inventario);
    case 4: return sugerirSecao4(riscos);
    case 5: return sugerirSecao5(inventario, riscos);
    case 6: return sugerirSecao6(company);
    case 8: return sugerirSecao8(riscos);
  }
}

function sugerirSecao1(company: any): string {
  if (!company) return "Cadastre os dados do Encarregado em Fase 1 → Encarregado pra gerar esta seção automaticamente.";
  const linhas: string[] = [];
  linhas.push("AGENTE DE TRATAMENTO (Controlador)");
  linhas.push(`Razão social/órgão: ${company.name || "[a preencher]"}`);
  if (company.cnpj) linhas.push(`CNPJ: ${company.cnpj}`);
  if (company.cidade) linhas.push(`Município: ${company.cidade}`);
  linhas.push("");
  linhas.push("ENCARREGADO (DPO) — Art. 41 LGPD");
  if (company.dpoName) linhas.push(`Nome: ${company.dpoName}`);
  else linhas.push("Nome: [pendente — cadastre em Fase 1 → Encarregado]");
  if (company.dpoEmail) linhas.push(`E-mail: ${company.dpoEmail}`);
  if (company.dpoTelefone) linhas.push(`Telefone: ${company.dpoTelefone}`);
  if (company.dpoEndereco) linhas.push(`Endereço: ${company.dpoEndereco}`);

  if (company.dpoSubstitutoNome) {
    linhas.push("");
    linhas.push("ENCARREGADO SUBSTITUTO (Art. 41 §1º — boa prática)");
    linhas.push(`Nome: ${company.dpoSubstitutoNome}`);
    if (company.dpoSubstitutoEmail) linhas.push(`E-mail: ${company.dpoSubstitutoEmail}`);
    if (company.dpoSubstitutoTelefone) linhas.push(`Telefone: ${company.dpoSubstitutoTelefone}`);
  }
  return linhas.join("\n");
}

function sugerirSecao2(inv: any): string {
  if (!inv) return "Vincule este RIPD a um processo do Inventário pra gerar a descrição automaticamente.";
  const linhas: string[] = [];
  linhas.push(`PROCESSO: ${inv.nome || "—"}`);
  if (inv.setor) linhas.push(`Setor responsável: ${inv.setor}`);
  if (inv.finalidade) linhas.push(`Finalidade: ${inv.finalidade}`);
  if (inv.baseLegal) linhas.push(`Base legal (Art. 7º ou 11): ${inv.baseLegal}`);
  if (inv.tiposDados) linhas.push(`Tipos de dados tratados: ${inv.tiposDados}`);
  if (inv.dadosSensiveis) linhas.push("⚠ ATENÇÃO: trata dados pessoais SENSÍVEIS (Art. 11 LGPD).");
  if (inv.retencao) linhas.push(`Prazo de retenção: ${inv.retencao}`);
  if (inv.compartilhamento) linhas.push(`Compartilhamento: ${inv.compartilhamento}`);
  return linhas.join("\n");
}

function sugerirSecao4(riscos: any[]): string {
  if (riscos.length === 0) return "Nenhum risco identificado pra este processo. Vá em Fase 3 → Análise de Riscos pra mapear os riscos antes de gerar esta seção.";
  const linhas: string[] = [`Análise de ${riscos.length} risco(s) identificado(s) na Fase 3 (Análise de Riscos):`, ""];
  riscos.forEach((r, i) => {
    const sev = parseSeveridade(r.severityLevel);
    const pi = parseProbImp(r.severityLevel);
    linhas.push(`${i + 1}. ${r.riscoTitulo}`);
    linhas.push(`   Severidade: ${sev} (Probabilidade ${pi.p} × Impacto ${pi.i})`);
    if (r.categoria) linhas.push(`   Categoria: ${r.categoria}`);
    if (r.descricao) linhas.push(`   Descrição: ${r.descricao}`);
    linhas.push("");
  });
  return linhas.join("\n");
}

function sugerirSecao5(inv: any, riscos: any[]): string {
  const linhas: string[] = [];
  if (inv?.medidasSeguranca) {
    linhas.push("MEDIDAS GERAIS (do Inventário):");
    linhas.push(inv.medidasSeguranca);
    linhas.push("");
  }
  const comMitigacao = riscos.filter((r) => r.mitigationPlan && r.mitigationPlan.trim().length > 0);
  if (comMitigacao.length > 0) {
    linhas.push("MEDIDAS POR RISCO (da Análise de Riscos):");
    comMitigacao.forEach((r) => {
      linhas.push(`• ${r.riscoTitulo} → ${r.mitigationPlan}`);
    });
  }
  if (linhas.length === 0) {
    return "Preencha o campo 'Medidas de Segurança' no Inventário e/ou o 'Plano de Mitigação' em cada risco da Fase 3 pra gerar esta seção automaticamente.";
  }
  return linhas.join("\n");
}

function sugerirSecao6(company: any): string {
  const dpoEmail = company?.dpoEmail || "[cadastre em Fase 1 → Encarregado]";
  return `Os titulares de dados pessoais têm os seguintes direitos garantidos pelo Art. 18 da LGPD:

I. Confirmação da existência de tratamento
II. Acesso aos dados
III. Correção de dados incompletos, inexatos ou desatualizados
IV. Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD
V. Portabilidade dos dados a outro fornecedor de serviço ou produto
VI. Eliminação dos dados pessoais tratados com consentimento (exceto nas hipóteses do Art. 16)
VII. Informação das entidades públicas e privadas com as quais o controlador realizou uso compartilhado de dados
VIII. Informação sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa
IX. Revogação do consentimento (Art. 8º §5º)

CANAL DE ATENDIMENTO:
Encarregado pelo Tratamento de Dados Pessoais
E-mail: ${dpoEmail}
Prazo de resposta: 15 dias úteis (Art. 19, II LGPD)
`;
}

function sugerirSecao8(riscos: any[]): string {
  if (riscos.length === 0) {
    return "Sem riscos mapeados — não é possível concluir sobre risco residual. Volte à Análise de Riscos.";
  }
  const altos = riscos.filter((r) => parseSeveridade(r.severityLevel) === "ALTA");
  const medios = riscos.filter((r) => parseSeveridade(r.severityLevel) === "MÉDIA");
  const altosSemMit = altos.filter((r) => !r.mitigationPlan || r.mitigationPlan.trim().length === 0);
  const altosComMit = altos.length - altosSemMit.length;

  let nivelResidual: "BAIXO" | "MÉDIO" | "ALTO";
  let recomendacao: string;
  if (altosSemMit.length > 0) {
    nivelResidual = "ALTO";
    recomendacao = `Existem ${altosSemMit.length} risco(s) ALTO sem plano de mitigação documentado. Recomenda-se NÃO prosseguir com o tratamento até estabelecer medidas mitigadoras eficazes ou consultar a ANPD (Art. 38 par. único + Art. 32).`;
  } else if (altos.length > 0 && medios.length > 0) {
    nivelResidual = "MÉDIO";
    recomendacao = `Os riscos ALTO foram mitigados, mas permanecem ${medios.length} risco(s) de severidade MÉDIA. Tratamento pode prosseguir com monitoramento contínuo das medidas e revisão semestral deste RIPD.`;
  } else if (medios.length > 0) {
    nivelResidual = "MÉDIO";
    recomendacao = `Riscos majoritariamente MÉDIOS já com mitigação prevista. Tratamento pode prosseguir com revisão anual.`;
  } else {
    nivelResidual = "BAIXO";
    recomendacao = `Riscos BAIXOS e com medidas adequadas. Tratamento pode prosseguir com revisão anual ou em caso de mudança material no processo.`;
  }

  const linhas: string[] = [];
  linhas.push(`NÍVEL DE RISCO RESIDUAL: ${nivelResidual}`);
  linhas.push("");
  linhas.push(`Composição dos riscos analisados:`);
  linhas.push(`• ${altos.length} risco(s) de severidade ALTA (${altosComMit} com mitigação documentada, ${altosSemMit.length} sem)`);
  linhas.push(`• ${medios.length} risco(s) de severidade MÉDIA`);
  linhas.push(`• ${riscos.length - altos.length - medios.length} risco(s) de severidade BAIXA`);
  linhas.push("");
  linhas.push("RECOMENDAÇÃO:");
  linhas.push(recomendacao);
  return linhas.join("\n");
}
