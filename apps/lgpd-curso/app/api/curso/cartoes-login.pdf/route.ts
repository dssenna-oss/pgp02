// GET /api/curso/cartoes-login.pdf?turmaId=...
// Retorna HTML print-ready (A4) — usuário usa Ctrl+P pra salvar como PDF.
// Salva também em E:\_________PGP\Jogo Vegas Modalidade A - Eletronico\ via copy/paste manual do user.
// V1 — HTML simples, sem dependência de pdf lib server-side.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { papeisPorOrgao } from "@/lib/seeds/processos-vegas";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return new NextResponse(e.message, { status: 403 });
  }

  const turmaId = req.nextUrl.searchParams.get("turmaId");
  if (!turmaId) return new NextResponse("turmaId obrigatório", { status: 400 });

  const turma = await prisma.cursoTurma.findUnique({
    where: { id: turmaId },
    include: {
      grupos: {
        orderBy: { numero: "asc" },
        include: {
          company: { include: { users: { orderBy: { papel: "asc" } } } },
        },
      },
    },
  });
  if (!turma) return new NextResponse("Turma não encontrada", { status: 404 });

  const senhaPadrao = "Curso2026!";
  const url = process.env.NEXTAUTH_URL || "http://localhost:3100";

  const corPorPapel: Record<string, string> = {
    DPO: "#7C3AED",
    SAUDE: "#10B981",
    RH: "#F59E0B",
    TI: "#3B82F6",
    COMUNICACAO: "#EC4899",
    CERIMONIAL: "#F59E0B",
    OUVIDORIA: "#10B981",
    PROCURADORIA: "#EC4899",
  };

  const cards: string[] = [];
  for (const grupo of turma.grupos) {
    const orgao = grupo.orgao === "PM" ? "Prefeitura" : "Câmara";
    const papeisDef = papeisPorOrgao(grupo.orgao as "PM" | "CM");

    for (const p of papeisDef) {
      const user = grupo.company.users.find((u) => u.papel === p.papel);
      if (!user) continue;
      const cor = corPorPapel[p.papel] || "#6B7280";
      cards.push(`
        <div class="card">
          <div class="card-header" style="background:${cor}">
            <div class="card-papel">${p.nomeAmigavel}</div>
            <div class="card-grupo">Grupo ${grupo.numero} · ${orgao} de ${turma.cidade}</div>
          </div>
          <div class="card-body">
            <div class="card-row">
              <div class="card-label">Login</div>
              <div class="card-value mono">${user.email}</div>
            </div>
            <div class="card-row">
              <div class="card-label">Senha</div>
              <div class="card-value mono">${senhaPadrao}</div>
            </div>
            <div class="card-row">
              <div class="card-label">Acesso</div>
              <div class="card-value mono">${url}/login</div>
            </div>
            <div class="card-responsabilidade">
              <strong>Sua responsabilidade no jogo:</strong><br>
              ${p.responsabilidade}
            </div>
          </div>
        </div>
      `);
    }
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Cartões de Login — Turma ${turma.nome}</title>
<style>
  @page {
    size: A4;
    margin: 10mm;
  }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 0; background: #fff; color: #111; }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6mm;
  }
  .card {
    border: 2px dashed #999;
    border-radius: 6px;
    overflow: hidden;
    page-break-inside: avoid;
    background: #fff;
    min-height: 65mm;
  }
  .card-header {
    color: #fff;
    padding: 4mm 5mm;
  }
  .card-papel { font-size: 14pt; font-weight: 700; }
  .card-grupo { font-size: 9pt; opacity: 0.95; margin-top: 1mm; }
  .card-body { padding: 4mm 5mm; }
  .card-row { display: flex; gap: 4mm; margin-bottom: 2mm; align-items: baseline; }
  .card-label { font-size: 8pt; color: #666; font-weight: 600; min-width: 14mm; text-transform: uppercase; }
  .card-value { font-size: 10pt; color: #111; }
  .mono { font-family: "Courier New", monospace; }
  .card-responsabilidade { font-size: 8pt; color: #444; margin-top: 4mm; padding-top: 3mm; border-top: 1px solid #eee; line-height: 1.4; }
  .header-pagina { padding: 4mm 0; border-bottom: 2px solid #FBBF24; margin-bottom: 4mm; }
  .header-pagina h1 { font-size: 12pt; margin: 0; }
  .header-pagina .sub { font-size: 9pt; color: #666; margin-top: 1mm; }
  .footer-info { margin-top: 6mm; padding-top: 4mm; border-top: 1px dashed #ccc; font-size: 8pt; color: #666; }
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
  <div class="header-pagina">
    <h1>Cartões de Login · Turma "${turma.nome}"</h1>
    <div class="sub">${turma.cidade} · ${turma.grupos.length} grupos · ${cards.length} cartões · Senha padrão: <span class="mono">${senhaPadrao}</span></div>
  </div>
  <div class="grid">${cards.join("")}</div>
  <div class="footer-info">
    Instruções: recorte na linha tracejada e distribua 1 cartão por participante.
    Cada participante usa o login durante toda a aula prática (~3h).
    Em caso de dúvida, procure o facilitador. <br>
    <em>PGP Treinamento · ${url}</em>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
