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
  anexoTipo?: string | null; // "PDF" | "URL" | null
  anexoUrl?: string | null;
  anexoNome?: string | null;
};

function validar(input: ArticleInput) {
  if (!input.titulo?.trim()) throw new Error("Informe o título.");
  if (input.capaUrl && input.capaUrl.length > 0) {
    if (!input.capaUrl.startsWith("data:image/")) throw new Error("Capa inválida — envie uma imagem.");
    if (input.capaUrl.length > 700_000) throw new Error("Imagem de capa muito grande.");
  }
  if (input.anexoTipo === "PDF") {
    if (!input.anexoUrl?.startsWith("data:application/pdf")) throw new Error("Anexo inválido — envie um arquivo PDF.");
    // base64 infla ~33%; limite ~4MB de arquivo ⇒ ~5.5MB de data URL (sob o bodySizeLimit de 5mb não cabe;
    // por isso travamos no cliente em ~3,8MB de arquivo). Aqui validamos o tamanho final da string.
    if (input.anexoUrl.length > 5_200_000) throw new Error("PDF muito grande (máx. ~3,8 MB). Use um link externo para arquivos maiores.");
  } else if (input.anexoTipo === "URL") {
    const u = input.anexoUrl?.trim() ?? "";
    if (!/^https?:\/\//i.test(u)) throw new Error("Informe uma URL válida (começando com http:// ou https://).");
  }
}

/** Cria ou atualiza um artigo (rascunho). Coordenação/Encarregado/Admin. */
export async function salvarArtigo(input: ArticleInput): Promise<{ ok: true; id: string }> {
  await requireEditor();
  validar(input);
  const tipo = TIPOS_ARTIGO.includes(input.tipo as (typeof TIPOS_ARTIGO)[number]) ? input.tipo : "NOTICIA";

  const temAnexo = input.anexoTipo === "PDF" || input.anexoTipo === "URL";
  const dados = {
    titulo: input.titulo.trim(),
    tipo,
    resumo: input.resumo?.trim() || null,
    conteudo: input.conteudo ?? "",
    capaUrl: input.capaUrl?.trim() || null,
    anexoTipo: temAnexo ? input.anexoTipo : null,
    anexoUrl: temAnexo ? (input.anexoUrl?.trim() || null) : null,
    anexoNome: temAnexo ? (input.anexoNome?.trim() || null) : null,
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
