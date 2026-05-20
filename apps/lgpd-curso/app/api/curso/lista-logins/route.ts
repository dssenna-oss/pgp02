// GET /api/curso/lista-logins?turmaId=...
// Folha de consulta do FACILITADOR — tabela print-friendly com TODOS os
// emails reais de uma turma, lidos direto do banco (fonte da verdade).
// Resolve o problema de tentar logar com email no formato antigo.
//
// Mostra: grupo, papel, nome amigável, email real (já com slug da turma).
// NÃO mostra senha — o hash bcrypt no banco não é reversível; a senha é a
// que o facilitador definiu ao criar a turma (padrão Curso2026!).

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

  // Monta as linhas agrupadas por grupo, na ordem oficial dos papéis.
  const blocos: string[] = [];
  let totalLogins = 0;

  for (const grupo of turma.grupos) {
    const orgaoNome = grupo.orgao === "PM" ? "Prefeitura Municipal" : "Câmara Municipal";
    const orgaoCor = grupo.orgao === "PM" ? "#059669" : "#1E40AF";
    const papeisDef = papeisPorOrgao(grupo.orgao as "PM" | "CM");

    const linhas: string[] = [];
    for (const p of papeisDef) {
      const user = grupo.company.users.find((u) => u.papel === p.papel);
      if (!user) continue;
      totalLogins++;
      linhas.push(`
        <tr>
          <td class="papel">${p.nomeAmigavel}</td>
          <td class="email"><code>${user.email}</code></td>
        </tr>`);
    }

    blocos.push(`
      <div class="grupo-bloco">
        <div class="grupo-header" style="background:${orgaoCor}">
          Grupo ${grupo.numero} · ${orgaoNome} de ${turma.cidade}
        </div>
        <table class="logins-table">
          <thead>
            <tr><th>Papel</th><th>Email de login</th></tr>
          </thead>
          <tbody>${linhas.join("")}</tbody>
        </table>
      </div>`);
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Lista de Logins — Turma ${turma.nome}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    margin: 0; padding: 12mm; background: #fff; color: #0f172a;
  }
  h1 { font-size: 16pt; margin: 0 0 2mm; }
  .sub { font-size: 9pt; color: #64748b; margin-bottom: 2mm; }
  .slug-box {
    display: inline-block;
    background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 4px;
    padding: 1.5mm 3mm; font-size: 9pt; color: #065F46; margin: 2mm 0 4mm;
  }
  .slug-box code { font-weight: 700; }
  .aviso-senha {
    background: #FEF3C7; border-left: 3px solid #F59E0B; border-radius: 3px;
    padding: 3mm 4mm; font-size: 9pt; color: #78350F; margin-bottom: 6mm;
    line-height: 1.5;
  }
  .grupo-bloco { margin-bottom: 6mm; page-break-inside: avoid; }
  .grupo-header {
    color: #fff; font-weight: 700; font-size: 10pt;
    padding: 2mm 3mm; border-radius: 4px 4px 0 0;
  }
  .logins-table {
    width: 100%; border-collapse: collapse; font-size: 9.5pt;
  }
  .logins-table th {
    text-align: left; background: #F1F5F9; color: #475569;
    font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5pt;
    padding: 2mm 3mm; border: 1px solid #E2E8F0;
  }
  .logins-table td {
    padding: 2mm 3mm; border: 1px solid #E2E8F0;
  }
  .logins-table .papel { font-weight: 600; width: 40%; }
  .logins-table .email code {
    font-family: "Courier New", monospace; font-size: 9pt;
    background: #F8FAFC; padding: 0.5mm 1.5mm; border-radius: 2px;
  }
  .logins-table tr:nth-child(even) td { background: #FAFAFA; }
  .footer { margin-top: 8mm; font-size: 8pt; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 3mm; }
  .print-button {
    position: fixed; top: 1rem; right: 1rem;
    background: #2563EB; color: white; border: none; padding: .5rem 1rem;
    font-size: 14px; cursor: pointer; border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }
  @media print { .print-button { display: none; } body { padding: 0; } }
</style>
</head>
<body>
  <button class="print-button" onclick="window.print()">🖨 Imprimir / Salvar PDF</button>

  <h1>🔑 Lista de Logins · Turma "${turma.nome}"</h1>
  <div class="sub">
    ${turma.cidade} · ${turma.grupos.length} grupos · ${totalLogins} logins ·
    Gerado em ${new Date().toLocaleString("pt-BR")}
  </div>
  <div class="slug-box">
    Slug da turma: <code>${turma.slug || "(sem slug — turma antiga)"}</code>
    — todos os emails desta turma terminam em <code>.${turma.slug || "???"}@curso.lgpd</code>
  </div>

  <div class="aviso-senha">
    <strong>⚠️ Uso exclusivo do facilitador.</strong> Esta folha é a fonte da verdade dos emails de login.
    A <strong>senha</strong> de todos é a que você definiu ao criar a turma (padrão <code>Curso2026!</code>) —
    ela não aparece aqui de propósito, você a informa à turma no momento certo.
  </div>

  ${blocos.join("")}

  <div class="footer">
    PGP Treinamento · Curso prático de LGPD · Esta lista reflete o banco de dados no momento da geração.
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
