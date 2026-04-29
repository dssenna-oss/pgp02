import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUserHasCompany } from "@/lib/ensure-company";

// GET - Listar todos os inventários da empresa do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar usuário e empresa (cria empresa padrão se necessário)
    const user = await ensureUserHasCompany(session.user.email);

    // Buscar inventários da empresa
    const inventarios = await prisma.dataInventory.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(inventarios);
  } catch (error) {
    console.error("Erro ao buscar inventários:", error);
    return NextResponse.json(
      { error: "Erro ao buscar inventários" },
      { status: 500 }
    );
  }
}

// POST - Criar novo inventário
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await ensureUserHasCompany(session.user.email);

    const data = await request.json();

    const inventario = await prisma.dataInventory.create({
      data: {
        companyId: user.companyId,
        serviceName: data.serviceName,
        dataCategory: data.dataCategory,
        personalData: data.personalData,
        legalBasis: data.legalBasis,
        purpose: data.purpose,
        dataSubjects: data.dataSubjects,
        retention: data.retention,
        storage: data.storage,
        sharing: data.sharing || "",
        security: data.security
      }
    });

    return NextResponse.json(inventario, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar inventário:", error);
    return NextResponse.json(
      { error: "Erro ao criar inventário" },
      { status: 500 }
    );
  }
}
