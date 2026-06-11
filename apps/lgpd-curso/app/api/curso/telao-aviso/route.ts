// GET /api/curso/telao-aviso
//
// Versão do comando do telão PRO PARTICIPANTE (qualquer autenticado com
// grupo): devolve um aviso amigável quando o facilitador está projetando um
// Material de Apoio ("conteudo:<id>"), pro banner "📺 No telão agora…" do
// celular. Outros comandos (quiz, placar, atividades) devolvem aviso null —
// essas telas já têm fluxo próprio no celular e não precisam de banner.
// A turma é derivada da sessão (companyId → cursoGrupo → turma): o client não
// precisa saber turmaId.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { ensureColunaTelaoComando } from "@/lib/coluna-telao-comando";
import { getConteudoTelao } from "@/lib/conteudos-telao";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  const companyId = session?.user?.companyId;
  // Sem sessão/sem grupo (inclui ADMIN): sem aviso — o banner só existe pro
  // participante acompanhar o telão.
  if (!session?.user?.id || !companyId) return NextResponse.json({ aviso: null });

  await ensureColunaTelaoComando();
  const grupo = await prisma.cursoGrupo.findUnique({
    where: { companyId },
    select: { turma: { select: { telaoComando: true } } },
  });

  const comando = grupo?.turma?.telaoComando ?? null;
  if (!comando?.startsWith("conteudo:")) return NextResponse.json({ aviso: null });

  const conteudo = getConteudoTelao(comando.slice("conteudo:".length));
  if (!conteudo) return NextResponse.json({ aviso: null });

  return NextResponse.json({
    aviso: {
      comando,
      emoji: conteudo.emoji,
      titulo: conteudo.titulo,
      href: conteudo.hrefAluno, // null = sem página própria (só acompanhar o telão)
    },
  });
}
