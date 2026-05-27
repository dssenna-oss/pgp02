import { BibliotecaFlipbook } from "@/components/biblioteca-flipbook";

export const dynamic = "force-dynamic";

export default function ConteudosDidaticosPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Conteúdos Didáticos
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Materiais de apoio</h1>
      <p className="mb-5 mt-1 text-sm text-gray-600">
        Conteúdo complementar pra estudar antes, durante e depois do curso.
      </p>

      <BibliotecaFlipbook
        titulo="Trilha LGPD Descomplicada"
        descricao="Biblioteca de publicações folheáveis sobre a LGPD — leitura complementar em linguagem simples. Abre em tela cheia; dá pra folhear no celular."
        url="https://heyzine.com/shelf/trilha_lgpd_descomplicada.html"
      />
    </div>
  );
}
