"use server";

// Server actions da Carta para a Alta Gestão (Fase Preliminar).

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { ensureColunasFasePreliminar } from "@/lib/coluna-fase-preliminar";
import {
  gerarCartaAutoPreenchida,
  type CartaAltaGestaoData,
  type CartaAltaGestaoSalva,
  type ContextoCarta,
} from "@/lib/carta-alta-gestao";
import { revalidatePath } from "next/cache";

async function requireCompany() {
  const session = await getSession();
  const companyId = session?.user?.companyId;
  if (!companyId) throw new Error("Sem empresa associada");
  return { companyId };
}

async function lerCompanyComContexto() {
  const { companyId } = await requireCompany();
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      name: true,
      cidade: true,
      orgao: true,
      dpoName: true,
      cartaAltaGestao: true,
    },
  });
  if (!company) throw new Error("Empresa não encontrada");
  return { companyId, company };
}

// Variante tolerante a ADMIN sem company — retorna context fictício pra
// renderizar template-padrão. Banner de preview avisa que é visualização.
async function lerCompanyOuPlaceholder() {
  const session = await getSession();
  const companyId = session?.user?.companyId;
  if (!companyId) {
    return {
      companyId: null as string | null,
      company: {
        name: "(modo facilitador — sem grupo)",
        cidade: "Vegas",
        orgao: "PM" as string | null,
        dpoName: null as string | null,
        cartaAltaGestao: null as any,
      },
    };
  }
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      name: true,
      cidade: true,
      orgao: true,
      dpoName: true,
      cartaAltaGestao: true,
    },
  });
  if (!company) return { companyId, company: { name: "(?)", cidade: "Vegas", orgao: "PM" as string | null, dpoName: null, cartaAltaGestao: null as any } };
  return { companyId, company };
}

function contextoDe(c: { name: string; cidade: string | null; orgao: string | null; dpoName: string | null }): ContextoCarta {
  return {
    orgao: (c.orgao === "CM" ? "CM" : "PM"),
    cidade: c.cidade || "Vegas",
    nomeOrgao: c.name,
    dpoName: c.dpoName,
  };
}

// Lê o estado atual da carta. Se nunca foi salva, retorna null (não auto-preenche
// silenciosamente — preenchimento é decisão do user, via botão Auto-preencher).
// ADMIN sem companyId vê template padrão + salva=null (banner de preview avisa).
export async function getCarta(): Promise<{
  salva: CartaAltaGestaoSalva | null;
  templateSugerido: CartaAltaGestaoData;
}> {
  await ensureColunasFasePreliminar();
  const { company } = await lerCompanyOuPlaceholder();
  const ctx = contextoDe(company);
  return {
    salva: (company.cartaAltaGestao as CartaAltaGestaoSalva | null) ?? null,
    templateSugerido: gerarCartaAutoPreenchida(ctx),
  };
}

// Persiste rascunho ou finaliza. `finalizar=true` marca a carta como pronta.
export async function salvarCarta(
  data: CartaAltaGestaoData,
  finalizar: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await ensureColunasFasePreliminar();
    const { companyId } = await requireCompany();
    const agora = new Date().toISOString();
    const salva: CartaAltaGestaoSalva = {
      ...data,
      finalizadaEm: finalizar ? agora : null,
      atualizadoEm: agora,
    };
    await prisma.company.update({
      where: { id: companyId },
      data: { cartaAltaGestao: salva },
    });
    revalidatePath("/dashboard/fase-preliminar/carta-alta-gestao");
    revalidatePath("/dashboard/fase-preliminar");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erro ao salvar" };
  }
}
