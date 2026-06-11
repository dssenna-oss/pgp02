// GET /api/curso/caderno/docx?grupoId=X&modo=completo|executivo|cartilha
//
// Gera 1 dos 3 documentos institucionais do curso:
//
//   completo  — Caderno do Curso (~60-80pg) pro DPO do grupo. Inclui dados
//               reais ou modelo amarelo quando vazio. Exige grupoId. Admin-only.
//   executivo — Relatório Executivo (~12pg) pra Alta Gestão do grupo. Score +
//               métricas + recomendações estratégicas. Exige grupoId. Admin-only.
//   cartilha  — Cartilha do PGP (~100-150pg) — guia genérico de implementação
//               da LGPD pra qualquer Instituição Pública. NÃO depende de
//               grupoId. Aberto a qualquer autenticado (facilitador OU
//               participante). Opcionais: ?instituicao=X&tipo=PM|CM|AUTARQUIA|
//               TRIBUNAL|OUTRO pra personalizar capa.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/auth-server";
import { ensureTabelaTermometro } from "@/lib/colunas-termometro";
import { Document, Packer } from "docx";
import {
  gerarCadernoCompleto,
  gerarCadernoExecutivo,
  gerarCartilhaInstitucional,
  type GrupoCadernoData,
  type CartilhaOpts,
} from "@/lib/caderno-curso";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // DOCX grandes (Cartilha) podem demorar ~15-25s

export async function GET(req: NextRequest) {
  const modoParam = req.nextUrl.searchParams.get("modo");
  const modo: "completo" | "executivo" | "cartilha" =
    modoParam === "executivo" ? "executivo"
    : modoParam === "cartilha" ? "cartilha"
    : "completo";

  // Cartilha tem auth menos restritivo (qualquer autenticado) — facilitador e
  // participantes podem baixar pra levar pra Instituição. Outros modos são
  // admin-only.
  try {
    if (modo === "cartilha") {
      await requireSession();
    } else {
      await requireAdmin();
    }
  } catch (e: any) {
    return new NextResponse(e.message, { status: 403 });
  }

  // ─── MODO CARTILHA ──────────────────────────────────────────────────────
  if (modo === "cartilha") {
    const instituicao = req.nextUrl.searchParams.get("instituicao") || undefined;
    const tipoRaw = req.nextUrl.searchParams.get("tipo");
    const tipo: CartilhaOpts["tipoOrgao"] =
      tipoRaw === "PM" || tipoRaw === "CM" || tipoRaw === "AUTARQUIA" ||
      tipoRaw === "TRIBUNAL" || tipoRaw === "OUTRO"
        ? (tipoRaw as CartilhaOpts["tipoOrgao"])
        : undefined;

    const opts: CartilhaOpts = {
      nomeInstituicao: instituicao,
      tipoOrgao: tipo,
    };
    const children = gerarCartilhaInstitucional(opts);

    const doc = new Document({
      creator: "PGP Treinamento — Curso prático de LGPD",
      title: instituicao
        ? `Cartilha do PGP — ${instituicao}`
        : "Cartilha do PGP — Guia de Implementação da LGPD em Instituições Públicas",
      description: "Cartilha institucional do Programa de Governança em Privacidade — guia genérico para implementação da LGPD em Instituições Públicas brasileiras.",
      styles: {
        default: {
          document: { run: { font: "Calibri", size: 22 } },
          heading1: {
            run: { font: "Calibri", size: 38, bold: true, color: "5B21B6" },
            paragraph: { spacing: { before: 480, after: 240 } },
          },
          heading2: {
            run: { font: "Calibri", size: 28, bold: true, color: "7C3AED" },
            paragraph: { spacing: { before: 320, after: 160 } },
          },
          heading3: {
            run: { font: "Calibri", size: 24, bold: true, color: "1E1B4B" },
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
    const slugInst = instituicao
      ? instituicao.replace(/[^a-zA-Z0-9]+/g, "_")
      : "Generica";
    const nomeArquivo = `Cartilha_PGP_${slugInst}.docx`;
    return new NextResponse(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      },
    });
  }

  // ─── MODOS COMPLETO / EXECUTIVO (exigem grupoId) ────────────────────────
  const grupoId = req.nextUrl.searchParams.get("grupoId");
  if (!grupoId) {
    return NextResponse.json({ error: "grupoId obrigatório" }, { status: 400 });
  }

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

  // Termômetros INDIVIDUAIS dos membros do grupo (cada um avaliou o PRÓPRIO
  // órgão real). A tabela pode não existir em turma muito antiga → catch
  // graceful (cai no fallback de modelo no caderno).
  await ensureTabelaTermometro();
  const termometros = await prisma.termometroResposta
    .findMany({
      where: { companyId: grupo.companyId },
      select: { userId: true, momento: true, score: true, scorePessoal: true },
    })
    .catch(() => [] as { userId: string; momento: string; score: number; scorePessoal: number }[]);

  const data: GrupoCadernoData = { grupo: grupo as any, termometros };
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
