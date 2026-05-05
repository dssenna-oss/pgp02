


"use client";

import PhaseDocumentsUpload from "./phase-documents-upload";
import PhaseInfoManager from "./phase-info-manager";
import PhaseChecklist from "./phase-checklist";
import PhaseDescriptionManager from "./phase-description-manager";
import PhasePracticalLinks from "./phase-practical-links";
import PhaseEbooksManager from "./phase-ebooks-manager";
import PhaseSection from "./phase-section";
import PhaseToolbar from "./phase-toolbar";
import PhaseTOC from "./phase-toc";
import PhaseReadingProgress from "./phase-reading-progress";

export default function Fase2Content() {
  // Definir o checklist da Fase 2
  const checklistSections = [
    {
      id: "avaliacao-maturidade",
      title: "1. Avaliação de Maturidade em Privacidade",
      items: [
        {
          id: "realizar-diagnostico-inicial",
          label: "Realize um diagnóstico da situação atual de proteção de dados",
          checked: false
        },
        {
          id: "aplicar-questionario-maturidade",
          label: "Aplique questionário de maturidade em privacidade (ex: framework NIST)",
          checked: false
        },
        {
          id: "identificar-nivel-maturidade",
          label: "Identifique o nível de maturidade atual (inexistente, inicial, gerenciado, definido, otimizado)",
          checked: false
        },
        {
          id: "documentar-estado-atual",
          label: "Documente o estado atual de conformidade com a LGPD",
          checked: false
        }
      ]
    },
    {
      id: "levantamento-inicial",
      title: "2. Levantamento Inicial de Informações",
      items: [
        {
          id: "listar-sistemas-principais",
          label: "Liste os principais sistemas e aplicações que tratam dados pessoais",
          checked: false
        },
        {
          id: "identificar-bases-dados",
          label: "Identifique as principais bases de dados e repositórios",
          checked: false
        },
        {
          id: "mapear-fornecedores-chave",
          label: "Mapeie fornecedores e parceiros-chave que acessam dados",
          checked: false
        },
        {
          id: "identificar-processos-criticos",
          label: "Identifique processos críticos que envolvem dados pessoais",
          checked: false
        },
        {
          id: "verificar-documentacao-existente",
          label: "Verifique se existe documentação de privacidade e segurança",
          checked: false
        }
      ]
    },
    {
      id: "analise-conformidade-inicial",
      title: "3. Análise de Conformidade Inicial",
      items: [
        {
          id: "verificar-politicas-existentes",
          label: "Verifique se existem políticas de privacidade e segurança",
          checked: false
        },
        {
          id: "avaliar-avisos-privacidade",
          label: "Avalie avisos de privacidade e termos de uso atuais",
          checked: false
        },
        {
          id: "verificar-contratos",
          label: "Verifique se contratos possuem cláusulas de proteção de dados",
          checked: false
        },
        {
          id: "identificar-processos-consentimento",
          label: "Identifique como são coletados os consentimentos atualmente",
          checked: false
        },
        {
          id: "avaliar-medidas-seguranca",
          label: "Avalie as medidas de segurança técnicas existentes",
          checked: false
        }
      ]
    },
    {
      id: "identificacao-riscos-iniciais",
      title: "4. Identificação de Riscos Iniciais",
      items: [
        {
          id: "identificar-areas-alto-risco",
          label: "Identifique áreas de alto risco imediato",
          checked: false
        },
        {
          id: "listar-dados-sensiveis",
          label: "Liste tratamentos de dados sensíveis",
          checked: false
        },
        {
          id: "identificar-vulnerabilidades-criticas",
          label: "Identifique vulnerabilidades críticas evidentes",
          checked: false
        },
        {
          id: "avaliar-exposicao-regulatoria",
          label: "Avalie exposição a riscos regulatórios e sanções",
          checked: false
        }
      ]
    },
    {
      id: "priorizacao-proximas-fases",
      title: "5. Priorização para Próximas Fases",
      items: [
        {
          id: "definir-escopo-inicial",
          label: "Defina o escopo inicial do programa (áreas/processos prioritários)",
          checked: false
        },
        {
          id: "estabelecer-cronograma-macro",
          label: "Estabeleça cronograma macro das próximas fases",
          checked: false
        },
        {
          id: "identificar-recursos-necessarios",
          label: "Identifique recursos necessários (orçamento, equipe, ferramentas)",
          checked: false
        },
        {
          id: "obter-aprovacao-diretoria",
          label: "Obtenha aprovação da diretoria para prosseguir com o programa",
          checked: false
        },
        {
          id: "elaborar-relatorio-diagnostico",
          label: "Elabore relatório de diagnóstico para apresentação",
          checked: false
        }
      ]
    }
  ];

  return (
    <>
      <PhaseReadingProgress />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-6">
        <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🚩 Fase 2 - Diagnóstico Inicial
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Avaliação da situação atual e identificação do nível de maturidade em privacidade
        </p>
      </div>

      {/* Toolbar de UX (Recolher tudo / Expandir tudo + atalhos E/C) */}
      <PhaseToolbar phase="fase-2" />

      {/* E-books Interativos */}
      <PhaseEbooksManager phase="fase-2" />

      {/* Descrição da Fase */}
      <PhaseSection
        phase="fase-2"
        section="descricao"
        title="Descrição da Fase"
        icon="📄"
        subtitle="Visão geral da fase"
        defaultOpen={true}
        accent="blue"
      >
      <PhaseDescriptionManager
        phase="fase-2"
        noCard
        defaultContent={`
<p class="text-gray-700 dark:text-gray-300">
            Antes de iniciar o mapeamento detalhado, é fundamental fazer um diagnóstico da situação 
            atual da empresa em relação à proteção de dados pessoais. Esta fase permite entender o 
            ponto de partida e definir prioridades.
          </p>
          
          <h4 class="text-lg font-semibold mt-4 mb-2">Objetivos do Diagnóstico:</h4>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Avaliar o nível de maturidade em privacidade e segurança da informação</li>
            <li>Identificar o estado atual de conformidade com a LGPD</li>
            <li>Mapear sistemas, processos e fornecedores principais</li>
            <li>Identificar riscos críticos evidentes</li>
            <li>Definir escopo e prioridades para as próximas fases</li>
          </ul>

          <h4 class="text-lg font-semibold mt-4 mb-2">Atividades Principais:</h4>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Aplicação de questionários de avaliação de maturidade</li>
            <li>Entrevistas com gestores de áreas-chave</li>
            <li>Revisão de documentação existente (políticas, contratos, procedimentos)</li>
            <li>Inspeção visual de ambientes e sistemas principais</li>
            <li>Análise preliminar de riscos</li>
          </ul>

          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              <strong>💡 Importante:</strong> O diagnóstico inicial não precisa ser exaustivo. O objetivo 
              é ter uma visão geral suficiente para planejar as próximas etapas. O mapeamento detalhado 
              virá na Fase 3.
            </p>
          </div>

          <h4 class="text-lg font-semibold mt-4 mb-2">Resultado Esperado:</h4>
          <p class="text-gray-700 dark:text-gray-300">
            Ao final desta fase, a empresa deve ter um <strong>Relatório de Diagnóstico</strong> 
            com a situação atual, nível de maturidade identificado, riscos críticos mapeados e 
            recomendações de prioridades para as fases seguintes.
          </p>
        `}
      />
      </PhaseSection>

      {/* Orientações sobre a fase */}
      <PhaseInfoManager phase="fase-2" section="howto" />

      {/* Checklist de Implementação */}
      <PhaseSection
        phase="fase-2"
        section="checklist"
        title="Checklist de Implementação"
        icon="✅"
        subtitle="Itens de controle pra acompanhar o progresso da fase"
        accent="emerald"
      >
        <PhaseChecklist phase="fase-2" sections={checklistSections} noCard />
      </PhaseSection>

      {/* Na prática - Links para aplicativos externos */}
      <PhasePracticalLinks phase="fase-2" />

      {/* Documentação da Fase */}
      <PhaseSection
        phase="fase-2"
        section="documentacao"
        title="Documentação da Fase"
        icon="📂"
        subtitle="E-books, textos, PDFs e vídeos relacionados a esta fase"
        accent="blue"
      >
        <PhaseDocumentsUpload phase="fase-2" noCard />
      </PhaseSection>
        </div>
        <PhaseTOC phase="fase-2" />
      </div>
    </>
  );
}

