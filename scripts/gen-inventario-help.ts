/**
 * Gerador de FieldHelp pras perguntas do form de Inventário.
 *
 * Lê INVENTARIO_FORM_SCHEMA, identifica perguntas SEM `help` ainda preenchido,
 * e usa Gemini pra gerar rascunho seguindo o tom/estrutura das 4 perguntas
 * da Sec 1 (já feitas à mão como few-shot).
 *
 * Saída: arquivo JSON em scripts/_help-output-<sec>.json — pra eu (Claude)
 * revisar e mergear no schema depois. NÃO modifica o schema diretamente.
 *
 * Uso:
 *   npx tsx scripts/gen-inventario-help.ts sec2
 *   npx tsx scripts/gen-inventario-help.ts sec3
 *   npx tsx scripts/gen-inventario-help.ts all      # todas as seções faltantes
 *
 * Custo aproximado: ~500-1500 tokens out por pergunta. ~50 perguntas total
 * = ~75k tokens output. Em Gemini 2.5 Flash, $0.30/1M out → ~$0.02 (centavos).
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { generateText } from "../lib/llm";
import {
  INVENTARIO_FORM_SCHEMA,
  type FormSection,
  type FormField,
  type FieldHelp,
} from "../lib/inventario-form-schema";
import { MINI_APPS } from "../lib/inventario-mini-apps";

const VALID_MINI_APP_IDS = Object.keys(MINI_APPS);

// ============================================================
// FEW-SHOT — exemplos da Sec 1 que escrevi à mão
// ============================================================
const FEW_SHOT_EXAMPLES = [
  {
    pergunta: "Nome",
    tipo: "text-long",
    contextoSecao: "Sec 1 — Identificação do Respondente",
    output: {
      why: "Pra registrar quem foi a pessoa responsável por descrever este tratamento de dados. A LGPD exige que a empresa saiba quem trata cada informação dentro dela.",
      lgpd: {
        artigo: "Art. 37",
        resumo:
          "O controlador deve manter registro das operações de tratamento de dados pessoais.",
      },
      feedsInto: ["inventario", "ripd"],
    },
  },
  {
    pergunta:
      "Descreva de forma detalhada a finalidade do tratamento dos dados pessoais.",
    tipo: "text-long",
    contextoSecao: "Sec 2 — Identificação do Processo",
    output: {
      why: "A finalidade é o coração da LGPD. Precisa ser específica, legítima e clara — não pode ser genérica tipo 'pra melhorar serviços'. Sem finalidade bem descrita, todo o tratamento fica vulnerável em auditoria.",
      lgpd: {
        artigo: "Art. 6º, I",
        resumo:
          "Princípio da finalidade — o tratamento deve ter propósitos legítimos, específicos, explícitos e informados ao titular.",
      },
      feedsInto: [
        "inventario",
        "riscos",
        "diagnostico",
        "ripd",
        "politica-privacidade",
      ],
      criticidade: "alta",
      exemplos: [
        "Bom: 'Selecionar candidatos a estágio em escolas municipais, avaliando aderência ao perfil exigido pelo edital, durante o período de seleção pública'",
        "Ruim: 'Para uso interno' — vago demais",
        "Ruim: 'Para melhorar serviços' — não-finalidade, proibido pela LGPD",
      ],
    },
  },
];

// ============================================================
// PROMPT
// ============================================================
const SYSTEM_PROMPT = `Você é um especialista em LGPD (Lei nº 13.709/2018) escrevendo conteúdo de ajuda contextual pra um formulário de Inventário de Dados Pessoais usado por organizações públicas brasileiras (prefeituras, autarquias, órgãos).

Sua tarefa: pra cada pergunta do form, gerar um JSON com 4 campos:

1. "why": 1-2 frases curtas em português simples explicando POR QUE essa pergunta importa. Foco prático, sem juridiquês. Pode citar termos como "controlador", "operador", "titular", "dado pessoal", "dado sensível" — eles têm tooltip auto.
2. "lgpd": objeto { "artigo": string, "resumo": string } com o ARTIGO MAIS DIRETAMENTE relacionado da LGPD. "resumo" em 1 frase clara. Se não houver artigo específico, ainda assim aponte o mais próximo. Pode ser undefined em casos raros.
3. "feedsInto": array de ids dos mini-apps que essa resposta vai alimentar. Use APENAS estes ids: ${VALID_MINI_APP_IDS.join(", ")}. Sempre inclua "inventario". Pense quais documentos derivam da resposta — se trata de risco, "riscos"; se de finalidade ou consentimento, "politica-privacidade"; se de coleta/aviso ao titular, "politica-privacidade"; se de transferência ou compartilhamento, "contratos"; se de armazenamento/segurança, "politica-seguranca"; se de incidentes, "incidentes"; se de decisão automatizada ou risco alto, "ripd"; etc.
4. "criticidade" (opcional): "alta" se a pergunta toca em ponto de risco LGPD (dados sensíveis, crianças/adolescentes, transferência internacional, decisão automatizada, marketing direcionado, biometria, saúde). "media" se é importante mas não crítica. Omita se for rotineira.
5. "exemplos" (opcional): array de 2-4 strings curtas com exemplos práticos pra organização pública brasileira. Inclua só se "criticidade" for "alta" ou se a pergunta for ambígua e exemplos ajudarem o user a responder.

Tom: direto, prático, sem rodeio. Frases curtas. Em português brasileiro. Pode usar 1ª pessoa ("você"). Evite "deve-se", "faz-se necessário", "outrossim". Use "precisa", "ajuda", "serve pra".

IMPORTANTE: Responda APENAS com o JSON do "output". NADA antes ou depois. Sem markdown fence, sem comentário. Se incluir markdown fence eu vou parsear como erro.`;

function buildUserPrompt(field: FormField, sectionTitle: string): string {
  const partes = [
    `# Few-shot — exemplos do tom/estrutura esperados:`,
    ``,
    ...FEW_SHOT_EXAMPLES.map(
      (ex, i) =>
        `## Exemplo ${i + 1}\nSeção: ${ex.contextoSecao}\nPergunta: "${ex.pergunta}"\nTipo: ${ex.tipo}\n\nOutput esperado:\n${JSON.stringify(ex.output, null, 2)}`
    ),
    ``,
    `# Sua tarefa agora:`,
    ``,
    `Seção: ${sectionTitle}`,
    `Pergunta: "${field.label}"`,
    `Tipo: ${field.type}`,
    field.options
      ? `Opções de resposta: ${JSON.stringify(field.options)}`
      : "",
    field.description ? `Descrição auxiliar: ${field.description}` : "",
    ``,
    `Gere o JSON do output (e SOMENTE o JSON, sem markdown):`,
  ];
  return partes.filter(Boolean).join("\n");
}

// ============================================================
// LÓGICA
// ============================================================

function stripJsonFence(s: string): string {
  // Remove ```json e ``` se o modelo desobedecer
  return s
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

function validateHelp(obj: any, fieldId: string): FieldHelp | null {
  if (!obj || typeof obj !== "object") return null;
  if (typeof obj.why !== "string" || !obj.why.trim()) {
    console.warn(`  ⚠️  ${fieldId}: campo "why" inválido`);
    return null;
  }
  // feedsInto: filtra só ids válidos
  const feedsInto = Array.isArray(obj.feedsInto)
    ? obj.feedsInto.filter((id: any) => VALID_MINI_APP_IDS.includes(id))
    : ["inventario"];
  if (feedsInto.length === 0) feedsInto.push("inventario");

  const help: FieldHelp = {
    why: obj.why.trim(),
    feedsInto,
  };

  if (obj.lgpd?.artigo && obj.lgpd?.resumo) {
    help.lgpd = {
      artigo: String(obj.lgpd.artigo).trim(),
      resumo: String(obj.lgpd.resumo).trim(),
    };
  }
  if (obj.criticidade === "alta" || obj.criticidade === "media") {
    help.criticidade = obj.criticidade;
  }
  if (Array.isArray(obj.exemplos) && obj.exemplos.length > 0) {
    help.exemplos = obj.exemplos
      .filter((x: any) => typeof x === "string" && x.trim())
      .map((x: string) => x.trim());
    if (help.exemplos && help.exemplos.length === 0) delete help.exemplos;
  }
  return help;
}

async function generateForField(
  field: FormField,
  sectionTitle: string
): Promise<FieldHelp | null> {
  const userMessage = buildUserPrompt(field, sectionTitle);
  let raw: string;
  try {
    raw = await generateText({
      systemPrompt: SYSTEM_PROMPT,
      history: [],
      userMessage,
      temperature: 0.4, // baixo pra consistência de tom
      maxOutputTokens: 3000,
    });
  } catch (e: any) {
    console.error(`  ❌ ${field.id}: erro chamando LLM —`, e.message);
    return null;
  }
  const cleaned = stripJsonFence(raw);
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error(`  ❌ ${field.id}: não foi JSON válido. Raw: ${cleaned.slice(0, 200)}`);
    return null;
  }
  return validateHelp(parsed, field.id);
}

async function processSection(section: FormSection): Promise<Record<string, FieldHelp>> {
  const out: Record<string, FieldHelp> = {};
  const fieldsToProcess = section.fields.filter((f) => !f.help);
  console.log(
    `\n📋 ${section.title} — ${fieldsToProcess.length} de ${section.fields.length} pendente(s)`
  );
  if (fieldsToProcess.length === 0) {
    console.log("  ✅ Já 100% preenchido, pulando.");
    return out;
  }
  for (const field of fieldsToProcess) {
    process.stdout.write(`  → ${field.id}... `);
    const help = await generateForField(field, section.title);
    if (help) {
      out[field.id] = help;
      console.log("✓");
    } else {
      console.log("✗");
    }
  }
  return out;
}

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error(
      "Uso: npx tsx scripts/gen-inventario-help.ts <sec2|sec3|sec4|sec5|sec6|sec7|all>"
    );
    process.exit(1);
  }

  const sections = INVENTARIO_FORM_SCHEMA.filter(
    (s): s is FormSection => s.kind === "section"
  );

  const targets =
    target === "all" ? sections : sections.filter((s) => s.id === target);

  if (targets.length === 0) {
    console.error(`Seção '${target}' não encontrada. Disponíveis:`, sections.map((s) => s.id));
    process.exit(1);
  }

  for (const section of targets) {
    const out = await processSection(section);
    if (Object.keys(out).length === 0) continue;

    const outFile = path.join(
      __dirname,
      `_help-output-${section.id}.json`
    );
    fs.writeFileSync(outFile, JSON.stringify(out, null, 2), "utf-8");
    console.log(
      `\n💾 Salvo em: scripts/_help-output-${section.id}.json (${Object.keys(out).length} entradas)`
    );
  }

  console.log("\n✨ Pronto. Revisar JSON e aplicar manualmente no schema.");
}

main().catch((e) => {
  console.error("Erro fatal:", e);
  process.exit(1);
});
