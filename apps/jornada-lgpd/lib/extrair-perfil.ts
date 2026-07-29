// Extração do Perfil a partir do site oficial da instituição.
//
// Pipeline (receita comprovada no lgpd-pgp, versão em miniatura):
//   1. mapSite() descobre as URLs do site → escolhemos até 3 páginas candidatas
//      por palavra-chave (contato, gabinete/prefeito, LGPD/privacidade,
//      transparência) além da própria home.
//   2. scrapeMany() → markdown das páginas.
//   3. Gemini extrai APENAS os campos do perfil, em JSON estrito
//      (thinkingBudget: 0 — thinking come o budget e trunca o JSON).
//   4. sanitize: só chaves conhecidas de CAMPOS_PERFIL, strings aparadas,
//      UF normalizada. O que a IA não achou NÃO vem — nada de chute.
//
// O resultado é SUGESTÃO: quem grava é o gestor, revisando o form e salvando.

import { GoogleGenAI } from "@google/genai";
import { mapSite, scrapeUrlToMarkdown } from "./firecrawl";
import { CAMPOS_PERFIL } from "./perfil";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export interface ExtracaoPerfil {
  /** campo do perfil → valor sugerido (só os que a IA achou no texto) */
  sugestoes: Record<string, string>;
  /** URLs efetivamente lidas (pra UI mostrar de onde veio) */
  fontesLidas: string[];
  /** erro fatal (nada extraído); erros parciais são silenciosos */
  erro: string | null;
}

// Palavras-chave → páginas que costumam ter os dados do perfil.
// Ordem = prioridade; pegamos no máximo 1 URL por grupo, 3 no total.
const GRUPOS_CANDIDATOS: RegExp[] = [
  /lgpd|privacidade|protecao-de-dados|encarregado/i,
  /contato|fale-?conosco|ouvidoria|atendimento/i,
  // cuidado: "prefeit" solto casa com QUALQUER notícia "prefeitura-de-x-inaugura..."
  /gabinete|\/(o-)?prefeito\b|vice-prefeito|president|estrutura-organizacional|institucional|quem-somos/i,
];

function escolherCandidatas(urls: string[], home: string): string[] {
  const homeUrl = new URL(home);
  const escolhidas: string[] = [];
  for (const re of GRUPOS_CANDIDATOS) {
    const achada = urls.find(
      (u) =>
        re.test(u) &&
        !escolhidas.includes(u) &&
        // só páginas do mesmo domínio e que não sejam arquivos
        u.includes(homeUrl.hostname) &&
        !/\.(pdf|jpg|jpeg|png|gif|zip|docx?|xlsx?)($|\?)/i.test(u) &&
        // notícia não é página institucional ("prefeito-anuncia-aumento...")
        !/noticia|detalhe-da-materia|\/materia\/|\/info\/|imprensa/i.test(u),
    );
    if (achada) escolhidas.push(achada);
  }
  return escolhidas;
}

function buildPrompt(): string {
  const campos = CAMPOS_PERFIL.filter((c) => c.campo !== "site") // site = a própria URL colada
    .map((c) => `- "${c.campo}": ${c.label} (ex.: ${c.placeholder})`)
    .join("\n");
  return `Você está lendo páginas do site oficial de uma instituição pública brasileira para preencher o cadastro dela num sistema de adequação à LGPD.

REGRAS RÍGIDAS:
1. Só preencha um campo se a informação estiver LITERAL ou muito próxima no texto. NUNCA invente.
2. Se a informação não está no texto, OMITA a chave (não retorne "", null nem "não encontrado").
3. "uf" = sigla de 2 letras maiúsculas. "cnpj" no formato como aparece no site.
4. "autoridadeNome"/"autoridadeCargo" = o chefe do órgão (prefeito, presidente...). Não confunda com secretários ou com o encarregado.
5. "dpoNome"/"dpoEmail"/"dpoTelefone" = o Encarregado de Proteção de Dados (DPO). Preencha SOMENTE se o texto usar a palavra "encarregado" ou "DPO" ligada ao dado. E-mail/telefone de ouvidoria, SIC ou atendimento geral NÃO servem — nesse caso OMITA os três campos "dpo...". O telefone geral da instituição NUNCA é "dpoTelefone".
6. "tipo" = uma palavra ou duas: Prefeitura, Câmara Municipal, Autarquia, Tribunal, Secretaria Estadual...
7. "canalTitularUrl" = link de formulário/página onde o TITULAR de dados exerce direitos LGPD, se existir.

CAMPOS (retorne APENAS estas chaves, num JSON plano):
${campos}

Retorne APENAS o JSON, sem markdown nem comentários.`;
}

