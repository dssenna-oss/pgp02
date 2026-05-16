import { PageHeader } from "@/components/page-header";
import { AvisoEditor } from "./aviso-editor";
import { getAviso, getPrerequisitos } from "./actions";

export const dynamic = "force-dynamic";

export default async function AvisoPage() {
  const [aviso, prereq] = await Promise.all([getAviso(), getPrerequisitos()]);
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        missao="Missão 4b · Aviso"
        titulo="Aviso de Privacidade"
        descricao="Síntese pública institucional. Alimentado pelas 3 fichas da Missão 4a: RIPD (seção 3), Terceiros (seção 7) e DSR (seção 11). Transparência só vale se o que está prometido EXISTE."
      />
      <AvisoEditor aviso={aviso as any} prereq={prereq} />
    </div>
  );
}
