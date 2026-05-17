// GET /api/curso/certificado?grupoId=X
// HTML print-ready (A4 paisagem) com selo "Município LGPD-Friendly" + score do grupo.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { calcularMaturidade, nivelMaturidade, KpisGrupo } from "@/lib/maturidade";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return new NextResponse(e.message, { status: 403 });
  }

  const grupoId = req.nextUrl.searchParams.get("grupoId");
  if (!grupoId) return new NextResponse("grupoId obrigatório", { status: 400 });

  const grupo = await prisma.cursoGrupo.findUnique({
    where: { id: grupoId },
    include: {
      turma: true,
      company: {
        include: {
          users: { select: { name: true, papel: true, role: true } },
          inventories: { select: { status: true } },
          risks: { select: { id: true } },
          gapAnswers: { select: { resposta: true } },
          ripds: { select: { status: true } },
          operators: { include: { contracts: { select: { clausulasLgpd: true } } } },
          dsrRequests: { select: { id: true } },
          policies: { where: { slug: "aviso-privacidade" }, select: { status: true, publicSlug: true } },
          incidents: { select: { comunicadoAnpd: true, comunicadoTitular: true } },
        },
      },
    },
  });
  if (!grupo) return new NextResponse("Grupo não encontrado", { status: 404 });

  const c = grupo.company;
  const gapAderentes = c.gapAnswers.filter((g) => g.resposta === "ADERENTE").length;
  const gapParciais = c.gapAnswers.filter((g) => g.resposta === "PARCIAL").length;

  const kpis: KpisGrupo = {
    inventario: {
      total: c.inventories.length,
      aprovados: c.inventories.filter((i) => i.status === "APROVADO").length,
      submetidos: c.inventories.filter((i) => i.status === "SUBMETIDO").length,
      devolvidos: c.inventories.filter((i) => i.status === "DEVOLVIDO").length,
    },
    riscos: {
      total: c.risks.length,
      aprovados: c.risks.filter((r: any) => r.status === "APROVADO").length,
      submetidos: c.risks.filter((r: any) => r.status === "SUBMETIDO").length,
    },
    gap: {
      respondidos: c.gapAnswers.length,
      aderentes: gapAderentes,
      parciais: gapParciais,
      score: c.gapAnswers.length > 0
        ? Math.round(((gapAderentes * 100 + gapParciais * 50) / 1000) * 100)
        : 0,
    },
    ripds: {
      total: c.ripds.length,
      aprovados: c.ripds.filter((r) => r.status === "APROVADO").length,
    },
    terceiros: {
      total: c.operators.length,
      comClausula: c.operators.filter((o) => o.contracts?.[0]?.clausulasLgpd).length,
    },
    dsr: { total: c.dsrRequests.length },
    aviso: {
      status: (c.policies[0]?.status as any) || null,
      publicSlug: c.policies[0]?.publicSlug || null,
    },
    incidentes: {
      total: c.incidents.length,
      comunicadosAnpd: c.incidents.filter((i) => i.comunicadoAnpd).length,
      comunicadosTitular: c.incidents.filter((i) => i.comunicadoTitular).length,
    },
  };

  const score = calcularMaturidade(kpis);
  const nivel = nivelMaturidade(score);

  const orgao = grupo.orgao === "PM" ? "Prefeitura Municipal" : "Câmara Municipal";
  const data = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const participantes = c.users
    .filter((u) => u.role !== "ADMIN")
    .map((u) => u.name.split(" · ")[0])
    .join("  ·  ");

  const corPrincipal = grupo.orgao === "PM" ? "#047857" : "#1D4ED8";
  const corAccent = grupo.orgao === "PM" ? "#10B981" : "#3B82F6";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Certificado · ${c.name}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Georgia", serif; background: #fff; color: #111; }
  .cert {
    width: 297mm; height: 210mm;
    padding: 18mm 22mm;
    background: linear-gradient(135deg, #FFFEF7 0%, #FFFFFF 50%, #FFFEF7 100%);
    position: relative;
    border: 8px double ${corPrincipal};
    page-break-after: avoid;
  }
  .corner {
    position: absolute;
    width: 20mm; height: 20mm;
    border: 3px solid ${corAccent};
  }
  .corner.tl { top: 6mm; left: 6mm; border-right: none; border-bottom: none; }
  .corner.tr { top: 6mm; right: 6mm; border-left: none; border-bottom: none; }
  .corner.bl { bottom: 6mm; left: 6mm; border-right: none; border-top: none; }
  .corner.br { bottom: 6mm; right: 6mm; border-left: none; border-top: none; }
  .header { text-align: center; margin-bottom: 8mm; }
  .selo {
    display: inline-block;
    background: ${corPrincipal}; color: white;
    padding: 4mm 10mm;
    border-radius: 50px;
    font-size: 12pt; font-weight: bold;
    letter-spacing: 2px;
    margin-bottom: 6mm;
  }
  h1 { font-size: 36pt; color: ${corPrincipal}; font-weight: normal; letter-spacing: 1px; margin-bottom: 3mm; }
  h2 { font-size: 16pt; color: #555; font-weight: normal; font-style: italic; }
  .body { text-align: center; padding: 4mm 0; }
  .entrega {
    font-size: 14pt; line-height: 1.7;
    margin: 6mm 0;
  }
  .nome-municipio {
    font-size: 28pt; color: ${corPrincipal}; font-weight: bold;
    margin: 4mm 0;
    border-bottom: 2px solid ${corAccent};
    display: inline-block;
    padding-bottom: 2mm;
  }
  .score-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6mm;
    margin: 8mm 0;
  }
  .score-card {
    border: 1.5px solid ${corAccent};
    padding: 5mm;
    border-radius: 4mm;
    background: white;
  }
  .score-card .label { font-size: 9pt; color: #666; text-transform: uppercase; letter-spacing: 1px; }
  .score-card .value { font-size: 24pt; font-weight: bold; color: ${corPrincipal}; margin-top: 2mm; font-family: sans-serif; }
  .score-card .desc { font-size: 9pt; color: #888; margin-top: 1mm; }
  .participantes {
    font-size: 10pt; color: #666;
    margin-top: 4mm; padding: 4mm 8mm;
    border-top: 1px dashed ${corAccent};
  }
  .footer {
    position: absolute; bottom: 14mm; left: 22mm; right: 22mm;
    display: flex; justify-content: space-between;
    font-size: 9pt; color: #888;
    align-items: end;
  }
  .footer .data { text-align: left; }
  .footer .selo-bottom { text-align: right; font-style: italic; }
  .print-button {
    position: fixed; top: 1rem; right: 1rem;
    background: #2563EB; color: white; border: none; padding: .5rem 1rem;
    font-size: 14px; cursor: pointer; border-radius: 4px;
  }
  @media print { .print-button { display: none; } }
</style>
</head>
<body>
  <button class="print-button" onclick="window.print()">🖨 Imprimir / Salvar PDF</button>
  <div class="cert">
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>

    <div class="header">
      <div class="selo">${nivel.emoji}  SELO MUNICÍPIO LGPD-FRIENDLY  ${nivel.emoji}</div>
      <h1>CERTIFICADO DE PARTICIPAÇÃO</h1>
      <h2>Curso prático de Lei Geral de Proteção de Dados Pessoais</h2>
    </div>

    <div class="body">
      <div class="entrega">
        Certificamos que o grupo
      </div>
      <div class="nome-municipio">${orgao} de ${grupo.turma.cidade} — Grupo ${grupo.numero}</div>
      <div class="entrega">
        concluiu, em ${data}, todas as 6 missões do curso prático de LGPD<br>
        e alcançou o seguinte panorama de maturidade do Programa de Governança em Privacidade:
      </div>

      <div class="score-grid">
        <div class="score-card">
          <div class="label">Maturidade PGP</div>
          <div class="value">${score}/100</div>
          <div class="desc">${nivel.label}</div>
        </div>
        <div class="score-card">
          <div class="label">GAP Analysis</div>
          <div class="value">${kpis.gap.score}%</div>
          <div class="desc">${kpis.gap.respondidos}/10 controles</div>
        </div>
        <div class="score-card">
          <div class="label">Aviso de Privacidade</div>
          <div class="value">${kpis.aviso.status === "PUBLICADO" ? "✓" : "—"}</div>
          <div class="desc">${kpis.aviso.status === "PUBLICADO" ? "publicado" : "não publicado"}</div>
        </div>
      </div>

      <div class="participantes">
        <strong>Participantes:</strong><br>
        ${participantes}
      </div>
    </div>

    <div class="footer">
      <div class="data">
        ${grupo.turma.cidade}, ${data}<br>
        Turma "${grupo.turma.nome}"
      </div>
      <div class="selo-bottom">
        PGP Treinamento · Curso prático de LGPD<br>
        Documento emitido em ambiente de treinamento
      </div>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
