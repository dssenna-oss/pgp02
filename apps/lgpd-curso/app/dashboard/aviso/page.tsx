import { PageHeader } from "@/components/page-header";
import { BaseLegalCard } from "@/components/base-legal-card";
import { AvisoEditor } from "./aviso-editor";
import { getAviso, getPrerequisitos } from "./actions";
import { getSession } from "@/lib/auth-server";
import { podeEditarFaseAvancada } from "@/lib/curso-permissoes";
import { ModoObservadorBanner } from "@/components/modo-observador-banner";
import { FaseReadOnlyWrapper } from "@/components/fase-readonly-wrapper";

export const dynamic = "force-dynamic";

export default async function AvisoPage() {
  const session = await getSession();
  const podeEditar = podeEditarFaseAvancada(session?.user?.role);
  const [aviso, prereq] = await Promise.all([getAviso(), getPrerequisitos()]);
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        missao="Missão 4b · Aviso"
        titulo="Aviso de Privacidade"
        descricao="Síntese pública institucional. Alimentado pelas 3 fichas da Missão 4a: RIPD (seção 3), Terceiros (seção 7) e DSR (seção 11). Transparência só vale se o que está prometido EXISTE."
      />
      <BaseLegalCard faseKey="aviso" />
      {!podeEditar && <ModoObservadorBanner />}
      <FaseReadOnlyWrapper podeEditar={podeEditar}>
        <AvisoEditor aviso={aviso as any} prereq={prereq} />
      </FaseReadOnlyWrapper>
    </div>
  );
}
