"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export type EntregaInput = {
  id?: string;
  titulo: string;
  descricao?: string;
  eixoCodigo: string;
  trimestre: string;
  responsavel?: string;
  prazoTexto?: string;
  prazoData?: string; // "YYYY-MM-DD" ou ""
  status: string;
  custo?: string; // R$ como texto do form ("" = sem custo)
};

/** Converte texto de moeda BR/US ("1.234,56", "1234.56", "R$ 1.000") em número, ou null. */
function parseCusto(v?: string): number | null {
  if (v == null) return null;
  let s = String(v).replace(/[^\d.,-]/g, "").trim();
  if (!s) return null;
  // Se tem vírgula, trata como separador decimal BR e remove pontos de milhar.
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

const STATUS_VALIDOS = ["A_INICIAR", "EM_ANDAMENTO", "CONCLUIDO", "ATRASADO"];

export async function salvarEntrega(input: EntregaInput) {
  await requireEditor();
  if (!input.titulo?.trim()) throw new Error("O título é obrigatório.");
  if (!input.eixoCodigo) throw new Error("O eixo é obrigatório.");
  if (!input.trimestre) throw new Error("O trimestre é obrigatório.");

  const dados = {
    titulo: input.titulo.trim(),
    descricao: input.descricao?.trim() || null,
    eixoCodigo: input.eixoCodigo,
    trimestre: input.trimestre,
    responsavel: input.responsavel?.trim() || null,
    prazoTexto: input.prazoTexto?.trim() || null,
    prazoData: input.prazoData ? new Date(`${input.prazoData}T12:00:00`) : null,
    status: STATUS_VALIDOS.includes(input.status) ? input.status : "A_INICIAR",
    custo: parseCusto(input.custo),
  };

  if (input.id) {
    await prisma.entrega.update({ where: { id: input.id }, data: dados });
  } else {
    const max = await prisma.entrega.aggregate({ _max: { ordem: true } });
    await prisma.entrega.create({ data: { ...dados, ordem: (max._max.ordem ?? 0) + 1 } });
  }

  // A Visão geral (% execução, progresso por eixo) e o Calendário derivam destas.
  revalidatePath("/dashboard/plano");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendario");
  return { ok: true };
}

export async function excluirEntrega(id: string) {
  await requireEditor();
  await prisma.entrega.delete({ where: { id } });
  revalidatePath("/dashboard/plano");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendario");
  return { ok: true };
}
