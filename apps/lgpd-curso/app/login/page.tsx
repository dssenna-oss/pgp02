"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Brand } from "@/components/brand";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [veioDoQr, setVeioDoQr] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // QR Code do crachá codifica `/login#email=<email-do-papel>`.
  // Lemos o hash no mount e pré-preenchemos o campo email, agilizando o login
  // no curso presencial (~36 participantes em paralelo). Senha continua manual.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.slice(1); // remove "#"
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const emailFromQr = params.get("email");
    if (emailFromQr) {
      setEmail(decodeURIComponent(emailFromQr));
      setVeioDoQr(true);
      // foca direto no campo senha (skip email)
      setTimeout(() => passwordRef.current?.focus(), 100);
      // limpa o hash da URL pra não vazar email se compartilhar a aba
      try { history.replaceState(null, "", window.location.pathname); } catch {}
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Bem-vindo(a)!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border rounded-xl shadow-sm p-6">
        <div className="flex justify-center mb-4">
          <Brand />
        </div>
        <h1 className="text-lg font-semibold text-center mb-1">Entrar</h1>
        <p className="text-xs text-gray-500 text-center mb-5">
          {veioDoQr
            ? "Email preenchido pelo QR do seu crachá — só digite a senha."
            : "Escaneie o QR Code do crachá ou digite manualmente."}
        </p>
        {veioDoQr && (
          <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900">
            ✓ Identificado pelo QR Code. Digite a senha pra entrar.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu email do crachá"
              className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Senha</label>
            <input
              ref={passwordRef}
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="informada pelo facilitador"
              className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-4 text-[11px] text-center text-gray-500">
          Sem login? Procure o facilitador. <br />
          Senhas e cadastros são gerados pela turma.
        </div>
      </div>
    </div>
  );
}
