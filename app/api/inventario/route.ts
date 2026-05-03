import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUserHasCompany } from "@/lib/ensure-company";
import { inventoryAccessFilter, isDPO, INVENTORY_STATUS } from "@/lib/auth-helpers";

// GET - Listar inventários conforme papel do usuário.
// DPO (qualquer nível) → todos da organização.
// Contribuidor → apenas os que ele mesmo criou.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await ensureUserHasCompany(session.user.email);

    const filter = inventoryAccessFilter({
      id: user.id,
      companyId: user.companyId,
      role: user.role,
    });
    if (!filter) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const inventarios = await prisma.dataInventory.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, setor: true },
        },
        // Necessário pro card mostrar contagem de riscos identificados.
        // Selecionamos só `riskCode` (não o registro inteiro) — leve.
        processRisks: {
          select: { riskCode: true },
        },
      },
    });

    // Contagem de tarefas pessoais do user atual vinculadas a cada
    // processo. Não vaza tarefas de outros users (cada um vê só as suas).
    const taskGroups = await prisma.task.groupBy({
      by: ["dataInventoryId"],
      where: {
        userId: user.id,
        dataInventoryId: { not: null },
        status: { not: "CONCLUIDA" },
      },
      _count: { _all: true },
    });
    const taskCountByProcess = new Map<string, number>();
    for (const g of taskGroups) {
      if (g.dataInventoryId) {
        taskCountByProcess.set(g.dataInventoryId, g._count._all);
      }
    }
    const enriched = inventarios.map((inv) => ({
      ...inv,
      myOpenTasksCount: taskCountByProcess.get(inv.id) ?? 0,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Erro ao buscar inventários:", error);
    return NextResponse.json(
      { error: "Erro ao buscar inventários" },
      { status: 500 }
    );
  }
}

// POST - Criar novo inventário. Marca o criador (createdById) e, se o user
// tem `setor`, copia pro registro pra facilitar filtros depois.
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
    // Usamos placeholders enquanto não derivamos do formAnswers.
    const placeholder = isDraft ? "[Em preenchimento]" : "";

    // Busca dados extras do usuário (setor) — não vem no session por default
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, setor: true },
    });

    // Status inicial:
    //   - isDraft=true → RASCUNHO
    //   - isDraft=false (concluindo direto) →
    //       APROVADO se o user é DPO (atalho — não precisa se auto-aprovar)
    //       SUBMETIDO se o user é Contribuidor (precisa revisão do DPO)
    const finalStatus = isDraft
      ? INVENTORY_STATUS.RASCUNHO
      : isDPO(user.role)
        ? INVENTORY_STATUS.APROVADO
        : INVENTORY_STATUS.SUBMETIDO;

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
        createdById: user.id,
        setor: fullUser?.setor ?? null,
        status: finalStatus,
      },
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
