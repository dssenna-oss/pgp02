// Auto-migração idempotente das colunas do Encarregado/Substituto em companies.
// Espelha /api/curso/migrar-encarregado (que é uma rota MANUAL, admin-only) mas
// roda SOZINHA ao abrir/salvar a Fase 1 — garante que o DPO real nunca bata em
// "column does not exist" caso a migração manual não tenha sido acionada em
// prod. Mesmo espírito do ensureColuna* canônico do app.

import { prisma } from "@/lib/prisma";

let verificadoNestaInstancia = false;

export async function ensureColunasEncarregado(): Promise<void> {
  if (verificadoNestaInstancia) return;
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "companies"
       ADD COLUMN IF NOT EXISTS "dpoTelefone" TEXT,
       ADD COLUMN IF NOT EXISTS "dpoEndereco" TEXT,
       ADD COLUMN IF NOT EXISTS "dpoSubstitutoNome" TEXT,
       ADD COLUMN IF NOT EXISTS "dpoSubstitutoEmail" TEXT,
       ADD COLUMN IF NOT EXISTS "dpoSubstitutoTelefone" TEXT`
  );
  verificadoNestaInstancia = true;
}
