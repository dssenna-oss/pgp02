import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { papeisPorOrgao } from "@/lib/seeds/processos-vegas";
import { ensureColunaSenhaExibicao } from "@/lib/coluna-senha-turma";
import { DemoMultiPerfilView } from "./demo-multiperfil-view";

export const dynamic = "force-dynamic";

export default async function DemoMultiPerfilPage({
  params,
}: {
  params: { turmaSlug: string };
}) {
  await ensureColunaSenhaExibicao();

  const turma = await prisma.cursoTurma.findFirst({
    where: { slug: params.turmaSlug },
    include: {
      grupos: {
        orderBy: { numero: "asc" },
        include: {
          company: {
            select: {
              name: true,
              users: {
                select: { email: true, papel: true },
                orderBy: { papel: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!turma) {
    redirect("/facilitador");
  }

  const grupos = turma.grupos.map((g) => {
    const orgao = (g.orgao === "CM" ? "CM" : "PM") as "PM" | "CM";
    const papeisDef = papeisPorOrgao(orgao);
    const papeis = papeisDef.map((p) => {
      const user = g.company.users.find((u) => u.papel === p.papel);
      return {
        papel: p.papel,
        nomeAmigavel: p.nomeAmigavel,
        responsabilidade: p.responsabilidade,
        email: user?.email || null,
      };
    });
    return {
      grupoId: g.id,
      numero: g.numero,
      orgao,
      companyName: g.company.name,
      papeis,
    };
  });

  return (
    <DemoMultiPerfilView
      turma={{
        nome: turma.nome,
        slug: turma.slug,
        cidade: turma.cidade,
        senhaExibicao: turma.senhaExibicao,
      }}
      grupos={grupos}
    />
  );
}
