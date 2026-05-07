import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasSuperAdminAccess, ROLES } from "@/lib/auth-helpers";

/**
 * Super admin endpoint — gerencia organizações.
 *
 * Acesso restrito ao email definido em SUPER_ADMIN_EMAIL (env). Qualquer
 * outro user logado recebe 403, mesmo sendo DPO Principal.
 *
 * GET  → lista todas as orgs com DPO principal e contagem de usuários/inv.
 * POST → cria org + DPO principal numa transação. Senha temporária é
 *        gerada e devolvida na resposta (mostrada UMA VEZ no UI).
 */

function generateTempPassword(): string {
  // 12 chars: 8 hex + 4 dígitos. Sem caracteres ambíguos.
  const hex = Math.random().toString(16).slice(2, 10);
  const digits = Math.floor(Math.random() * 9000 + 1000).toString();
  return hex.toUpperCase() + digits;
}

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: "Não autenticado", status: 401 };
  }
  if (!hasSuperAdminAccess(session.user as any)) {
    return { error: "Acesso restrito ao super admin", status: 403 };
  }
  return { session };
}

export async function GET() {
  const guard = await requireSuperAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const orgs = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: {
        where: {
          role: { in: [ROLES.DPO_PRINCIPAL, ROLES.ADMIN_LEGACY] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
      _count: {
        select: {
          users: true,
          dataInventories: true,
        },
      },
    },
  });

  return NextResponse.json({ orgs });
}

export async function POST(request: NextRequest) {
  const guard = await requireSuperAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { companyName, dpoName, dpoEmail } = body ?? {};
  if (!companyName?.trim() || !dpoName?.trim() || !dpoEmail?.trim()) {
    return NextResponse.json(
      { error: "companyName, dpoName e dpoEmail são obrigatórios" },
      { status: 400 }
    );
  }

  // Email único?
  const existing = await prisma.user.findUnique({
    where: { email: dpoEmail.trim().toLowerCase() },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe um usuário com este email" },
      { status: 409 }
    );
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  // Cria Company + User (DPO Principal) em transação atômica
  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        companyName: companyName.trim(),
        dpoName: dpoName.trim(),
        dpoEmail: dpoEmail.trim().toLowerCase(),
      },
    });
    const user = await tx.user.create({
      data: {
        name: dpoName.trim(),
        email: dpoEmail.trim().toLowerCase(),
        password: passwordHash,
        role: ROLES.DPO_PRINCIPAL,
        isActive: true,
        companyId: company.id,
      },
    });
    return { company, user };
  });

  return NextResponse.json(
    {
      org: result.company,
      dpo: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      // ATENÇÃO: senha em claro só é devolvida no momento da criação.
      // O frontend mostra UMA VEZ e instrui o super admin a copiar.
      tempPassword,
    },
    { status: 201 }
  );
}
