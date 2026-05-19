"use client";

// MapaPgp — visão "onde você está no Programa de Governança em Privacidade".
// Mostra as 9 fases do PGP em um grid horizontal compacto. Preliminar/Fase 1/Fase 2
// vêm marcadas como "feito antes da turma chegar" e abrem modal explicativo.
// Fase atual (definida pelo prop `faseAtual`, default 3) aparece destacada com pulse.

import { useState } from "react";
import { X } from "lucide-react";

type FaseId = "preliminar" | "f1" | "f2" | "f3" | "f4" | "f5" | "f6" | "f7" | "f8";

type Fase = {
  id: FaseId;
  rotulo: string;       // "Preliminar", "Fase 1"...
  titulo: string;       // "Capacitação", "DPO + Comitê"...
};

const FASES: Fase[] = [
  { id: "preliminar", rotulo: "Preliminar", titulo: "Capacitação" },
  { id: "f1",         rotulo: "Fase 1",     titulo: "DPO + Comitê" },
  { id: "f2",         rotulo: "Fase 2",     titulo: "Escopo" },
  { id: "f3",         rotulo: "Fase 3",     titulo: "Inventário + Riscos" },
  { id: "f4",         rotulo: "Fase 4",     titulo: "GAP" },
  { id: "f5",         rotulo: "Fase 5",     titulo: "Plano de Ação" },
  { id: "f6",         rotulo: "Fase 6",     titulo: "RIPD + Aviso" },
  { id: "f7",         rotulo: "Fase 7",     titulo: "Incidentes" },
  { id: "f8",         rotulo: "Fase 8",     titulo: "Monitorar" },
];

const EXPLICACOES: Record<"preliminar" | "f1" | "f2", { titulo: string; corpo: React.ReactNode }> = {
  preliminar: {
    titulo: "Fase Preliminar — Capacitação e Sensibilização",
    corpo: (
      <>
        <p><strong>O que aconteceu antes da turma chegar:</strong> a Prefeitura/Câmara contratou consultoria LGPD e ministrou 4 horas de aula teórica pros servidores envolvidos no tratamento de dados — você é resultado disso.</p>
        <p><strong>O que produziu:</strong> ~30 servidores capacitados em conceitos básicos (dados pessoais, sensíveis, bases legais, direitos dos titulares).</p>
        <p><strong>Por que importa pra você agora:</strong> sem esse alicerce, a Fase 3 (que você vai jogar) viraria "encher formulário no escuro". Quem chega ao Inventário precisa SABER o que está catalogando.</p>
        <p className="text-xs text-gray-500 italic">No app principal do PGP isso é o mini-app de Capacitação LGPD.</p>
      </>
    ),
  },
  f1: {
    titulo: "Fase 1 — Designação do DPO + Comitê + Política Institucional",
    corpo: (
      <>
        <p><strong>O que aconteceu antes da turma chegar:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>O Prefeito/Presidente da Câmara <strong>nomeou formalmente o Encarregado (DPO)</strong> por portaria — você foi indicado.</li>
          <li>Foi criado o <strong>Comitê Gestor de Proteção de Dados</strong> com representantes de TI, Jurídico, RH, Comunicação.</li>
          <li>Aprovou-se a <strong>Política Institucional de Privacidade</strong> (documento de alto nível que declara o compromisso da instituição).</li>
        </ul>
        <p><strong>Por que importa pra você agora:</strong> o DPO sem mandato formal não tem autoridade pra exigir os Inventários dos donos de processo. Sem Comitê, decisões ficam só nas costas do DPO. A LGPD exige Encarregado nomeado (Art. 41).</p>
        <p className="text-xs text-gray-500 italic">No app principal do PGP isso é o mini-app de Encarregado + Política do PGP.</p>
      </>
    ),
  },
  f2: {
    titulo: "Fase 2 — Escopo e Levantamento Preliminar",
    corpo: (
      <>
        <p><strong>O que aconteceu antes da turma chegar:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>O DPO + Comitê identificaram <strong>todos os setores</strong> da instituição que tratam dados pessoais.</li>
          <li>Definiu-se a <strong>ordem de prioridade</strong>: quais setores serão atacados primeiro no Inventário.</li>
          <li>Cada setor pré-listou os processos que tem (sem detalhar ainda).</li>
        </ul>
        <p><strong>Por que importa pra você agora:</strong> os <strong>2 processos pré-cadastrados</strong> que aparecem no seu Inventário (ex.: Posto de Saúde + Estagiários, ou Tribuna Livre + Ouvidoria) <strong>vieram desse levantamento preliminar</strong>. Não caíram do céu. A Fase 2 entregou pra você uma "lista do que catalogar" — agora na Fase 3 você detalha cada um.</p>
        <p className="text-xs text-gray-500 italic">No app principal do PGP isso é o conteúdo didático da Fase 2 + o card "Próximas etapas".</p>
      </>
    ),
  },
};

