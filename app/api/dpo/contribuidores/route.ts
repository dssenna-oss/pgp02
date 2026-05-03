import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageContributors, isDPO, ROLES } from "@/lib/auth-helpers";

/**
 * Endpoints do DPO pra gerenciar contribuidores da própria organização.
 *
 * Acesso:
 *   - GET   → qualquer DPO (Principal, Substituto, Auxiliar) — view-only
 *   - POST  → só DPO Principal ou Substituto (canManageContributors)
 *
 * Os contribuidores criados aqui ganham:
 *   - role: CONTRIBUIDOR
 *   - companyId: mesma da DPO logada
 *   - invitedById: id do DPO que criou
 *   - isActive: true
 *   - senha temporária gerada e devolvida UMA VEZ pra cópia manual
 *     (Opção A — sem email automático)
 */

function generateTempPassword(): string {
  const hex = Math.random().toString(16).slice(2, 10);
  const digits = Math.floor(Math.random() * 9000 + 1000).toString();
  return hex.toUpperCase() + digits;
}

async function getCurrentDPO() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: "Não autenticado", status: 401 };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user?.companyId) {
    return { error: "Empresa não encontrada", status: 404 };
  }
  if (!isDPO(user.role)) {
    return { error: "Apenas DPOs podem acessar contribuidores", status: 403 };
  }
  return { user };
}

export async function GET() {
  const guard = await getCurrentDPO();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const { user } = guard;

  const contribuidores = await prisma.user.findMany({
    where: {
      companyId: user.companyId,
      role: { in: [ROLES.CONTRIBUIDOR, ROLES.USER_LEGACY] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      setor: true,
      isActive: true,
      createdAt: true,
      invitedBy: { select: { name: true, email: true } },
      _count: {
        select: { createdInventories: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ contribuidores });
}

export async function POST(request: NextRequest) {
  const guard = await getCurrentDPO();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const { user } = guard;

  if (!canManageContributors(user.role)) {
    return NextResponse.json(
      {
        error:
          "Apenas DPO Principal ou Substituto podem criar contribuidores",
      },
      { status: 403 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { name, email, setor } = body ?? {};
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "Nome e email são obrigatórios" },
      { status: 400 }
    );
  }

  // Email único?
  const existing = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe um usuário com este email" },
      { status: 409 }
    );
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const created = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: passwordHash,
      role: ROLES.CONTRIBUIDOR,
      isActive: true,
      companyId: user.companyId,
      invitedById: user.id,
      setor: setor?.trim() || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      setor: true,
    },
  });

  return NextResponse.json(
    {
      contribuidor: created,
      // Senha em claro só sai na resposta de criação. UI mostra UMA VEZ.
      tempPassword,
    },
    { status: 201 }
  );
}
