"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export type IncidenteInput = {
  id?: string;
  titulo: string;
  descricao?: string;
  severidade: string;
  status: string;
  ocorridoEm?: string; // YYYY-MM-DD ou datetime-local
  detectadoEm?: string;
  comunicadoAnpd?: boolean;
  comunicadoTitular?: boolean;
  naturezaDados?: string;
  medidasMitigacao?: string;
};

const SEV = ["BAIXA", "MEDIA", "ALTA", "CRITICA"];
const STATUS = ["RASCUNHO", "EM_ANALISE", "ENCERRADO"];

function parseDT(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v.length <= 10 ? `${v}T12:00:00` : v);
  return isNaN(d.getTime()) ? null : d;
}

export async function salvarIncidente(input: IncidenteInput) {
  await requireEditor();
  if (!input.titulo?.trim()) throw new Error("Informe um título para o incidente.");

  const dados = {
    titulo: input.titulo.trim(),
    descricao: input.descricao?.trim() || null,
    severidade: SEV.includes(input.severidade) ? input.severidade : "MEDIA",
    status: STATUS.includes(input.status) ? input.status : "EM_ANALISE",
    ocorridoEm: parseDT(input.ocorridoEm),
    detectadoEm: parseDT(input.detectadoEm),
    comunicadoAnpd: !!input.comunicadoAnpd,
    comunicadoTitular: !!input.comunicadoTitular,
    naturezaDados: input.naturezaDados?.trim() || null,
    medidasMitigacao: input.medidasMitigacao?.trim() || null,
  };

  if (input.id) {
    await prisma.incident.update({ where: { id: input.id }, data: dados });
  } else {
    const max = await prisma.incident.aggregate({ _max: { ordem: true } });
    await prisma.incident.create({ data: { ...dados, ordem: (max._max.ordem ?? 0) + 1 } });
  }
  revalidatePath("/dashboard/incidentes");
  return { ok: true };
}

export async function excluirIncidente(id: string) {
  await requireEditor();
  await prisma.incident.delete({ where: { id } });
  revalidatePath("/dashboard/incidentes");
  return { ok: true };
}
