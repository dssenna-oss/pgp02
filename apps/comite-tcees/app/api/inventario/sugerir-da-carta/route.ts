import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { suggestServicesFromUrl, annotateAlreadyMapped } from "@/lib/sugestao-carta";

// Scrape (Firecrawl) + classificação (Gemini) podem levar ~30-40s.
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let url = "";
  try {
    const body = await req.json();
    url = String(body?.url ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }
  if (!url) return NextResponse.json({ error: "Informe a URL da Carta de Serviços." }, { status: 400 });

  const result = await suggestServicesFromUrl(url);

  // Marca quais já estão no Inventário (dedup por nome).
  const existentes = await prisma.dataInventory.findMany({
    select: { id: true, nome: true, updatedAt: true },
  });
  const anotados = annotateAlreadyMapped(
    result.services,
    existentes.map((e) => ({ id: e.id, name: e.nome, updatedAt: e.updatedAt.toISOString() })),
  );

  return NextResponse.json({ ...result, services: anotados });
}
