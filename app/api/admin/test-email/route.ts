/**
 * Endpoint admin de teste de envio de email (Brevo).
 *
 * GET /api/admin/test-email?to=email@dominio.com
 *
 * Usa o sender configurado em .env (BREVO_*) e dispara um email
 * de teste pro endereço passado. Retorna { ok, status }.
 *
 * Acesso: DPO-only.
 *
 * Setup 2026-05-10. Pode ser removido depois de validar a integração.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import { sendEmail } from "@/lib/email-sender";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, name: true, email: true },
  });
  if (!isDPO(user?.role)) {
    return NextResponse.json({ error: "Apenas DPO" }, { status: 403 });
  }

  const to = request.nextUrl.searchParams.get("to") ?? user!.email;

  const ok = await sendEmail({
    to: { email: to, name: "Teste PGP" },
    subject: "🧪 Teste de email do Sistema PGP",
    html: `
      <h2 style="color:#3B7FDB;">Funcionou!</h2>
      <p>Este é um email de teste enviado pelo Sistema PGP via Brevo.</p>
      <p>Se você recebeu, a integração está OK e o sender (${process.env.BREVO_SENDER_EMAIL}) está autorizado.</p>
      <p style="font-size:12px;color:#666;">Disparado em ${new Date().toLocaleString("pt-BR")}</p>
    `,
    text: `Funcionou! Email de teste do Sistema PGP via Brevo. Disparado em ${new Date().toLocaleString("pt-BR")}.`,
    tag: "smoke-test",
  });

  return NextResponse.json({
    ok,
    to,
    sender: process.env.BREVO_SENDER_EMAIL,
    senderName: process.env.BREVO_SENDER_NAME,
  });
}
