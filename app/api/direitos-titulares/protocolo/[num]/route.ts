/**
 * API pública — consulta de status por número de protocolo + email
 *
 * GET /api/direitos-titulares/protocolo/[num]?email=...
 *
 * Retorna apenas dados não-sensíveis (status, datas, decisão).
 * Confirmação dupla por e-mail evita enumeração de protocolos por terceiros.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { num: string } },
) {
  try {
    const protocolNumber = decodeURIComponent(params.num).trim().toUpperCase();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!protocolNumber) {
      return NextResponse.json(
        { error: "Número de protocolo é obrigatório" },
        { status: 400 },
      );
    }
    if (!email) {
      return NextResponse.json(
        { error: "E-mail do titular é obrigatório para validar a consulta" },
        { status: 400 },
      );
    }

    const dsr = await prisma.dataSubjectRequest.findUnique({
      where: { protocolNumber },
      select: {
        protocolNumber: true,
        titularEmail: true,
        status: true,
        decision: true,
        createdAt: true,
        dueDate: true,
        responseDate: true,
        responseChannelUsed: true,
      },
    });

    // Mensagem genérica em caso de não-encontrado / email divergente
    // (evita confirmar existência do protocolo para quem não é titular).
    if (!dsr || dsr.titularEmail.toLowerCase() !== email) {
      return NextResponse.json(
        {
          error:
            "Não foi possível localizar uma requisição com esse protocolo e e-mail.",
        },
        { status: 404 },
      );
    }

    // Esconde o email da resposta (já foi validado acima)
    const { titularEmail: _ignored, ...safe } = dsr;

    return NextResponse.json(safe);
  } catch (error) {
    console.error("Erro ao consultar protocolo:", error);
    return NextResponse.json(
      { error: "Erro ao consultar protocolo" },
      { status: 500 },
    );
  }
}
