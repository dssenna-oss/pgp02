"use server";

// Documento institucional do PRI (Frente 3). Espelha o padrão do Aviso de
// Privacidade — usa a tabela Policy com o slug pri-resposta-incidentes.

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { checkGapConcluido } from "@/lib/phase-guard";
import { detectarPlaceholders } from "@/lib/aviso-auto-preencher";
import { PRI_SLUG, gerarRascunhoPri } from "@/lib/pri-secoes";

export type PriResult = { ok: true; pri: any } | { ok: false; error: string };

export async function getPri() {
  const { companyId } = await requireCompany();
  return prisma.policy.findUnique({
    where: { companyId_slug: { companyId, slug: PRI_SLUG } },
  });
}

export async function savePri(conteudoMd: string) {
  const skip = await checkGapConcluido("FASE_7", "Salvar documento do PRI");
  if (skip) return skip;
  const { companyId } = await requireCompany();
  const result = await prisma.policy.upsert({
    where: { companyId_slug: { companyId, slug: PRI_SLUG } },
    create: {
      companyId,
      slug: PRI_SLUG,
      titulo: "Plano de Resposta a Incidentes (PRI)",
      conteudoMd,
      status: "RASCUNHO",
    },
    update: { conteudoMd },
  });
  revalidatePath("/dashboard/pri");
  return result;
}

export async function publicarPri(): Promise<PriResult | { skip: any }> {
  const skip = await checkGapConcluido("FASE_7", "Publicar documento do PRI");
  if (skip) return skip as any;
  const { companyId } = await requireCompany();

  const policy = await prisma.policy.findUnique({
    where: { companyId_slug: { companyId, slug: PRI_SLUG } },
  });
  if (!policy) {
    return { ok: false, error: "Crie o documento antes de publicar (clique em Salvar rascunho primeiro)." };
  }

  // Anti-placeholder: publicar com textos [entre colchetes] do template é
  // "compliance fake" — pior que não publicar.
  const placeholders = detectarPlaceholders(policy.conteudoMd || "");
  if (placeholders.length > 0) {
    const preview = placeholders.slice(0, 3).map((p) => `"[${p}]"`).join(", ");
    const extras = placeholders.length > 3 ? ` e mais ${placeholders.length - 3}` : "";
    return {
      ok: false,
      error:
        `Publicação bloqueada: o PRI ainda contém ${placeholders.length} placeholder(s) do template — ` +
        `${preview}${extras}. Substitua todos os textos [entre colchetes] por informações reais antes de publicar.`,
    };
  }

  // Versionamento: cada publicação vira uma PolicyVersion no histórico.
  const ultima = await prisma.policyVersion.findFirst({
    where: { policyId: policy.id },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  const numero = (ultima?.numero ?? 0) + 1;

  const publicSlug = `${companyId.slice(0, 6)}-pri`;
  const result = await prisma.policy.update({
    where: { id: policy.id },
    data: { status: "PUBLICADO", publicSlug, publishedAt: new Date() },
  });
  await prisma.policyVersion.create({
    data: {
      policyId: policy.id,
      numero,
      conteudoMd: policy.conteudoMd,
      changelog: `Publicação ${numero}`,
    },
  });
  revalidatePath("/dashboard/pri");
  return { ok: true, pri: result };
}

export async function reabrirPri(): Promise<PriResult | { skip: any }> {
  const skip = await checkGapConcluido("FASE_7", "Reabrir documento do PRI");
  if (skip) return skip as any;
  const { companyId } = await requireCompany();
  const policy = await prisma.policy.findUnique({
    where: { companyId_slug: { companyId, slug: PRI_SLUG } },
  });
  if (!policy) return { ok: false, error: "Documento do PRI não encontrado." };
  if (policy.status !== "PUBLICADO") return { ok: false, error: "O documento não está publicado." };
  const result = await prisma.policy.update({
    where: { id: policy.id },
    data: { status: "RASCUNHO" },
  });
  revalidatePath("/dashboard/pri");
  return { ok: true, pri: result };
}

// Monta o markdown do PRI a partir dos dados que já existem no app — dados do
// órgão, Encarregado e equipe do PRI. Não persiste; retorna o texto.
export async function autoPreencherPri(): Promise<
  { ok: true; md: string } | { ok: false; error: string }
> {
  try {
    const { companyId } = await requireCompany();
    const [company, membros] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true, cnpj: true, dpoName: true, dpoEmail: true, dpoTelefone: true },
      }),
      prisma.priMembroEquipe.findMany({
        where: { companyId },
        orderBy: { createdAt: "asc" },
        select: { nome: true, papel: true, contato24h: true, email: true },
      }),
    ]);
    if (!company) return { ok: false, error: "Empresa não encontrada." };
    return { ok: true, md: montarPriPreenchido(company, membros) };
  } catch (e: any) {
    console.error("[autoPreencherPri] erro:", e);
    return { ok: false, error: e?.message || "Erro ao montar o PRI." };
  }
}

function montarPriPreenchido(
  company: {
    name: string;
    cnpj: string | null;
    dpoName: string | null;
    dpoEmail: string | null;
    dpoTelefone: string | null;
  },
  membros: { nome: string; papel: string; contato24h: string | null; email: string | null }[],
): string {
  const orgao = company.name + (company.cnpj ? ` (CNPJ ${company.cnpj})` : "");
  const dpo = company.dpoName
    ? `${company.dpoName}${company.dpoEmail ? ` — ${company.dpoEmail}` : ""}${company.dpoTelefone ? ` — ${company.dpoTelefone}` : ""}`
    : "[nome, e-mail e telefone do Encarregado]";
  const equipe =
    membros.length > 0
      ? membros
          .map(
            (m) =>
              `- ${m.nome} — ${m.papel}` +
              `${m.contato24h ? ` — contato 24h: ${m.contato24h}` : ""}` +
              `${m.email ? ` — ${m.email}` : ""}`,
          )
          .join("\n")
      : "[Cadastre a equipe no mini-app de Incidentes e use Auto-preencher de novo, ou liste os membros manualmente.]";

  let md = gerarRascunhoPri();
  md = md.replace("[identifique o órgão]", orgao);
  md = md.replace(
    "[Liste cada membro: nome, papel e contato 24h. Use o botão Auto-preencher para trazer a equipe já cadastrada no mini-app de Incidentes.]",
    equipe,
  );
  md = md.replace("[nome, e-mail e telefone do Encarregado]", dpo);
  return md;
}
