// Comunicação — rótulos e helpers de Notícias/Materiais/Artigos.

import type { BadgeVariant } from "@/lib/comite-ui";

export const TIPO_ARTIGO: Record<string, { label: string; emoji: string; variant: BadgeVariant }> = {
  NOTICIA: { label: "Notícia", emoji: "📢", variant: "blue" },
  EDUCATIVO: { label: "Material educativo", emoji: "📚", variant: "green" },
  ARTIGO: { label: "Artigo", emoji: "📝", variant: "indigo" },
};

export function tipoArtigo(t: string) {
  return TIPO_ARTIGO[t] ?? { label: t, emoji: "📄", variant: "gray" as BadgeVariant };
}

export const STATUS_ARTIGO: Record<string, { label: string; variant: BadgeVariant }> = {
  RASCUNHO: { label: "rascunho", variant: "gray" },
  PUBLICADO: { label: "publicado", variant: "green" },
};

export function statusArtigo(s: string) {
  return STATUS_ARTIGO[s] ?? { label: s, variant: "gray" as BadgeVariant };
}

export const TIPOS_ARTIGO = ["NOTICIA", "EDUCATIVO", "ARTIGO"] as const;
