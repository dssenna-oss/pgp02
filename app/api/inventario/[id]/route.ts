
import { NextRequest, NextResponse } from "next/server";
import { ensureUserHasCompany } from "@/lib/ensure-company";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Buscar inventário específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const inventario = await prisma.dataInventory.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId
      }
    });

    if (!inventario) {
      return NextResponse.json({ error: "Inventário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(inventario);
  } catch (error) {
    console.error("Erro ao buscar inventário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar inventário" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar inventário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const data = await request.json();

    const inventario = await prisma.dataInventory.updateMany({
      where: {
        id: params.id,
        companyId: user.companyId
      },
      data: {
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

    if (inventario.count === 0) {
      return NextResponse.json({ error: "Inventário não encontrado" }, { status: 404 });
    }

    const updated = await prisma.dataInventory.findUnique({
      where: { id: params.id }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar inventário:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar inventário" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir inventário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const deleted = await prisma.dataInventory.deleteMany({
      where: {
        id: params.id,
        companyId: user.companyId
      }
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Inventário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Inventário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir inventário:", error);
    return NextResponse.json(
      { error: "Erro ao excluir inventário" },
      { status: 500 }
    );
  }
}
