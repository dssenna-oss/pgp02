-- Fase 7 — Checklist operacional de monitoramento: tabela nova no Neon PROD
-- ANTES do deploy. Rodar no Neon SQL Editor do comite-tcees. Aditivo/idempotente.

CREATE TABLE IF NOT EXISTS "monitoring_checks" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "monitoring_checks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "monitoring_checks_itemId_key" ON "monitoring_checks"("itemId");
