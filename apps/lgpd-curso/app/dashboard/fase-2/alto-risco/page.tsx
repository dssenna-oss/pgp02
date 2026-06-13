// Aprofundamento da Fase 2 — Avaliação de Alto Risco (framework da ANPD).
// Explica a regra cumulativa "1+1" (1 critério geral + 1 específico), exibe o
// infográfico (public/guia-alto-risco.png) e disponibiliza a referência
// completa em PDF (public/criterios-priorizacao-anpd.pdf). Liga o conceito à
// Matriz de Priorização (Fase 2) e ao RIPD (Art. 38, Fase 6).

import Link from "next/link";
import {
  ArrowLeft, AlertTriangle, Layers, Scale, Cpu, Video, GitBranch, HeartPulse,
  CheckCircle2, FileDown, ArrowRight,
} from "lucide-react";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";

export const dynamic = "force-dynamic";

function Criterio({
  icon: Icon, titulo, children, cor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  titulo: string;
  children: React.ReactNode;
  cor: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3.5">
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${cor}`} />
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-gray-900">{titulo}</h3>
        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

export default function AltoRiscoPage() {
  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4">
      <AdminPreviewBanner />

      <Link
        href="/dashboard/fase-2"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-3"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar à Fase 2
      </Link>

      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Fase 2 · Aprofundamento
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-2">
        <AlertTriangle className="h-6 w-6 text-amber-600" />
        O tratamento de dados é de Alto Risco?
      </h1>
      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
        Saber se um processo é de <strong>alto risco</strong> é o que diz o que priorizar e o que
        exige um RIPD. A ANPD usa um teste simples e cumulativo — a regra do “1 + 1”.
      </p>

      {/* A regra de ouro */}
      <div className="mt-4 rounded-xl border-l-4 border-l-amber-500 border border-amber-200 bg-amber-50/70 p-4">
        <h2 className="text-sm font-bold text-amber-900">⚖️ A regra de ouro — “1 + 1” (cumulatividade)</h2>
        <p className="text-sm text-amber-900/90 mt-1 leading-relaxed">
          Pra um tratamento ser de <strong>alto risco</strong>, ele precisa atender <strong>ao
          mesmo tempo</strong>:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-amber-900/90">
          <li>✔️ pelo menos <strong>1 critério GERAL</strong> (Passo 1), <strong>E</strong></li>
          <li>✔️ pelo menos <strong>1 critério ESPECÍFICO</strong> (Passo 2).</li>
        </ul>
        <p className="text-xs text-amber-900/80 mt-2">
          Um critério sozinho <strong>não basta</strong> — é a combinação dos dois que confirma o alto risco.
        </p>
      </div>

      {/* Infográfico */}
      <figure className="mt-5">
        <img
          src="/guia-alto-risco.png"
          alt="Guia de Avaliação: o tratamento de dados é de alto risco? Regra do 1+1, critérios gerais, critérios específicos e resultado."
          className="w-full rounded-lg border border-gray-200"
        />
        <figcaption className="text-[11px] text-gray-400 mt-1 text-center">
          Guia visual — toque/dê zoom pra ler os detalhes.
        </figcaption>
      </figure>

      {/* Passo 1 */}
      <section className="mt-6">
        <h2 className="text-base font-semibold text-gray-800 mb-2">
          Passo 1 — Critérios <span className="text-blue-700">Gerais</span> (escolha ≥ 1)
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Criterio icon={Layers} titulo="Tratamento em Larga Escala" cor="text-blue-600">
            Volume significativo de dados ou de titulares — ampla abrangência geográfica, longa
            duração ou grande número de pessoas afetadas.
          </Criterio>
          <Criterio icon={Scale} titulo="Afetação de Direitos Fundamentais" cor="text-blue-600">
            Tratamentos que possam limitar o exercício de direitos ou afetar significativamente os
            interesses e as liberdades dos titulares.
          </Criterio>
        </div>
      </section>

      {/* Passo 2 */}
      <section className="mt-5">
        <h2 className="text-base font-semibold text-gray-800 mb-2">
          Passo 2 — Critérios <span className="text-emerald-700">Específicos</span> (escolha ≥ 1)
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Criterio icon={Cpu} titulo="Tecnologias Emergentes ou Inovadoras" cor="text-emerald-600">
            Ferramentas novas, ou uso inovador de tecnologias existentes, que tragam riscos ainda
            pouco conhecidos.
          </Criterio>
          <Criterio icon={Video} titulo="Vigilância de Zonas Acessíveis ao Público" cor="text-emerald-600">
            Monitoramento sistemático de áreas onde circulam pessoas — câmeras de segurança em
            espaços abertos, por exemplo.
          </Criterio>
          <Criterio icon={GitBranch} titulo="Decisões Automatizadas e Profiling" cor="text-emerald-600">
            Decisões sem intervenção humana que definem perfis — de saúde, consumo, crédito ou
            profissional.
          </Criterio>
          <Criterio icon={HeartPulse} titulo="Dados Sensíveis ou de Vulneráveis" cor="text-emerald-600">
            Dados sensíveis (Art. 5º II — saúde, biometria, opinião política/religiosa…) ou de
            crianças, adolescentes e idosos.
          </Criterio>
        </div>
      </section>

      {/* Resultado */}
      <div className="mt-5 rounded-xl border-l-4 border-l-red-500 border border-red-200 bg-red-50/70 p-4">
        <h2 className="text-sm font-bold text-red-900 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-red-600" /> Resultado — Alto Risco confirmado
        </h2>
        <p className="text-sm text-red-900/90 mt-1 leading-relaxed">
          Marcou <strong>pelo menos uma opção em cada passo</strong>? Então, segundo a ANPD, o
          tratamento é <strong>legalmente de alto risco</strong> — e isso traz consequências práticas.
        </p>
      </div>

      {/* Por que importa */}
      <section className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
        <h2 className="text-sm font-semibold text-indigo-900">🔗 Por que isso importa (na Fase 2 e adiante)</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-indigo-900/90 leading-relaxed">
          <li>• Na <strong>priorização</strong>, processos de alto risco vão pro <strong>topo</strong> — são os primeiros a mapear no Inventário (Fase 3).</li>
          <li>• Alto risco <strong>obriga o RIPD</strong> (Relatório de Impacto à Proteção de Dados — Art. 38 da LGPD, Fase 6) e medidas de segurança reforçadas.</li>
          <li>• A <strong>Matriz de Priorização</strong> usa vários dos mesmos sinais (sensibilidade, vulneráveis, volume, tecnologias) — alto risco e alta prioridade andam juntos.</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/dashboard/fase-2/priorizacao" className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-800">
            Ir pra Matriz de Priorização <ArrowRight className="h-3 w-3" />
          </Link>
          <span className="text-indigo-300">·</span>
          <Link href="/dashboard/ripd" className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-800">
            Ver o RIPD (Fase 6) <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* Download da referência completa */}
      <a
        href="/criterios-priorizacao-anpd.pdf"
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-800 hover:bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white"
      >
        <FileDown className="h-4 w-4" /> Baixar a referência completa (PDF)
      </a>

      <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
        Fonte: critérios da <strong>Resolução CD/ANPD nº 2/2022</strong> e do Guia Orientativo da
        ANPD sobre tratamento de alto risco. Material de apoio do curso — não substitui a leitura
        da norma.
      </p>
    </div>
  );
}
