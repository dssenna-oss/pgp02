"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { Brand } from "@/components/brand";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
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
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-navy overflow-hidden">
      {/* Fundo institucional: foto da fachada do TCE-ES + camada azul */}
      <div
        className="absolute inset-0 bg-cover"
        style={{ backgroundImage: "url('/tcees-fachada.jpg')", backgroundPosition: "center 35%" }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, rgba(13,27,75,0.92) 0%, rgba(28,85,152,0.78) 55%, rgba(28,85,152,0.55) 100%)" }}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-sm bg-white border rounded-xl shadow-2xl p-6">
        <div className="flex justify-center mb-5">
          <Brand />
        </div>
        <h1 className="text-lg font-semibold text-center mb-1">Entrar</h1>
        <p className="text-xs text-gray-500 text-center mb-5">
          Comitê Executivo de Proteção de Dados Pessoais · TCEES
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu email institucional"
              className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Senha</label>
            <div className="relative mt-1">
              <input
                ref={passwordRef}
                type={mostrarSenha ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="sua senha"
                className="w-full px-3 py-2 pr-10 border rounded-md text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white rounded-md py-2.5 text-sm font-semibold hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
