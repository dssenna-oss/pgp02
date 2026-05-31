"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { getTemplate, applyPlaceholders } from "@/lib/policies-templates";
import { defaultSlugForType, slugify, type PolicyType } from "@/lib/policies-helpers";
import { tceesPlaceholders, policyTypeForInstrumento } from "@/lib/policy-mono";

/** Gera um slug único na tabela policies (sufixa -2, -3… se colidir). */
async function slugUnico(base: string, ignoreId?: string): Promise<string> {
  const raiz = slugify(base) || "politica";
  let slug = raiz;
  let n = 1;
  // loop curto: na prática 1-2 iterações
  while (true) {
    const existe = await prisma.policy.findFirst({
      where: { slug, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
      select: { id: true },
    });
    if (!existe) return slug;
    n += 1;
    slug = `${raiz}-${n}`;
  }
}

/** Cria uma política a partir de um template (uso avulso, sem instrumento). */
export async function criarPolicy(type: PolicyType): Promise<{ id: string }> {
  await requireSession();
  const tpl = getTemplate(type);
  const placeholders = await tceesPlaceholders();
  const content = applyPlaceholders(tpl.content, placeholders);
  const slug = await slugUnico(defaultSlugForType(type));
  const policy = await prisma.policy.create({
    data: { type, title: tpl.defaultTitle, slug, currentContent: content },
    select: { id: true },
  });
  revalidatePath("/dashboard/execucao/politicas");
  return { id: policy.id };
}

/**
 * Abre (ou cria sob demanda) a política que realiza um item da Central de
 * Instrumentos. Idempotente: se já existe Policy vinculada ao instrumento,
 * devolve ela; senão cria do template do tipo mapeado.
 */
export async function abrirPolicyDoInstrumento(
  instrumentoId: string,
): Promise<{ id: string } | { erro: string }> {
  await requireSession();
  const inst = await prisma.instrumento.findUnique({
    where: { id: instrumentoId },
    select: { id: true, nome: true },
  });
  if (!inst) return { erro: "Instrumento não encontrado." };

  const existente = await prisma.policy.findFirst({
    where: { instrumentoId },
    select: { id: true },
  });
  if (existente) return { id: existente.id };

  const type = policyTypeForInstrumento(inst.nome);
  if (!type) return { erro: "Este instrumento não é um documento de texto editável aqui." };

  const tpl = getTemplate(type);
  const placeholders = await tceesPlaceholders();
  const content = applyPlaceholders(tpl.content, placeholders);
  const slug = await slugUnico(defaultSlugForType(type));
  const policy = await prisma.policy.create({
    data: {
      type,
      title: inst.nome,
      slug,
      currentContent: content,
      instrumentoId,
    },
    select: { id: true },
  });
  // Marca o instrumento como em elaboração se ainda estava por iniciar.
  await prisma.instrumento.updateMany({
    where: { id: instrumentoId, status: "A_ELABORAR" },
    data: { status: "EM_ELABORACAO" },
  });
  revalidatePath("/dashboard/execucao");
  revalidatePath("/dashboard/execucao/politicas");
  return { id: policy.id };
}

/** Salva rascunho (título + conteúdo markdown). */
export async function salvarRascunho(input: {
  id: string;
  title: string;
  content: string;
}): Promise<{ ok: true }> {
  await requireSession();
  if (!input.title.trim()) throw new Error("O título é obrigatório.");
  await prisma.policy.update({
    where: { id: input.id },
    data: { title: input.title.trim(), currentContent: input.content },
  });
  revalidatePath(`/dashboard/execucao/politicas/${input.id}`);
  revalidatePath("/dashboard/execucao/politicas");
  return { ok: true };
}

/**
 * Publica: congela o conteúdo atual como nova versão, atualiza o snapshot
 * público e incrementa a versão. Sincroniza o instrumento vinculado p/
 * PUBLICADO.
 */
export async function publicarPolicy(input: {
  id: string;
  changeLog?: string;
}): Promise<{ ok: true; version: number }> {
  const session = await requireSession();
  const autor = session.user?.name || session.user?.email || null;

  const policy = await prisma.policy.findUnique({
    where: { id: input.id },
    select: { currentContent: true, currentVersion: true, instrumentoId: true },
  });
  if (!policy) throw new Error("Política não encontrada.");

  const novaVersao = policy.currentVersion + 1;

  await prisma.$transaction([
    prisma.policy.update({
      where: { id: input.id },
      data: {
        status: "PUBLICADA",
        publishedContent: policy.currentContent,
        currentVersion: novaVersao,
        publishedAt: new Date(),
        publishedBy: autor,
      },
    }),
    prisma.policyVersion.create({
      data: {
        policyId: input.id,
        version: novaVersao,
        content: policy.currentContent,
        changeLog: input.changeLog?.trim() || null,
        publishedBy: autor,
      },
    }),
  ]);

  if (policy.instrumentoId) {
    await prisma.instrumento.update({
      where: { id: policy.instrumentoId },
      data: { status: "PUBLICADO" },
    });
  }

  revalidatePath(`/dashboard/execucao/politicas/${input.id}`);
  revalidatePath("/dashboard/execucao/politicas");
  revalidatePath("/dashboard/execucao");
  return { ok: true, version: novaVersao };
}

/** Exclui uma política (e suas versões em cascata). */
export async function excluirPolicy(id: string): Promise<{ ok: true }> {
  await requireSession();
  await prisma.policy.delete({ where: { id } });
  revalidatePath("/dashboard/execucao/politicas");
  return { ok: true };
}
