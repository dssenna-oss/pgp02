// POST /api/perfil/extrair — lê o site oficial e devolve SUGESTÕES pros
// campos do perfil. Não grava nada: quem salva é o gestor no form.

import { NextRequest, NextResponse } from "next/server";
import { requireInstituicao } from "@/lib/auth-server";
import { extrairPerfilDoSite } from "@/lib/extrair-perfil";

export const dynamic = "force-dynamic";
// map + até 4 scrapes em paralelo + Gemini; 60 mantém o teto compatível com
// qualquer plano da Vercel (mesma regra do ZIP).
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await requireInstituicao();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url) return NextResponse.json({ error: "Informe a URL do site." }, { status: 400 });

  const resultado = await extrairPerfilDoSite(url);
  return NextResponse.json(resultado);
}
