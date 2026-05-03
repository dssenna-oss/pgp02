
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "E-mail é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Por segurança, não revelar se o e-mail existe ou não
      return NextResponse.json(
        { message: "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha." },
        { status: 200 }
      );
    }

    // Gerar token único
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no banco de dados
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Enviar e-mail com link de redefinição
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    try {
      // Tentar enviar e-mail com Resend se configurado
      const resendApiKey = process.env.RESEND_API_KEY;
      
      if (resendApiKey) {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "LGPD - PGP <noreply@pgp.com>",
            to: [email],
            subject: "Redefinição de Senha - LGPD - PGP",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Redefinição de Senha</h2>
                <p>Olá,</p>
                <p>Você solicitou a redefinição de senha para sua conta no <strong>LGPD - PGP</strong>.</p>
                <p>Clique no botão abaixo para criar uma nova senha:</p>
                <div style="margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="background-color: #2563eb; color: white; padding: 12px 24px; 
                            text-decoration: none; border-radius: 6px; display: inline-block;">
                    Redefinir Senha
                  </a>
                </div>
                <p>Ou copie e cole este link no seu navegador:</p>
                <p style="color: #666; font-size: 14px; word-break: break-all;">${resetUrl}</p>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  Este link é válido por 1 hora.<br>
                  Se você não solicitou esta redefinição, ignore este e-mail.
                </p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #999; font-size: 12px;">
                  LGPD - PGP - Programa de Governança em Privacidade
                </p>
              </div>
            `,
          }),
        });

        if (!response.ok) {
          console.error("Erro ao enviar e-mail via Resend:", await response.text());
        }
      } else {
        console.log("RESEND_API_KEY não configurada. Link de redefinição:", resetUrl);
      }
    } catch (emailError) {
      console.error("Erro ao enviar e-mail:", emailError);
      // Continuar mesmo se o e-mail falhar
    }

    return NextResponse.json(
      { 
        message: "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.",
        // Em desenvolvimento, incluir o link
        ...(process.env.NODE_ENV === "development" && { resetUrl })
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao processar solicitação:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
