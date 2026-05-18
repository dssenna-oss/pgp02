"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { checkGapConcluido } from "@/lib/phase-guard";
import { detectarPlaceholders, gerarAvisoAutoPreenchido, type DadosParaAviso } from "@/lib/aviso-auto-preencher";

const SLUG = "aviso-privacidade";

export async function getAviso() {
  const { companyId } = await requireCompany();
  return prisma.policy.findUnique({
    where: { companyId_slug: { companyId, slug: SLUG } },
  });
}

export async function getPrerequisitos() {
  const { companyId } = await requireCompany();
  const [inventariosAprovados, ripds, operadores, dsr] = await Promise.all([
    prisma.dataInventory.count({ where: { companyId, status: "APROVADO" } }),
    prisma.ripd.findMany({ where: { companyId }, select: { id: true, titulo: true, status: true } }),
    prisma.operator.findMany({ where: { companyId }, select: { id: true, nome: true, contracts: { select: { clausulasLgpd: true } } } }),
    prisma.dsrRequest.findMany({ where: { companyId }, select: { id: true } }),
  ]);
  return {
    inventariosAprovados,
    ripds: ripds.length,
    ripdsAprovados: ripds.filter((r) => r.status === "APROVADO").length,
    operadores: operadores.length,
    operadoresComClausula: operadores.filter((o) => o.contracts?.[0]?.clausulasLgpd).length,
    dsr: dsr.length,
  };
}

export async function saveAviso(conteudoMd: string) {
  const skip = await checkGapConcluido("FASE_6", "Salvar Aviso de Privacidade");
  if (skip) return skip;
  const { companyId } = await requireCompany();
  const result = await prisma.policy.upsert({
    where: { companyId_slug: { companyId, slug: SLUG } },
    create: {
      companyId,
      slug: SLUG,
      titulo: "Aviso de Privacidade",
      conteudoMd,
      status: "RASCUNHO",
    },
    update: { conteudoMd },
  });
  revalidatePath("/dashboard/aviso");
  return result;
}

export async function publicarAviso() {
  const skip = await checkGapConcluido("FASE_6", "Publicar Aviso de Privacidade");
  if (skip) return skip;
  const { companyId } = await requireCompany();

  // Pré-requisito legal — Art. 9 LGPD lista informações obrigatórias no Aviso
  // (finalidade, forma e duração do tratamento, identificação do controlador,
  //  uso compartilhado, responsabilidades, direitos do titular). Sem Inventário
  //  aprovado não existe a matéria-prima dessas informações.
  const inventariosAprovados = await prisma.dataInventory.count({
    where: { companyId, status: "APROVADO" },
  });
  if (inventariosAprovados === 0) {
    throw new Error(
      "Pré-requisito legal: aprove ao menos 1 processo no Inventário antes de publicar o Aviso. O Art. 9 LGPD exige descrição clara das finalidades, formas de tratamento e duração — informações que vêm do Inventário."
    );
  }

  const policy = await prisma.policy.findUnique({
    where: { companyId_slug: { companyId, slug: SLUG } },
  });
  if (!policy) throw new Error("Crie o Aviso antes de publicar");

  // Validação anti-placeholder: bloqueia publicação se ainda houver textos
  // [entre colchetes] do template inicial. Aviso publicado com placeholders
  // é vazamento de "compliance fake" — pior que não publicar.
  const placeholders = detectarPlaceholders(policy.conteudoMd || "");
  if (placeholders.length > 0) {
    const preview = placeholders.slice(0, 3).map((p) => `"[${p}]"`).join(", ");
    const extras = placeholders.length > 3 ? ` e mais ${placeholders.length - 3}` : "";
    throw new Error(
      `Publicação bloqueada: o Aviso ainda contém ${placeholders.length} placeholder(s) do template — ` +
      `${preview}${extras}. Substitua todos os textos [entre colchetes] por informações reais antes de publicar. ` +
      `Dica: use o botão "✨ Auto-preencher do PGP" pra montar o texto a partir dos dados das missões anteriores.`
    );
  }

  const publicSlug = `${companyId.slice(0, 6)}-aviso`;
  const result = await prisma.policy.update({
    where: { id: policy.id },
    data: {
      status: "PUBLICADO",
      publicSlug,
      publishedAt: new Date(),
    },
  });
  revalidatePath("/dashboard/aviso");
  return result;
}

// Reabre um Aviso publicado pra edição — volta status pra RASCUNHO.
// Útil quando o DPO publicou com placeholders e precisa consertar.
// A URL pública (publicSlug) deixa de servir o conteúdo até nova publicação.
export async function reabrirAviso() {
  const skip = await checkGapConcluido("FASE_6", "Reabrir Aviso de Privacidade");
  if (skip) return skip;
  const { companyId } = await requireCompany();

  const policy = await prisma.policy.findUnique({
    where: { companyId_slug: { companyId, slug: SLUG } },
  });
  if (!policy) throw new Error("Aviso não encontrado");
  if (policy.status !== "PUBLICADO") throw new Error("Aviso não está publicado");

  const result = await prisma.policy.update({
    where: { id: policy.id },
    data: {
      status: "RASCUNHO",
      // Mantém publicSlug e publishedAt pra histórico, mas o status RASCUNHO
      // já trava a renderização pública (a rota /p/[slug] checa status).
    },
  });
  revalidatePath("/dashboard/aviso");
  return result;
}

// Gera o markdown completo a partir dos dados das missões anteriores.
// Não persiste — retorna o texto pro client preencher o textarea, dando
// chance do DPO revisar antes de salvar.
export async function autoPreencherAviso(): Promise<{ md: string }> {
  const { companyId } = await requireCompany();

  const [company, processos, operadores, dsrCount] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true, cnpj: true, orgao: true, cidade: true,
        dpoName: true, dpoEmail: true, dpoTelefone: true, dpoEndereco: true,
        dpoSubstitutoNome: true, dpoSubstitutoEmail: true, dpoSubstitutoTelefone: true,
      },
    }),
    prisma.dataInventory.findMany({
      where: { companyId, status: "APROVADO" },
      select: {
        nome: true, setor: true, finalidade: true, baseLegal: true,
        tiposDados: true, dadosSensiveis: true, retencao: true,
        compartilhamento: true, medidasSeguranca: true,
      },
    }),
    prisma.operator.findMany({
      where: { companyId },
      include: { contracts: { select: { tipoOperacao: true, nivelRisco: true, riscoFatoresMarcados: true } } },
    }),
    prisma.dsrRequest.count({ where: { companyId } }),
  ]);

  if (!company) throw new Error("Empresa não encontrada");

  const dados: DadosParaAviso = {
    company,
    processos,
    operadores: operadores.map((o) => ({
      nome: o.nome,
      servico: o.servico,
      riscoFatoresMarcados: o.contracts[0]?.riscoFatoresMarcados || [],
      tipoOperacao: o.contracts[0]?.tipoOperacao || null,
      nivelRisco: o.contracts[0]?.nivelRisco || null,
    })),
    dsr: { total: dsrCount },
  };

  return { md: gerarAvisoAutoPreenchido(dados) };
}
