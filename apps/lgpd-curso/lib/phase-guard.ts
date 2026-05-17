// Guard pedagógico: impede DPO de "pular" pra Fases 5/6/7 sem fechar a Fase 4
// (GAP Analysis). Quando bloqueia, registra a tentativa em PhaseSkipAttempt
// pra que o Facilitador veja em tempo real no painel.
//
// IMPORTANTE — por que RETURN em vez de THROW:
// O Next.js 14+ SANITIZA mensagens de erro de server actions em produção
// (security feature). Se a gente fizer throw new Error("PHASE_SKIP_M3:..."),
// o client recebe um erro genérico SEM o prefixo — o handler não consegue
// detectar e o erro cai no Error Boundary como "Server Components render".
// Por isso retornamos um objeto especial que sobrevive à serialização.
//
// Uso em qualquer action de Plano de Ação, RIPD, Terceiros, DSR, Aviso ou
// Incidente:
//
//   const skip = await checkGapConcluido("FASE_5", "Criar Plano de Acao");
//   if (skip) return skip;  // <— bloqueia ANTES de qualquer mutação
//   // ... resto da action

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";

export const PHASE_SKIP_FLAG = "__phaseSkipBlocked";
export const PHASE_SKIP_MESSAGE =
  "VOCÊ AINDA NÃO CONCLUIU A FASE 4 - GAP ANALYSIS. Seu grupo perderá pontos se prosseguir!";

export type FaseTentada = "FASE_5" | "FASE_6" | "FASE_7";

export type PhaseSkipResult = {
  [PHASE_SKIP_FLAG]: true;
  fase: FaseTentada;
  message: string;
};

export async function gapConcluido(companyId: string): Promise<boolean> {
  const qtd = await prisma.gapAnswer.count({ where: { companyId } });
  return qtd >= 10;
}

/**
 * Se o GAP NÃO está concluído, registra a tentativa de pulo e retorna um
 * PhaseSkipResult. A action deve `return skip` imediatamente.
 * Se o GAP está OK, retorna `null` e a action segue normalmente.
 */
export async function checkGapConcluido(
  faseTentada: FaseTentada,
  acaoTentada?: string,
): Promise<PhaseSkipResult | null> {
  const { session, companyId } = await requireCompany();
  if (await gapConcluido(companyId)) return null;

  // Registra tentativa pro Facilitador ver. Não bloqueia caso falhe (best-effort).
  try {
    const grupo = await prisma.cursoGrupo.findUnique({ where: { companyId } });
    if (grupo) {
      // Idempotência leve: se há tentativa PENDING na mesma fase no último minuto,
      // não duplica (DPO clicando freneticamente em vários botões não inunda).
      const recente = await prisma.phaseSkipAttempt.findFirst({
        where: {
          grupoId: grupo.id,
          status: "PENDING",
          faseTentada,
          createdAt: { gte: new Date(Date.now() - 60_000) },
        },
      });
      if (!recente) {
        await prisma.phaseSkipAttempt.create({
          data: {
            grupoId: grupo.id,
            requestedById: session.user.id,
            requestedByName: session.user.name || session.user.email,
            faseTentada,
            acaoTentada: acaoTentada || null,
          },
        });
      }
    }
  } catch (e) {
    console.error("[phase-guard] falha ao registrar tentativa:", e);
  }

  return {
    [PHASE_SKIP_FLAG]: true,
    fase: faseTentada,
    message: PHASE_SKIP_MESSAGE,
  };
}

export function isPhaseSkipResult(x: unknown): x is PhaseSkipResult {
  return !!x && typeof x === "object" && (x as any)[PHASE_SKIP_FLAG] === true;
}
