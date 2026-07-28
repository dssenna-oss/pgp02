// 🔒 Trocar minha senha — disponível pra qualquer usuário logado.

import { requireSessao } from "@/lib/auth-server";
import { trocarSenha } from "./actions";

export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  curta: "A nova senha precisa ter pelo menos 8 caracteres.",
  confere: "A confirmação não bate com a nova senha — digite igual nos dois campos.",
  atual: "A senha atual não confere. Tente de novo.",
};

export default async function SenhaPage({
  searchParams,
}: {
  searchParams: { ok?: string; erro?: string };
}) {
  const sessao = await requireSessao();

  return (
    <div className="mx-auto max-w-sm py-6">
      <h1 className="text-xl font-extrabold text-gray-900">🔒 Trocar minha senha</h1>
      <p className="mt-1 text-sm text-gray-500">Conta: {sessao.email}</p>

      {searchParams.ok && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          ✅ Senha alterada — use a nova no próximo acesso.
        </p>
      )}
      {searchParams.erro && ERROS[searchParams.erro] && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {ERROS[searchParams.erro]}
        </p>
      )}

      <form action={trocarSenha} className="mt-5 space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-gray-700">Senha atual</span>
          <input type="password" name="atual" required className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-700">Nova senha (mín. 8)</span>
          <input type="password" name="nova" required minLength={8} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-700">Confirmar a nova senha</span>
          <input type="password" name="confirma" required minLength={8} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm" />
        </label>
        <button
          type="submit"
          className="w-full rounded-xl bg-teal-700 px-4 py-3 text-base font-bold text-white hover:bg-teal-800"
        >
          Salvar nova senha
        </button>
      </form>
    </div>
  );
}
