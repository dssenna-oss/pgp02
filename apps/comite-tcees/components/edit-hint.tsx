"use client";

import { usePodeEditar } from "@/lib/use-pode-editar";

/**
 * Renderiza um trecho de texto APENAS para quem pode editar (ADMIN/COORDENADOR).
 *
 * Usado no PageHeader para que instruções de ação — "adicione e edite pelo
 * botão ao lado", "edite o valor atual" etc. — não apareçam para usuários de
 * só-leitura, que não enxergam os botões correspondentes.
 */
export function EditHint({ text }: { text: string }) {
  const podeEditar = usePodeEditar();
  if (!podeEditar) return null;
  return <> {text}</>;
}
