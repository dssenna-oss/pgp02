// Permissões do curso por papel.
//
// A partir da Fase 4 (GAP Analysis), a EXECUÇÃO do PGP é conduzida pelo
// DPO/Encarregado — espelha a realidade: depois do mapeamento inicial, é o
// Encarregado quem toca o programa, acionando os demais setores quando precisa.
//
// Contribuidores (role MEMBER) entram em "Modo Observador" nas Fases 4-7:
// veem tudo em tempo real, acompanham o trabalho, mas não editam.
// Fases 1-3 (Inventário, Riscos) continuam abertas a todos os papéis —
// é onde cada dono de processo preenche o que conhece.

/** True se o papel pode EDITAR as Fases 4-7 (GAP, Plano, RIPD, Terceiros, DSR, Aviso, Incidentes). */
export function podeEditarFaseAvancada(role: string | null | undefined): boolean {
  return role === "DPO" || role === "ADMIN";
}

// Modalidade C — "Modo Cards". Quando a turma do grupo está com modoCards=true,
// as fases de produção ficam em modo LEITURA pra TODOS (a produção é nos cards
// físicos). Helper assíncrono porque precisa consultar a turma do grupo.
// Tolerante a falha (se a coluna ainda não migrou ou der erro, assume false —
// nunca bloqueia o curso por causa disso).
import { prisma } from "@/lib/prisma";
import { ensureColunaModoCards } from "@/lib/coluna-modo-cards";

export async function turmaEmModoCards(companyId: string | null | undefined): Promise<boolean> {
  const { modoCards } = await turmaDoGrupo(companyId);
  return modoCards;
}

// Variante que devolve também o slug da turma — a home do aluno usa pra montar
// o link direto do Quiz Diagnóstico (/quiz/<slug>), evitando que 50+ pessoas
// precisem escanear o QR do telão de longe. Mesma tolerância a falha.
export async function turmaDoGrupo(
  companyId: string | null | undefined,
): Promise<{ modoCards: boolean; turmaSlug: string | null }> {
  if (!companyId) return { modoCards: false, turmaSlug: null };
  try {
    await ensureColunaModoCards();
    const grupo = await prisma.cursoGrupo.findUnique({
      where: { companyId },
      select: { turma: { select: { modoCards: true, slug: true } } },
    });
    return {
      modoCards: grupo?.turma?.modoCards === true,
      turmaSlug: grupo?.turma?.slug || null,
    };
  } catch {
    return { modoCards: false, turmaSlug: null };
  }
}

/**
 * Decide se a tela de produção pode ser editada AGORA, combinando a regra do
 * papel com o Modo Cards da turma. Em Modo Cards, ninguém edita (nem o DPO).
 */
export async function podeEditarAgora(
  companyId: string | null | undefined,
  regraDoPapel: boolean,
): Promise<{ podeEditar: boolean; modoCards: boolean }> {
  const modoCards = await turmaEmModoCards(companyId);
  return { podeEditar: regraDoPapel && !modoCards, modoCards };
}
