"use client";

/**
 * Modo leitura overlay (Checkpoint 23).
 *
 * Abre uma tela cheia tipo Notion/Medium pra ler o conteúdo extenso da
 * fase em tipografia caprichada (serif, espaçamento generoso, sem
 * distrações). Reduz fadiga em fases com muito texto explicativo.
 *
 * Estratégia de captura do conteúdo:
 *  - Lê DOM direto via `document.querySelector` pelos `data-phase-section-id`
 *    e `[data-tour-id="phase-practical"]` que já existem (CP19/CP21).
 *  - Não precisa de nova API ou prop drilling — qualquer fase com
 *    PhaseSection é compatível automaticamente.
 *
 * Persistência de preferências:
 *  - Tema (sépia/claro/escuro) e tamanho de fonte (16/19/22) em localStorage.
 *
 * Atalhos:
 *  - Esc → fecha
 *  - A−/A+ no header → ajusta tamanho de fonte
 *  - Botões de tema no header → alterna entre 3 modos
 */

import { useEffect, useMemo, useState } from "react";
import { BookOpen, X } from "lucide-react";

type Theme = "sepia" | "light" | "dark";
type FontSize = 16 | 19 | 22;

interface ReadingSection {
  id: string;
  title: string;
  /** HTML interno da seção (já parseado, sem o header colapsável). */
  html: string;
}

interface PhaseReaderModeProps {
  phase: string;
}

const STORAGE_THEME = "pgp:phase-reader:theme";
const STORAGE_FONT = "pgp:phase-reader:font";

export default function PhaseReaderMode({ phase }: PhaseReaderModeProps) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("sepia");
  const [fontSize, setFontSize] = useState<FontSize>(19);
  const [sections, setSections] = useState<ReadingSection[]>([]);

  // Carrega preferências salvas
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const t = window.localStorage.getItem(STORAGE_THEME);
      if (t === "sepia" || t === "light" || t === "dark") setTheme(t);
      const f = Number(window.localStorage.getItem(STORAGE_FONT));
      if (f === 16 || f === 19 || f === 22) setFontSize(f);
    } catch {
      // silencioso
    }
  }, []);

  // Salva preferências
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_THEME, theme);
      window.localStorage.setItem(STORAGE_FONT, String(fontSize));
    } catch {
      // silencioso
    }
  }, [theme, fontSize]);

  // Quando abre: captura o conteúdo da página em snapshot.
  function handleOpen() {
    const captured = captureSections();
    setSections(captured);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  // Atalhos: Esc fecha, +/- ajustam fonte
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e.code === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setFontSize((f) => (f === 16 ? 19 : 22));
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setFontSize((f) => (f === 22 ? 19 : 16));
      }
    };
    window.addEventListener("keydown", handler);
    // Trava o scroll do body enquanto overlay tá aberto
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="Abrir modo leitura imersivo (foco no conteúdo)"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors"
      >
        <BookOpen className="h-3.5 w-3.5" />
        Modo leitura
      </button>

      {open && (
        <ReaderOverlay
          phase={phase}
          sections={sections}
          theme={theme}
          fontSize={fontSize}
          onClose={handleClose}
          onChangeTheme={setTheme}
          onChangeFontSize={setFontSize}
        />
      )}
    </>
  );
}

// ============================================================
// Captura DOM → seções legíveis
// ============================================================

/**
 * Itera todas as `<section data-phase-section-id="...">` da página e
 * extrai (1) o título do botão de header e (2) o conteúdo do body
 * (parágrafos, listas, etc.). Pega também o card de "Coloque em prática"
 * via `[data-tour-id="phase-practical"]`. Ignora elementos do próprio
 * componente (toolbars, botões internos).
 */
function captureSections(): ReadingSection[] {
  if (typeof document === "undefined") return [];
  const out: ReadingSection[] = [];

  // 1. PhaseSections (descrição, considerações, checklist, documentação)
  const sectionEls = Array.from(
    document.querySelectorAll<HTMLElement>("[data-phase-section-id]")
  );
  for (const el of sectionEls) {
    const id = el.getAttribute("data-phase-section-id") ?? "section";
    // Título: pega o primeiro <h2> dentro do <button>
    const title =
      el.querySelector("button h2")?.textContent?.trim() ??
      sectionTitleFallback(id);
    // Conteúdo: tudo que NÃO é o botão header
    const bodyHtml = extractBodyHtml(el);
    out.push({ id, title, html: bodyHtml });
  }

  // 2. Card "Coloque em prática" (CP21)
  const practical = document.querySelector<HTMLElement>(
    '[data-tour-id="phase-practical"]'
  );
  if (practical) {
    const title = "Coloque em prática";
    const bodyHtml = extractBodyHtml(practical);
    out.push({ id: "practical", title, html: bodyHtml });
  }

  return out;
}

