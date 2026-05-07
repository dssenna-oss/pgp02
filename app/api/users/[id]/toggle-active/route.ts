
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/auth-helpers";

// PATCH - Ativar/Desativar usuário (apenas admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Verificar se é admin
    const adminEmail = "clubedoservidor@protonmail.com";
    if (session.user.email !== adminEmail) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem gerenciar usuários." },
        { status: 403 }
      );
    }

    const userId = params.id;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Campo isActive é obrigatório e deve ser um booleano" },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Não permitir desativar o próprio usuário admin
    if (user.email === adminEmail && !isActive) {
      return NextResponse.json(
        { error: "Você não pode desativar sua própria conta de administrador" },
        { status: 400 }
      );
    }

    // Atualizar status do usuário.
    // Defesa em camadas: se está aprovando (isActive=true) e o role está
    // nulo/vazio (cadastros antigos via /signup que não atribuíam role),
    // promove a DPO_PRINCIPAL — quem se cadastra via formulário é, por
    // definição, o representante da nova organização.
    const needsRolePromotion =
      isActive && (!user.role || user.role.trim() === "");

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive,
        ...(needsRolePromotion ? { role: ROLES.DPO_PRINCIPAL } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar status do usuário:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status do usuário" },
      { status: 500 }
    );
  }
}
