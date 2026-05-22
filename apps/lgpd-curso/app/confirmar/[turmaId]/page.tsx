// Página pública de confirmação de presença. O link é enviado no e-mail de
// convite aos inscritos — não exige login.

import { prisma } from "@/lib/prisma";
import { ensureColunasControleTurma } from "@/lib/colunas-controle-turma";
import { Brand } from "@/components/brand";
import { ConfirmarPresencaForm } from "./confirmar-form";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function dataLonga(valor: Date | null): string {
  if (!valor) return "";
  return valor.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

export default async function Page({ params }: { params: { turmaId: string } }) {
  await ensureColunasControleTurma();

  const turma = await prisma.cursoTurma.findUnique({
    where: { id: params.turmaId },
    select: { id: true, nome: true, cidade: true, acessoInicio: true, acessoFim: true },
  });

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white border rounded-xl shadow-sm p-6">
        <div className="flex justify-center mb-4">
          <Brand />
        </div>

        {!turma ? (
          <div className="text-center">
            <h1 className="text-lg font-semibold mb-1">Turma não encontrada</h1>
            <p className="text-sm text-gray-500">
              O link de confirmação parece inválido. Confira o endereço com o facilitador.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-center mb-1">Confirmação de presença</h1>
            <p className="text-sm text-gray-600 text-center mb-1">
              Curso prático de LGPD — turma <strong>{turma.nome}</strong>
            </p>
            {(turma.acessoInicio || turma.acessoFim) && (
              <p className="text-xs text-gray-500 text-center mb-4">
                {turma.acessoInicio && turma.acessoFim
                  ? `Acesso ao app de ${dataLonga(turma.acessoInicio)} a ${dataLonga(turma.acessoFim)}.`
                  : turma.acessoInicio
                    ? `Acesso ao app a partir de ${dataLonga(turma.acessoInicio)}.`
                    : `Acesso ao app até ${dataLonga(turma.acessoFim)}.`}
              </p>
            )}
            <p className="text-xs text-gray-500 text-center mb-5">
              Informe o e-mail com que você se inscreveu para registrar sua presença.
            </p>
            <ConfirmarPresencaForm turmaId={turma.id} />
          </>
        )}
      </div>
    </div>
  );
}
