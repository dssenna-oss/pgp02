-- ====================================================================
-- Etapa 30 — DataSubjectRequest (Requisições de Direitos do Titular)
-- ====================================================================
-- Implementa sub-sessão A3 do mini-app de Direitos do Titular (arts. 18,
-- 19 e 20 da LGPD). Idempotente: pode ser reaplicada com segurança.
-- ====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS "data_subject_requests" (
  "id"                         TEXT PRIMARY KEY,
  "companyId"                  TEXT NOT NULL,

  -- Protocolo institucional (REQ-YYYY-NNNN)
  "protocolNumber"             TEXT NOT NULL,

  -- Identificação do titular
  "titularName"                TEXT NOT NULL,
  "titularCpf"                 TEXT NOT NULL,
  "titularDocType"             TEXT,
  "titularDocNumber"           TEXT,
  "titularBirthDate"           TIMESTAMP(3),
  "titularPhone"               TEXT NOT NULL,
  "titularEmail"               TEXT NOT NULL,
  "titularAddress"             TEXT,
  "titularCategory"            TEXT NOT NULL,
  "titularCategoryOther"       TEXT,

  -- Representante legal/procurador
  "hasRepresentative"          BOOLEAN NOT NULL DEFAULT false,
  "representativeName"         TEXT,
  "representativeCpf"          TEXT,
  "representativeType"         TEXT,
  "representativeTypeOther"    TEXT,
  "representativeEmail"        TEXT,
  "representativePhone"        TEXT,

  -- Direitos solicitados (códigos I..XII, arrays nativos do Postgres)
  "requestedRights"            TEXT[] NOT NULL DEFAULT '{}',

  -- Detalhamento livre do pedido
  "detailedRequest"            TEXT NOT NULL,

  -- Canal preferido de resposta
  "responseChannel"            TEXT NOT NULL,
  "responseChannelOther"       TEXT,

  -- Anexos (URLs Vercel Blob)
  "identityDocUrl"             TEXT,
  "representationDocUrl"       TEXT,
  "additionalDocs"             JSONB,

  -- Workflow
  "status"                     TEXT NOT NULL DEFAULT 'RECEBIDA',

  -- Resposta institucional
  "decision"                   TEXT,
  "responseText"               TEXT,
  "responseActions"            TEXT,
  "responseDate"               TIMESTAMP(3),
  "responseChannelUsed"        TEXT,

  "respondedByUserId"          TEXT,
  "relatedTaskId"              TEXT,

  -- Aceite/Declaração + auditoria
  "authenticityAccepted"       BOOLEAN NOT NULL DEFAULT false,
  "ipAddress"                  TEXT,
  "userAgent"                  TEXT,

  -- Prazo legal de resposta (15 dias corridos)
  "dueDate"                    TIMESTAMP(3) NOT NULL,

  "createdAt"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- Constraints (idempotentes)
-- ====================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'data_subject_requests_protocolNumber_key'
  ) THEN
    ALTER TABLE "data_subject_requests"
      ADD CONSTRAINT "data_subject_requests_protocolNumber_key" UNIQUE ("protocolNumber");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'data_subject_requests_relatedTaskId_key'
  ) THEN
    ALTER TABLE "data_subject_requests"
      ADD CONSTRAINT "data_subject_requests_relatedTaskId_key" UNIQUE ("relatedTaskId");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'data_subject_requests_companyId_fkey'
  ) THEN
    ALTER TABLE "data_subject_requests"
      ADD CONSTRAINT "data_subject_requests_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'data_subject_requests_respondedByUserId_fkey'
  ) THEN
    ALTER TABLE "data_subject_requests"
      ADD CONSTRAINT "data_subject_requests_respondedByUserId_fkey"
      FOREIGN KEY ("respondedByUserId") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END
$$;

-- ====================================================================
-- Índices
-- ====================================================================
CREATE INDEX IF NOT EXISTS "data_subject_requests_companyId_status_idx"
  ON "data_subject_requests"("companyId", "status");

CREATE INDEX IF NOT EXISTS "data_subject_requests_companyId_createdAt_idx"
  ON "data_subject_requests"("companyId", "createdAt");

CREATE INDEX IF NOT EXISTS "data_subject_requests_protocolNumber_idx"
  ON "data_subject_requests"("protocolNumber");

COMMIT;
