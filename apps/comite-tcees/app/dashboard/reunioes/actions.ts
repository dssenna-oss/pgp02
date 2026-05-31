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

function dataBR(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
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
    // Comunicar aos membros: nova reunião agendada (aviso no app; e-mail virá depois).
    if (dados.status === "AGENDADA") {
      await prisma.notificacao.create({
        data: {
          tipo: "REUNIAO",
          titulo: `Nova reunião agendada: ${dados.titulo}`,
          descricao: `${dataBR(dataDate)}${dados.hora ? ` · ${dados.hora}` : ""}${dados.local ? ` · ${dados.local}` : ""} — confirme sua presença.`,
          href: "/dashboard/reunioes",
        },
      });
    }
  }

  revalidatePath("/dashboard/reunioes");
  revalidatePath("/dashboard/calendario");
  revalidatePath("/dashboard/notificacoes");
  return { ok: true };
}

/** Marca a pauta como aprovada e comunica os membros (aviso no app). */
export async function aprovarPauta(id: string) {
  await requireSession();
  const reuniao = await prisma.reuniao.findUnique({
    where: { id },
    select: { titulo: true, pauta: true, data: true, pautaAprovada: true },
  });
  if (!reuniao) throw new Error("Reunião não encontrada.");
  if (reuniao.pautaAprovada) return { ok: true }; // já aprovada — evita aviso duplicado

  await prisma.reuniao.update({ where: { id }, data: { pautaAprovada: true } });
  await prisma.notificacao.create({
    data: {
      tipo: "PAUTA",
      titulo: `Pauta aprovada: ${reuniao.titulo}`,
      descricao: reuniao.pauta
        ? reuniao.pauta.slice(0, 140)
        : `Reunião de ${dataBR(reuniao.data)}.`,
      href: "/dashboard/reunioes",
    },
  });

  revalidatePath("/dashboard/reunioes");
  revalidatePath("/dashboard/notificacoes");
  return { ok: true };
}

export async function excluirReuniao(id: string) {
  await requireSession();
  await prisma.reuniao.delete({ where: { id } });
  revalidatePath("/dashboard/reunioes");
  revalidatePath("/dashboard/calendario");
  return { ok: true };
}
