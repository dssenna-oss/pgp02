
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Buscar usuário e companhia
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return NextResponse.json(
        { error: "Usuário não está associado a uma empresa" },
        { status: 400 }
      );
    }

    // Buscar configurações ou criar configurações padrão
    let settings = await prisma.systemSettings.findUnique({
      where: { companyId: user.companyId },
    });

    if (!settings) {
      // Criar configurações padrão se não existirem
      settings = await prisma.systemSettings.create({
        data: {
          companyId: user.companyId,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Buscar usuário e companhia
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return NextResponse.json(
        { error: "Usuário não está associado a uma empresa" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Atualizar ou criar configurações
    const settings = await prisma.systemSettings.upsert({
      where: { companyId: user.companyId },
      update: {
        // Configurações de Email
        smtpServer: body.smtpServer,
        smtpPort: body.smtpPort,
        smtpUser: body.smtpUser,
        smtpPassword: body.smtpPassword,
        // Notificações
        emailNotifications: body.emailNotifications,
        pushNotifications: body.pushNotifications,
        deadlineReminders: body.deadlineReminders,
        incidentAlerts: body.incidentAlerts,
        // Segurança
        twoFactorAuth: body.twoFactorAuth,
        sessionTimeout: body.sessionTimeout,
        sessionTimeoutMinutes: body.sessionTimeoutMinutes,
        // Sistema
        autoBackup: body.autoBackup,
        backupTime: body.backupTime,
        autoDarkMode: body.autoDarkMode,
        language: body.language,
      },
      create: {
        companyId: user.companyId,
        // Configurações de Email
        smtpServer: body.smtpServer,
        smtpPort: body.smtpPort,
        smtpUser: body.smtpUser,
        smtpPassword: body.smtpPassword,
        // Notificações
        emailNotifications: body.emailNotifications,
        pushNotifications: body.pushNotifications,
        deadlineReminders: body.deadlineReminders,
        incidentAlerts: body.incidentAlerts,
        // Segurança
        twoFactorAuth: body.twoFactorAuth,
        sessionTimeout: body.sessionTimeout,
        sessionTimeoutMinutes: body.sessionTimeoutMinutes,
        // Sistema
        autoBackup: body.autoBackup,
        backupTime: body.backupTime,
        autoDarkMode: body.autoDarkMode,
        language: body.language,
      },
    });

    return NextResponse.json({ 
      message: "Configurações salvas com sucesso!",
      settings 
    });
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json(
      { error: "Erro ao salvar configurações" },
      { status: 500 }
    );
  }
}
