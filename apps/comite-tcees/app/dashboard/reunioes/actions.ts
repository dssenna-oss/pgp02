"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export type ReuniaoInput = {
  id?: string;
  titulo: string;
  data: string; // "YYYY-MM-DD"
  hora?: string;
  local?: string;
  pauta?: string;
  decisoes?: string;
  presentes?: string; // vem do form como string
  totalConvocados?: string;
  status: string; // AGENDADA | REALIZADA
  ataRegistrada?: boolean;
  ataUrl?: string;
};

function parseIntOrNull(v?: string): number | null {
  if (v == null || v.trim() === "") return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

export async function salvarReuniao(input: ReuniaoInput) {
  // Qualquer membro logado pode criar/editar (decisão: acesso aberto).
  await requireSession();

  if (!input.titulo?.trim()) throw new Error("O título é obrigatório.");
  if (!input.data) throw new Error("A data é obrigatória.");

  // input.data vem como "YYYY-MM-DD" — fixa meio-dia local pra evitar
  // deslocamento de fuso que jogaria a reunião pro dia anterior.
  const dataDate = new Date(`${input.data}T12:00:00`);

  const dados = {
    titulo: input.titulo.trim(),
    data: dataDate,
    hora: input.hora?.trim() || null,
    local: input.local?.trim() || null,
    pauta: input.pauta?.trim() || null,
    decisoes: input.decisoes?.trim() || null,
    presentes: parseIntOrNull(input.presentes),
    totalConvocados: parseIntOrNull(input.totalConvocados),
    status: input.status === "REALIZADA" ? "REALIZADA" : "AGENDADA",
    ataRegistrada: !!input.ataRegistrada,
    ataUrl: input.ataUrl?.trim() || null,
  };

  if (input.id) {
    await prisma.reuniao.update({ where: { id: input.id }, data: dados });
  } else {
    await prisma.reuniao.create({ data: { ...dados, ordem: 0 } });
  }

  revalidatePath("/dashboard/reunioes");
  revalidatePath("/dashboard/calendario");
  return { ok: true };
}

export async function excluirReuniao(id: string) {
  await requireSession();
  await prisma.reuniao.delete({ where: { id } });
  revalidatePath("/dashboard/reunioes");
  revalidatePath("/dashboard/calendario");
  return { ok: true };
}
