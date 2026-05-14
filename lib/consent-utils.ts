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
 * Extrai o IP real do request considerando proxies em cadeia
 * (Vercel + Cloudflare + outros).
 *
 * Ordem de preferência:
 *   1. `cf-connecting-ip` — Cloudflare expõe o IP do client original
 *      direto. Quando presente, é a fonte mais confiável.
 *   2. `x-vercel-forwarded-for` — header do Vercel com o IP original
 *      do client (não inclui os proxies da própria Vercel).
 *   3. `x-forwarded-for` — lista RFC 7239 da direita-pra-esquerda:
 *      o último IP público (não-privado, não-loopback) é o client
 *      original. O 1º pode ser um proxy interno spoofável.
 *   4. `x-real-ip` — comum em Nginx.
 *
 * Fallback final: "0.0.0.0" pra nunca crashar — IP é evidência
 * importante mas não bloqueia o aceite.
 */
export function extractClientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp && isValidPublicIp(cfIp.trim())) return cfIp.trim();

  const vercelXff = req.headers.get("x-vercel-forwarded-for");
  if (vercelXff) {
    const pick = pickLastPublicIp(vercelXff);
    if (pick) return pick;
  }

  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const pick = pickLastPublicIp(xff);
    if (pick) return pick;
    // Se todos os IPs são privados (ex: dev local) cai no 1º só pra ter algo.
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();
  return "0.0.0.0";
}

/**
 * Varre a lista `x-forwarded-for` da direita pra esquerda e devolve o
 * último IP público válido. Pula loopback, redes privadas RFC 1918,
 * link-local, e IPv6 reservado.
 */
function pickLastPublicIp(headerValue: string): string | null {
  const parts = headerValue
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    if (isValidPublicIp(parts[i])) return parts[i];
  }
  return null;
}

/**
 * Heurística simples: rejeita loopback (127.x, ::1), RFC 1918
 * (10.x, 172.16-31.x, 192.168.x), link-local (169.254.x, fe80::),
 * e IPv6 unique-local (fc00::/7). Strings vazias e tokens inválidos
 * também retornam false.
 */
function isValidPublicIp(ip: string): boolean {
  if (!ip) return false;
  // Strip de porta opcional em IPv4 ("1.2.3.4:5678") — em IPv6 a sintaxe
  // com porta usa colchetes "[...]:port" que não tratamos aqui.
  const v4 = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?$/);
  if (v4) {
    const octets = v4[1].split(".").map(Number);
    if (octets.some((o) => Number.isNaN(o) || o < 0 || o > 255)) return false;
    if (octets[0] === 10) return false;
    if (octets[0] === 127) return false;
    if (octets[0] === 169 && octets[1] === 254) return false;
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return false;
    if (octets[0] === 192 && octets[1] === 168) return false;
    if (octets[0] === 0) return false;
    return true;
  }
  // IPv6 — checagem grosseira; aceita qualquer hex:hex... que não seja
  // loopback/link-local/unique-local.
  if (/^[0-9a-fA-F:]+$/.test(ip) && ip.includes(":")) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return false;
    if (lower.startsWith("fe80:")) return false;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return false;
    return true;
  }
  return false;
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
