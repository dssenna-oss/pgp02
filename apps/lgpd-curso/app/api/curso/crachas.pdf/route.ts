// GET /api/curso/crachas.pdf?turmaId=...
// Retorna HTML print-ready (A4 paisagem) com crachás físicos:
//   - 6 papéis × N grupos = crachás dos participantes ativos (QR code de login)
//   - 10 crachás extras "Consultor/Observador" (ícone 🔍, sem credenciais)
// User usa Ctrl+P pra salvar como PDF.
//
// Layout: A4 paisagem (297×210mm), 3 crachás por linha (90×130mm cada),
// linha pontilhada vertical entre cada crachá pra recorte.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { papeisPorOrgao } from "@/lib/seeds/processos-vegas";

// Emoji + cor de ícone por papel
const PAPEL_VISUAL: Record<string, { emoji: string; corIcone: string }> = {
  DPO:            { emoji: "⚖️", corIcone: "#7C3AED" },
  SAUDE:          { emoji: "🩺", corIcone: "#059669" },
  RH:             { emoji: "💼", corIcone: "#F59E0B" },
  TI:             { emoji: "💻", corIcone: "#3B82F6" },
  COMUNICACAO:    { emoji: "📢", corIcone: "#EC4899" },
  CERIMONIAL:     { emoji: "🏛️", corIcone: "#F59E0B" },
  OUVIDORIA:      { emoji: "📢", corIcone: "#059669" },
  PROCURADORIA:   { emoji: "⚖️", corIcone: "#EC4899" },
  ADMINISTRATIVO: { emoji: "📋", corIcone: "#0EA5E9" },
};

// QR gerado via api.qrserver.com (serviço público, sem precisar de lib local).
function qrUrl(data: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=${size}x${size}&margin=2`;
}

type CrachaData = {
  tipo: "PAPEL" | "OBSERVADOR";
  // PAPEL fields:
  orgao?: "PM" | "CM";
  grupoNumero?: number;
  cidade?: string;
  nomePapel?: string;
  emoji?: string;
  corIcone?: string;
  responsabilidade?: string;
  login?: string;
  loginUrl?: string;
  // OBSERVADOR fields:
  observadorIdx?: number;
  // URL pública /observador/<turmaSlug> — não-autenticada, mostra timeline+status
  // dos grupos pro observador acompanhar do celular durante o curso.
  observadorUrl?: string;
};

function renderCracha(c: CrachaData): string {
  if (c.tipo === "OBSERVADOR") {
    // Observador agora tem QR Code pra acompanhar o painel da turma pelo
    // celular (rota PÚBLICA /observador/<slug>, sem login). 4 atribuições
    // foram condensadas pra abrir espaço pro QR.
    return `
      <div class="cracha">
        <div class="cracha-furo"></div>
        <div class="orgao-observador">
          <div class="orgao-tipo">CONSULTOR · OBSERVADOR</div>
          <div class="orgao-nome">Apoio ao Facilitador</div>
        </div>
        <div class="papel-row">
          <div class="papel-icon" style="background:#475569">🔍</div>
          <div>
            <div class="papel-nome">Observador #${String(c.observadorIdx).padStart(2, "0")}</div>
            <div class="papel-resp">Acompanha sem interferir</div>
          </div>
        </div>
        <div class="cracha-corpo qr-corpo">
          <img src="${qrUrl(c.observadorUrl || "")}" alt="QR" class="qr-img" />
          <div class="qr-label">📷 acompanhe a turma</div>
          <div class="qr-login-obs">painel read-only</div>
        </div>
        <div class="obs-mini-atr">Circule · Observe · Anote · Não interfira</div>
        <div class="nome-bloco">
          <div class="nome-label">NOME</div>
          <div class="nome-linha"></div>
        </div>
        <div class="cracha-footer">LGPD-Friendly · Curso 2026</div>
      </div>`;
  }

  // PAPEL — crachá padrão com QR
  const orgaoNome = c.orgao === "PM" ? "Prefeitura Municipal" : "Câmara Municipal";
  const orgaoClass = c.orgao === "PM" ? "orgao-pm" : "orgao-cm";
  return `
    <div class="cracha">
      <div class="cracha-furo"></div>
      <div class="orgao-banda ${orgaoClass}">
        <div class="orgao-tipo">${orgaoNome}</div>
        <div class="orgao-nome">${c.cidade} · Grupo ${c.grupoNumero}</div>
      </div>
      <div class="papel-row">
        <div class="papel-icon" style="background:${c.corIcone}">${c.emoji}</div>
        <div>
          <div class="papel-nome">${c.nomePapel}</div>
          <div class="papel-resp">${(c.responsabilidade || "").substring(0, 50)}${(c.responsabilidade || "").length > 50 ? "…" : ""}</div>
        </div>
      </div>
      <div class="cracha-corpo qr-corpo">
        <img src="${qrUrl(c.loginUrl || "")}" alt="QR" class="qr-img" />
        <div class="qr-label">📷 escaneie pra abrir o app</div>
        <div class="qr-login">${c.login}</div>
        <div class="qr-senha">senha: informada pelo facilitador</div>
      </div>
      <div class="nome-bloco">
        <div class="nome-label">NOME</div>
        <div class="nome-linha"></div>
      </div>
      <div class="cracha-footer">LGPD-Friendly · Curso 2026</div>
    </div>`;
}

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

  const url = process.env.NEXTAUTH_URL || "https://lgpd-curso.vercel.app";
  const loginUrlBase = `${url}/login`;

  const crachas: CrachaData[] = [];

  // Crachás dos papéis padrão
  for (const grupo of turma.grupos) {
    const papeisDef = papeisPorOrgao(grupo.orgao as "PM" | "CM");
    for (const p of papeisDef) {
      const user = grupo.company.users.find((u) => u.papel === p.papel);
      if (!user) continue;
      const visual = PAPEL_VISUAL[p.papel] || { emoji: "👤", corIcone: "#6B7280" };
      crachas.push({
        tipo: "PAPEL",
        orgao: grupo.orgao as "PM" | "CM",
        grupoNumero: grupo.numero,
        cidade: turma.cidade,
        nomePapel: p.nomeAmigavel,
        emoji: visual.emoji,
        corIcone: visual.corIcone,
        responsabilidade: p.responsabilidade,
        login: user.email,
        loginUrl: `${loginUrlBase}#email=${encodeURIComponent(user.email)}`,
      });
    }
  }

  // 10 crachás Consultor/Observador (genéricos) — QR aponta pra
  // /observador/<turmaSlug> (público, read-only, view da turma toda).
  const observadorUrl = `${url}/observador/${turma.slug || ""}`;
  for (let i = 1; i <= 10; i++) {
    crachas.push({ tipo: "OBSERVADOR", observadorIdx: i, observadorUrl });
  }

  const cards = crachas.map(renderCracha).join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Crachás — Turma ${turma.nome}</title>
