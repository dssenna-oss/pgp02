import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSuperAdmin, ROLES } from "@/lib/auth-helpers";

/**
 * Reseta a senha do DPO Principal de uma organização.
 *
 * POST /api/sysadmin/orgs/[id]/reset-password
 *
 * Lógica:
 * - Acha o DPO Principal (ou admin legado) da org `id`
 * - Gera nova senha temporária
 * - Atualiza hash no banco
 * - Devolve a senha em claro UMA VEZ na resposta (super admin copia)
 *
 * Acesso: SUPER_ADMIN_EMAIL apenas.
 */

function generateTempPassword(): string {
  const hex = Math.random().toString(16).slice(2, 10);
  const digits = Math.floor(Math.random() * 9000 + 1000).toString();
  return hex.toUpperCase() + digits;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!isSuperAdmin(session.user.email)) {
    return NextResponse.json(
      { error: "Acesso restrito ao super admin" },
      { status: 403 }
    );
  }

  const { id } = await params;

  // Acha o DPO Principal (ou admin legado) da org
  const dpo = await prisma.user.findFirst({
    where: {
      companyId: id,
      role: { in: [ROLES.DPO_PRINCIPAL, ROLES.ADMIN_LEGACY] },
    },
  });

  if (!dpo) {
    return NextResponse.json(
      { error: "DPO Principal não encontrado nesta organização" },
      { status: 404 }
    );
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({
    where: { id: dpo.id },
    data: {
      password: passwordHash,
      // Limpa qualquer reset token pendente
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json({
    dpo: { id: dpo.id, name: dpo.name, email: dpo.email },
    tempPassword,
  });
}
