-- Fase 6 — DSR (painel interno): tabela nova a aplicar no Neon PROD ANTES do
-- deploy (a Central e os Indicadores passam a consultar prisma.dataSubjectRequest).
-- Rodar no Neon SQL Editor do projeto comite-tcees. Aditivo e idempotente.

CREATE TABLE IF NOT EXISTS "data_subject_requests" (
    "id" TEXT NOT NULL,
    "protocolNumber" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'ouvidoria',
    "titularName" TEXT NOT NULL,
    "titularCategory" TEXT NOT NULL DEFAULT 'cidadao',
    "requestedRights" TEXT[],
    "detailedRequest" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEBIDA',
    "decision" TEXT,
    "responseText" TEXT,
    "responseActions" TEXT,
    "responseDate" TIMESTAMP(3),
    "respondedBy" TEXT,
    "instrumentoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "data_subject_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "data_subject_requests_status_idx" ON "data_subject_requests"("status");
CREATE INDEX IF NOT EXISTS "data_subject_requests_createdAt_idx" ON "data_subject_requests"("createdAt");
