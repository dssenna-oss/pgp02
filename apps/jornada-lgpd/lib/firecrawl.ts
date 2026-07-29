// Wrapper minimalista da API REST do Firecrawl (v1) — cópia enxuta do
// lib/firecrawl.ts do lgpd-pgp (se mudar lá, conferir aqui).
//
// Firecrawl raspa com browser real (executa JS, passa por Wordfence/Cloudflare),
// o que resolve os bloqueios típicos de site público brasileiro. Erros nunca
// lançam — voltam como `error` string pro caller decidir.

const FIRECRAWL_BASE = "https://api.firecrawl.dev";

export interface FirecrawlScrapeResult {
  url: string;
  markdown: string;
  title: string | null;
  error: string | null;
}

export async function scrapeUrlToMarkdown(
  url: string,
  opts: { timeoutMs?: number } = {},
): Promise<FirecrawlScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return { url, markdown: "", title: null, error: "FIRECRAWL_API_KEY não configurada" };

  const timeoutMs = opts.timeoutMs ?? 25_000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(`${FIRECRAWL_BASE}/v1/scrape`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: false }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { url, markdown: "", title: null, error: `HTTP ${res.status}${txt ? ` — ${txt.slice(0, 200)}` : ""}` };
    }
    const json = (await res.json()) as {
      success?: boolean;
      data?: { markdown?: string; metadata?: { title?: string } };
      error?: string;
    };
    if (!json.success || !json.data?.markdown) {
      return { url, markdown: "", title: null, error: json.error ?? "Resposta inesperada do Firecrawl" };
    }
    return { url, markdown: json.data.markdown, title: json.data.metadata?.title ?? null, error: null };
  } catch (e: any) {
    return {
      url,
      markdown: "",
      title: null,
      error: e?.name === "AbortError" ? "Timeout" : (e?.message ?? "Erro de rede"),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function scrapeMany(
  urls: string[],
  opts: { timeoutMs?: number } = {},
): Promise<FirecrawlScrapeResult[]> {
  return Promise.all(urls.map((u) => scrapeUrlToMarkdown(u, opts)));
}

export interface FirecrawlMapResult {
  urls: string[];
  error: string | null;
}

// /v1/map só lista as URLs do site (bem mais barato que scrape) — usado pra
// descobrir as páginas de contato/gabinete/LGPD a partir da home.
export async function mapSite(
  domain: string,
  opts: { timeoutMs?: number; limit?: number } = {},
): Promise<FirecrawlMapResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return { urls: [], error: "FIRECRAWL_API_KEY não configurada" };

  const url = /^https?:\/\//.test(domain) ? domain : `https://${domain}`;
  const timeoutMs = opts.timeoutMs ?? 20_000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(`${FIRECRAWL_BASE}/v1/map`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, limit: opts.limit ?? 150 }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { urls: [], error: `HTTP ${res.status}${txt ? ` — ${txt.slice(0, 200)}` : ""}` };
    }
    const json = (await res.json()) as { success?: boolean; links?: string[]; error?: string };
    if (!json.success || !Array.isArray(json.links)) {
      return { urls: [], error: json.error ?? "Resposta inesperada do Firecrawl /v1/map" };
    }
    return { urls: json.links, error: null };
  } catch (e: any) {
    return { urls: [], error: e?.name === "AbortError" ? "Timeout" : (e?.message ?? "Erro de rede") };
  } finally {
    clearTimeout(timer);
  }
}
