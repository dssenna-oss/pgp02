// POST /api/curso/disparar-incidente { turmaId, orgao: "PM" | "CM" }
// Cria automaticamente um Incident.RASCUNHO em TODOS os grupos do órgão
// com cenário dramático pré-preenchido. Usado pelo facilitador na Missão 5.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

const CENARIOS = {
  PM: {
    titulo: "🚨 Pendrive com prontuários encontrado em ônibus municipal",
    descricao:
      "Um pendrive sem criptografia, contendo prontuários e exames de 2.300 pacientes do " +
      "Posto Dr. Joaquim Bento, foi encontrado num ônibus da linha municipal de Vegas. " +
      "A imprensa local já está no portão da Prefeitura pedindo posicionamento. O Prefeito " +
      "quer respostas até o final da tarde. Vocês têm 25 minutos para registrar, classificar " +
      "severidade, gerar Comunicação ANPD (Res. 15/2024) e Carta aos Titulares (Art. 48 §1º LGPD).",
    severidade: "ALTA",
  },
  CM: {
    titulo: "🚨 Lista dos inscritos da Tribuna Livre vazou em grupo de WhatsApp",
    descricao:
      "A lista completa dos 480 inscritos da Tribuna Livre — com nome, CPF, telefone, endereço " +
      "e tema da fala — vazou num grupo público de WhatsApp da cidade de Vegas. Um vereador " +
      "de oposição já protocolou requerimento na Mesa Diretora exigindo explicações. Imprensa " +
      "cobrindo. Vocês têm 25 minutos para registrar, classificar severidade, gerar Comunicação " +
      "ANPD (Res. 15/2024) e Carta aos Titulares (Art. 48 §1º LGPD).",
    severidade: "ALTA",
  },
};

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const { turmaId, orgao } = await req.json();
  if (!turmaId) return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });
  if (!["PM", "CM"].includes(orgao)) return NextResponse.json({ error: "orgao deve ser PM ou CM" }, { status: 400 });

  const cenario = CENARIOS[orgao as "PM" | "CM"];

  const grupos = await prisma.cursoGrupo.findMany({
    where: { turmaId, orgao },
    select: { companyId: true, numero: true },
  });
  if (grupos.length === 0) {
    return NextResponse.json({ error: `Nenhum grupo ${orgao} na turma` }, { status: 404 });
  }

  const agora = new Date();
  const incidentes = [];
  for (const g of grupos) {
    const inc = await prisma.incident.create({
      data: {
        companyId: g.companyId,
        titulo: cenario.titulo,
        descricao: cenario.descricao,
        severidade: cenario.severidade,
        status: "RASCUNHO",
        ocorridoEm: new Date(agora.getTime() - 1000 * 60 * 30), // ocorreu há 30 min
        detectadoEm: agora,
      },
    });
    incidentes.push({ grupo: g.numero, incidentId: inc.id });
  }

  return NextResponse.json({
    ok: true,
    orgao,
    cenario: cenario.titulo,
    incidentesCriados: incidentes,
    disparadoEm: agora.toISOString(),
  });
}
