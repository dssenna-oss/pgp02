"use client";

// Chips de contato da equipe ETIR — aparecem na linha do incidente ativo
// (status != ENCERRADO) pra DPO acionar a equipe em 1 clique no celular.
// Busca os membros via API leve. Cache de 30s no client.

import { useEffect, useState } from "react";
import { Phone, Mail, Users } from "lucide-react";
import { rotuloPapel, emojiPapel } from "@/lib/pri-catalogo";

type Membro = {
  id: string;
  nome: string;
  papel: string;
  contato24h: string | null;
  email: string | null;
};

let cache: { ts: number; data: Membro[] } | null = null;
const CACHE_MS = 30000;

export function EquipeAcionarChips({ compacto = false }: { compacto?: boolean }) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cache && Date.now() - cache.ts < CACHE_MS) {
      setMembros(cache.data);
      setLoading(false);
      return;
    }
    fetch("/api/curso/pri-equipe", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const lista = (d.membros || []) as Membro[];
        cache = { ts: Date.now(), data: lista };
        setMembros(lista);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (membros.length === 0) {
    return (
      <div className="text-[10px] text-amber-700 italic flex items-center gap-1">
        <Users className="h-3 w-3" />
        ⚠ Equipe de Resposta a Incidentes não cadastrada. Veja o PRI acima.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-[10px] font-semibold text-purple-800 uppercase tracking-wider mr-1 flex items-center gap-1">
        <Users className="h-3 w-3" /> Acionar equipe:
      </span>
      {membros.slice(0, compacto ? 4 : 99).map((m) => (
        <ChipMembro key={m.id} membro={m} />
      ))}
      {compacto && membros.length > 4 && (
        <span className="text-[10px] text-gray-500">+{membros.length - 4}</span>
      )}
    </div>
  );
}

function ChipMembro({ membro }: { membro: Membro }) {
  // Usa tel: pra ligar direto se for mobile, ou abre WhatsApp se número
  // tiver formato BR. Heurística simples: se começa com (XX) ou 55, abre wa.me
  const numero = (membro.contato24h || "").replace(/\D/g, "");
  const isMobile = numero.length >= 11;
  const href = isMobile
    ? `https://wa.me/55${numero}`
    : numero
    ? `tel:${numero}`
    : membro.email
    ? `mailto:${membro.email}`
    : "#";

  return (
    <a
      href={href}
      target={isMobile ? "_blank" : undefined}
      rel="noreferrer"
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 border border-purple-300 text-purple-900 text-[10px] hover:bg-purple-200 transition-colors"
      title={`${rotuloPapel(membro.papel)}${membro.contato24h ? ` · ${membro.contato24h}` : ""}${membro.email ? ` · ${membro.email}` : ""}`}
    >
      <span>{emojiPapel(membro.papel)}</span>
      <span className="font-medium">{membro.nome.split(" ")[0]}</span>
      {membro.contato24h ? <Phone className="h-2.5 w-2.5" /> : membro.email ? <Mail className="h-2.5 w-2.5" /> : null}
    </a>
  );
}
