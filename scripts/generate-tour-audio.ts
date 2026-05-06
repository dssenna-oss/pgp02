/**
 * scripts/generate-tour-audio.ts
 *
 * Gera os MP3s do tour de onboarding chamando a API ElevenLabs.
 *
 * Uso:
 *   npx ts-node --project tsconfig.json scripts/generate-tour-audio.ts
 *
 * Variáveis de ambiente necessárias (já em `.env`):
 *   - ELEVENLABS_API_KEY    (xi-api-key)
 *   - ELEVENLABS_VOICE_ID   (default: Bella — EXAVITQu4vr4xnSDxMaL)
 *   - ELEVENLABS_MODEL_ID   (default: eleven_multilingual_v2)
 *
 * Saída: `public/tour-audio/<id>.mp3` — 1 arquivo por passo.
 *
 * Idempotente: se o arquivo já existe e tem o mesmo `text` registrado em
 * `_manifest.json`, pula. Pra forçar re-geração: deletar o MP3 ou o manifesto.
 */

import "dotenv/config";
import { writeFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Roteiros inline pra evitar problema de ESM resolver com .ts extension.
// Mantenha sincronizado com `lib/tour/master-script.ts` e
// `lib/tour/phase-scripts.ts`.
type AudioStep = { id: string; text: string };

function buildPhaseScript(
  scriptId: string,
  intro: string,
  conteudo: string,
  pratica: string
): AudioStep[] {
  return [
    { id: `${scriptId}-01-intro`, text: intro },
    { id: `${scriptId}-02-conteudo`, text: conteudo },
    { id: `${scriptId}-03-pratica`, text: pratica },
  ];
}

const PHASE_TOURS: Record<string, AudioStep[]> = {
  "entendendo-pgp": buildPhaseScript(
    "entendendo-pgp",
    "Bem-vindo ao Entendendo o PGP. Aqui você conhece os fundamentos do Programa de Governança em Privacidade. É o ponto de partida pra entender o aplicativo.",
    "O conteúdo didático explica os princípios da LGPD, os papéis envolvidos e as etapas do programa de governança. Comece por aqui se for sua primeira vez.",
    "Aqui você acessa o Painel de Maturidade e a Política do PGP — os dois instrumentos que mostram o estágio atual do seu programa em tempo real."
  ),
  "fase-preliminar": buildPhaseScript(
    "fase-preliminar",
    "Bem-vindo à Fase Preliminar. Aqui você organiza a sensibilização e a capacitação da equipe sobre a LGPD. É o pré-requisito pras outras fases.",
    "O conteúdo didático aborda como engajar a diretoria, o RH e os colaboradores antes de começar o trabalho técnico do mapeamento.",
    "Registre eventos de capacitação em cinco eixos: onboarding, pílulas, prática, departamental e monitoramento. Tudo pra atender o artigo cinquenta e dois da LGPD."
  ),
  "fase-1": buildPhaseScript(
    "fase-1",
    "Bem-vindo à Fase um — Formação das Equipes. Aqui você estrutura quem faz o que no programa: encarregado, comitê e colaboradores.",
    "O conteúdo explica as responsabilidades de cada papel envolvido e como nomeá-los formalmente dentro da organização.",
    "Cadastre os contribuidores da organização, vincule a setores e veja quem participa do mapeamento de processos da Fase três."
  ),
  "fase-2": buildPhaseScript(
    "fase-2",
    "Bem-vindo à Fase dois — Diagnóstico de Privacidade. Aqui você mede a maturidade atual da organização antes de começar a executar.",
    "O conteúdo explica o que avaliar e como interpretar os resultados do diagnóstico inicial.",
    "Gere o Diagnóstico de Privacidade — score de zero a cem com quatro pilares ponderados e recomendações priorizadas pra ação."
  ),
  "fase-3": buildPhaseScript(
    "fase-3",
    "Bem-vindo à Fase três — Mapeamento e Análise de Riscos. Esta é a fase mais densa do programa. Aqui nasce o coração do PGP.",
    "O conteúdo cobre como entrevistar setores, documentar processos de tratamento e identificar riscos a cada operação com dados pessoais.",
    "Alimente o Inventário de Processos e a Análise de Riscos. Os dados aqui alimentam todas as ferramentas seguintes do programa."
  ),
  "fase-4": buildPhaseScript(
    "fase-4",
    "Bem-vindo à Fase quatro — GAP Analysis. Aqui você compara o estado atual da organização com as práticas exigidas pela LGPD.",
    "O conteúdo apresenta os domínios e controles avaliados pela matriz oficial usada pelo programa.",
    "Responda os cento e dezenove controles do GAP, organizados em vinte e oito domínios. O sistema gera score, recomendações e snapshots históricos."
  ),
  "fase-5": buildPhaseScript(
    "fase-5",
    "Bem-vindo à Fase cinco — Plano de Ação. Aqui você organiza as pendências detectadas em uma lista priorizada e rastreável.",
    "O conteúdo explica como definir responsáveis, prazos e prioridades pra cada ação institucional do programa.",
    "Importe ações do GAP, riscos e bases legais; depois acompanhe pelo cronograma com exportação pra Excel pra apresentar à diretoria."
  ),
  "fase-6": buildPhaseScript(
    "fase-6",
    "Bem-vindo à Fase seis — Execução. Aqui você publica os documentos formais exigidos pela ANPD.",
    "O conteúdo aborda os onze instrumentos do programa: políticas, RIPDs, contratos com terceiros e a Política do PGP.",
    "Gere políticas a partir de templates oficiais, conduza RIPDs estruturados e gerencie operadores com avaliação de risco."
  ),
  "fase-7": buildPhaseScript(
    "fase-7",
    "Bem-vindo à Fase sete — Monitoramento. Aqui o programa entra em modo contínuo de resposta a eventos críticos.",
    "O conteúdo explica como detectar incidentes, comunicar à ANPD em até setenta e duas horas e notificar os titulares afetados.",
    "Registre incidentes com workflow de sete estados, gere a comunicação à ANPD em formato Word e mantenha a timeline de evidências pra auditoria."
  ),
};

const MASTER_TOUR: AudioStep[] = [
  {
    id: "01-welcome",
    text: "Olá! Bem-vindo ao Programa de Governança em Privacidade. Este tour vai te apresentar as principais funcionalidades em poucos minutos. Você pode pausar ou pular a qualquer momento.",
  },
  {
    id: "02-sidebar",
    text: "Esta é a sua barra de navegação. Por aqui você acessa todas as ferramentas do programa: as fases didáticas, o inventário de processos, a análise de riscos, e os instrumentos formais.",
  },
  {
    id: "03-fases",
    text: "O programa é dividido em fases sequenciais, da preliminar até a sétima. Cada fase tem conteúdo didático, checklist, documentação e uma ferramenta nativa pra colocar em prática. Avance no seu ritmo.",
  },
  {
    id: "04-riscos",
    text: "A partir do Inventário, o sistema gera análise de riscos, GAP Analysis e diagnóstico de privacidade automaticamente. Você não precisa preencher tudo manualmente.",
  },
  {
    id: "05-plano",
    text: "Cada pendência identificada vira uma ação no Plano de Ação. Acompanhe prazos, responsáveis, prioridades, e exporte evidências para a auditoria da ANPD.",
  },
  {
    id: "06-politicas",
    text: "Quando o programa amadurece, você publica políticas, RIPDs, contratos com terceiros e a Política do PGP — todos os documentos exigidos pela ANPD.",
  },
  {
    id: "07-maturidade",
    text: "O Painel de Maturidade mostra o estágio do programa em tempo real, com cinco pilares ponderados, status das oito fases e pendências críticas pra resolver.",
  },
  {
    id: "08-fechamento",
    text: "Você pode refazer este tour a qualquer momento pelo botão flutuante no canto inferior direito. Boas práticas e ótima jornada no PGP!",
  },
];

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // Bella
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

if (!API_KEY) {
  console.error("ERRO: ELEVENLABS_API_KEY não definida em .env");
  process.exit(1);
}

const OUTPUT_DIR = path.join(process.cwd(), "public", "tour-audio");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "_manifest.json");

