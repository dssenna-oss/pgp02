"use server";

// Server actions do documento: salvar respostas específicas + mudar status.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInstituicao } from "@/lib/auth-server";
import { getModeloPacote } from "@/lib/modelos-pacote";
import { getConfigDoc } from "@/lib/documentos-config";

export async function salvarRespostas(formData: FormData) {
  const { instituicaoId } = await requireInstituicao();
  const slug = String(formData.get("slug") ?? "");
  const modelo = getModeloPacote(slug);
  if (!modelo) redirect("/jornada");

  const config = getConfigDoc(modelo.numero);
  const respostas: Record<string, string> = {};
  for (const p of config?.perguntas ?? []) {
    const v = String(formData.get(p.id) ?? "").trim();
    if (v) respostas[p.id] = v;
  }

  await prisma.documentoResposta.upsert({
    where: { instituicaoId_numeroModelo: { instituicaoId, numeroModelo: modelo.numero } },
    update: { respostas },
    create: { instituicaoId, numeroModelo: modelo.numero, respostas },
  });

  revalidatePath(`/jornada/documento/${slug}`);
  revalidatePath("/jornada");
  redirect(`/jornada/documento/${slug}?ok=1`);
}

export async function definirStatus(formData: FormData) {
  const { instituicaoId } = await requireInstituicao();
  const slug = String(formData.get("slug") ?? "");
  const status = String(formData.get("status") ?? "");
  const modelo = getModeloPacote(slug);
  if (!modelo || !["rascunho", "pronto"].includes(status)) redirect("/jornada");

  await prisma.documentoResposta.upsert({
    where: { instituicaoId_numeroModelo: { instituicaoId, numeroModelo: modelo.numero } },
    update: { status },
    create: { instituicaoId, numeroModelo: modelo.numero, status },
  });

  revalidatePath(`/jornada/documento/${slug}`);
  revalidatePath("/jornada");
  redirect(`/jornada/documento/${slug}${status === "pronto" ? "?pronto=1" : ""}`);
}
