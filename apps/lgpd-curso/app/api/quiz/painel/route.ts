// GET /api/quiz/painel?turmaId=X
// Retorna métricas AGREGADAS do quiz de uma turma — sem expor identidade
// (nem há identidade pra expor, mas reforça que o endpoint só serve agregados).
//
// Acesso: ADMIN only.
//
// Retorna:
//   {
//     total: { respondentes, completos, scoreMedio, scoreMediano },
//     histograma: { '0-25': N, '25-50': N, '50-75': N, '75-100': N },
//     porQuestao: [{ qid, enunciado, categoria, totalRespostas, percAcerto,
//                    distribuicao: [%, %, %, %], maisErrada: indice|null }],
//     porCategoria: [{ categoria, rotulo, percAcertoMedio, totalRespondentes }]
//   }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { ensureTabelaQuiz } from "@/lib/colunas-quiz";
import { ensureColunaQuizDuracao } from "@/lib/coluna-quiz-duracao";
import { PERGUNTAS, CATEGORIAS, type CategoriaQuiz } from "@/lib/quiz-perguntas";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  try {
    await ensureTabelaQuiz();
    await ensureColunaQuizDuracao();

    const turmaId = req.nextUrl.searchParams.get("turmaId");
    if (!turmaId) {
      return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });
    }

    const turma = await prisma.cursoTurma.findUnique({
      where: { id: turmaId },
      select: { quizDuracaoMinutos: true },
    });

    const respostas = await prisma.quizResponse.findMany({
      where: { turmaId, finishedAt: { not: null } },
      select: {
        scoreTotal: true,
        scorePorCategoria: true,
        respostas: true,
      },
    });

    // Em andamento — pra calcular "tempo restante" de cada um e mostrar ao
    // facilitador. Limita a 100 pra não pesar (turma típica tem 50).
    const emAndamento = await prisma.quizResponse.findMany({
      where: { turmaId, finishedAt: null },
      select: { startedAt: true },
      orderBy: { startedAt: "asc" },
      take: 100,
    });

    const totalRespondentes = await prisma.quizResponse.count({ where: { turmaId } });
    const completos = respostas.length;

    // Calcula tempo restante POR participante em andamento (em segundos).
    // Negativo = já passou do prazo (cliente deve ter submetido auto, mas se
    // bateu offline pode aparecer aqui — facilitador vê e pode investigar).
    const duracaoMinutos = turma?.quizDuracaoMinutos ?? null;
    const tempoRestantesSeg: number[] = duracaoMinutos
      ? emAndamento.map((r) => {
          const deadlineMs = r.startedAt.getTime() + duracaoMinutos * 60 * 1000;
          return Math.floor((deadlineMs - Date.now()) / 1000);
        })
      : [];
    const proximoExpirarSeg = tempoRestantesSeg.length > 0 ? Math.min(...tempoRestantesSeg) : null;
    const tempoMedioRestanteSeg =
      tempoRestantesSeg.length > 0
        ? Math.round(tempoRestantesSeg.reduce((a, b) => a + b, 0) / tempoRestantesSeg.length)
        : null;

    // Score médio + histograma
    const totalPerguntas = PERGUNTAS.length;
    let somaScores = 0;
    const histograma = { "0-25": 0, "25-50": 0, "50-75": 0, "75-100": 0 };
    const scoresOrdenados: number[] = [];

    for (const r of respostas) {
      somaScores += r.scoreTotal;
      const perc = (r.scoreTotal / totalPerguntas) * 100;
      if (perc < 25) histograma["0-25"]++;
      else if (perc < 50) histograma["25-50"]++;
      else if (perc < 75) histograma["50-75"]++;
      else histograma["75-100"]++;
      scoresOrdenados.push(r.scoreTotal);
    }

    const scoreMedio = completos > 0 ? somaScores / completos : 0;
    scoresOrdenados.sort((a, b) => a - b);
    const scoreMediano = completos > 0
      ? scoresOrdenados[Math.floor(completos / 2)]
      : 0;

    // Por questão: % de acerto + distribuição de alternativas
    const porQuestao = PERGUNTAS.map((p) => {
      let totalDaQuestao = 0;
      let acertos = 0;
      const distribuicao = [0, 0, 0, 0];

      for (const r of respostas) {
        const lista = (r.respostas as any[]) || [];
        const found = lista.find((x: any) => x.qid === p.qid);
        if (found && typeof found.selected === "number" && found.selected >= 0) {
          totalDaQuestao++;
          if (found.selected === p.correta) acertos++;
          if (found.selected >= 0 && found.selected < 4) {
            distribuicao[found.selected]++;
          }
        }
      }

      const percAcerto = totalDaQuestao > 0 ? (acertos / totalDaQuestao) * 100 : 0;
      // Alternativa errada mais comum (excluindo a correta)
      let maisErrada: number | null = null;
      let maxErrados = 0;
      for (let i = 0; i < 4; i++) {
        if (i === p.correta) continue;
        if (distribuicao[i] > maxErrados) {
          maxErrados = distribuicao[i];
          maisErrada = i;
        }
      }
      // Distribuição em percentual (arredondado)
      const distribuicaoPerc = distribuicao.map((n) =>
        totalDaQuestao > 0 ? Math.round((n / totalDaQuestao) * 100) : 0,
      );

      return {
        qid: p.qid,
        enunciado: p.enunciado,
        categoria: p.categoria,
        rotuloCategoria: CATEGORIAS[p.categoria].rotulo,
        emojiCategoria: CATEGORIAS[p.categoria].emoji,
        alternativas: p.alternativas,
        correta: p.correta,
        totalRespostas: totalDaQuestao,
        acertos,
        percAcerto: Math.round(percAcerto),
        distribuicao: distribuicaoPerc,
        maisErrada,
      };
    });

    // Por categoria — média de acerto
    const porCategoria = (Object.keys(CATEGORIAS) as CategoriaQuiz[]).map((cat) => {
      const meta = CATEGORIAS[cat];
      const perguntasDaCat = PERGUNTAS.filter((p) => p.categoria === cat);
      let somaPercDaCategoria = 0;
      let respondentesCategoria = 0;
      for (const r of respostas) {
        const dados = (r.scorePorCategoria as any)?.[cat];
        if (dados && dados.total > 0) {
          somaPercDaCategoria += (dados.correct / dados.total) * 100;
          respondentesCategoria++;
        }
      }
      const percAcertoMedio = respondentesCategoria > 0
        ? Math.round(somaPercDaCategoria / respondentesCategoria)
        : 0;
      return {
        categoria: cat,
        rotulo: meta.rotulo,
        emoji: meta.emoji,
        percAcertoMedio,
        totalQuestoes: perguntasDaCat.length,
        respondentes: respondentesCategoria,
      };
    });

    return NextResponse.json({
      total: {
        respondentes: totalRespondentes,
        completos,
        scoreMedio: Math.round(scoreMedio * 10) / 10,
        scoreMediano,
        totalPerguntas,
      },
      histograma,
      porQuestao,
      porCategoria,
      // Info do timer pro Facilitador visualizar — null se a turma não tem
      // duração configurada. Cliente do quiz é INVISÍVEL (sem UI de tempo).
      timer: {
        duracaoMinutos,
        emAndamento: emAndamento.length,
        proximoExpirarSeg, // pode ser negativo (já passou)
        tempoMedioRestanteSeg,
      },
      geradoEm: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[quiz/painel]", e);
    return NextResponse.json({ error: e.message || "Erro" }, { status: 500 });
  }
}
