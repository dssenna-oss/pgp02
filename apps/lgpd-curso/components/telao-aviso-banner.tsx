"use client";

// Banner "📺 No telão agora…" + acompanhamento do telão no celular do
// participante.
//
// Dois modos, conforme `autoSeguir` (= turma em Modo Cards / Modalidade C):
//   • autoSeguir = true  → o celular ESPELHA o telão: quando o facilitador
//     troca o que está projetado, o celular NAVEGA SOZINHO pra tela
//     correspondente (quando ela tem página própria — `href`). Sem toque.
//   • autoSeguir = false → comportamento clássico (Modalidade A): só mostra a
//     faixa e o participante DECIDE tocar pra abrir. Nunca arranca a tela de
//     quem está digitando.
// Comandos sem página própria no celular (`href` null: Guia estático,
// Fases 3-7 só-telão) nunca navegam — a faixa diz "acompanhe pelo telão".
// Polling leve do /api/curso/telao-aviso (a turma é derivada da sessão no
// servidor). Mesmo padrão do DsrAlertBanner.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Tv2, ChevronRight, X } from "lucide-react";

type Aviso = {
  comando: string;
  emoji: string;
  titulo: string;
  href: string | null;
};

const INTERVALO_MS = 5000; // espelho do telão precisa ser ágil

export function TelaoAvisoBanner() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [aviso, setAviso] = useState<Aviso | null>(null);
  // guarda o comando dispensado — se o facilitador trocar de conteúdo, o
  // banner novo volta a aparecer.
  const [dispensado, setDispensado] = useState<string | null>(null);

  // pathname e o último comando que JÁ navegamos vivem em refs pra serem lidos
  // dentro do setInterval sem rearmá-lo a cada navegação.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const ultimoComandoNavegado = useRef<string | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";
  const temGrupo = !!session?.user?.companyId;

  useEffect(() => {
    if (isAdmin || !temGrupo) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/curso/telao-aviso", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const av: Aviso | null = data?.aviso ?? null;
        setAviso(av);

        // Espelho do telão (Modo Cards): navega sozinho quando o comando MUDA
        // e a tela tem página própria. Só dispara na troca (não a cada poll),
        // pra não prender o participante numa só tela entre comandos.
        if (data?.autoSeguir && av?.href && av.comando !== ultimoComandoNavegado.current) {
          ultimoComandoNavegado.current = av.comando;
          if (pathnameRef.current !== av.href) router.push(av.href);
        } else {
          ultimoComandoNavegado.current = av?.comando ?? null;
        }
      } catch {}
    }
    load();
    const id = setInterval(load, INTERVALO_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [isAdmin, temGrupo, router]);

  // Não mostra: facilitador, sem grupo, nada no telão, dispensado, ou o
  // participante JÁ está na página apresentada.
  if (isAdmin || !temGrupo || !aviso) return null;
  if (dispensado === aviso.comando) return null;
  if (aviso.href && pathname === aviso.href) return null;

  const corpo = (
    <div className="flex items-center gap-3 max-w-7xl mx-auto">
      <Tv2 className="h-5 w-5 shrink-0 animate-pulse" />
      <div className="flex-1 text-sm">
        <strong>📺 No telão agora: {aviso.emoji} {aviso.titulo}</strong>
        {aviso.href ? " — toque para abrir no seu celular." : " — acompanhe pelo telão."}
      </div>
      {aviso.href && <ChevronRight className="h-4 w-4 shrink-0" />}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDispensado(aviso.comando);
        }}
        className="shrink-0 rounded p-1 hover:bg-white/20"
        aria-label="Dispensar aviso"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  const classes =
    "block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 border-b border-indigo-800 transition-colors";

  return aviso.href ? (
    <Link href={aviso.href} className={classes}>
      {corpo}
    </Link>
  ) : (
    <div className={classes.replace(" hover:bg-indigo-700", "")}>{corpo}</div>
  );
}