<style>
  @page {
    size: A4 landscape;
    margin: 8mm;
  }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    margin: 0; padding: 8mm; background: #fff; color: #111;
  }

  .header-pagina {
    padding: 0 0 4mm; border-bottom: 1px dashed #cbd5e1; margin-bottom: 6mm;
  }
  .header-pagina h1 { font-size: 11pt; margin: 0; font-weight: 700; }
  .header-pagina .sub { font-size: 8pt; color: #666; margin-top: 1mm; }
  .aviso-impressao {
    margin-top: 3mm;
    padding: 3mm 4mm;
    background: #FEF3C7;
    border-left: 3px solid #F59E0B;
    border-radius: 2mm;
    font-size: 9pt;
    color: #78350F;
    line-height: 1.5;
  }
  .aviso-impressao ul { margin: 1mm 0 2mm 5mm; padding: 0; }
  .aviso-impressao li { margin: 0.5mm 0; }
  .aviso-impressao code { background: #FDE68A; padding: 0 1mm; border-radius: 1mm; font-size: 8pt; }
  .aviso-qr {
    margin-top: 3mm;
    padding-top: 2mm;
    border-top: 1px dotted #F59E0B;
    font-size: 8.5pt;
  }

  .grid {
    display: grid;
    grid-template-columns: 90mm 90mm 90mm;
    column-gap: 6mm;
    row-gap: 8mm;
    justify-content: center;
  }

  /* Linha pontilhada entre crachás (recorte) — pseudo-elementos nas colunas */
  .grid .cracha:nth-child(3n+2)::before,
  .grid .cracha:nth-child(3n+2)::after,
  .grid .cracha:nth-child(3n+3)::before {
    content: "";
    position: absolute;
    top: -2mm; bottom: -2mm;
    width: 0;
    border-left: 1px dashed #94a3b8;
  }
  .grid .cracha:nth-child(3n+2)::before { left: -3mm; }
  .grid .cracha:nth-child(3n+2)::after  { right: -3mm; }

  .cracha {
    position: relative;
    width: 90mm;
    height: 130mm;
    background: #fff;
    border: 1px solid #cbd5e1;
    border-radius: 3mm;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    page-break-inside: avoid;
  }
  .cracha-furo {
    position: absolute;
    top: 2mm;
    left: 50%;
    transform: translateX(-50%);
    width: 10mm;
    height: 3mm;
    border: 1px solid #cbd5e1;
    border-radius: 2mm;
    background: #fff;
    z-index: 5;
  }

  .orgao-banda, .orgao-observador {
    color: #fff;
    text-align: center;
    padding: 9mm 3mm 3mm;
  }
  .orgao-pm { background: linear-gradient(135deg, #059669 0%, #10B981 100%); }
  .orgao-cm { background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); }
  .orgao-observador { background: linear-gradient(135deg, #475569 0%, #64748B 100%); }
  .orgao-tipo {
    font-size: 7pt;
    letter-spacing: 1.2pt;
    text-transform: uppercase;
    opacity: 0.92;
  }
  .orgao-nome {
    font-size: 12pt;
    font-weight: 700;
    margin-top: 0.5mm;
    letter-spacing: 0.5pt;
  }

  .papel-row {
    display: flex;
    gap: 3mm;
    align-items: center;
    padding: 3mm 3mm;
    border-bottom: 1px solid #f1f5f9;
  }
  .papel-icon {
    flex-shrink: 0;
    width: 12mm;
    height: 12mm;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18pt;
    line-height: 1;
  }
  .papel-nome { font-size: 9.5pt; font-weight: 700; color: #0f172a; line-height: 1.15; }
  .papel-resp { font-size: 7pt; color: #64748b; font-style: italic; margin-top: 0.5mm; line-height: 1.15; }

  .cracha-corpo {
    flex: 1;
    padding: 2mm 3mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .qr-corpo { gap: 1mm; }
  .qr-img {
    width: 28mm;
    height: 28mm;
    border: 1px solid #0f172a;
    padding: 0.5mm;
    background: #fff;
  }
  .qr-label { font-size: 7pt; color: #475569; margin-top: 1mm; }
  .qr-login { font-size: 7pt; font-family: "Courier New", monospace; color: #1e293b; margin-top: 1mm; }
  .qr-senha { font-size: 6.5pt; color: #64748b; font-style: italic; }

  .obs-bloco { width: 100%; }
  .obs-titulo {
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: 1pt;
    color: #475569;
    text-align: center;
    margin-bottom: 1.5mm;
  }
  .obs-lista {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 7pt;
    color: #1e293b;
    line-height: 1.35;
  }
  .obs-lista li {
    padding-left: 3mm;
    text-indent: -3mm;
    margin-bottom: 1mm;
  }
  .obs-lista li:before { content: "▸ "; color: #94a3b8; }
  .qr-login-obs {
    font-size: 6.5pt;
    color: #64748b;
    font-style: italic;
    margin-top: 0.5mm;
  }
  .obs-mini-atr {
    padding: 1.5mm 3mm;
    text-align: center;
    font-size: 6.5pt;
    color: #475569;
    font-weight: 600;
    letter-spacing: 0.3pt;
    border-top: 1px dashed #e2e8f0;
  }

  .nome-bloco {
    padding: 1.5mm 3mm;
    border-top: 1px dashed #cbd5e1;
  }
  .nome-label { font-size: 6pt; letter-spacing: 1pt; color: #94a3b8; font-weight: 600; }
  .nome-linha { border-bottom: 1px solid #94a3b8; height: 4mm; }

  .cracha-footer {
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    padding: 1.5mm;
    font-size: 6.5pt;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1pt;
  }

  .print-button {
    position: fixed; top: 1rem; right: 1rem;
    background: #2563EB; color: white; border: none; padding: .5rem 1rem;
    font-size: 14px; cursor: pointer; border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    z-index: 100;
  }
  @media print { .print-button, .header-pagina { display: none; } body { padding: 0; } }
</style>
</head>
<body>
  <button class="print-button" onclick="window.print()">🖨 Imprimir / Salvar PDF</button>
  <div class="header-pagina">
    <h1>Crachás · Turma "${turma.nome}"</h1>
    <div class="sub">
      ${turma.cidade} · ${turma.grupos.length} grupos · ${crachas.length} crachás
      (${crachas.filter(c => c.tipo === "PAPEL").length} papéis + ${crachas.filter(c => c.tipo === "OBSERVADOR").length} observadores)
    </div>
    <div class="aviso-impressao">
      <strong>⚙️ Antes de imprimir — abra o diálogo (Ctrl+P) e confira 3 coisas:</strong>
      <ul>
        <li><strong>Layout:</strong> Paisagem (Landscape)</li>
        <li><strong>Margens:</strong> Mínimas (ou Padrão)</li>
        <li><strong>Gráficos de fundo</strong> ✓ marcado (preserva as cores dos crachás)</li>
      </ul>
      <div>Resultado: 3 crachás por folha A4. Recorte na linha pontilhada vertical entre eles.</div>
      <div class="aviso-qr">
        💡 <strong>Como o QR Code funciona:</strong> ao escanear com a câmera do celular, o participante abre o app
        com o email do papel já preenchido. A senha é <strong>informada por você (facilitador)</strong> no
        momento certo da aula — não está impressa no crachá de propósito.
      </div>
    </div>
  </div>
  <div class="grid">${cards}</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