interface ManifestEntry {
  id: string;
  text: string;
  voiceId: string;
  modelId: string;
  generatedAt: string;
  bytes: number;
}

function loadManifest(): Record<string, ManifestEntry> {
  if (!existsSync(MANIFEST_PATH)) return {};
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveManifest(m: Record<string, ManifestEntry>) {
  writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2), "utf-8");
}

async function generateOne(stepId: string, text: string): Promise<Buffer> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`ElevenLabs ${res.status}: ${msg}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifest = loadManifest();
  let generated = 0;
  let skipped = 0;
  let totalChars = 0;

  // Concatena tour mestre + 9 tours por fase pra gerar tudo numa rodada.
  const ALL_STEPS: AudioStep[] = [
    ...MASTER_TOUR,
    ...Object.values(PHASE_TOURS).flat(),
  ];

  console.log(`Total: ${ALL_STEPS.length} passos (mestre + 9 fases).`);
  console.log(`Voz: ${VOICE_ID} · Modelo: ${MODEL_ID}\n`);

  for (const step of ALL_STEPS) {
    const outPath = path.join(OUTPUT_DIR, `${step.id}.mp3`);
    const existingEntry = manifest[step.id];
    const fileExists = existsSync(outPath);

    if (
      fileExists &&
      existingEntry &&
      existingEntry.text === step.text &&
      existingEntry.voiceId === VOICE_ID &&
      existingEntry.modelId === MODEL_ID
    ) {
      console.log(`✓ ${step.id} — já gerado (${existingEntry.bytes} bytes)`);
      skipped++;
      continue;
    }

    console.log(`→ ${step.id} (${step.text.length} chars)…`);
    try {
      const buf = await generateOne(step.id, step.text);
      writeFileSync(outPath, buf);
      manifest[step.id] = {
        id: step.id,
        text: step.text,
        voiceId: VOICE_ID,
        modelId: MODEL_ID,
        generatedAt: new Date().toISOString(),
        bytes: buf.length,
      };
      saveManifest(manifest);
      generated++;
      totalChars += step.text.length;
      console.log(`  ✓ ${buf.length} bytes salvos em ${outPath}`);
    } catch (err) {
      console.error(`  ✗ ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  }

  console.log(
    `\nResumo: ${generated} gerados, ${skipped} pulados, ${totalChars} chars consumidos.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
