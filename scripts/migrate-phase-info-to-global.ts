
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function migratePhaseInfoToGlobal() {
  try {
    console.log("🔄 Iniciando migração de PhaseInfo para formato global...\n");

    // 1. Buscar todos os registros existentes com conteúdo (heyzineEmbedUrl ou howToProceed)
    const existingInfos = await prisma.phaseInfo.findMany({
      where: {
        OR: [
          { heyzineEmbedUrl: { not: null } },
          { howToProceed: { not: null } },
        ],
      },
    });

    console.log(`📊 Encontrados ${existingInfos.length} registros com conteúdo.\n`);

    // 2. Para cada fase, criar um registro global consolidado
    const phases = [
      "preliminar",
      "fase-1",
      "fase-2",
      "fase-3",
      "fase-4",
      "fase-5",
      "fase-6",
      "fase-7",
    ];

    for (const phase of phases) {
      // Buscar registros desta fase
      const phaseRecords = existingInfos.filter((r) => r.phase === phase);

      if (phaseRecords.length === 0) {
        console.log(`⏭️  ${phase}: Nenhum registro encontrado.`);
        continue;
      }

      // Pegar o primeiro registro com conteúdo para ser o global
      const firstRecord = phaseRecords[0];

      // Verificar se já existe um registro global para esta fase
      const existingGlobal = await prisma.phaseInfo.findFirst({
        where: {
          phase: phase,
          isGlobal: true,
          companyId: null,
        },
      });

      if (existingGlobal) {
        console.log(`✅ ${phase}: Registro global já existe (id: ${existingGlobal.id})`);
      } else {
        // Criar registro global
        const globalRecord = await prisma.phaseInfo.create({
          data: {
            phase: phase,
            isGlobal: true,
            companyId: null,
            heyzineEmbedUrl: firstRecord.heyzineEmbedUrl,
            howToProceed: firstRecord.howToProceed,
          },
        });
        console.log(`✨ ${phase}: Registro global criado (id: ${globalRecord.id})`);
      }

      // 3. Atualizar registros antigos para manter apenas checklistState
      for (const record of phaseRecords) {
        await prisma.phaseInfo.update({
          where: { id: record.id },
          data: {
            heyzineEmbedUrl: null,
            howToProceed: null,
            isGlobal: false,
          },
        });
      }
      console.log(
        `🔄 ${phase}: ${phaseRecords.length} registro(s) atualizado(s) para manter apenas checklist.`
      );
    }

    console.log("\n✅ Migração concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migratePhaseInfoToGlobal();
