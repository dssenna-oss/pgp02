/**
 * Utilitários da coleta digital de Termo de Consentimento (S2).
 *
 * Lib server-side (usa node:crypto). Cada função tem propósito único e
 * é testável puro — sem dependências externas.
 */

import { createHash } from "crypto";

/**
 * SHA-256 hex do conteúdo do termo na hora do aceite. Garante que o
 * controlador pode provar EXATAMENTE qual texto o titular viu, mesmo
 * que o termo tenha sido republicado depois.
 */
export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Normaliza email: lowercase + trim. Retorna null se for inválido.
 * Regex simples — não tenta ser RFC 5322 completo. Pega 99% dos casos
 * sem rejeitar emails legítimos.
 */
export function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const e = raw.trim().toLowerCase();
  if (e.length < 5 || e.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

/**
 * Normaliza CPF (só dígitos) e valida os 2 dígitos verificadores.
 * Retorna o CPF "limpo" (11 dígitos) ou null se inválido.
 *
 * Algoritmo:
 *   1. Strip pra só dígitos. Precisa ter exatamente 11.
 *   2. Rejeita sequências repetidas (00000000000, 11111111111, ...).
 *   3. Calcula 1º DV: soma(d[i] * (10-i)) pra i=0..8, mod 11. Se >= 10, DV=0.
 *   4. Calcula 2º DV: soma(d[i] * (11-i)) pra i=0..9, mod 11. Se >= 10, DV=0.
 *   5. Compara com d[9] e d[10].
 */
export function normalizeCpf(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cpf = raw.replace(/\D/g, "");
  if (cpf.length !== 11) return null;
  if (/^(\d)\1{10}$/.test(cpf)) return null; // todos iguais

  const digits = cpf.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  let dv1 = (sum * 10) % 11;
  if (dv1 >= 10) dv1 = 0;
  if (dv1 !== digits[9]) return null;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
  let dv2 = (sum * 10) % 11;
  if (dv2 >= 10) dv2 = 0;
  if (dv2 !== digits[10]) return null;

  return cpf;
}

/**
 * Extrai o IP real do request, considerando que estamos atrás do
 * Vercel/CDN (que põe `x-forwarded-for`). Se houver múltiplos IPs
 * (proxies em cadeia), pega o primeiro (o do client original).
 *
 * Fallback: "0.0.0.0" se não conseguir extrair. Nunca devolve null
 * pra simplificar o caller — o IP é evidência, melhor ter "0.0.0.0"
 * que crashar.
 */
export function extractClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "0.0.0.0";
}

/**
 * Extrai o user-agent. Defensivo: trunca em 1000 chars (UA típico tem
 * 100-300 chars; 1000 cobre 99% incluindo edge cases sem encher
 * o banco com bots maliciosos enviando UA gigante).
 */
export function extractUserAgent(req: Request): string {
  const ua = req.headers.get("user-agent") ?? "";
  return ua.slice(0, 1000);
}

/** Mascara CPF/email pra UI pública (LGPD princípio da minimização). */
export function maskCpf(cpf: string | null | undefined): string {
  if (!cpf) return "";
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}
