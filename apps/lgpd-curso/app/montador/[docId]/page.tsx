// Montador Guiado — página PÚBLICA/standalone de UM documento.
// Sem login, sem turma, sem banco. Embutível em iframe (apresentação online)
// ou aberta por link/QR direto no celular.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMontadorDoc } from "@/lib/montador-docs";
import { MontadorRunner } from "@/components/montador-runner";
import { AtividadesDocLinks, CapaDoc } from "@/components/montador-atividade";

export default function MontadorPublicoDocPage({
  params,
}: {
  params: { docId: string };
}) {
  const doc = getMontadorDoc(params.docId);
  // O wizard só existe pra documentos com decisões (formatos são opcionais).
  if (!doc || !doc.disponivel || doc.decisoes.length === 0) notFound();

  return (
    <div className="pagina-embed min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/montador"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Todos os documentos
        </Link>

        <CapaDoc docId={doc.id} />

        <header className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            {doc.emoji} {doc.titulo}
          </h1>
          <p className="mt-2 text-gray-600 leading-relaxed">{doc.intro}</p>
        </header>

        <MontadorRunner doc={doc} hubHref="/montador" />

        <AtividadesDocLinks base="/montador" doc={doc} atual="" />

        <footer className="mt-8 text-center text-[11px] text-gray-400">
          Atividade de simulação — nenhum dado é coletado ou armazenado.
        </footer>
      </div>
    </div>
  );
}
