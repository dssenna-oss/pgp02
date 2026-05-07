export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadPolicyAuth, policyToDTO } from "@/lib/policies-helpers";
import {
  applyOrgProfile,
  getOrgProfile,
  type OrgProfileKey,
} from "@/lib/policy-org-profiles";

const VALID_KEYS: readonly OrgProfileKey[] = [
  "prefeitura",
  "camara",
  "tcontas",
  "autarquia",
  "federal",
];

/**
 * POST /api/politicas/[id]/apply-org-profile
 * Body: { profileKey: "prefeitura" | "camara" | "tcontas" | "autarquia" | "federal" }
 *
 * Substitui os marcadores `[...]` do template (Política Interna, Aviso
 * Externo, Termo de Uso, Cookies) pelos textos institucionais do
 * perfil escolhido. Idempotente — pode rodar com perfis diferentes
 * sequencialmente que cada um só substitui marcadores ainda não
 * resolvidos.
 *
 * Não persiste o profileKey — é aplicação one-shot. DPO pode editar
 * manualmente depois sem ser sobrescrito.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const r = await loadPolicyAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  if (!user.isDPO) {
    return NextResponse.json(
      { error: "Apenas DPO pode aplicar perfil de órgão" },
      { status: 403 },
    );
  }
  const { id } = await params;

  let body: { profileKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const key = body.profileKey;
  if (!key || !VALID_KEYS.includes(key as OrgProfileKey)) {
    return NextResponse.json(
      {
        error: `profileKey inválido. Use um de: ${VALID_KEYS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const profile = getOrgProfile(key as OrgProfileKey);
  if (!profile) {
    return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
  }

  const [policy, company] = await Promise.all([
    prisma.policy.findFirst({
      where: { id, companyId: user.companyId },
    }),
    prisma.company.findUnique({
      where: { id: user.companyId },
      select: { id: true, slug: true, companyName: true },
    }),
  ]);

  if (!policy) {
    return NextResponse.json(
      { error: "Política não encontrada" },
      { status: 404 },
    );
  }

  const { content: newContent, replacementsCount } = applyOrgProfile(
    policy.currentContent,
    profile,
  );

  if (replacementsCount === 0) {
    return NextResponse.json(
      {
        error:
          "Nenhum marcador `[...]` deste perfil foi encontrado no conteúdo. Talvez você já aplicou o perfil ou já editou os trechos manualmente.",
      },
      { status: 400 },
    );
  }

  const updated = await prisma.policy.update({
    where: { id: policy.id },
    data: {
      currentContent: newContent,
    },
    include: {
      publishedBy: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { versions: true } },
    },
  });

  return NextResponse.json({
    policy: policyToDTO(updated as any, company?.slug ?? null),
    profile: { key: profile.key, label: profile.label },
    replacementsCount,
  });
}
