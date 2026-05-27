import Link from "next/link";
import { BookOpen, Download } from "lucide-react";
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

      {/* Cartilha do PGP — guia genérico de implementação da LGPD em Instituições
          Públicas. Independente do trabalho do grupo no curso — pra cada
          participante levar pra Instituição. */}
      <div className="mt-6 rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-100">
            <BookOpen className="h-6 w-6 text-purple-700" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-purple-900">Cartilha do PGP</h2>
            <p className="mb-1 text-sm text-purple-700 italic">
              Guia de Implementação da LGPD em Instituições Públicas
            </p>
            <p className="text-sm text-gray-700 mt-2">
              Documento institucional de ~120 páginas com tudo o que você precisa pra implementar a LGPD na sua
              Instituição: conteúdo das 8 etapas do Programa de Governança em Privacidade, glossário, modelos de
              documentos (Política do PGP, Cláusulas LGPD pra contratos, Política de Retenção, Termo de Consentimento,
              Comunicação à ANPD), explicação das armadilhas comuns no setor público, adaptação por porte do órgão,
              calendário de revisões, checklist final e roteiros de implementação por prazo (30d / 90d / 12 meses).
            </p>
            <p className="text-xs text-gray-500 mt-2 italic">
              📌 Independente do trabalho do seu grupo no curso. Pra você levar pra sua Instituição.
            </p>
            <div className="mt-4">
              <Link
                href="/api/curso/caderno/docx?modo=cartilha"
                target="_blank"
                className="inline-flex items-center gap-2 rounded-lg bg-purple-700 hover:bg-purple-800 px-4 py-2 text-sm font-semibold text-white shadow-sm"
              >
                <Download className="h-4 w-4" />
                Baixar Cartilha do PGP (DOCX)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
