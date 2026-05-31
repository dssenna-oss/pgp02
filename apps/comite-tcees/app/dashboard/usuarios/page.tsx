import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/page-header";
import { UsuariosClient, type UsuarioDTO, type MembroOption } from "@/components/usuarios-client";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const session = await requireAdmin();

  const [users, membros] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    }),
    prisma.membro.findMany({
      where: { email: { not: null } },
      orderBy: { ordem: "asc" },
      select: { nome: true, email: true, funcao: true },
    }),
  ]);

  const dtos: UsuarioDTO[] = users.map((u) => ({
    id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive,
    isSelf: u.id === session.user.id,
  }));

  // Membros do roster que ainda não têm login (pra criar em 1 clique).
  const emailsComLogin = new Set(users.map((u) => u.email.toLowerCase()));
  const membroOptions: MembroOption[] = membros
    .filter((m) => m.email && !emailsComLogin.has(m.email.toLowerCase()))
    .map((m) => ({ nome: m.nome, email: m.email as string, funcao: m.funcao }));

  return (
    <>
      <PageHeader
        emoji="🔑"
        title="Acessos ao app"
        lead="Gerencie os logins do Comitê. Cada membro deve ter o seu — crie a conta com uma senha inicial e informe à pessoa (ela pode trocar depois em “Minha conta”)."
      />
      <UsuariosClient usuarios={dtos} membrosSemLogin={membroOptions} />
    </>
  );
}
