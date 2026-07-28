// Painel do Clube do Servidor — instituições habilitadas + criar acesso.

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { completudePerfil } from "@/lib/perfil";
import { criarInstituicao } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { ok?: string; erro?: string };
}) {
  await requireAdmin();
  const instituicoes = await prisma.instituicao.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: { select: { email: true, nome: true } },
      _count: { select: { documentos: true } },
    },
  });

  return (
    <div>
      <h1 className="text-xl font-extrabold text-gray-900">Painel do Clube</h1>
      <p className="mt-1 text-sm text-gray-500">
        Instituições habilitadas na Jornada LGPD e criação de novos acessos.
      </p>

      {searchParams.ok && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          ✅ Instituição criada — envie o e-mail e a senha combinada pro gestor.
        </p>
      )}
      {searchParams.erro && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {searchParams.erro === "email"
            ? "Este e-mail já tem acesso — use outro."
            : "Preencha nome da instituição, nome e e-mail do gestor, e uma senha com pelo menos 8 caracteres."}
        </p>
      )}

      <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-600">
          ➕ Habilitar nova instituição
        </h2>
        <form action={criarInstituicao} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-gray-700">Nome da instituição *</span>
            <input name="nome" required placeholder="Prefeitura Municipal de …" className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Cidade</span>
            <input name="cidade" className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">UF</span>
            <input name="uf" maxLength={2} className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm uppercase" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Gestor — nome *</span>
            <input name="gestorNome" required className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Gestor — e-mail *</span>
            <input name="gestorEmail" type="email" required className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm" />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-gray-700">Senha inicial (mín. 8) *</span>
            <input name="gestorSenha" required minLength={8} className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm" />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-teal-800 sm:col-span-2 sm:w-auto"
          >
            Criar acesso
          </button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-600">
          🏛️ Instituições ({instituicoes.length})
        </h2>
        <div className="mt-2 space-y-2">
          {instituicoes.map((i) => {
            const { feitos, total } = completudePerfil(i);
            return (
              <div key={i.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-gray-900">
                  {i.nome}
                  {i.cidade ? <span className="font-normal text-gray-500"> · {i.cidade}{i.uf ? `/${i.uf}` : ""}</span> : null}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Perfil {feitos}/{total} · {i._count.documentos} documento(s) iniciado(s) ·
                  gestores: {i.users.map((u) => u.email).join(", ") || "—"}
                </p>
              </div>
            );
          })}
          {instituicoes.length === 0 && (
            <p className="text-sm text-gray-400">Nenhuma instituição ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}
