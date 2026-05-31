-- Fase 7 — Autoavaliação TCU: tabela nova a aplicar no Neon PROD ANTES do deploy
-- (a página /dashboard/autoavaliacao consulta prisma.tcuAnswer). Rodar no Neon
-- SQL Editor do projeto comite-tcees. Aditivo e idempotente.

CREATE TABLE IF NOT EXISTS "tcu_answers" (
    "id" TEXT NOT NULL,
    "questionCode" TEXT NOT NULL,
    "resposta" TEXT NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tcu_answers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tcu_answers_questionCode_key" ON "tcu_answers"("questionCode");
