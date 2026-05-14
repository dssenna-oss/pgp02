import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageContributors, ROLES } from "@/lib/auth-helpers";

/**
 * Reseta a senha de um Contribuidor. Apenas DPO Principal ou Substituto.
 *
 * Fluxo:
 * 1. Verifica que o solicitante é DPO Principal/Substituto da mesma org
 * 2. Acha o Contribuidor pelo id (deve ser da mesma org)
 * 3. Gera nova senha temporária, atualiza hash
 * 4. Devolve senha em claro UMA VEZ na resposta
 */

function generateTempPassword(): string {
  const hex = Math.random().toString(16).slice(2, 10);
  const digits = Math.floor(Math.random() * 9000 + 1000).toString();
  return hex.toUpperCase() + digits;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const dpo = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, companyId: true },
  });
  if (!dpo?.companyId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }
  if (!canManageContributors(dpo.role)) {
    return NextResponse.json(
      { error: "Apenas DPO Principal ou Substituto podem resetar senhas" },
      { status: 403 }
    );
  }

  const { id } = await Promise.resolve(params as any);

  const target = await prisma.user.findFirst({
    where: {
      id,
      companyId: dpo.companyId,
      role: { in: [ROLES.CONTRIBUIDOR, ROLES.USER_LEGACY] },
    },
    select: { id: true, email: true, name: true },
  });
  if (!target) {
    return NextResponse.json(
      { error: "Contribuidor não encontrado nesta organização" },
      { status: 404 }
    );
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({
    where: { id },
    data: {
      password: passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json({
    contribuidor: { id: target.id, name: target.name, email: target.email },
    tempPassword,
  });
}
