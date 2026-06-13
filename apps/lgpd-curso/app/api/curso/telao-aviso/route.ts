// GET /api/curso/telao-aviso
//
// Versão do comando do telão PRO PARTICIPANTE (qualquer autenticado com
// grupo): devolve um aviso amigável pro banner "📺 No telão agora…" do celular
// quando o facilitador está projetando:
//   • um Material de Apoio ("conteudo:<id>") → link pra mesma página; ou
//   • uma Atividade ao vivo ("atividade:<id>") → link pra tela de responder
//     (DPO registra; membro acompanha em leitura). Cobre os Desafios da Trilha
//     e as votações das fases.
// Os demais comandos (quiz, placar, "atividade:termometro") devolvem aviso
// null — têm fluxo próprio no celular e não precisam de banner.
// A turma é derivada da sessão (companyId → cursoGrupo → turma): o client não
// precisa saber turmaId.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { ensureColunaTelaoComando } from "@/lib/coluna-telao-comando";
import { getConteudoTelao } from "@/lib/conteudos-telao";
import { getAtividadeC } from "@/lib/atividades-c";

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

  // Material de Apoio projetado → banner com link pra mesma página no celular.
  if (comando?.startsWith("conteudo:")) {
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

  // Atividade ao vivo projetada (Desafios da Trilha + votações das fases) →
  // banner levando o DPO a registrar e o membro a acompanhar. "atividade:termometro"
  // não é atividade de catálogo (getAtividadeC = undefined) → sem banner, fluxo próprio.
  if (comando?.startsWith("atividade:")) {
    const at = getAtividadeC(comando.slice("atividade:".length));
    if (!at) return NextResponse.json({ aviso: null });
    return NextResponse.json({
      aviso: {
        comando,
        emoji: at.emoji,
        titulo: at.titulo,
        href: `/dashboard/atividades/${at.id}`,
      },
    });
  }

  return NextResponse.json({ aviso: null });
}
