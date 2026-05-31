"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { trocarMinhaSenha } from "@/app/dashboard/usuarios/actions";

export function ContaClient() {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
  const [salvando, setSalvando] = useState(false);

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
  const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

  async function salvar() {
    if (nova.length < 6) return toast.error("A nova senha precisa de ao menos 6 caracteres.");
    if (nova !== confirma) return toast.error("A confirmação não confere com a nova senha.");
    setSalvando(true);
    const r = await trocarMinhaSenha({ senhaAtual: atual, novaSenha: nova });
    if ("erro" in r) { toast.error(r.erro); setSalvando(false); return; }
    toast.success("Senha alterada com sucesso");
    setAtual(""); setNova(""); setConfirma(""); setSalvando(false);
  }

  return (
    <div className="space-y-3.5">
      <div><label className={labelCls}>Senha atual</label><input type="password" className={inputCls} value={atual} onChange={(e) => setAtual(e.target.value)} /></div>
      <div><label className={labelCls}>Nova senha</label><input type="password" className={inputCls} value={nova} onChange={(e) => setNova(e.target.value)} placeholder="mín. 6 caracteres" /></div>
      <div><label className={labelCls}>Confirmar nova senha</label><input type="password" className={inputCls} value={confirma} onChange={(e) => setConfirma(e.target.value)} /></div>
      <button onClick={salvar} disabled={salvando} className="bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700 disabled:opacity-60">
        {salvando ? "Salvando…" : "Alterar senha"}
      </button>
    </div>
  );
}
