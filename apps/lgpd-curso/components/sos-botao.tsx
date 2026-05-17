"use client";

// Botão SOS — fica na sidebar do participante. 1 clique → POST /api/curso/sos.
// Polling 8s pra refletir status do próprio chamado:
//   sem chamado    → botão neutro "Chamar facilitador"
//   PENDING        → botão pulsando + "Chamando... (há Xmin)"
//   ATTENDED       → "Facilitador a caminho ✓ (Xmin)"

import { useState, useEffect, useRef } from "react";
import { LifeBuoy, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type SosState = {
  id: string;
  status: "PENDING" | "ATTENDED" | "RESOLVED";
  createdAt: string;
  attendedAt: string | null;
} | null;

export function SosBotao() {
  const [estado, setEstado] = useState<SosState>(null);
  const [enviando, setEnviando] = useState(false);
  const [, setTick] = useState(0);
  const ultimoStatusRef = useRef<string | null>(null);

  async function carregar() {
    try {
      const res = await fetch("/api/curso/sos", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const novo = data.request as SosState;

      // Detecta transição PENDING → ATTENDED → mostra "Facilitador a caminho" via toast
      if (ultimoStatusRef.current === "PENDING" && novo?.status === "ATTENDED") {
        toast.success("Facilitador a caminho! 🙋‍♂️", { duration: 6000 });
      }
      ultimoStatusRef.current = novo?.status || null;
      setEstado(novo);
    } catch {}
  }

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 8000);
    // tick pro relógio "há Xmin" atualizar mesmo entre fetches
    const tickId = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => { clearInterval(id); clearInterval(tickId); };
  }, []);

  async function chamar() {
    if (estado) return; // já tem aberto
    setEnviando(true);
    try {
      const res = await fetch("/api/curso/sos", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao chamar facilitador");
        return;
      }
      setEstado(data.request);
      toast.success(
        data.novo
          ? "Facilitador chamado — alguém já vai aí! 🙋‍♂️"
          : "Vocês já chamaram — facilitador a caminho",
      );
    } catch (e: any) {
      toast.error(e.message);
    }
    setEnviando(false);
  }

  // Quanto tempo desde o pedido
  const minDesde = estado?.createdAt
    ? Math.max(0, Math.floor((Date.now() - new Date(estado.createdAt).getTime()) / 60000))
    : 0;

  const label =
    !estado ? "Chamar facilitador" :
    estado.status === "PENDING" ? `Chamando... (há ${minDesde}min)` :
    estado.status === "ATTENDED" ? `Facilitador a caminho (${minDesde}min)` :
    "Chamar facilitador";

  const Icon =
    !estado ? LifeBuoy :
    estado.status === "PENDING" ? Loader2 :
    CheckCircle2;

  return (
    <button
      type="button"
      onClick={chamar}
      disabled={enviando || !!estado}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors min-h-[44px] mb-1",
        !estado && "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
        estado?.status === "PENDING" && "bg-red-100 text-red-800 ring-2 ring-red-400 animate-pulse cursor-default",
        estado?.status === "ATTENDED" && "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400 cursor-default",
        enviando && "opacity-60 cursor-wait",
      )}
      title={estado ? "Aguarde o facilitador chegar" : "Chama o facilitador pra tirar dúvida do grupo"}
    >
      <Icon className={cn("h-4 w-4 shrink-0", estado?.status === "PENDING" && "animate-spin")} />
      <span className="flex-1 text-left truncate">{label}</span>
    </button>
  );
}
