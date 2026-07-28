"use client";

// Login por e-mail + senha. Depois de entrar, o middleware manda cada papel
// pra sua casa (GESTOR → /jornada · ADMIN → /admin).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function EntrarPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [senhaDefinida, setSenhaDefinida] = useState(false);

  useEffect(() => {
    setSenhaDefinida(new URLSearchParams(window.location.search).has("definida"));
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    const r = await signIn("credentials", { email, senha, redirect: false });
    setEnviando(false);
    if (r?.error) {
      setErro("E-mail ou senha não conferem. Confira e tente de novo.");
      return;
    }
    router.push("/jornada");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="text-2xl font-extrabold text-gray-900">Entrar</h1>
      <p className="mt-1 text-sm text-gray-500">Use o acesso enviado pelo Clube do Servidor.</p>
      {senhaDefinida && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          ✅ Senha criada com sucesso — entre com ela abaixo.
        </p>
      )}
      <form onSubmit={entrar} className="mt-5 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu e-mail"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
        />
        <input
          type="password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="sua senha"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
        />
        {erro && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-xl bg-teal-700 px-4 py-3 text-base font-bold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
