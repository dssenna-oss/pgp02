"use client";

// Painel Multi-Perfil — facilitador escolhe um papel da turma e gera URL
// com email+senha pré-preenchidos + auto-submit, pra colar em janela
// anônima e demonstrar o app como aquele participante em segundos.
//
// 3 botões por papel:
// - 📋 Copiar URL pronta (Ctrl+Shift+N → Ctrl+V → Enter)
// - 🚀 Abrir em popup (mesmo navegador — sobrescreve sessão do facilitador!)
// - 📋 Copiar credenciais (formato "email · senha" pra colar onde quiser)

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft, Copy, Check, ExternalLink, Eye, KeyRound,
  AlertTriangle, ChevronRight, UserCircle2,
} from "lucide-react";

type Papel = {
  papel: string;
  nomeAmigavel: string;
  responsabilidade: string;
  email: string | null;
};
type Grupo = {
  grupoId: string;
  numero: number;
  orgao: "PM" | "CM";
  companyName: string;
  papeis: Papel[];
};

export function DemoMultiPerfilView({
  turma,
  grupos,
}: {
  turma: { nome: string; slug: string; cidade: string; senhaExibicao: string | null };
  grupos: Grupo[];
}) {
  const [grupoAberto, setGrupoAberto] = useState<string | null>(
    grupos[0]?.grupoId ?? null,
  );
  const [copiou, setCopiou] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const senha = turma.senhaExibicao;

  function montarUrlAutoLogin(email: string): string {
    if (!senha) return `${baseUrl}/login#email=${encodeURIComponent(email)}`;
    return `${baseUrl}/login#email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}&auto=1`;
  }

  async function copiar(texto: string, idChave: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiou(idChave);
      setTimeout(() => setCopiou(null), 2000);
    } catch {
      toast.error("Falha ao copiar — copie manualmente do título do botão.");
    }
  }

  function abrirPopup(email: string) {
    if (!senha) {
      toast.error("Defina a senha da turma primeiro (botão 🔑 Senha de acesso na sidebar).");
      return;
    }
    const url = montarUrlAutoLogin(email);
    // Popup pequeno, sem barra de menu — mas COMPARTILHA cookies com a aba
    // do facilitador. Vai sobrescrever a sessão do facilitador. Aviso embutido.
    const ok = confirm(
      `⚠️ Abrir como ${email}?\n\n` +
      `Isso vai SOBRESCREVER a sua sessão de facilitador no navegador atual.\n` +
      `Pra demos paralelas SEM perder a sessão, use o botão "📋 Copiar URL pronta" + cole em Ctrl+Shift+N.`
    );
    if (!ok) return;
    window.open(url, "_blank", "popup=yes,width=1200,height=800");
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        href="/facilitador"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-3"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar ao Painel
      </Link>

      <div className="mb-1 text-xs uppercase tracking-wide text-gray-500 font-semibold">
        Facilitador · Demonstração ao vivo
      </div>
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <UserCircle2 className="h-6 w-6 text-blue-600" />
        Login Rápido — {turma.nome}
      </h1>
      <p className="text-sm text-gray-600 mt-1">
        Acesse rapidamente como qualquer papel da turma <strong>{turma.nome}</strong> pra
        demonstrar o app ao vivo. Recomendado: <strong>copiar URL pronta + colar em janela
        anônima</strong> (Ctrl+Shift+N) — sua sessão de facilitador continua ativa em paralelo.
      </p>

      {/* Aviso senha não cadastrada */}
      {!senha && (
        <div className="mt-4 rounded-md border-l-4 border-l-red-500 border border-red-200 bg-red-50 p-3 text-xs text-red-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Senha da turma não cadastrada</div>
              <p>
                As URLs com auto-login só funcionam se você definir a senha visível
                desta turma. Use o widget <strong>🔑 Senha de acesso</strong> na sidebar do
                facilitador. Enquanto isso, só os links com email pré-preenchido funcionam
                (senha será pedida no /login).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Caixa de senha (cópia rápida) */}
      {senha && (
        <div className="mt-4 rounded-md border-l-4 border-l-emerald-500 border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <KeyRound className="h-4 w-4 text-emerald-700 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-emerald-900">Senha desta turma</div>
              <code className="text-sm font-mono text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                {senha}
              </code>
            </div>
            <button
              type="button"
              onClick={() => copiar(senha, "senha-turma")}
              className="text-xs px-2 py-1 rounded border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100"
            >
              {copiou === "senha-turma" ? "✓ Copiada" : "Copiar"}
            </button>
          </div>
        </div>
      )}

      {/* Instruções */}
      <div className="mt-4 rounded-md border bg-blue-50/50 border-blue-200 p-3 text-xs text-blue-900">
        <div className="font-semibold mb-1.5">💡 Fluxo recomendado pra demo paralela</div>
        <ol className="space-y-0.5 ml-4 list-decimal">
          <li>Escolha um papel abaixo</li>
          <li>Clica <strong>📋 Copiar URL pronta</strong></li>
          <li>Pressiona <kbd className="px-1 py-0.5 bg-white border rounded text-[10px]">Ctrl+Shift+N</kbd> (janela anônima)</li>
          <li>Cola na barra de endereço (<kbd className="px-1 py-0.5 bg-white border rounded text-[10px]">Ctrl+V</kbd>) + Enter</li>
          <li>App loga automaticamente — sua aba de facilitador continua intacta</li>
        </ol>
      </div>

      {/* Grupos como accordion */}
      <div className="mt-6 space-y-3">
        {grupos.map((grupo) => {
          const aberto = grupoAberto === grupo.grupoId;
          const corOrgao = grupo.orgao === "PM" ? "emerald" : "blue";
          return (
            <div
              key={grupo.grupoId}
              className={`rounded-lg border-l-4 ${
                corOrgao === "emerald" ? "border-l-emerald-500" : "border-l-blue-500"
              } border bg-white`}
            >
              <button
                type="button"
                onClick={() => setGrupoAberto(aberto ? null : grupo.grupoId)}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    aberto ? "rotate-90" : ""
                  }`}
                />
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-gray-900">
                    {grupo.orgao === "PM" ? "🛕" : "🏛"} Grupo {grupo.numero} · {grupo.orgao}
                  </div>
                  <div className="text-xs text-gray-500">{grupo.companyName}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                  {grupo.papeis.filter((p) => p.email).length} papéis
                </span>
              </button>

              {aberto && (
                <div className="border-t bg-gray-50/50">
                  <div className="divide-y">
                    {grupo.papeis.map((papel) => {
                      if (!papel.email) return null;
                      const url = montarUrlAutoLogin(papel.email);
                      const credenciaisTxt = senha
                        ? `${papel.email} · ${senha}`
                        : papel.email;
                      const chaveCopia = `${grupo.grupoId}-${papel.papel}`;
                      return (
                        <div key={papel.papel} className="px-4 py-3">
                          <div className="flex items-start gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900">
                                {papel.nomeAmigavel}
                              </div>
                              <code className="text-[11px] font-mono text-gray-600 break-all">
                                {papel.email}
                              </code>
                              <p className="text-[11px] text-gray-500 mt-0.5 italic">
                                {papel.responsabilidade}
                              </p>
                            </div>
                            <div className="flex gap-1.5 flex-wrap shrink-0">
                              <button
                                type="button"
                                onClick={() => copiar(url, `url-${chaveCopia}`)}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-blue-300 bg-white text-blue-800 hover:bg-blue-50"
                                title="Copia URL com email+senha pré-preenchidos e auto-submit. Cole em Ctrl+Shift+N."
                              >
                                {copiou === `url-${chaveCopia}` ? (
                                  <><Check className="h-3 w-3" /> Copiada</>
                                ) : (
                                  <><Copy className="h-3 w-3" /> URL pronta</>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => copiar(credenciaisTxt, `cred-${chaveCopia}`)}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                title="Copia 'email · senha' formatado pra colar onde quiser"
                              >
                                {copiou === `cred-${chaveCopia}` ? (
                                  <><Check className="h-3 w-3" /> Copiado</>
                                ) : (
                                  <><KeyRound className="h-3 w-3" /> Credenciais</>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => abrirPopup(papel.email!)}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                title="⚠️ Abre popup que sobrescreve a sua sessão de facilitador (use com cuidado)"
                              >
                                <ExternalLink className="h-3 w-3" /> Popup
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rodapé com lembrete */}
      <div className="mt-6 text-xs text-gray-500 italic">
        <Eye className="h-3 w-3 inline mr-1" />
        URLs e credenciais são geradas pra esta turma específica ({turma.slug}).
        Não compartilhe fora do ambiente do curso.
      </div>
    </div>
  );
}
