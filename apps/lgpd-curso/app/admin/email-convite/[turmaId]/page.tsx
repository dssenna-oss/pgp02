// Modelo editável de e-mail de convite — reforça o início do curso e pede a
// confirmação de presença aos inscritos. Admin-only (rota sob /admin).

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { ensureColunasControleTurma } from "@/lib/colunas-controle-turma";
import { normalizarParticipantes } from "@/lib/participantes-turma";
import { PageHeader } from "@/components/page-header";
import { EmailConvite } from "./email-convite";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// URL pública de produção — os links e imagens do e-mail precisam apontar
// para o ambiente publicado, onde os destinatários conseguem abri-los.
const BASE_URL = "https://lgpd-curso.vercel.app";

export default async function Page({ params }: { params: { turmaId: string } }) {
  await requireAdmin();
  await ensureColunasControleTurma();

  const turma = await prisma.cursoTurma.findUnique({
    where: { id: params.turmaId },
    select: {
      id: true,
      nome: true,
      cidade: true,
      acessoInicio: true,
      acessoFim: true,
      participantes: true,
    },
  });

  if (!turma) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader
          missao="Admin"
          titulo="E-mail de convite"
          descricao="Turma não encontrada."
        />
      </div>
    );
  }

  const participantes = normalizarParticipantes(turma.participantes).map((p) => ({
    nome: p.nome,
    email: p.email,
  }));

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        missao="Admin"
        titulo="E-mail de convite"
        descricao={`Modelo pronto e editável para enviar aos inscritos da turma "${turma.nome}". Personalize pelo nome de cada participante, edite o que quiser e copie para enviar.`}
      />
      <EmailConvite
        turmaId={turma.id}
        turmaNome={turma.nome}
        cidade={turma.cidade}
        acessoInicio={turma.acessoInicio ? turma.acessoInicio.toISOString() : null}
        acessoFim={turma.acessoFim ? turma.acessoFim.toISOString() : null}
        participantes={participantes}
        baseUrl={BASE_URL}
      />
    </div>
  );
}
