"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor, getSession } from "@/lib/auth-server";
import { TIPOS_ARTIGO } from "@/lib/articles";
import { revalidatePath } from "next/cache";

export type ArticleInput = {
  id?: string;
  titulo: string;
  tipo: string;
  resumo?: string;
  conteudo?: string;
  capaUrl?: string | null;
};

function validar(input: ArticleInput) {
  if (!input.titulo?.trim()) throw new Error("Informe o título.");
  if (input.capaUrl && input.capaUrl.length > 0) {
    if (!input.capaUrl.startsWith("data:image/")) throw new Error("Capa inválida — envie uma imagem.");
    if (input.capaUrl.length > 700_000) throw new Error("Imagem de capa muito grande.");
  }
}

/** Cria ou atualiza um artigo (rascunho). Coordenação/Encarregado/Admin. */
export async function salvarArtigo(input: ArticleInput): Promise<{ ok: true; id: string }> {
  await requireEditor();
  validar(input);
  const tipo = TIPOS_ARTIGO.includes(input.tipo as (typeof TIPOS_ARTIGO)[number]) ? input.tipo : "NOTICIA";

  const dados = {
    titulo: input.titulo.trim(),
    tipo,
    resumo: input.resumo?.trim() || null,
    conteudo: input.conteudo ?? "",
    capaUrl: input.capaUrl?.trim() || null,
  };

  if (input.id) {
    const a = await prisma.article.update({ where: { id: input.id }, data: dados });
    revalidatePath("/dashboard/noticias");
    return { ok: true, id: a.id };
  }
  const session = await getSession();
  const a = await prisma.article.create({
    data: { ...dados, autor: session?.user?.name ?? null },
  });
  revalidatePath("/dashboard/noticias");
  return { ok: true, id: a.id };
}

/** Publica (torna visível aos membros) ou despublica (volta a rascunho). */
export async function alternarPublicacao(id: string): Promise<{ ok: true; publicado: boolean }> {
  await requireEditor();
  const atual = await prisma.article.findUnique({ where: { id }, select: { status: true } });
  if (!atual) throw new Error("Artigo não encontrado.");
  const publicar = atual.status !== "PUBLICADO";
  await prisma.article.update({
    where: { id },
    data: { status: publicar ? "PUBLICADO" : "RASCUNHO", publicadoEm: publicar ? new Date() : null },
  });
  revalidatePath("/dashboard/noticias");
  return { ok: true, publicado: publicar };
}

export async function excluirArtigo(id: string): Promise<{ ok: true }> {
  await requireEditor();
  await prisma.article.delete({ where: { id } });
  revalidatePath("/dashboard/noticias");
  return { ok: true };
}
