// Guard pedagógico: impede DPO de "pular" pra Fases 5/6/7 sem fechar a Fase 4
// (GAP Analysis). Quando bloqueia, registra a tentativa em PhaseSkipAttempt
// pra que o Facilitador veja em tempo real no painel.
//
// Uso em qualquer action de Plano de Ação, RIPD, Terceiros, DSR, Aviso ou
// Incidente:
//
//   await ensureGapConcluido("FASE_5", "Criar Plano de Acao");
//
// Se GAP não tem 10 respostas, registra a tentativa e dispara erro com prefixo
// "PHASE_SKIP_M3:" — o client detecta e mostra o Dialog em vez de toast genérico.

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";

export const PHASE_SKIP_PREFIX = "PHASE_SKIP_M3:";
export const PHASE_SKIP_MESSAGE =
  "VOCÊ AINDA NÃO CONCLUIU A FASE 4 - GAP ANALYSIS. Seu grupo perderá pontos se prosseguir!";

export type FaseTentada = "FASE_5" | "FASE_6" | "FASE_7";

export async function gapConcluido(companyId: string): Promise<boolean> {
  const qtd = await prisma.gapAnswer.count({ where: { companyId } });
  return qtd >= 10;
}

export async function ensureGapConcluido(
  faseTentada: FaseTentada,
  acaoTentada?: string,
): Promise<void> {
  const { session, companyId } = await requireCompany();
  if (await gapConcluido(companyId)) return;

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
    // Não bloqueia o usuário por causa de falha de telemetria
    console.error("[phase-guard] falha ao registrar tentativa:", e);
  }

  throw new Error(`${PHASE_SKIP_PREFIX}${PHASE_SKIP_MESSAGE}`);
}

export function isPhaseSkipError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err as any).message || String(err);
  return typeof msg === "string" && msg.startsWith(PHASE_SKIP_PREFIX);
}
