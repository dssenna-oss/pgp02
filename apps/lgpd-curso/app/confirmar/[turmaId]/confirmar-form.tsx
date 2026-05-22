"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export function ConfirmarPresencaForm({ turmaId }: { turmaId: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<{ jaConfirmado: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch("/api/curso/confirmar-presenca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turmaId, email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErro(data?.error || `Erro ${res.status}`);
        return;
      }
      setSucesso({ jaConfirmado: !!data.jaConfirmado });
    } catch (err: any) {
      setErro(err.message || "Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (sucesso) {
    return (
      <div className="text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-emerald-900 mb-1">
          {sucesso.jaConfirmado ? "Presença já confirmada" : "Presença confirmada!"}
        </h2>
        <p className="text-sm text-gray-600">
          {sucesso.jaConfirmado
            ? "Sua presença já estava registrada. Tudo certo — nos vemos no curso!"
            : "Tudo certo! Sua presença está registrada. Nos vemos no curso."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs font-medium text-gray-700">Seu e-mail</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="o e-mail da sua inscrição"
          className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
        />
      </div>

      {erro && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {erro}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md transition-colors"
      >
        {loading ? "Confirmando..." : "Confirmar minha presença"}
      </button>
    </form>
  );
}
