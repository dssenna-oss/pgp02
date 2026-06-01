"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Camera, Trash2 } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { atualizarMinhaFoto } from "@/app/dashboard/usuarios/actions";

const MAX = 200; // lado máximo do avatar em px

/** Redimensiona/recorta a imagem para um quadrado MAX×MAX no navegador (canvas) e devolve uma data URL JPEG. */
function redimensionar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo não é uma imagem válida."));
      img.onload = () => {
        const lado = Math.min(img.width, img.height);
        const sx = (img.width - lado) / 2;
        const sy = (img.height - lado) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = MAX;
        canvas.height = MAX;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas indisponível."));
        ctx.drawImage(img, sx, sy, lado, lado, 0, 0, MAX, MAX);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function FotoPerfilClient({ nome, avatarUrl }: { nome: string; avatarUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [salvando, setSalvando] = useState(false);
  const [previa, setPrevia] = useState<string | null>(avatarUrl);

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite reescolher o mesmo arquivo depois
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Selecione um arquivo de imagem.");

    setSalvando(true);
    const t = toast.loading("Enviando foto…");
    try {
      const dataUrl = await redimensionar(file);
      setPrevia(dataUrl);
      const r = await atualizarMinhaFoto(dataUrl);
      if ("erro" in r) { toast.error(r.erro, { id: t }); setPrevia(avatarUrl); }
      else { toast.success("Foto atualizada", { id: t }); router.refresh(); }
    } catch (err: any) {
      toast.error(err?.message ?? "Não foi possível enviar.", { id: t });
      setPrevia(avatarUrl);
    } finally {
      setSalvando(false);
    }
  }

  async function remover() {
    if (!confirm("Remover sua foto de perfil?")) return;
    setSalvando(true);
    const t = toast.loading("Removendo…");
    const r = await atualizarMinhaFoto(null);
    if ("erro" in r) toast.error(r.erro, { id: t });
    else { toast.success("Foto removida", { id: t }); setPrevia(null); router.refresh(); }
    setSalvando(false);
  }

  return (
    <div>
      <label className="text-xs font-semibold text-gray-700 mb-2 block">Foto de perfil</label>
      <div className="flex items-center gap-4">
        <Avatar nome={nome} avatarUrl={previa} size={72} />
        <div className="flex flex-col gap-2">
          <input ref={inputRef} type="file" accept="image/*" onChange={escolher} className="hidden" />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={salvando}
            className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-3.5 py-2 text-[13px] font-semibold hover:bg-brand-700 disabled:opacity-60"
          >
            <Camera className="w-4 h-4" /> {previa ? "Trocar foto" : "Enviar foto"}
          </button>
          {previa && (
            <button
              onClick={remover}
              disabled={salvando}
              className="inline-flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-red-600 disabled:opacity-60"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remover
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">A imagem é recortada num quadrado e reduzida automaticamente. JPG ou PNG.</p>
    </div>
  );
}
