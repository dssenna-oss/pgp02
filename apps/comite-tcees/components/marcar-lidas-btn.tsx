"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function MarcarLidasBtn({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function marcar() {
    setLoading(true);
    const res = await fetch("/api/comite/notificacoes/marcar-lidas", { method: "POST" });
    setLoading(false);
    if (res.ok) {
      toast.success("Todas marcadas como lidas");
      router.refresh();
    } else {
      toast.error("Não foi possível atualizar");
    }
  }

  return (
    <button
      onClick={marcar}
      disabled={disabled || loading}
      className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-3.5 py-2 hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? "Atualizando…" : "Marcar todas como lidas"}
    </button>
  );
}
