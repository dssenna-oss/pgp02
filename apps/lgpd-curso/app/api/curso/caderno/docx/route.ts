// GET /api/curso/caderno/docx?grupoId=X&modo=completo|executivo
//
// Gera o Caderno do Curso — DOCX consolidado entregue ao grupo no fim do
// curso. Compila: conteúdo institucional das 8 etapas do PGP + dados reais
// produzidos pelo grupo + recomendações de próximos passos.
//
// Modos:
//   completo  — kit institucional pessoal do DPO (~60-80 páginas). Onde não
//               há dado real, usa modelo defensável marcado com selo amarelo.
//   executivo — Relatório Executivo pra Alta Gestão/chefia (~12 páginas).
//               Foco em status + métricas + recomendações estratégicas.
//
// Admin-only — apenas facilitador baixa pelo Painel do Facilitador.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { Document, Packer } from "docx";
import {
  gerarCadernoCompleto,
  gerarCadernoExecutivo,
  type GrupoCadernoData,
} from "@/lib/caderno-curso";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Vercel Pro: DOCX consolidado pode demorar ~10-15s

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return new NextResponse(e.message, { status: 403 });
  }

  const grupoId = req.nextUrl.searchParams.get("grupoId");
  if (!grupoId) {
    return NextResponse.json({ error: "grupoId obrigatório" }, { status: 400 });
  }
  const modoParam = req.nextUrl.searchParams.get("modo");
  const modo: "completo" | "executivo" = modoParam === "executivo" ? "executivo" : "completo";

  const grupo = await prisma.cursoGrupo.findUnique({
    where: { id: grupoId },
    include: {
      turma: { select: { nome: true, cidade: true } },
      company: {
        include: {
          users: { select: { name: true, papel: true, role: true } },
          inventories: true,
          risks: { include: { inventory: { select: { nome: true } } } },
          gapAnswers: true,
          actions: true,
          ripds: { include: { sections: true } },
          operators: { include: { contracts: true } },
          dsrRequests: true,
          policies: true,
          incidents: true,
          priMembros: true,
          priRaci: true,
        },
      },
    },
  });

  if (!grupo) {
    return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });
  }

  // Monta a estrutura do DOCX
  const data: GrupoCadernoData = { grupo: grupo as any };
  const children = modo === "executivo" ? gerarCadernoExecutivo(data) : gerarCadernoCompleto(data);

  const c = grupo.company;
  const orgaoNome = grupo.orgao === "PM" ? "Prefeitura Municipal" : "Câmara Municipal";
  const tituloDoc = modo === "executivo"
    ? `Relatório Executivo do PGP — ${c.name}`
    : `Caderno do Curso — ${c.name}`;

  const doc = new Document({
    creator: "PGP Treinamento — Curso prático de LGPD",
    title: tituloDoc,
    description: `${modo === "executivo" ? "Relatório Executivo" : "Caderno consolidado"} do Grupo ${grupo.numero} (${orgaoNome} de ${grupo.turma.cidade}) — turma ${grupo.turma.nome}`,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
        heading1: {
          run: { font: "Calibri", size: 36, bold: true, color: "1E40AF" },
          paragraph: { spacing: { before: 480, after: 240 } },
        },
        heading2: {
          run: { font: "Calibri", size: 28, bold: true, color: "2563EB" },
          paragraph: { spacing: { before: 320, after: 160 } },
        },
        heading3: {
          run: { font: "Calibri", size: 24, bold: true },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { orientation: "portrait" },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const ab = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
  const slugNome = c.name.replace(/[^a-zA-Z0-9]+/g, "_");
  const prefixoArquivo = modo === "executivo" ? "Relatorio_Executivo_PGP" : "Caderno_Curso";
  const nomeArquivo = `${prefixoArquivo}_${slugNome}_Grupo${grupo.numero}.docx`;
  return new NextResponse(ab, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
