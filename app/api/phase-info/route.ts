
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Email do administrador que pode editar e-books globais
const ADMIN_EMAIL = "clubedoservidor@protonmail.com";

// GET - Buscar informações de uma fase específica
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const phase = searchParams.get("phase");
    const section = searchParams.get("section") || "description";

    if (!phase) {
      return NextResponse.json(
        { error: "Fase não especificada" },
        { status: 400 }
      );
    }

    // Buscar informações globais (criadas pelo admin) primeiro
    const globalInfo = await prisma.phaseInfo.findFirst({
      where: {
        phase: phase,
        section: section,
        isGlobal: true,
        companyId: null,
      },
    });

    // Buscar checklist específico da empresa do usuário
    let userChecklistState = null;
    if (session.user.companyId) {
      const companyInfo = await prisma.phaseInfo.findFirst({
        where: {
          phase: phase,
          section: section,
          companyId: session.user.companyId,
          isGlobal: false,
        },
        select: {
          checklistState: true,
        },
      });
      userChecklistState = companyInfo?.checklistState;
    }

    // Combinar informações: e-books globais + checklist do usuário
    return NextResponse.json({
      heyzineEmbedUrl: globalInfo?.heyzineEmbedUrl || null,
      howToProceed: globalInfo?.howToProceed || null,
      checklistHtml: globalInfo?.checklistHtml || null,
      description: globalInfo?.description || null,
      practicalUrls: globalInfo?.practicalUrls || [],
      checklistState: userChecklistState || null,
    });
  } catch (error) {
    console.error("Erro ao buscar informações da fase:", error);
    return NextResponse.json(
      { error: "Erro ao buscar informações da fase" },
      { status: 500 }
    );
  }
}

// POST - Criar ou atualizar informações de uma fase
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { phase, section = "description", heyzineEmbedUrl, howToProceed, checklistHtml, checklistState, description, practicalUrls } = body;

    if (!phase) {
      return NextResponse.json(
        { error: "Fase não especificada" },
        { status: 400 }
      );
    }

    const isAdmin = session.user.email === ADMIN_EMAIL;

    // Se for admin, pode atualizar e-books globais
    if (isAdmin && (heyzineEmbedUrl !== undefined || howToProceed !== undefined || checklistHtml !== undefined || description !== undefined || practicalUrls !== undefined)) {
      // Atualizar ou criar e-book global
      const updateData: any = {};
      if (heyzineEmbedUrl !== undefined) updateData.heyzineEmbedUrl = heyzineEmbedUrl || null;
      if (howToProceed !== undefined) updateData.howToProceed = howToProceed || null;
      if (checklistHtml !== undefined) updateData.checklistHtml = checklistHtml || null;
      if (description !== undefined) updateData.description = description || null;
      if (practicalUrls !== undefined) updateData.practicalUrls = practicalUrls || [];

      // Buscar se já existe um e-book global para esta fase/seção
      const existingGlobal = await prisma.phaseInfo.findFirst({
        where: {
          phase: phase,
          section: section,
          isGlobal: true,
          companyId: null,
        },
      });

      if (existingGlobal) {
        // Atualizar existente
        await prisma.phaseInfo.update({
          where: { id: existingGlobal.id },
          data: updateData,
        });
      } else {
        // Criar novo
        await prisma.phaseInfo.create({
          data: {
            phase: phase,
            section: section,
            isGlobal: true,
            companyId: null,
            heyzineEmbedUrl: heyzineEmbedUrl || null,
            howToProceed: howToProceed || null,
            checklistHtml: checklistHtml || null,
            description: description || null,
            practicalUrls: practicalUrls || [],
          },
        });
      }
    }

    // Qualquer usuário pode salvar seu próprio checklistState
    if (checklistState !== undefined && session.user.companyId) {
      // Buscar se já existe um registro para esta empresa/fase/seção
      const existingCompanyInfo = await prisma.phaseInfo.findFirst({
        where: {
          phase: phase,
          section: section,
          companyId: session.user.companyId,
          isGlobal: false,
        },
      });

      if (existingCompanyInfo) {
        // Atualizar existente
        await prisma.phaseInfo.update({
          where: { id: existingCompanyInfo.id },
          data: { checklistState: checklistState || null },
        });
      } else {
        // Criar novo
        await prisma.phaseInfo.create({
          data: {
            phase: phase,
            section: section,
            companyId: session.user.companyId,
            isGlobal: false,
            checklistState: checklistState || null,
          },
        });
      }
    }

    // Retornar os dados atualizados
    const globalInfo = await prisma.phaseInfo.findFirst({
      where: {
        phase: phase,
        section: section,
        isGlobal: true,
        companyId: null,
      },
    });

    let userChecklistState = null;
    if (session.user.companyId) {
      const companyInfo = await prisma.phaseInfo.findFirst({
        where: {
          phase: phase,
          section: section,
          companyId: session.user.companyId,
          isGlobal: false,
        },
        select: {
          checklistState: true,
        },
      });
      userChecklistState = companyInfo?.checklistState;
    }

    return NextResponse.json({
      heyzineEmbedUrl: globalInfo?.heyzineEmbedUrl || null,
      howToProceed: globalInfo?.howToProceed || null,
      checklistHtml: globalInfo?.checklistHtml || null,
      description: globalInfo?.description || null,
      practicalUrls: globalInfo?.practicalUrls || [],
      checklistState: userChecklistState || null,
      isAdmin,
    });
  } catch (error) {
    console.error("Erro ao salvar informações da fase:", error);
    return NextResponse.json(
      { error: "Erro ao salvar informações da fase" },
      { status: 500 }
    );
  }
}
