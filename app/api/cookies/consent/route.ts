export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

/**
 * Endpoint de Consentimento de Cookies (Checkpoint 26).
 *
 * - POST   → registra consentimento (ou atualiza preferências)
 * - GET    → recupera último consentimento ativo do user logado
 * - DELETE → revoga consentimento (seta `revokedAt`, zera analytics/marketing/preferences)
 *
 * O banner aparece SÓ em páginas públicas, mas o endpoint aceita tanto
 * usuários logados quanto anônimos (deviceFingerprint identifica o
 * browser quando o titular ainda não fez login).
 *
 * IP é anonimizado (zera os últimos 8 bits IPv4 ou últimos 80 bits IPv6)
 * antes de persistir, conforme orientação ANPD/LGPD pra registro de
 * eventos. User agent é preservado pra suporte/auditoria.
 */

interface ConsentBody {
  necessary?: boolean;
  analytics?: boolean;
  marketing?: boolean;
  preferences?: boolean;
}

/** Anonimiza o IP zerando o último octeto (IPv4) ou últimos 80 bits (IPv6). */
function anonymizeIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined;
  const trimmed = ip.split(",")[0].trim();
  if (trimmed.includes(".")) {
    // IPv4 — zera o último octeto
    const parts = trimmed.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  } else if (trimmed.includes(":")) {
    // IPv6 — mantém os primeiros 48 bits (3 grupos de 16 bits)
    const parts = trimmed.split(":");
    if (parts.length >= 3) {
      return `${parts[0]}:${parts[1]}:${parts[2]}::`;
    }
  }
  return trimmed; // formato desconhecido — preserva (raro)
}

export async function POST(request: NextRequest) {
  try {
    const body: ConsentBody = await request.json().catch(() => ({}));
    const { necessary, analytics, marketing, preferences } = body;

    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as
      | { id?: string; email?: string }
      | undefined;
    const userId = sessionUser?.id ?? null;

    const userAgent = request.headers.get("user-agent") ?? undefined;
    const forwardedFor = request.headers.get("x-forwarded-for");
    const rawIp = forwardedFor ?? request.headers.get("x-real-ip") ?? undefined;
    const ipAddress = anonymizeIp(rawIp ?? undefined);

    const cookieStore = await cookies();
    const deviceFingerprint = cookieStore.get("device_fp")?.value ?? undefined;

    const consent = await prisma.cookieConsent.create({
      data: {
        userId: userId ?? undefined,
        deviceFingerprint,
        ipAddress,
        userAgent,
        necessary: true, // Sempre true — não pode ser desativado
        analytics: analytics ?? false,
        marketing: marketing ?? false,
        preferences: preferences ?? false,
        consentMethod: "banner",
        consentVersion: "1.0",
      },
    });

    return NextResponse.json({
      success: true,
      consentId: consent.id,
      message: "Consentimento registrado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao registrar consentimento de cookies:", error);
    return NextResponse.json(
      { error: "Erro ao registrar consentimento" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string } | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 },
      );
    }

    const latestConsent = await prisma.cookieConsent.findFirst({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
    });

    if (!latestConsent) {
      return NextResponse.json({ hasConsent: false });
    }

    return NextResponse.json({
      hasConsent: true,
      preferences: {
        necessary: latestConsent.necessary,
        analytics: latestConsent.analytics,
        marketing: latestConsent.marketing,
        preferences: latestConsent.preferences,
      },
      consentedAt: latestConsent.createdAt,
      revokedAt: latestConsent.revokedAt,
    });
  } catch (error) {
    console.error("Erro ao buscar consentimento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar consentimento" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string } | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 },
      );
    }

    const latestConsent = await prisma.cookieConsent.findFirst({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
    });

    if (latestConsent) {
      await prisma.cookieConsent.update({
        where: { id: latestConsent.id },
        data: {
          revokedAt: new Date(),
          analytics: false,
          marketing: false,
          preferences: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Consentimento revogado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao revogar consentimento:", error);
    return NextResponse.json(
      { error: "Erro ao revogar consentimento" },
      { status: 500 },
    );
  }
}