const CAMPOS_PERFIL_KEYS: string[] = CAMPOS_PERFIL.map((c) => c.campo);

function sanitize(raw: any): Record<string, string> {
  const conhecidos = new Set<string>(CAMPOS_PERFIL_KEYS);
  const limpo: Record<string, string> = {};
  if (!raw || typeof raw !== "object") return limpo;
  for (const [k, v] of Object.entries(raw)) {
    if (!conhecidos.has(k)) continue;
    if (typeof v !== "string") continue;
    let val = v.trim();
    if (!val || /não (encontrad|informad|const)/i.test(val)) continue;
    if (k === "uf") {
      val = val.toUpperCase().slice(0, 2);
      if (!/^[A-Z]{2}$/.test(val)) continue;
    }
    if (k === "dpoEmail" && !val.includes("@")) continue;
    limpo[k] = val.slice(0, 300);
  }
  // Rede de segurança anti-chute nos campos do encarregado (a IA insiste em
  // promover a ouvidoria a DPO): e-mail de setor genérico não passa, e sem um
  // NOME de encarregado o telefone é quase sempre o geral da casa — melhor
  // âmbar do que errado.
  if (limpo.dpoEmail && /^(ouvidoria|contato|faleconosco|sic|esic|gabinete|atendimento|imprensa)@/i.test(limpo.dpoEmail)) {
    delete limpo.dpoEmail;
  }
  if (!limpo.dpoNome) {
    delete limpo.dpoTelefone;
    // ...exceto e-mail que é claramente da função, mesmo sem nome publicado.
    if (limpo.dpoEmail && !/^(dpo|lgpd|encarregad|privacidade|protecao)/i.test(limpo.dpoEmail)) {
      delete limpo.dpoEmail;
    }
  }
  return limpo;
}

export async function extrairPerfilDoSite(siteUrl: string): Promise<ExtracaoPerfil> {
  const home = /^https?:\/\//.test(siteUrl) ? siteUrl : `https://${siteUrl}`;
  try {
    new URL(home);
  } catch {
    return { sugestoes: {}, fontesLidas: [], erro: "Endereço inválido — cole o site completo (ex.: www.prefeitura.gov.br)." };
  }

  // 1+2. Home e mapa em PARALELO (sites de prefeitura com Wordfence levam 30s+
  // pra responder; o orçamento total precisa caber nos 60s da rota):
  //   t0: scrape da home (até 38s) ‖ map (até 15s)
  //   map pronto → scrape das candidatas (até 20s)
  const homePromise = scrapeUrlToMarkdown(home, { timeoutMs: 38_000 });
  const mapa = await mapSite(home, { limit: 150, timeoutMs: 15_000 });
  const candidatas = mapa.error ? [] : escolherCandidatas(mapa.urls, home);
  const [homeResult, ...candidatasResult] = await Promise.all([
    homePromise,
    ...candidatas.map((u) => scrapeUrlToMarkdown(u, { timeoutMs: 20_000 })),
  ]);
  const resultados = [homeResult, ...candidatasResult];
  const lidas = resultados.filter((r) => !r.error && r.markdown.trim());
  if (lidas.length === 0) {
    return {
      sugestoes: {},
      fontesLidas: [],
      erro: `Não consegui ler o site (${resultados[0]?.error ?? "sem conteúdo"}). Confira o endereço ou preencha manualmente.`,
    };
  }

  let corpus = lidas
    .map((r) => `\n\n===== PÁGINA: ${r.url} =====\n${r.markdown}`)
    .join("");
  if (corpus.length > 45_000) corpus = corpus.slice(0, 45_000) + "\n[...truncado...]";

  // 3. Gemini — extração JSON estrita
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return { sugestoes: {}, fontesLidas: [], erro: "GOOGLE_API_KEY não configurada" };
  const ai = new GoogleGenAI({ apiKey });

  let bruto: any = null;
  try {
    const resp = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: `${buildPrompt()}\n\n--- CONTEÚDO DO SITE ---${corpus}` }] }],
      config: {
        temperature: 0.1,
        maxOutputTokens: 2_000,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    bruto = JSON.parse(resp.text ?? "{}");
  } catch (e: any) {
    return { sugestoes: {}, fontesLidas: lidas.map((r) => r.url), erro: `A leitura falhou (${e?.message ?? "erro na IA"}). Tente de novo em instantes.` };
  }

  const sugestoes = sanitize(bruto);
  // O site oficial é a própria URL que a pessoa colou.
  sugestoes.site = sugestoes.site ?? home.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return { sugestoes, fontesLidas: lidas.map((r) => r.url), erro: null };
}
