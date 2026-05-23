// Hero visual do Quiz Diagnóstico LGPD — SVG inline, sem dependência externa.
// Composição: escudo com cadeado (LGPD), círculos de proteção, gradient azul→roxo.

export function QuizHero({ subtitle }: { subtitle?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-5 py-8 text-white shadow-lg">
      {/* Padrão geométrico de fundo */}
      <svg
        className="absolute inset-0 h-full w-full opacity-10"
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Círculos decorativos */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
      <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-purple-400/20 blur-3xl" aria-hidden />

      <div className="relative flex items-center gap-4">
        {/* Ícone escudo + cadeado */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-2 ring-white/40 backdrop-blur">
          <svg
            className="h-9 w-9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            {/* Escudo */}
            <path d="M12 2 L4 5 V12 C 4 16.5 7 20 12 22 C 17 20 20 16.5 20 12 V5 Z" />
            {/* Cadeado dentro */}
            <rect x="9" y="11" width="6" height="5" rx="0.5" />
            <path d="M10 11 V9 a2 2 0 0 1 4 0 V11" />
          </svg>
        </div>

        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-100">
            Diagnóstico Inicial
          </div>
          <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">
            Quiz LGPD
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-blue-100/90 sm:text-base">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Linha de chip-rótulos LGPD */}
      <div className="relative mt-5 flex flex-wrap gap-2 text-[11px] font-medium">
        <span className="rounded-full bg-white/15 px-2.5 py-1 ring-1 ring-white/20">
          📚 Princípios
        </span>
        <span className="rounded-full bg-white/15 px-2.5 py-1 ring-1 ring-white/20">
          ⚖️ Bases Legais
        </span>
        <span className="rounded-full bg-white/15 px-2.5 py-1 ring-1 ring-white/20">
          👥 Personagens
        </span>
        <span className="rounded-full bg-white/15 px-2.5 py-1 ring-1 ring-white/20">
          🛡️ Direitos do Titular
        </span>
        <span className="rounded-full bg-white/15 px-2.5 py-1 ring-1 ring-white/20">
          🚩 Fases do PGP
        </span>
      </div>
    </div>
  );
}
