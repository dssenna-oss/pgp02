import Link from "next/link";
import { BookOpen, Download, FileText, Table2 } from "lucide-react";
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

      <div className="mt-6">
        <BibliotecaFlipbook
          titulo="PGP, LAI, Analogias com O Pequeno Príncipe e Zootopia"
          descricao="E-books folheáveis sobre o Programa de Governança em Privacidade (PGP), a Lei de Acesso à Informação e analogias divertidas com O Pequeno Príncipe e Zootopia pra fixar os conceitos. Abre em tela cheia; dá pra folhear no celular."
          url="https://heyzine.com/shelf/725a2dd314.html"
        />
      </div>

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
              Documento institucional (PDF, 15 páginas) com tudo o que você precisa pra implementar a LGPD na sua
              Instituição: conteúdo das 8 etapas do Programa de Governança em Privacidade, glossário, modelos de
              documentos (Política do PGP, Cláusulas LGPD pra contratos, Política de Retenção, Termo de Consentimento,
              Comunicação à ANPD), explicação das armadilhas comuns no setor público, adaptação por porte do órgão,
              calendário de revisões, checklist final e roteiros de implementação por prazo (30d / 90d / 12 meses).
            </p>
            <p className="text-xs text-gray-500 mt-2 italic">
              📌 Independente do trabalho do seu grupo no curso. Pra você levar pra sua Instituição.
            </p>
            <div className="mt-4">
              {/* PDF estático (public/cartilha-pgp.pdf) — versão diagramada
                  fornecida pelo facilitador (2026-06-13, 15 págs). A rota
                  geradora /api/curso/caderno/docx?modo=cartilha segue existindo
                  pro facilitador. Pra atualizar: trocar o arquivo em public/. */}
              <Link
                href="/cartilha-pgp.pdf"
                target="_blank"
                className="inline-flex items-center gap-2 rounded-lg bg-purple-700 hover:bg-purple-800 px-4 py-2 text-sm font-semibold text-white shadow-sm"
              >
                <Download className="h-4 w-4" />
                Baixar Cartilha do PGP (PDF)
              </Link>
              {/* Versão Word DIAGRAMADA (public/cartilha-pgp.docx) — mesma arte
                  do PDF, pra adaptar ao órgão. Estático. A rota geradora
                  /api/curso/caderno/docx?modo=cartilha segue existindo pro
                  facilitador. Pra atualizar: trocar o arquivo em public/. */}
              <p className="mt-2 text-xs text-gray-500">
                Prefere adaptar ao seu órgão?{" "}
                <Link
                  href="/cartilha-pgp.docx"
                  target="_blank"
                  className="font-medium text-purple-700 underline underline-offset-2 hover:text-purple-800"
                >
                  Baixe a versão Word (editável)
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pacote de Modelos — 21 templates editáveis (complementa a Cartilha
          que é descritiva). Cor teal pra diferenciar visualmente. */}
      <div className="mt-6 rounded-lg border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-100">
            <FileText className="h-6 w-6 text-teal-700" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-teal-900">Pacote de Modelos do PGP</h2>
            <p className="mb-1 text-sm text-teal-700 italic">
              21 modelos pra a sua Instituição adaptar e preencher
            </p>
            <p className="text-sm text-gray-700 mt-2">
              Documento (PDF, 16 páginas) com 21 modelos dos principais instrumentos do PGP — Ato de Designação do
              Encarregado, Portaria do Comitê Gestor, Carta para a Alta Gestão, Roadmap 90 dias, Aviso de Privacidade, Documento do PRI,
              Política do PGP, Cláusulas LGPD pra contratos, Política de Retenção, Termo de Consentimento, Comunicação
              à ANPD, Comunicação aos Titulares, Termômetro, Matriz de Priorização, Fichas de Processo /
              Risco / Operador / DSR, GAP, Plano de Ação e RIPD.
            </p>
            <p className="text-xs text-gray-500 mt-2 italic">
              📌 Os campos a preencher estão marcados em vermelho ([NOME DA INSTITUIÇÃO], [DATA] etc.).
              Caixas amarelas com exemplos preenchidos ajudam a entender como adaptar.
            </p>
            <div className="mt-4">
              {/* PDF estático (public/pacote-modelos-pgp.pdf) — versão diagramada
                  fornecida pelo facilitador (2026-06-13, 21 modelos, Portaria do
                  Comitê como Modelo 02). A rota geradora /api/curso/pacote-modelos/docx
                  segue existindo pro facilitador (versão plana + ?instituicao=X).
                  Pra atualizar: trocar o arquivo em public/. */}
              <Link
                href="/pacote-modelos-pgp.pdf"
                target="_blank"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-sm"
              >
                <Download className="h-4 w-4" />
                Baixar Pacote de Modelos (PDF)
              </Link>
              {/* Versão Word DIAGRAMADA (public/pacote-modelos-pgp.docx) — mesma
                  arte do PDF, com os placeholders [NOME DA INSTITUIÇÃO] etc.
                  preservados pra preencher no Word. Estático (não personaliza por
                  ?instituicao). Pra atualizar: trocar o arquivo em public/. */}
              <p className="mt-2 text-xs text-gray-500">
                Vai preencher os modelos?{" "}
                <Link
                  href="/pacote-modelos-pgp.docx"
                  target="_blank"
                  className="font-medium text-teal-700 underline underline-offset-2 hover:text-teal-800"
                >
                  Baixe a versão Word (campos editáveis)
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Planilha do PGP — workbook Excel interdependente (5ª peça). Cor âmbar/laranja
          pra diferenciar de Cartilha (roxo) e Pacote (teal). */}
      <div className="mt-6 rounded-lg border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <Table2 className="h-6 w-6 text-amber-700" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-amber-900">Planilha do PGP</h2>
            <p className="mb-1 text-sm text-amber-700 italic">
              Workbook Excel com 13 abas que se conectam automaticamente
            </p>
            <p className="text-sm text-gray-700 mt-2">
              Ferramenta de trabalho pra implementar o PGP na sua Instituição com dados reais. As abas conversam entre
              si: você preenche o Inventário, escolhe o processo na aba Riscos por uma lista, e a severidade é calculada
              sozinha. O score de priorização, o % de conformidade do GAP, os prazos de DSR (15 dias úteis) e de
              incidentes (3 e 7 dias úteis) e o score de maturidade no Painel são todos automáticos.
            </p>
            <p className="text-xs text-gray-500 mt-2 italic">
              📌 Funciona offline — nada é enviado pra lugar nenhum. As células amarelas são pra preencher; as cinzas são
              calculadas (não edite). A aba &ldquo;Exemplo&rdquo; mostra um caso fictício completo pra referência.
            </p>
            <div className="mt-4">
              <Link
                href="/api/curso/planilha-pgp/xlsx"
                target="_blank"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm"
              >
                <Download className="h-4 w-4" />
                Baixar Planilha do PGP (XLSX)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
