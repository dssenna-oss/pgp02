import type { ReactNode } from "react";

// Envolve o conteúdo editável de uma Fase. Quando `podeEditar` é false
// (Contribuidor em Modo Observador), usa <fieldset disabled> — recurso
// NATIVO do HTML que desabilita TODOS os controles de formulário
// descendentes (button, input, select, textarea) de uma vez, sem
// precisar tocar em cada botão dos mini-apps.
//
// Links <a> de navegação continuam funcionando (fieldset não afeta âncoras).
// O guard de role no servidor (server actions) é a rede de segurança final.
export function FaseReadOnlyWrapper({
  podeEditar,
  children,
}: {
  podeEditar: boolean;
  children: ReactNode;
}) {
  if (podeEditar) return <>{children}</>;
  return (
    // min-w-0 + reset de borda/padding: <fieldset> tem defaults de UA que
    // quebrariam layouts flex/grid se não forem zerados.
    <fieldset disabled className="fase-readonly m-0 min-w-0 border-0 p-0">
      {children}
    </fieldset>
  );
}
