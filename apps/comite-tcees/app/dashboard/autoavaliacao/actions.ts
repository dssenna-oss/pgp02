"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

const VALIDAS = ["SIM", "PARCIAL", "NAO", "NA"];

/** Define/sobrescreve manualmente a resposta de uma questão. */
export async function responderTcu(input: {
  questionCode: string;
  resposta: string;
  observacao?: string;
}): Promise<{ ok: true }> {
  await requireEditor();
  if (!VALIDAS.includes(input.resposta)) throw new Error("Resposta inválida.");
  await prisma.tcuAnswer.upsert({
    where: { questionCode: input.questionCode },
    create: { questionCode: input.questionCode, resposta: input.resposta, observacao: input.observacao?.trim() || null },
    update: { resposta: input.resposta, observacao: input.observacao?.trim() || null },
  });
  revalidatePath("/dashboard/autoavaliacao");
  revalidatePath("/dashboard/indicadores");
  return { ok: true };
}

/** Remove a resposta manual → volta ao valor automático (ou pendente). */
export async function redefinirTcu(questionCode: string): Promise<{ ok: true }> {
  await requireEditor();
  await prisma.tcuAnswer.deleteMany({ where: { questionCode } });
  revalidatePath("/dashboard/autoavaliacao");
  revalidatePath("/dashboard/indicadores");
  return { ok: true };
}
