"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export type GapInput = {
  controlCode: string;
  aderencia?: string | null;
  cenarioAtual?: string;
  mapeamento?: string;
  pontoMelhoria?: string;
};

const ADER_VALIDA = ["ADERENTE", "PARCIAL", "NAO_ADERENTE", "NA"];

export async function salvarGap(input: GapInput) {
  await requireSession();
  if (!input.controlCode) throw new Error("Controle não informado.");

  const data = {
    aderencia: input.aderencia && ADER_VALIDA.includes(input.aderencia) ? input.aderencia : null,
    cenarioAtual: input.cenarioAtual?.trim() || null,
    pontoMelhoria: input.pontoMelhoria?.trim() || null,
    mapeamento: input.mapeamento?.trim() || null,
  };

  await prisma.gapAnswer.upsert({
    where: { controlCode: input.controlCode },
    update: data,
    create: { controlCode: input.controlCode, ...data },
  });

  revalidatePath("/dashboard/gap");
  return { ok: true };
}
