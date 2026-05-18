"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { checkGapConcluido } from "@/lib/phase-guard";
import { detectarPlaceholders, gerarAvisoAutoPreenchido, type DadosParaAviso } from "@/lib/aviso-auto-preencher";
import { aplicarErrosPlantados } from "@/lib/aviso-erros-plantados";

const SLUG = "aviso-privacidade";

// Padrão de retorno pra erros esperados de validação. Em Next 14+, throw em
// server action vira "Server Components render error" em prod (mensagem
// sanitizada). Pra erros estruturados que o client precisa exibir, RETORNAMOS
// um objeto em vez de fazer throw. Throws só pra erros REAIS de infra (DB
// falhou, etc) onde o Error Boundary global é OK.
export type AvisoResult =
  | { ok: true; aviso: any }
  | { ok: false; error: string };

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

export async function publicarAviso(): Promise<AvisoResult | { skip: any }> {
  const skip = await checkGapConcluido("FASE_6", "Publicar Aviso de Privacidade");
  if (skip) return skip as any;
  const { companyId } = await requireCompany();

  // Pré-requisito legal — Art. 9 LGPD lista informações obrigatórias no Aviso.
  // Sem Inventário aprovado não existe a matéria-prima dessas informações.
  const inventariosAprovados = await prisma.dataInventory.count({
    where: { companyId, status: "APROVADO" },
  });
  if (inventariosAprovados === 0) {
    return {
      ok: false,
      error:
        "Pré-requisito legal: aprove ao menos 1 processo no Inventário antes de publicar o Aviso. " +
        "O Art. 9 LGPD exige descrição clara das finalidades, formas de tratamento e duração — " +
        "informações que vêm do Inventário.",
    };
  }

  const policy = await prisma.policy.findUnique({
    where: { companyId_slug: { companyId, slug: SLUG } },
  });
  if (!policy) {
    return { ok: false, error: "Crie o Aviso antes de publicar (clique em Salvar rascunho primeiro)." };
  }

  // Validação anti-placeholder: bloqueia publicação se ainda houver textos
  // [entre colchetes] do template inicial. Aviso publicado com placeholders
  // é "compliance fake" — pior que não publicar.
  const placeholders = detectarPlaceholders(policy.conteudoMd || "");
  if (placeholders.length > 0) {
    const preview = placeholders.slice(0, 3).map((p) => `"[${p}]"`).join(", ");
    const extras = placeholders.length > 3 ? ` e mais ${placeholders.length - 3}` : "";
    return {
      ok: false,
      error:
        `Publicação bloqueada: o Aviso ainda contém ${placeholders.length} placeholder(s) do template — ` +
        `${preview}${extras}. Substitua todos os textos [entre colchetes] por informações reais antes de publicar. ` +
        `Dica: use o botão "Auto-preencher do PGP" pra montar o texto a partir dos dados das missões anteriores.`,
    };
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
  return { ok: true, aviso: result };
}

// Reabre um Aviso publicado pra edição — volta status pra RASCUNHO.
// A URL pública /p/[slug] já filtra por status=PUBLICADO, então para de servir.
export async function reabrirAviso(): Promise<AvisoResult | { skip: any }> {
  const skip = await checkGapConcluido("FASE_6", "Reabrir Aviso de Privacidade");
  if (skip) return skip as any;
  const { companyId } = await requireCompany();

  const policy = await prisma.policy.findUnique({
    where: { companyId_slug: { companyId, slug: SLUG } },
  });
  if (!policy) return { ok: false, error: "Aviso não encontrado." };
  if (policy.status !== "PUBLICADO") return { ok: false, error: "Aviso não está publicado." };

  const result = await prisma.policy.update({
    where: { id: policy.id },
    data: { status: "RASCUNHO" },
  });
  revalidatePath("/dashboard/aviso");
  return { ok: true, aviso: result };
}

// Gera o markdown completo a partir dos dados das missões anteriores.
// Não persiste — retorna o texto pro client preencher o textarea.
// Por padrão planta erros pedagógicos (modo curso). Pra produção limpa,
// passar plantarErros=false.
export async function autoPreencherAviso(
  opts: { plantarErros?: boolean } = {},
): Promise<{ ok: true; md: string; errosPlantados: string[] } | { ok: false; error: string }> {
  // Default ativa erros plantados — é o modo do curso. Quem chama de outro
  // contexto pode passar plantarErros: false explicitamente.
  const plantarErros = opts.plantarErros !== false;
  try {
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

    if (!company) return { ok: false, error: "Empresa não encontrada." };

    const dados: DadosParaAviso = {
      company,
      processos,
      operadores: operadores.map((o) => ({
        nome: o.nome,
        servico: o.servico,
        riscoFatoresMarcados: (o.contracts[0]?.riscoFatoresMarcados as string[]) || [],
        tipoOperacao: o.contracts[0]?.tipoOperacao || null,
        nivelRisco: o.contracts[0]?.nivelRisco || null,
      })),
      dsr: { total: dsrCount },
    };

    const mdLimpo = gerarAvisoAutoPreenchido(dados);

    if (plantarErros) {
      const ctx = {
        temProcessoSensivel: processos.some((p) => p.dadosSensiveis === true),
        quantidadeOperadores: operadores.length,
      };
      const { md, erros } = aplicarErrosPlantados(mdLimpo, ctx);
      // Persiste a lista de erros plantados pro facilitador conferir depois
      await prisma.policy.update({
        where: { companyId_slug: { companyId, slug: SLUG } },
        data: { autoErrosPlantados: erros },
      }).catch(() => {
        // Se a policy ainda não existe, vai ser criada no Save com array vazio
        // (não bloqueia o auto-preencher).
      });
      return { ok: true, md, errosPlantados: erros };
    }

    return { ok: true, md: mdLimpo, errosPlantados: [] };
  } catch (e: any) {
    console.error("[autoPreencherAviso] erro:", e);
    return { ok: false, error: e?.message || "Erro ao montar o Aviso. Cheque o Encarregado em Fase 1 e os processos APROVADOS no Inventário." };
  }
}

// Reporta um erro detectado pelo grupo no Aviso. Texto livre — facilitador
// classifica oralmente no debrief (padrão "Outros" do DSR Surpresa).
export async function reportarErroAviso(input: {
  descricao: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.descricao || input.descricao.trim().length < 5) {
    return { ok: false, error: "Descreva o erro detectado (mínimo 5 caracteres)." };
  }
  const { companyId, session } = await requireCompany();
  const policy = await prisma.policy.findUnique({
    where: { companyId_slug: { companyId, slug: SLUG } },
  });
  if (!policy) return { ok: false, error: "Aviso não encontrado." };

  const existentes = Array.isArray(policy.errosReportados) ? policy.errosReportados : [];
  const novo = {
    userName: session.user?.name || "Anônimo",
    userEmail: session.user?.email || null,
    descricao: input.descricao.trim(),
    criadoEm: new Date().toISOString(),
  };
  await prisma.policy.update({
    where: { id: policy.id },
    data: { errosReportados: [...existentes, novo] as any },
  });
  revalidatePath("/dashboard/aviso");
  return { ok: true };
}
