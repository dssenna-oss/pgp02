// Perfil da instituição — o formulário que alimenta TODOS os documentos.

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireInstituicao } from "@/lib/auth-server";
import { CAMPOS_PERFIL, completudePerfil } from "@/lib/perfil";
import { salvarPerfil } from "./actions";

export const dynamic = "force-dynamic";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  const { instituicaoId } = await requireInstituicao();
  const inst = await prisma.instituicao.findUnique({ where: { id: instituicaoId } });
  if (!inst) return <p className="text-sm text-rose-700">Instituição não encontrada.</p>;
  const { feitos, total } = completudePerfil(inst);

  return (
    <div>
      <Link
        href="/jornada"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900"
      >
        <ArrowLeft className="h-4 w-4" /> Trilha
      </Link>
      <h1 className="mt-2 text-xl font-extrabold text-gray-900">Perfil da instituição</h1>
      <p className="mt-1 text-sm text-gray-500">
        Preencha uma vez — estes dados entram automaticamente nos 21 documentos.{" "}
        <strong>
          {feitos}/{total} essenciais preenchidos.
        </strong>
      </p>

      {searchParams.ok && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          ✅ Perfil salvo.
        </p>
      )}

      <form action={salvarPerfil} className="mt-5 space-y-3">
        {CAMPOS_PERFIL.map((c) => (
          <label key={c.campo} className="block">
            <span className="text-xs font-semibold text-gray-700">
              {c.label}
              {c.essencial && <span className="text-teal-700"> *</span>}
            </span>
            <input
              name={c.campo}
              defaultValue={String((inst as any)[c.campo] ?? "")}
              placeholder={c.placeholder}
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm"
            />
          </label>
        ))}
        <button
          type="submit"
          className="w-full rounded-xl bg-teal-700 px-4 py-3 text-base font-bold text-white hover:bg-teal-800 sm:w-auto sm:px-8"
        >
          Salvar perfil
        </button>
      </form>
    </div>
  );
}
