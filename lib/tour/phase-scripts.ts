/**
 * Roteiros dos tours por fase (Checkpoint 20 — Fatia 3).
 *
 * Cada fase tem um tour curto de 3 passos (~1min total) focado em:
 *  1. Boas-vindas — o que essa fase representa no programa
 *  2. Conteúdo didático — spotlight na seção "descricao" da fase
 *  3. Coloque em prática — spotlight no card "phase-practical" (mini-app)
 *
 * Disparados manualmente pelo botão "Tour desta fase" em cada página
 * (não auto-disparam, ao contrário do tour mestre).
 *
 * Targets:
 *  - `[data-phase-section-id="descricao"]` — accordion da Descrição (CP19).
 *  - `[data-tour-id="phase-practical"]` — Card "Coloque em prática".
 */

import { TourStep, TourScriptId } from "./tour-types";

const SECTION_DESCRICAO = '[data-phase-section-id="descricao"]';
const PHASE_PRACTICAL = '[data-tour-id="phase-practical"]';

function buildPhaseScript(
  scriptId: TourScriptId,
  intro: string,
  conteudo: string,
  pratica: string
): TourStep[] {
  return [
    {
      id: `${scriptId}-01-intro`,
      title: "Sobre esta fase",
      text: intro,
      audioSrc: `/tour-audio/${scriptId}-01-intro.mp3`,
    },
    {
      id: `${scriptId}-02-conteudo`,
      title: "Conteúdo didático",
      text: conteudo,
      audioSrc: `/tour-audio/${scriptId}-02-conteudo.mp3`,
      targetSelector: SECTION_DESCRICAO,
    },
    {
      id: `${scriptId}-03-pratica`,
      title: "Coloque em prática",
      text: pratica,
      audioSrc: `/tour-audio/${scriptId}-03-pratica.mp3`,
      targetSelector: PHASE_PRACTICAL,
    },
  ];
}

export const PHASE_TOURS: Record<Exclude<TourScriptId, "master">, TourStep[]> = {
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
