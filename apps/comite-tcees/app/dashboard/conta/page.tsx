import { requireSession } from "@/lib/auth-server";
import { membroDoLogin } from "@/lib/membro-do-login";
import { PageHeader } from "@/components/page-header";
import { ContaClient } from "@/components/conta-client";
import { FotoPerfilClient } from "@/components/foto-perfil-client";

export const dynamic = "force-dynamic";

export default async function ContaPage() {
  const session = await requireSession();

  // Casa o login com o registro de Membro (por e-mail; fallback por nome)
  // para mostrar/editar a foto de perfil.
  const membro = await membroDoLogin(
    { email: session.user?.email, name: session.user?.name },
    { nome: true, avatarUrl: true },
  );

  return (
    <>
      <PageHeader
        emoji="👤"
        title="Minha conta"
        lead="Sua foto de perfil e a senha de acesso ao painel do Comitê."
      />
      <div className="space-y-4 max-w-md">
        <div className="bg-white border rounded-xl p-5">
          <div className="text-[13px] text-gray-600 mb-4">
            Conectado como <b>{session.user?.name}</b> · {session.user?.email}
          </div>
          {membro ? (
            <FotoPerfilClient nome={membro.nome} avatarUrl={membro.avatarUrl} />
          ) : (
            <p className="text-[12.5px] text-gray-400">Seu login não está vinculado a um membro do Comitê, então não há foto de perfil.</p>
          )}
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Trocar senha</h2>
          <ContaClient />
        </div>
      </div>
    </>
  );
}
