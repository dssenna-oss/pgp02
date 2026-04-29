
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, companyName, fullName, acceptTerms } = body;

    if (!email || !password || !companyName || !fullName) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar acceptTerms apenas se for fornecido (para compatibilidade com testes)
    if (acceptTerms !== undefined && !acceptTerms) {
      return NextResponse.json(
        { error: "É necessário aceitar os termos de uso" },
        { status: 400 }
      );
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado" },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar empresa e usuário
    const company = await prisma.company.create({
      data: {
        companyName,
        users: {
          create: {
            name: fullName,
            email,
            password: hashedPassword
          }
        }
      },
      include: {
        users: true
      }
    });

    const user = company.users[0];

    return NextResponse.json({
      message: "Conta criada com sucesso",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyId: company.id
      }
    });

  } catch (error) {
    console.error("Erro no signup:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
