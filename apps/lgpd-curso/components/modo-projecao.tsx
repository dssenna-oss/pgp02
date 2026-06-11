"use client";

// Modo Projeção — botão flutuante no canto superior direito que ativa um
// modo de visualização otimizado pra projeção em telão de retroprojetor:
//   • Esconde a sidebar (conteúdo ocupa quase 100% da largura)
//   • Aumenta fontes em ~30% (font-size 130% no <html>, escala tudo que usa rem)
//   • Esconde elementos com classe .esconder-em-projecao (rodapés, dicas)
//   • Banner verde no topo confirma o modo ativo
//
// Estado persistido em localStorage por origem — sobrevive a F5 e a logout/login.
// Funciona em todas as rotas autenticadas (plugado no AuthedLayout).

import { useEffect, useState } from "react";
import { Projector, X } from "lucide-react";

const STORAGE_KEY = "modo-projecao-ativo";

export function ModoProjecao() {
  const [ativo, setAtivo] = useState(false);
  const [hidratado, setHidratado] = useState(false);
  // Modo EMBED (?projecao=1 na URL): a página está dentro do iframe do Telão
  // Comandado — aplica o modo (sidebar oculta, fontes ampliadas) SEM banner,
  // sem botão flutuante e sem persistir no localStorage.
  const [embed, setEmbed] = useState(false);

  // 1º mount: lê localStorage e aplica classe no <html>
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("projecao") === "1") {
        setEmbed(true);
        document.documentElement.classList.add("modo-projecao");
        setHidratado(true);
        return;
      }
      const salvo = localStorage.getItem(STORAGE_KEY) === "1";
      setAtivo(salvo);
      if (salvo) document.documentElement.classList.add("modo-projecao");
    } catch {}
    setHidratado(true);
  }, []);

  // Toda vez que ativo mudar: aplica/remove classe + persiste.
  // No modo embed a classe é fixa (gerida pelo 1º efeito) — não mexe.
  useEffect(() => {
    if (!hidratado || embed) return;
    try {
      if (ativo) {
        document.documentElement.classList.add("modo-projecao");
        localStorage.setItem(STORAGE_KEY, "1");
      } else {
        document.documentElement.classList.remove("modo-projecao");
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, [ativo, hidratado, embed]);

  // Evita flash de conteúdo errado no 1º render do servidor.
  // No modo embed (iframe do telão) não renderiza UI nenhuma.
  if (!hidratado || embed) return null;

  return (
    <>
      {/* Banner verde no topo — só quando ativo */}
      {ativo && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-emerald-600 text-white text-sm py-1.5 px-4 flex items-center justify-center gap-3 shadow-md">
          <Projector className="h-4 w-4" />
          <span className="font-semibold">Modo Projeção ativo</span>
          <span className="hidden sm:inline opacity-90">
            — fontes ampliadas e sidebar oculta. Clique X pra sair.
          </span>
          <button
            type="button"
            onClick={() => setAtivo(false)}
            className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-xs font-medium"
            aria-label="Sair do Modo Projeção"
          >
            <X className="h-3.5 w-3.5" /> Sair
          </button>
        </div>
      )}

      {/* Botão flutuante — sempre visível pra ligar.
          Quando ativo, banner verde acima já oferece o "Sair" mais visível;
          o FAB também muda pra refletir o estado mas fica discreto. */}
      <button
        type="button"
        onClick={() => setAtivo((v) => !v)}
        className={`fixed z-50 inline-flex items-center gap-1.5 rounded-full shadow-lg transition-all text-xs font-medium ${
          ativo
            ? "bottom-4 right-4 bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-2"
            : "bottom-4 right-4 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 px-3 py-2"
        }`}
        title={ativo ? "Sair do Modo Projeção" : "Ativar Modo Projeção (telão)"}
      >
        <Projector className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">
          {ativo ? "Modo Projeção" : "Modo Projeção"}
        </span>
      </button>
    </>
  );
}