function sectionTitleFallback(id: string): string {
  switch (id) {
    case "descricao":     return "Descrição da Fase";
    case "checklist":     return "Checklist de Implementação";
    case "documentacao":  return "Documentação da Fase";
    default:              return id;
  }
}

/** Clona o elemento e remove botões/inputs/elementos interativos. */
function extractBodyHtml(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement;
  // Remove o botão header (que é o trigger do accordion)
  const headerBtn = clone.querySelector(":scope > button");
  if (headerBtn) headerBtn.remove();
  // Remove botões e inputs interativos remanescentes
  for (const sel of ["button", "input", "textarea", "select", "[role=\"button\"]"]) {
    clone.querySelectorAll(sel).forEach((node) => node.remove());
  }
  // Remove elementos com role=presentation que costumam ser decoração
  clone.querySelectorAll("[aria-hidden=\"true\"]").forEach((node) => node.remove());
  return clone.innerHTML;
}

// ============================================================
// Overlay
// ============================================================

interface ReaderOverlayProps {
  phase: string;
  sections: ReadingSection[];
  theme: Theme;
  fontSize: FontSize;
  onClose: () => void;
  onChangeTheme: (t: Theme) => void;
  onChangeFontSize: (s: FontSize) => void;
}

function ReaderOverlay({
  phase,
  sections,
  theme,
  fontSize,
  onClose,
  onChangeTheme,
  onChangeFontSize,
}: ReaderOverlayProps) {
  const themeStyles = useMemo(() => themeToStyles(theme), [theme]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Modo leitura — ${phase}`}
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{ backgroundColor: themeStyles.bg, color: themeStyles.fg }}
    >
      {/* Top bar */}
      <div
        className="sticky top-0 backdrop-blur border-b px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap"
        style={{
          backgroundColor: themeStyles.barBg,
          borderColor: themeStyles.barBorder,
          color: themeStyles.barFg,
        }}
      >
        <div className="flex items-center gap-2 text-sm">
          <BookOpen className="h-4 w-4" />
          <span className="font-medium">Modo leitura</span>
          <span className="opacity-60">·</span>
          <span className="opacity-90 truncate max-w-[40vw]">{phaseTitle(phase)}</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Font size */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onChangeFontSize(16)}
              title="Tamanho menor"
              className="px-2 py-1 rounded text-xs hover:bg-black/10 dark:hover:bg-white/10"
              style={fontSize === 16 ? { boxShadow: `inset 0 0 0 1px ${themeStyles.barFg}` } : undefined}
            >
              A−
            </button>
            <button
              onClick={() => onChangeFontSize(19)}
              title="Tamanho médio"
              className="px-2 py-1 rounded text-sm hover:bg-black/10 dark:hover:bg-white/10"
              style={fontSize === 19 ? { boxShadow: `inset 0 0 0 1px ${themeStyles.barFg}` } : undefined}
            >
              A
            </button>
            <button
              onClick={() => onChangeFontSize(22)}
              title="Tamanho maior"
              className="px-2 py-1 rounded text-base hover:bg-black/10 dark:hover:bg-white/10"
              style={fontSize === 22 ? { boxShadow: `inset 0 0 0 1px ${themeStyles.barFg}` } : undefined}
            >
              A+
            </button>
          </div>
          {/* Theme */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onChangeTheme("sepia")}
              title="Sépia"
              className="px-2 py-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
              style={theme === "sepia" ? { boxShadow: `inset 0 0 0 1px ${themeStyles.barFg}` } : undefined}
            >
              📜
            </button>
            <button
              onClick={() => onChangeTheme("light")}
              title="Claro"
              className="px-2 py-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
              style={theme === "light" ? { boxShadow: `inset 0 0 0 1px ${themeStyles.barFg}` } : undefined}
            >
              ☀
            </button>
            <button
              onClick={() => onChangeTheme("dark")}
              title="Escuro"
              className="px-2 py-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
              style={theme === "dark" ? { boxShadow: `inset 0 0 0 1px ${themeStyles.barFg}` } : undefined}
            >
              🌙
            </button>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ backgroundColor: themeStyles.btnBg, color: themeStyles.btnFg }}
          >
            <X className="h-3.5 w-3.5" />
            Fechar (Esc)
          </button>
        </div>
      </div>

      {/* Scrollable area */}
      <div className="overflow-y-auto h-[calc(100vh-56px)]">
        <article
          className="phase-reader-content max-w-2xl mx-auto px-6 sm:px-8 py-10 sm:py-12"
          style={{ fontSize: `${fontSize}px` }}
        >
          {sections.length === 0 ? (
            <p className="text-center opacity-60 italic">Nenhum conteúdo capturado nesta fase.</p>
          ) : (
            sections.map((s, i) => (
              <section key={s.id} className="mb-10" style={{ pageBreakInside: "avoid" }}>
                {i > 0 && <hr className="my-10 opacity-30" />}
                <h2 className="font-semibold mb-3" style={{ fontSize: `${fontSize + 6}px` }}>
                  {s.title}
                </h2>
                <div
                  className="phase-reader-html"
                  dangerouslySetInnerHTML={{ __html: s.html }}
                />
              </section>
            ))
          )}

          <p
            className="text-center text-xs italic mt-12 pt-6 border-t opacity-60"
            style={{ borderColor: themeStyles.barBorder }}
          >
            Pressione <kbd className="px-1.5 py-0.5 rounded" style={{ backgroundColor: themeStyles.barBg }}>Esc</kbd>{" "}
            pra voltar · use <kbd className="px-1.5 py-0.5 rounded" style={{ backgroundColor: themeStyles.barBg }}>+</kbd>/<kbd className="px-1.5 py-0.5 rounded" style={{ backgroundColor: themeStyles.barBg }}>−</kbd>{" "}
            pra ajustar fonte
          </p>
        </article>
      </div>

      <style jsx global>{`
        .phase-reader-content {
          font-family: Georgia, "Iowan Old Style", "Times New Roman", serif;
          line-height: 1.85;
        }
        .phase-reader-content p { margin: 0 0 1.4em 0; }
        .phase-reader-content h2,
        .phase-reader-content h3,
        .phase-reader-content h4 {
          margin-top: 1.6em;
          margin-bottom: 0.5em;
          font-weight: 600;
          line-height: 1.3;
        }
        .phase-reader-content h3 { font-size: 1.2em; }
        .phase-reader-content h4 { font-size: 1.1em; }
        .phase-reader-content ul,
        .phase-reader-content ol {
          margin: 0 0 1.4em 0;
          padding-left: 1.5em;
        }
        .phase-reader-content li { margin-bottom: 0.5em; line-height: 1.7; }
        .phase-reader-content strong { font-weight: 600; }
        .phase-reader-content em { font-style: italic; }
        .phase-reader-content blockquote {
          border-left: 4px solid currentColor;
          opacity: 0.85;
          padding: 0.5em 1em;
          margin: 1.4em 0;
          font-style: italic;
        }
        /* Esconde o controle do accordion residual (botão chevron, etc.) */
        .phase-reader-content button,
        .phase-reader-content input,
        .phase-reader-content [role="button"] { display: none !important; }
      `}</style>
    </div>
  );
}

// ============================================================
// Helpers visuais
// ============================================================

function themeToStyles(theme: Theme) {
  if (theme === "sepia") {
    return {
      bg: "#faf6ed",
      fg: "#3a2e1f",
      barBg: "rgba(250, 246, 237, 0.92)",
      barFg: "#5a4422",
      barBorder: "rgba(120, 80, 30, 0.18)",
      btnBg: "#5a4422",
      btnFg: "#faf6ed",
    };
  }
  if (theme === "light") {
    return {
      bg: "#ffffff",
      fg: "#1f2937",
      barBg: "rgba(255, 255, 255, 0.92)",
      barFg: "#374151",
      barBorder: "#e5e7eb",
      btnBg: "#1f2937",
      btnFg: "#ffffff",
    };
  }
  // dark
  return {
    bg: "#0f172a",
    fg: "#e5e7eb",
    barBg: "rgba(15, 23, 42, 0.92)",
    barFg: "#cbd5e1",
    barBorder: "rgba(255, 255, 255, 0.12)",
    btnBg: "#cbd5e1",
    btnFg: "#0f172a",
  };
}

function phaseTitle(phase: string): string {
  switch (phase) {
    case "entendendo-pgp":  return "Entendendo o PGP";
    case "fase-preliminar": return "Fase Preliminar — Sensibilização";
    case "fase-1":          return "Fase 1 — Formação das Equipes";
    case "fase-2":          return "Fase 2 — Diagnóstico";
    case "fase-3":          return "Fase 3 — Mapeamento e Riscos";
    case "fase-4":          return "Fase 4 — GAP Analysis";
    case "fase-5":          return "Fase 5 — Plano de Ação";
    case "fase-6":          return "Fase 6 — Execução";
    case "fase-7":          return "Fase 7 — Monitoramento";
    default:                return phase;
  }
}
