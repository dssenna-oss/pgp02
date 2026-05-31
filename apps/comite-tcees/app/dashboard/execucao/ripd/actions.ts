"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { emptyRipdData, normalizeRipdData, type RipdData } from "@/lib/ripd-helpers";
import { prepopRipdDoInventario } from "@/lib/ripd-mono";

/** Cria um RIPD — pré-populado de um processo do Inventário ou em branco. */
export async function criarRipd(input: {
  inventoryId?: string | null;
  instrumentoId?: string | null;
}): Promise<{ id: string } | { erro: string }> {
  await requireSession();

  let title = "RIPD — novo";
  let data: RipdData = emptyRipdData();

  if (input.inventoryId) {
    const prep = await prepopRipdDoInventario(input.inventoryId);
    if (!prep) return { erro: "Processo do Inventário não encontrado." };
    title = prep.title;
    data = prep.data;
  }

  const ripd = await prisma.ripd.create({
    data: {
      title,
      inventoryId: input.inventoryId || null,
      instrumentoId: input.instrumentoId || null,
      data: data as any,
    },
    select: { id: true },
  });
  revalidatePath("/dashboard/execucao/ripd");
  return { id: ripd.id };
}

/** Salva rascunho (título + 8 seções). */
export async function salvarRipd(input: {
  id: string;
  title: string;
  data: RipdData;
}): Promise<{ ok: true }> {
  await requireSession();
  if (!input.title.trim()) throw new Error("O título é obrigatório.");
  await prisma.ripd.update({
    where: { id: input.id },
    data: { title: input.title.trim(), data: normalizeRipdData(input.data) as any },
  });
  revalidatePath(`/dashboard/execucao/ripd/${input.id}`);
  revalidatePath("/dashboard/execucao/ripd");
  return { ok: true };
}

/** Aprova: congela versão, marca APROVADO e sincroniza o instrumento. */
export async function aprovarRipd(input: {
  id: string;
  changeLog?: string;
}): Promise<{ ok: true; version: number }> {
  const session = await requireSession();
  const autor = session.user?.name || session.user?.email || null;

  const ripd = await prisma.ripd.findUnique({
    where: { id: input.id },
    select: { data: true, publishedVersionNum: true, instrumentoId: true },
  });
  if (!ripd) throw new Error("RIPD não encontrado.");

  const novaVersao = (ripd.publishedVersionNum ?? 0) + 1;

  await prisma.$transaction([
    prisma.ripd.update({
      where: { id: input.id },
      data: {
        status: "APROVADO",
        publishedContent: ripd.data as any,
        publishedAt: new Date(),
        publishedVersionNum: novaVersao,
        approvedBy: autor,
        approvedAt: new Date(),
        rejectionNote: null,
      },
    }),
    prisma.ripdVersion.create({
      data: {
        ripdId: input.id,
        version: novaVersao,
        content: ripd.data as any,
        changeLog: input.changeLog?.trim() || null,
        approvedBy: autor,
      },
    }),
  ]);

  if (ripd.instrumentoId) {
    await prisma.instrumento.update({
      where: { id: ripd.instrumentoId },
      data: { status: "APROVADO" },
    });
  }

  revalidatePath(`/dashboard/execucao/ripd/${input.id}`);
  revalidatePath("/dashboard/execucao/ripd");
  revalidatePath("/dashboard/execucao");
  return { ok: true, version: novaVersao };
}

/** Volta um RIPD aprovado para rascunho (para nova rodada de edição). */
export async function reabrirRipd(id: string): Promise<{ ok: true }> {
  await requireSession();
  await prisma.ripd.update({ where: { id }, data: { status: "RASCUNHO" } });
  revalidatePath(`/dashboard/execucao/ripd/${id}`);
  revalidatePath("/dashboard/execucao/ripd");
  return { ok: true };
}

export async function excluirRipd(id: string): Promise<{ ok: true }> {
  await requireSession();
  await prisma.ripd.delete({ where: { id } });
  revalidatePath("/dashboard/execucao/ripd");
  return { ok: true };
}
