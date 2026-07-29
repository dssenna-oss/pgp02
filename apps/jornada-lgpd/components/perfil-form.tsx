"use client";

// Form do Perfil com o atalho "buscar no site": cola a URL → a IA lê o site
// e SUGERE valores. Regras de segurança do desenho:
//   - só preenche campo VAZIO (nunca sobrescreve o que o gestor já digitou);
//   - sugestão fica destacada em âmbar até ser editada ou salva;
//   - nada vai pro banco sem o clique em "Salvar perfil".

import { useState } from "react";
import { Sparkles, LoaderCircle } from "lucide-react";
import { salvarPerfil } from "@/app/perfil/actions";

type Campo = { campo: string; label: string; placeholder: string; essencial: boolean };

export function PerfilForm({
  campos,
  iniciais,
}: {
  campos: Campo[];
  iniciais: Record<string, string>;
}) {
  const [valores, setValores] = useState<Record<string, string>>(iniciais);
  const [sugeridos, setSugeridos] = useState<Set<string>>(new Set());
  const [url, setUrl] = useState(iniciais.site ?? "");
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);

  async function buscarNoSite() {
    if (!url.trim() || buscando) return;
    setBuscando(true);
    setAviso(null);
    try {
      const r = await fetch("/api/perfil/extrair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const j = await r.json();
      if (!r.ok || j.erro) {
        setAviso({ tom: "erro", texto: j.erro ?? j.error ?? "Não deu certo — tente de novo." });
        return;
      }
      const sugestoes: Record<string, string> = j.sugestoes ?? {};
      const aplicados: string[] = [];
      const novos = { ...valores };
      for (const [campo, valor] of Object.entries(sugestoes)) {
        if (!String(novos[campo] ?? "").trim()) {
          novos[campo] = valor;
          aplicados.push(campo);
        }
      }
      setValores(novos);
      setSugeridos(new Set(aplicados));
      setAviso(
        aplicados.length === 0
          ? { tom: "ok", texto: "O site foi lido, mas não achei nada novo além do que já está preenchido." }
          : {
              tom: "ok",
              texto: `${aplicados.length} campo${aplicados.length > 1 ? "s" : ""} sugerido${aplicados.length > 1 ? "s" : ""} a partir do site (marcados em âmbar). Confira — principalmente nomes e CNPJ — e salve.`,
            },
      );
    } catch {
      setAviso({ tom: "erro", texto: "Falha de conexão — tente de novo." });
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div>
      <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
        <p className="text-sm font-bold text-teal-900">
          <Sparkles className="mr-1 inline h-4 w-4" /> Preencher a partir do site
        </p>
        <p className="mt-1 text-xs leading-relaxed text-teal-900/70">
          Cole o site oficial e a gente busca CNPJ, endereço, autoridade e mais. Tudo chega como
          sugestão editável — nada é salvo sem você conferir.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="www.suainstituicao.gov.br"
            className="w-full flex-1 rounded-xl border border-teal-300 bg-white px-3.5 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={buscarNoSite}
            disabled={buscando || !url.trim()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {buscando ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" /> Lendo o site… (até 1 min)
              </>
            ) : (
              "Buscar dados"
            )}
          </button>
        </div>
        {aviso && (
          <p
            className={`mt-2 rounded-lg border px-3 py-2 text-xs font-medium ${
              aviso.tom === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {aviso.texto}
          </p>
        )}
      </div>

      <form action={salvarPerfil} className="mt-5 space-y-3">
        {campos.map((c) => {
          const sugerido = sugeridos.has(c.campo);
          return (
            <label key={c.campo} className="block">
              <span className="text-xs font-semibold text-gray-700">
                {c.label}
                {c.essencial && <span className="text-teal-700"> *</span>}
                {sugerido && (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                    🤖 sugerido — confira
                  </span>
                )}
              </span>
              <input
                name={c.campo}
                value={valores[c.campo] ?? ""}
                onChange={(e) => {
                  setValores((v) => ({ ...v, [c.campo]: e.target.value }));
                  if (sugerido)
                    setSugeridos((s) => {
                      const n = new Set(s);
                      n.delete(c.campo);
                      return n;
                    });
                }}
                placeholder={c.placeholder}
                className={`mt-1 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm ${
                  sugerido ? "border-amber-400 bg-amber-50" : "border-gray-300"
                }`}
              />
            </label>
          );
        })}
        <button
          type="submit"
          className="w-full rounded-xl bg-teal-700 px-4 py-3 text-base font-bold text-white hover:bg-teal-800 sm:w-auto sm:px-8"
        >
          Salvar perfil
        </button>
      </form>
    </div>
  );
}
