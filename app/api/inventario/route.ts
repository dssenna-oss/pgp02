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

    const isDraft = data.isDraft ?? false;
    // Drafts (do wizard) podem ainda não ter os campos resumo preenchidos.
    // Usamos placeholders enquanto não derivamos do formAnswers (checkpoint 7).
    const placeholder = isDraft ? "[Em preenchimento]" : "";

    const inventario = await prisma.dataInventory.create({
      data: {
        companyId: user.companyId,
        serviceName: data.serviceName ?? placeholder,
        dataCategory: data.dataCategory ?? placeholder,
        personalData: data.personalData ?? placeholder,
        legalBasis: data.legalBasis ?? placeholder,
        purpose: data.purpose ?? placeholder,
        dataSubjects: data.dataSubjects ?? placeholder,
        retention: data.retention ?? placeholder,
        storage: data.storage ?? placeholder,
        sharing: data.sharing ?? "",
        security: data.security ?? placeholder,
        formAnswers: data.formAnswers ?? undefined,
        isDraft,
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
