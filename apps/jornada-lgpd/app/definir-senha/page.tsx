// Página PÚBLICA do link do convite — o gestor cria a própria senha.
// Fora do middleware (sem login). Token inválido/expirado → orientação clara.

import { prisma } from "@/lib/prisma";
import { definirSenha } from "./actions";

export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  curta: "A senha precisa ter pelo menos 8 caracteres.",
  confere: "A confirmação não bate — digite a mesma senha nos dois campos.",
};

export default async function DefinirSenhaPage({
  searchParams,
}: {
  searchParams: { token?: string; erro?: string };
}) {
  const token = searchParams.token ?? "";
  const user = token
    ? await prisma.user.findUnique({
        where: { tokenAcesso: token },
        select: { nome: true, email: true, tokenExpira: true },
      })
    : null;
  const valido = !!user?.tokenExpira && user.tokenExpira > new Date();

  if (!valido || searchParams.erro === "invalido") {
    return (
      <div className="mx-auto max-w-sm py-10 text-center">
        <h1 className="text-xl font-extrabold text-gray-900">Link expirado ou inválido</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Este link de acesso não está mais ativo — ele vale por 7 dias e é de uso único.
          Peça um novo ao <strong>Clube do Servidor</strong> (responda o e-mail do convite)
          e chegará outro igualzinho na sua caixa.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="text-xl font-extrabold text-gray-900">Crie sua senha</h1>
      <p className="mt-1 text-sm text-gray-500">
        Olá, <strong>{user!.nome}</strong>! Seu usuário é <strong>{user!.email}</strong>.
        Defina a senha e você já entra.
      </p>

      {searchParams.erro && ERROS[searchParams.erro] && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {ERROS[searchParams.erro]}
        </p>
      )}

      <form action={definirSenha} className="mt-5 space-y-3">
        <input type="hidden" name="token" value={token} />
        <label className="block">
          <span className="text-xs font-semibold text-gray-700">Nova senha (mín. 8)</span>
          <input type="password" name="nova" required minLength={8} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-700">Confirmar a senha</span>
          <input type="password" name="confirma" required minLength={8} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm" />
        </label>
        <button
          type="submit"
          className="w-full rounded-xl bg-teal-700 px-4 py-3 text-base font-bold text-white hover:bg-teal-800"
        >
          Salvar senha e continuar
        </button>
      </form>
    </div>
  );
}
