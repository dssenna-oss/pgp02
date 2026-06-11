"use client";

import { useEffect, useState } from "react";
import { KeyRound, Copy, Check, ExternalLink, ShieldAlert, Smartphone, Bookmark } from "lucide-react";

function qrSrc(data: string, size = 240): string {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=${size}x${size}&margin=2`;
}

export function AcessoRapido({ email }: { email: string }) {
  const [senha, setSenha] = useState("");
  const [origin, setOrigin] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  // O link de auto-login. A senha fica só no '#' (fragmento) — não vai pro
  // servidor nem pros logs; o /login a lê, entra, e limpa o hash da URL.
  const url =
    origin && email && senha
      ? `${origin}/login#email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}&auto=1`
      : "";

  async function copiar() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* clipboard indisponível — o usuário pode copiar manualmente */
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <KeyRound className="h-6 w-6 text-indigo-600" /> Acesso rápido do facilitador
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Sua sessão agora dura <strong>30 dias</strong> — você loga raramente. E quando precisar
          (aparelho novo, sessão expirada), este atalho entra com <strong>um toque</strong>, sem digitar.
        </p>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        {/* Passo 1 — email (já é o seu, só confirmar) */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            1 · Seu login
          </label>
          <input
            value={email}
            readOnly
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          />
        </div>

        {/* Passo 2 — senha (fica só no navegador) */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            2 · Sua senha
          </label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="digite sua senha pra gerar o atalho"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </div>

        {/* Resultado — só aparece com a senha preenchida */}
        {url ? (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 mb-3">
              3 · Seu atalho de 1 toque
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <img
                src={qrSrc(url, 240)}
                alt="QR de acesso rápido"
                className="h-40 w-40 shrink-0 rounded-lg bg-white p-1.5 ring-1 ring-indigo-200"
              />
              <div className="flex-1 min-w-0 space-y-2">
                <button
                  onClick={copiar}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiado ? "Copiado!" : "Copiar link"}
                </button>
                <a
                  href={url}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  <ExternalLink className="h-4 w-4" /> Testar (abre e entra)
                </a>
              </div>
            </div>

            <div className="mt-4 space-y-1.5 text-sm text-indigo-900">
              <p className="flex items-start gap-2">
                <Smartphone className="h-4 w-4 shrink-0 mt-0.5" />
                <span><strong>No tablet/celular:</strong> escaneie o QR → no navegador, menu → “Adicionar à tela inicial”. Vira um ícone que loga sozinho.</span>
              </p>
              <p className="flex items-start gap-2">
                <Bookmark className="h-4 w-4 shrink-0 mt-0.5" />
                <span><strong>No notebook:</strong> “Copiar link” → salve nos favoritos. Um clique e está dentro.</span>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Digite a senha acima pra gerar o QR e o link.</p>
        )}

        {/* Aviso honesto de segurança */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            Este atalho <strong>contém sua senha</strong> — use só nos <strong>seus</strong> aparelhos.
            A senha não passa pelo servidor (fica no “#” do endereço), mas qualquer um com o link/QR
            entra como você. Em aparelho emprestado, prefira digitar.
          </span>
        </div>
      </div>
    </div>
  );
}
