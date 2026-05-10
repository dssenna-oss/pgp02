/**
 * POST /api/avisos-privacidade/[id]/sync-from-inventory
 *
 * Re-gera o `currentContent` a partir do Inventário atual mantendo as
 * mesmas `includedSections` + `additionalNotes` que o DPO já escolheu.
 * Atualiza `lastSyncedFromInventoryAt = NOW()`. Status fica como está
 * (RASCUNHO ou PUBLICADO — sem auto-republicar; DPO clica em "Publicar
 * nova versão" quando quiser propagar pra URL pública).
 *
 * Auth: DPO-only.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import { buildAvisoForCreate } from "@/lib/aviso-privacidade-builder";
import type { IncludedSections } from "@/lib/aviso-privacidade-sections";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, companyId: true },
  });
  if (!user?.companyId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }
  if (!isDPO(user.role)) {
    return NextResponse.json({ error: "Apenas DPO" }, { status: 403 });
  }

  const notice = await prisma.servicePrivacyNotice.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      dataInventory: true,
    },
  });
  if (!notice || notice.companyId !== user.companyId) {
    return NextResponse.json({ error: "Aviso não encontrado" }, { status: 404 });
  }

  const built = buildAvisoForCreate({
    company: {
      companyName: notice.company.companyName,
      cnpj: notice.company.cnpj,
      dpoName: notice.company.dpoName,
      dpoEmail: notice.company.dpoEmail,
      dpoPhone: notice.company.dpoPhone,
    },
    inventory: {
      serviceName: notice.dataInventory.serviceName,
      purpose: notice.dataInventory.purpose,
      legalBasis: notice.dataInventory.legalBasis,
      legalBasisSensitive: notice.dataInventory.legalBasisSensitive,
      previsaoLegal: notice.dataInventory.previsaoLegal,
      personalData: notice.dataInventory.personalData,
      sharing: notice.dataInventory.sharing,
      retention: notice.dataInventory.retention,
      security: notice.dataInventory.security,
      dataSubjects: notice.dataInventory.dataSubjects,
      storage: notice.dataInventory.storage,
      formAnswers: notice.dataInventory.formAnswers,
    },
    includedSections: notice.includedSections as IncludedSections,
    additionalNotes: notice.additionalNotes,
  });

  const updated = await prisma.servicePrivacyNotice.update({
    where: { id: notice.id },
    data: {
      currentContent: built.currentContent,
      includedSections: built.includedSections as any,
      lastSyncedFromInventoryAt: built.lastSyncedFromInventoryAt,
    },
    select: {
      id: true,
      currentContent: true,
      includedSections: true,
      lastSyncedFromInventoryAt: true,
    },
  });

  return NextResponse.json({ notice: updated });
}
