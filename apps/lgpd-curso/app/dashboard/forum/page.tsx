// Fórum da turma — visão do participante. A turma é derivada da sessão pela API.

import { requireSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { ForumTurma } from "@/components/forum/forum-turma";

export const dynamic = "force-dynamic";

export default async function ForumParticipantePage() {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect("/login");
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">💬 Fórum da turma</h1>
        <p className="mt-1 text-gray-600">
          Espaço de dúvidas e ajuda mútua depois do curso. Toda a turma vê e responde — o
          facilitador também participa.
        </p>
      </header>
      <ForumTurma souFacilitador={session.user.role === "ADMIN"} />
    </div>
  );
}
