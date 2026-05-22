// POST /api/curso/atualizar-turma
// Atualiza a janela de acesso (datas) e a lista de e-mails dos inscritos de
// uma turma. Admin-only. Usado pelo modal "Gerenciar turma".
//
// Body: { turmaId, acessoInicio?, acessoFim?, participantesTexto? }
//   - acessoInicio / acessoFim: "YYYY-MM-DD" ou "" (limpa a data)
//   - participantesTexto: texto colado com os e-mails (qualquer separador)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { ensureColunasControleTurma } from "@/lib/colunas-controle-turma";
import {
  parseEmails,
  normalizarParticipantes,
  mesclarParticipantes,
} from "@/lib/participantes-turma";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Fuso de Brasília — sem horário de verão desde 2019. As datas escolhidas
// pelo facilitador valem no horário do Brasil, não no fuso do servidor.
const FUSO = "-03:00";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const turmaId = String(body.turmaId || "");
  if (!turmaId) return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });

  const inicioStr = String(body.acessoInicio || "").trim();
  const fimStr = String(body.acessoFim || "").trim();
  // A data inicial vale a partir do começo do dia; a final, até o fim do dia.
  const acessoInicio = inicioStr ? new Date(`${inicioStr}T00:00:00.000${FUSO}`) : null;
  const acessoFim = fimStr ? new Date(`${fimStr}T23:59:59.999${FUSO}`) : null;

  if (acessoInicio && isNaN(acessoInicio.getTime())) {
    return NextResponse.json({ error: "Data inicial inválida" }, { status: 400 });
  }
  if (acessoFim && isNaN(acessoFim.getTime())) {
    return NextResponse.json({ error: "Data final inválida" }, { status: 400 });
  }
  if (acessoInicio && acessoFim && acessoInicio > acessoFim) {
    return NextResponse.json(
      { error: "A data inicial não pode ser depois da data final." },
      { status: 400 },
    );
  }

  await ensureColunasControleTurma();

  const turma = await prisma.cursoTurma.findUnique({
    where: { id: turmaId },
    select: { id: true, participantes: true },
  });
  if (!turma) return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });

  // Mescla a lista de e-mails preservando as confirmações já registradas.
  // Só mexe na lista se o texto veio no body (salvar só datas não a apaga).
  const atuais = normalizarParticipantes(turma.participantes);
  let participantes = atuais;
  if (typeof body.participantesTexto === "string") {
    participantes = mesclarParticipantes(atuais, parseEmails(body.participantesTexto));
  }

  const atualizada = await prisma.cursoTurma.update({
    where: { id: turmaId },
    data: {
      acessoInicio,
      acessoFim,
      participantes: participantes as any,
    },
    select: { id: true, nome: true, acessoInicio: true, acessoFim: true },
  });

  return NextResponse.json({
    ok: true,
    turma: atualizada,
    totalInscritos: participantes.length,
    totalConfirmados: participantes.filter((p) => p.confirmado).length,
  });
}
