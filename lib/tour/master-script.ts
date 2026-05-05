/**
 * Roteiro do tour mestre (Checkpoint 20 — Fatia 1).
 *
 * 8 passos que apresentam o app pra um usuário novo:
 *  1. Boas-vindas
 *  2. Sidebar (visão geral da navegação)
 *  3. Fases (pilar didático)
 *  4. Análise de Riscos (ferramenta DPO-only — pulado pra Contribuidor)
 *  5. Plano de Ação (ações rastreáveis)
 *  6. Políticas (instrumentos formais — DPO-only)
 *  7. Maturidade do PGP (painel executivo — DPO-only)
 *  8. Fechamento (botão pra refazer)
 *
 * Passos com `targetSelector` apontando pra elemento que não existe na DOM
 * (papel sem permissão) são automaticamente pulados pelo provider.
 */

import { TourStep } from "./tour-types";

export const MASTER_TOUR: TourStep[] = [
  {
    id: "01-welcome",
    title: "Bem-vindo ao PGP",
    text: "Olá! Bem-vindo ao Programa de Governança em Privacidade. Este tour vai te apresentar as principais funcionalidades em poucos minutos. Você pode pausar ou pular a qualquer momento.",
    audioSrc: "/tour-audio/01-welcome.mp3",
  },
  {
    id: "02-sidebar",
    title: "Sua barra de navegação",
    text: "Esta é a sua barra de navegação. Por aqui você acessa todas as ferramentas do programa: as fases didáticas, o inventário de processos, a análise de riscos, e os instrumentos formais.",
    audioSrc: "/tour-audio/02-sidebar.mp3",
    targetSelector: '[data-tour-id="sidebar"]',
  },
  {
    id: "03-fases",
    title: "Fases do programa",
    text: "O programa é dividido em fases sequenciais, da preliminar até a sétima. Cada fase tem conteúdo didático, checklist, documentação e uma ferramenta nativa pra colocar em prática. Avance no seu ritmo.",
    audioSrc: "/tour-audio/03-fases.mp3",
    targetSelector: '[data-tour-id="nav-fase-preliminar"]',
  },
  {
    id: "04-riscos",
    title: "Análise automática",
    text: "A partir do Inventário, o sistema gera análise de riscos, GAP Analysis e diagnóstico de privacidade automaticamente. Você não precisa preencher tudo manualmente.",
    audioSrc: "/tour-audio/04-riscos.mp3",
    targetSelector: '[data-tour-id="nav-riscos"]',
  },
  {
    id: "05-plano",
    title: "Plano de Ação central",
    text: "Cada pendência identificada vira uma ação no Plano de Ação. Acompanhe prazos, responsáveis, prioridades, e exporte evidências para a auditoria da ANPD.",
    audioSrc: "/tour-audio/05-plano.mp3",
    targetSelector: '[data-tour-id="nav-plano-acao"]',
  },
  {
    id: "06-politicas",
    title: "Instrumentos formais",
    text: "Quando o programa amadurece, você publica políticas, RIPDs, contratos com terceiros e a Política do PGP — todos os documentos exigidos pela ANPD.",
    audioSrc: "/tour-audio/06-politicas.mp3",
    targetSelector: '[data-tour-id="nav-politicas"]',
  },
  {
    id: "07-maturidade",
    title: "Painel de Maturidade",
    text: "O Painel de Maturidade mostra o estágio do programa em tempo real, com cinco pilares ponderados, status das oito fases e pendências críticas pra resolver.",
    audioSrc: "/tour-audio/07-maturidade.mp3",
    targetSelector: '[data-tour-id="nav-maturidade"]',
  },
  {
    id: "08-fechamento",
    title: "Pronto pra começar",
    text: "Você pode refazer este tour a qualquer momento pelo botão flutuante no canto inferior direito. Boas práticas e ótima jornada no PGP!",
    audioSrc: "/tour-audio/08-fechamento.mp3",
  },
];
