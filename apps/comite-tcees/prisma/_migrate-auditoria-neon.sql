-- Fase 7 — Auditoria Interna: tabelas novas no Neon PROD ANTES do deploy.
-- Rodar no Neon SQL Editor do comite-tcees. Aditivo e idempotente.

CREATE TABLE IF NOT EXISTS "auditorias" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "escopo" TEXT,
    "responsavel" TEXT,
    "dataPrevista" TIMESTAMP(3),
    "dataRealizada" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PLANEJADA',
    "observacoes" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "auditorias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "auditoria_achados" (
    "id" TEXT NOT NULL,
    "auditoriaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "severidade" TEXT NOT NULL DEFAULT 'MEDIA',
    "naoConformidade" BOOLEAN NOT NULL DEFAULT true,
    "recomendacao" TEXT,
    "planoAcao" TEXT,
    "prazo" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "auditoria_achados_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "auditorias_status_idx" ON "auditorias"("status");
CREATE INDEX IF NOT EXISTS "auditoria_achados_auditoriaId_idx" ON "auditoria_achados"("auditoriaId");

DO $$ BEGIN
  ALTER TABLE "auditoria_achados" ADD CONSTRAINT "auditoria_achados_auditoriaId_fkey"
    FOREIGN KEY ("auditoriaId") REFERENCES "auditorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
