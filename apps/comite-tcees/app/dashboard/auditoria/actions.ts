"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

function dataOuNull(d?: string): Date | null {
  if (!d || !d.trim()) return null;
  return new Date(`${d}T12:00:00`);
}

export type AuditoriaInput = {
  id?: string;
  titulo: string;
  escopo?: string;
  responsavel?: string;
  dataPrevista?: string;
  dataRealizada?: string;
  status?: string;
  observacoes?: string;
};

export async function salvarAuditoria(input: AuditoriaInput): Promise<{ ok: true }> {
  await requireEditor();
  if (!input.titulo?.trim()) throw new Error("Informe o título da auditoria.");
  const dados = {
    titulo: input.titulo.trim(),
    escopo: input.escopo?.trim() || null,
    responsavel: input.responsavel?.trim() || null,
    dataPrevista: dataOuNull(input.dataPrevista),
    dataRealizada: dataOuNull(input.dataRealizada),
    status: input.status || "PLANEJADA",
    observacoes: input.observacoes?.trim() || null,
  };
  if (input.id) await prisma.auditoria.update({ where: { id: input.id }, data: dados });
  else await prisma.auditoria.create({ data: dados });
  revalidatePath("/dashboard/auditoria");
  return { ok: true };
}

export async function excluirAuditoria(id: string): Promise<{ ok: true }> {
  await requireEditor();
  await prisma.auditoria.delete({ where: { id } });
  revalidatePath("/dashboard/auditoria");
  return { ok: true };
}

export type AchadoInput = {
  id?: string;
  auditoriaId: string;
  descricao: string;
  severidade?: string;
  naoConformidade?: boolean;
  recomendacao?: string;
  planoAcao?: string;
  prazo?: string;
  status?: string;
};

export async function salvarAchado(input: AchadoInput): Promise<{ ok: true }> {
  await requireEditor();
  if (!input.descricao?.trim()) throw new Error("Descreva o achado.");
  const dados = {
    descricao: input.descricao.trim(),
    severidade: input.severidade || "MEDIA",
    naoConformidade: input.naoConformidade ?? true,
    recomendacao: input.recomendacao?.trim() || null,
    planoAcao: input.planoAcao?.trim() || null,
    prazo: dataOuNull(input.prazo),
    status: input.status || "ABERTO",
  };
  if (input.id) await prisma.auditoriaAchado.update({ where: { id: input.id }, data: dados });
  else await prisma.auditoriaAchado.create({ data: { ...dados, auditoriaId: input.auditoriaId } });
  revalidatePath("/dashboard/auditoria");
  return { ok: true };
}

export async function excluirAchado(id: string): Promise<{ ok: true }> {
  await requireEditor();
  await prisma.auditoriaAchado.delete({ where: { id } });
  revalidatePath("/dashboard/auditoria");
  return { ok: true };
}
