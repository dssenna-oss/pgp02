"use client";

// 🕵️ Detetive na Repartição — toque nos vazamentos escondidos na cena.
// Hotspots em coordenadas percentuais sobre a ilustração. Sem servidor.

import { useState } from "react";
import { RotateCcw, SearchCheck, Trophy } from "lucide-react";
import { DETETIVE_CENA_IMG, DETETIVE_VAZAMENTOS } from "@/lib/jogos";

export function JogoDetetive() {
  const [achados, setAchados] = useState<Set<string>>(new Set());
  const [palpites, setPalpites] = useState(0);
  const [ultimo, setUltimo] = useState<string | null>(null); // id do último achado (feedback)
  const [nadaAqui, setNadaAqui] = useState(false);
  const [entregue, setEntregue] = useState(false);

  const total = DETETIVE_VAZAMENTOS.length;

  function clicar(e: React.MouseEvent<HTMLDivElement>) {
    if (entregue) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const hit = DETETIVE_VAZAMENTOS.find(
      (v) => px >= v.x && px <= v.x + v.w && py >= v.y && py <= v.y + v.h,
    );
    if (hit) {
      if (!achados.has(hit.id)) {
        setAchados((prev) => new Set(prev).add(hit.id));
        setUltimo(hit.id);
        setNadaAqui(false);
      }
    } else {
      setPalpites((p) => p + 1);
      setNadaAqui(true);
      setUltimo(null);
    }
  }

  function reiniciar() {
    setAchados(new Set());
    setPalpites(0);
    setUltimo(null);
    setNadaAqui(false);
    setEntregue(false);
  }

  const ultimoVaz = ultimo ? DETETIVE_VAZAMENTOS.find((v) => v.id === ultimo) : null;

  return (
    <div>
      <p className="mb-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
        A repartição de Vegas esvaziou pro almoço — e ficou um rastro de dados
        expostos. <strong>Toque nos {total} vazamentos escondidos na cena.</strong>{" "}
        Toques errados contam como palpite.
      </p>

      <div className="relative select-none overflow-hidden rounded-xl border border-gray-200" onClick={clicar}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={DETETIVE_CENA_IMG} alt="Cena da repartição" className="block w-full" draggable={false} />
        {/* marcadores dos achados (e dos perdidos, após entregar) */}
        {DETETIVE_VAZAMENTOS.map((v) => {
          const achou = achados.has(v.id);
          if (!achou && !entregue) return null;
          return (
            <span
              key={v.id}
              className={`pointer-events-none absolute rounded-lg border-2 ${
                achou ? "border-green-500 bg-green-400/20" : "border-rose-500 bg-rose-400/20"
              }`}
              style={{ left: `${v.x}%`, top: `${v.y}%`, width: `${v.w}%`, height: `${v.h}%` }}
            >
              <span
                className={`absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                  achou ? "bg-green-600" : "bg-rose-600"
                }`}
              >
                {achou ? "✓" : "!"}
              </span>
            </span>
          );
        })}
      </div>

      {/* Placar corrente + feedback */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">
          🔎 {achados.size} de {total} · {palpites} palpite{palpites === 1 ? "" : "s"} errado{palpites === 1 ? "" : "s"}
        </span>
        {!entregue && (
          <button
            type="button"
            onClick={() => setEntregue(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <SearchCheck className="h-4 w-4" /> Entregar
          </button>
        )}
      </div>

      {nadaAqui && !entregue && (
        <p className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          Nada suspeito aí… continue procurando. 🔍
        </p>
      )}
      {ultimoVaz && !entregue && (
        <div className="mt-2 rounded-xl border border-green-300 bg-green-50 p-3 text-sm">
          <p className="font-semibold text-green-800">✓ Achou: {ultimoVaz.nome}</p>
          <p className="mt-0.5 text-gray-700">{ultimoVaz.porque}</p>
          {ultimoVaz.artigo && <p className="mt-0.5 text-xs text-gray-500">📖 {ultimoVaz.artigo}</p>}
        </div>
      )}

      {/* Resultado */}
      {entregue && (
        <div className="mt-4">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-center">
            <Trophy className="mx-auto h-9 w-9 text-indigo-500" />
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {achados.size} de {total} vazamentos
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {palpites} palpite{palpites === 1 ? "" : "s"} errado{palpites === 1 ? "" : "s"}.{" "}
              {achados.size === total && palpites <= 2
                ? "Faro finíssimo — a repartição precisa de você! 🕵️"
                : achados.size === total
                  ? "Achou todos!"
                  : "Os que escaparam estão marcados em vermelho na cena."}
            </p>
          </div>
          <ol className="mt-4 space-y-2">
            {DETETIVE_VAZAMENTOS.map((v) => (
              <li
                key={v.id}
                className={`rounded-xl border p-3 text-sm ${
                  achados.has(v.id) ? "border-green-200 bg-green-50" : "border-rose-200 bg-rose-50"
                }`}
              >
                <p className="font-semibold text-gray-900">
                  {achados.has(v.id) ? "✓" : "✗"} {v.nome}
                </p>
                <p className="mt-0.5 text-gray-700">{v.porque}</p>
                {v.artigo && <p className="mt-0.5 text-xs text-gray-500">📖 {v.artigo}</p>}
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={reiniciar}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" /> Procurar de novo
          </button>
        </div>
      )}
    </div>
  );
}
