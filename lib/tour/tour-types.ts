/**
 * Tipos do tour de onboarding (Checkpoint 20).
 *
 * O tour mestre é um array de passos. Cada passo:
 *  - Tem um identificador estável (`id`) usado também como nome do MP3
 *  - Pode ou não destacar um elemento via spotlight (`targetSelector`)
 *  - Quando `targetSelector` é definido mas o elemento não existe na DOM
 *    (ex.: item DPO-only pra um Contribuidor), o passo é pulado automaticamente.
 */

/**
 * Identificadores de roteiro disponíveis. `master` é o tour mestre que
 * apresenta o app inteiro (auto-disparado no 1º login). Os demais são
 * tours curtos por fase, disparados manualmente pelo botão "Tour desta
 * fase" presente em cada página de fase.
 */
export type TourScriptId =
  | "master"
  | "entendendo-pgp"
  | "fase-preliminar"
  | "fase-1"
  | "fase-2"
  | "fase-3"
  | "fase-4"
  | "fase-5"
  | "fase-6"
  | "fase-7";

export interface TourStep {
  /** ID estável — vira o nome do MP3 (`/tour-audio/<id>.mp3`). */
  id: string;
  /** Título exibido no painel. */
  title: string;
  /** Texto narrado (também aparece como transcrição). */
  text: string;
  /** Caminho público do MP3. */
  audioSrc: string;
  /**
   * Seletor CSS do elemento a destacar. Suporta `[data-tour-id="..."]`.
   * Se omitido, não há spotlight (passo de tela cheia).
   */
  targetSelector?: string;
}

export interface TourState {
  isOpen: boolean;
  scriptId: TourScriptId | null;
  steps: TourStep[];
  /** Índice do passo atual em `steps` (após filtragem de pulados). */
  currentIndex: number;
  isPlaying: boolean;
}
