// Telão ao vivo (Telão Comandado, Modalidade C) — o notebook abre esta página
// UMA vez (+ Modo Projeção) e ela reage sozinha aos comandos que o facilitador
// toca no celular (Painel de Condução). Polling do campo telaoComando da turma.
//
// Fica FORA de /facilitador de propósito (layout raiz, sem sidebar) — igual ao
// /telao. O middleware protege /telao-vivo só pra ADMIN (startsWith "/telao").

import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { ensureColunaTelaoComando } from "@/lib/coluna-telao-comando";
import { TelaoVivoView } from "./telao-vivo-view";

export const dynamic = "force-dynamic";
// Primeira query pós cold-start do Neon pode demorar.
export const maxDuration = 30;

export default async function TelaoVivoPage({
  params,
}: {
  params: { turmaSlug: string };
}) {
  await requireAdmin();
  await ensureColunaTelaoComando();

  const turma = await prisma.cursoTurma.findFirst({
    where: { slug: params.turmaSlug },
    select: {
      id: true,
      nome: true,
      cidade: true,
      slug: true,
      status: true,
      telaoComando: true,
    },
  });
  if (!turma) notFound();

  return <TelaoVivoView turma={turma} comandoInicial={turma.telaoComando ?? null} />;
}
