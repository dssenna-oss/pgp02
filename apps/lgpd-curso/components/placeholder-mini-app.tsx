// Placeholder pros mini-apps que serão construídos na S2.

import { Construction } from "lucide-react";

export function PlaceholderMiniApp({
  titulo,
  missao,
  descricao,
  sessao = "S2",
}: {
  titulo: string;
  missao: string;
  descricao: string;
  sessao?: string;
}) {
  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
            {missao}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        <p className="text-sm text-gray-500 mt-1">{descricao}</p>
      </header>

      <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Construction className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <h2 className="font-medium text-gray-700">Mini-app em construção</h2>
        <p className="text-xs text-gray-500 mt-1">
          Esta tela será implementada na sessão <strong>{sessao}</strong> — cópia adaptada do app de produção.
        </p>
      </div>
    </div>
  );
}
