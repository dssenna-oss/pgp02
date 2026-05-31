"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

/** Alterna um item do checklist (marca/desmarca). Presença = concluído. */
export async function alternarItem(itemId: string): Promise<{ ok: true; done: boolean }> {
  await requireSession();
  const existe = await prisma.monitoringCheck.findUnique({ where: { itemId }, select: { id: true } });
  if (existe) {
    await prisma.monitoringCheck.delete({ where: { itemId } });
    revalidatePath("/dashboard/checklist-monitoramento");
    return { ok: true, done: false };
  }
  await prisma.monitoringCheck.create({ data: { itemId } });
  revalidatePath("/dashboard/checklist-monitoramento");
  return { ok: true, done: true };
}
