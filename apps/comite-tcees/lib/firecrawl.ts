/**
 * Wrapper minimalista da API REST do Firecrawl (v1).
 *
 * Firecrawl é um serviço que faz scraping com browser real (Playwright +
 * proxies residenciais), o que resolve dois problemas comuns em sites
 * públicos brasileiros:
 *   1. Sites com Wordfence / Cloudflare bloqueiam User-Agents de
 *      datacenter (curl, fetch nativo). Firecrawl passa.
 *   2. Atos normativos em CMS WordPress carregam o conteúdo via JS
 *      depois do pageload. Firecrawl executa o JS e captura.
 *
 * Doc oficial: https://docs.firecrawl.dev/api-reference/endpoint/scrape
 *
 * Uso:
 *   const md = await scrapeUrlToMarkdown("https://...");
 *   if (md) { ... }
 *
 * Em caso de erro (rede, 4xx/5xx, timeout), retorna `null` em vez de
 * lançar — o caller decide se segue sem essa URL ou sinaliza ao user.
 */

const FIRECRAWL_BASE = "https://api.firecrawl.dev";

export interface FirecrawlScrapeResult {
  url: string;
  markdown: string;
  title: string | null;
  /** Erro string-friendly se a tentativa falhou (HTTP/timeout/auth). */
  error: string | null;
}

/**
 * Faz scrape de uma URL e retorna markdown limpo.
 *
 * Firecrawl tem 2 endpoints úteis:
 *   - `/v1/scrape`  → 1 URL, síncrono (até ~30s)
 *   - `/v1/crawl`   → vários paths a partir de 1 raiz, assíncrono
 *
 * Pra esse uso (Inventário) basta o `scrape` síncrono.
 */
export async function scrapeUrlToMarkdown(
  url: string,
  opts: { timeoutMs?: number } = {},
): Promise<FirecrawlScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return {
      url,
      markdown: "",
      title: null,
      error: "FIRECRAWL_API_KEY não configurada",
    };
  }

  const timeoutMs = opts.timeoutMs ?? 30_000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(`${FIRECRAWL_BASE}/v1/scrape`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return {
        url,
        markdown: "",
        title: null,
        error: `HTTP ${res.status}${txt ? ` — ${txt.slice(0, 200)}` : ""}`,
      };
    }

    const json = (await res.json()) as {
      success?: boolean;
      data?: {
        markdown?: string;
        metadata?: { title?: string };
      };
      error?: string;
    };

    if (!json.success || !json.data?.markdown) {
      return {
        url,
        markdown: "",
        title: null,
        error: json.error ?? "Resposta inesperada do Firecrawl",
      };
    }

    return {
      url,
      markdown: json.data.markdown,
      title: json.data.metadata?.title ?? null,
      error: null,
    };
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

/**
 * Faz scrape de várias URLs em paralelo. Falhas individuais são
 * preservadas no array (com `error != null`) — o caller decide se ignora
 * ou avisa o user.
 */
export async function scrapeMany(
  urls: string[],
  opts: { timeoutMs?: number } = {},
): Promise<FirecrawlScrapeResult[]> {
  return Promise.all(urls.map((u) => scrapeUrlToMarkdown(u, opts)));
}

// ============================================================
// /v1/map — descobrir URLs de um site (mais leve que scrape)
// ============================================================

export interface FirecrawlMapResult {
  /** URLs descobertas no site (até `limit`). */
  urls: string[];
  /** Erro string-friendly se a tentativa falhou. */
  error: string | null;
}

/**
 * Mapeia o site dado a partir do domínio raiz e retorna URLs
 * descobertas. Endpoint `/v1/map` do Firecrawl é MUITO mais barato
 * que scrape — só lista URLs, não processa conteúdo.
 *
 * Uso típico: alimentar o auto-descobrir do modal "Pré-preencher por
 * Carta de Serviços" — user cola só o domínio (ou pega de
 * `Company.institutionalDomain`) e o sistema descobre URLs candidatas
 * pra carta de serviços, ouvidoria, SIC, LGPD, etc.
 *
 * `domain` aceita string com ou sem protocolo (normaliza pra https://).
 *
 * `limit` define quantas URLs retornar (default 500). Pra reduzir custo
 * em sites grandes, baixar pra 100-200 já cobre os links institucionais
 * típicos da home/menus.
 */
export async function mapSite(
  domain: string,
  opts: { timeoutMs?: number; limit?: number; search?: string } = {},
): Promise<FirecrawlMapResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return {
      urls: [],
      error: "FIRECRAWL_API_KEY não configurada",
    };
  }

  // Normaliza pra URL completa
  const url = /^https?:\/\//.test(domain)
    ? domain
    : `https://${domain}`;

  const timeoutMs = opts.timeoutMs ?? 30_000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(`${FIRECRAWL_BASE}/v1/map`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        limit: opts.limit ?? 500,
        ...(opts.search ? { search: opts.search } : {}),
      }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return {
        urls: [],
        error: `HTTP ${res.status}${txt ? ` — ${txt.slice(0, 200)}` : ""}`,
      };
    }

    const json = (await res.json()) as {
      success?: boolean;
      links?: string[];
      error?: string;
    };

    if (!json.success || !Array.isArray(json.links)) {
      return {
        urls: [],
        error: json.error ?? "Resposta inesperada do Firecrawl /v1/map",
      };
    }

    return {
      urls: json.links,
      error: null,
    };
  } catch (e: any) {
    return {
      urls: [],
      error: e?.name === "AbortError" ? "Timeout" : (e?.message ?? "Erro de rede"),
    };
  } finally {
    clearTimeout(timer);
  }
}
