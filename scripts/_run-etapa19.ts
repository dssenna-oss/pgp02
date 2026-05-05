/**
 * Etapa 19 — Vínculos M:N Incidente ↔ Inventário/Operador (Checkpoint 16 / F2-F3).
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Aplicando Etapa 19 — Vínculos M:N Incidente↔Inventário/Operador...");

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "incident_data_inventories" (
      "incidentId"      TEXT NOT NULL,
      "dataInventoryId" TEXT NOT NULL,
      "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("incidentId", "dataInventoryId")
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "incident_operators" (
      "incidentId" TEXT NOT NULL,
      "operatorId" TEXT NOT NULL,
      "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("incidentId", "operatorId")
    )
  `);
  console.log("  ✓ Tabelas criadas");

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='incident_data_inventories_incidentId_fkey') THEN
        ALTER TABLE "incident_data_inventories" ADD CONSTRAINT "incident_data_inventories_incidentId_fkey"
          FOREIGN KEY ("incidentId") REFERENCES "incidents"(id) ON DELETE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='incident_data_inventories_dataInventoryId_fkey') THEN
        ALTER TABLE "incident_data_inventories" ADD CONSTRAINT "incident_data_inventories_dataInventoryId_fkey"
          FOREIGN KEY ("dataInventoryId") REFERENCES "data_inventories"(id) ON DELETE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='incident_operators_incidentId_fkey') THEN
        ALTER TABLE "incident_operators" ADD CONSTRAINT "incident_operators_incidentId_fkey"
          FOREIGN KEY ("incidentId") REFERENCES "incidents"(id) ON DELETE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='incident_operators_operatorId_fkey') THEN
        ALTER TABLE "incident_operators" ADD CONSTRAINT "incident_operators_operatorId_fkey"
          FOREIGN KEY ("operatorId") REFERENCES "operators"(id) ON DELETE CASCADE;
      END IF;
    END $$
  `);
  console.log("  ✓ FKs com cascade delete");

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "incident_data_inventories_dataInventoryId_idx" ON "incident_data_inventories"("dataInventoryId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "incident_operators_operatorId_idx" ON "incident_operators"("operatorId")`);
  console.log("  ✓ Índices reversos");

  console.log("\n✅ Etapa 19 aplicada com sucesso!");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