export function MapaPgp({ faseAtual = "f3" as Exclude<FaseId, "preliminar">}: { faseAtual?: Exclude<FaseId, "preliminar"> }) {
  const [modal, setModal] = useState<"preliminar" | "f1" | "f2" | null>(null);

  const idxAtual = FASES.findIndex((f) => f.id === faseAtual);

  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Onde você está no Programa de Governança em Privacidade
      </h2>

      {/* Grid 9 colunas em desktop, scroll horizontal em mobile */}
      <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
        {FASES.map((fase, idx) => {
          const isPassado = idx < idxAtual;
          const isAtual = idx === idxAtual;
          const isFuturo = idx > idxAtual;
          const clicavel = isPassado && (fase.id === "preliminar" || fase.id === "f1" || fase.id === "f2");

          if (isAtual) {
            return (
              <div
                key={fase.id}
                className="text-left border-2 border-emerald-500 bg-emerald-50 rounded-md p-3 relative animate-pulse-here"
              >
                <div className="text-[10px] font-bold text-emerald-700 mb-1">{fase.rotulo}</div>
                <div className="text-xs font-bold text-emerald-900 leading-tight">{fase.titulo}</div>
                <div className="mt-2 inline-flex items-center text-[10px] text-emerald-800 font-bold">
                  📍 você está aqui
                </div>
              </div>
            );
          }

          if (clicavel) {
            return (
              <button
                key={fase.id}
                type="button"
                onClick={() => setModal(fase.id as "preliminar" | "f1" | "f2")}
                className="text-left border border-gray-200 bg-gray-50 rounded-md p-3 hover:border-gray-400 hover:bg-gray-100 transition-all"
              >
                <div className="text-[10px] font-bold text-gray-400 mb-1">{fase.rotulo}</div>
                <div className="text-xs font-medium text-gray-600 leading-tight">{fase.titulo}</div>
                <div className="mt-2 inline-flex items-center text-[10px] text-green-700 font-semibold">
                  ✓ feito
                </div>
              </button>
            );
          }

          // futuro
          return (
            <div
              key={fase.id}
              className="text-left border border-gray-200 bg-white rounded-md p-3 opacity-60"
            >
              <div className="text-[10px] font-bold text-gray-400 mb-1">{fase.rotulo}</div>
              <div className="text-xs font-medium text-gray-500 leading-tight">{fase.titulo}</div>
              <div className="mt-2 text-[10px] text-gray-400">à frente</div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 mt-3 italic">
        💡 Clique nas fases <strong>Preliminar / Fase 1 / Fase 2</strong> pra ver o que já foi feito antes da turma chegar.
      </p>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold">{EXPLICACOES[modal].titulo}</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                aria-label="Fechar"
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-sm text-gray-700 space-y-3">
              {EXPLICACOES[modal].corpo}
            </div>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="mt-5 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 rounded"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse-here {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55); }
          70% { box-shadow: 0 0 0 14px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .animate-pulse-here {
          animation: pulse-here 1.8s infinite;
        }
      `}</style>
    </div>
  );
}
