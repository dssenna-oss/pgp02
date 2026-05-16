// Singleton do Prisma Client com retry automático em erros de conexão.
// Motivo: Neon free-tier suspende compute após inatividade. A primeira request
// fria falha com P1001 ou "kind: Closed" enquanto o compute acorda (10-20s
// observado em prod). Esta extension reexecuta queries que falham por conexão
// até 4x com backoff total ~13s. Rotas que usam queries críticas devem
// declarar `export const maxDuration = 30` pra absorver o pior cenário.

import { PrismaClient, Prisma } from "@prisma/client";

const RETRIABLE_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Database connection timed out
  "P1008", // Operations timed out
  "P1017", // Server closed the connection
]);

const RETRIABLE_MESSAGES = [
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "Closed",          // "kind: Closed" do driver quando Neon dormiu
  "timed out",
  "Connection terminated",
  "Server has closed",
];

function isRetriable(err: any): boolean {
  if (!err) return false;
  if (RETRIABLE_CODES.has(err.code)) return true;
  const msg = String(err.message ?? "");
  return RETRIABLE_MESSAGES.some((m) => msg.includes(m));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function createClient(): PrismaClient {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Middleware de retry para queries do Prisma Client.
  // 4 tentativas com backoff 2s/4s/7s (total ~13s de espera) — ajustado em
  // 2026-05-16 após bug onde o /facilitador estourava 500 com Neon dormindo.
  base.$use(async (params, next) => {
    const maxRetries = 4;
    const delaysMs = [0, 2000, 4000, 7000]; // antes da tentativa 1, 2, 3, 4
    let lastErr: any = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await next(params);
      } catch (err: any) {
        lastErr = err;
        if (!isRetriable(err) || attempt === maxRetries - 1) throw err;
        const delayMs = delaysMs[attempt + 1];
        console.warn(
          `[prisma] ${params.model}.${params.action} falhou (${err.code ?? "?"}). Reexecutando em ${delayMs}ms (tentativa ${attempt + 2}/${maxRetries}).`
        );
        await sleep(delayMs);
      }
    }
    throw lastErr;
  });

  return base;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
