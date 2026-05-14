


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

export default function Fase3Content() {
  // Definir o checklist da Fase 3
  const checklistSections = [
    {
      id: "preparacao-mapeamento",
      title: "1. Preparação para o Mapeamento",
      items: [
        {
          id: "identificar-departamentos",
          label: "Identifique todos os departamentos que coletam/tratam dados pessoais",
          checked: false
        },
        {
          id: "agendar-entrevistas",
          label: "Agende entrevistas com gestores de cada área",
          checked: false
        },
        {
          id: "preparar-questionarios",
          label: "Prepare questionários de mapeamento para cada departamento",
          checked: false
        },
        {
          id: "definir-metodologia",
          label: "Defina a metodologia de documentação (planilhas, software específico, etc.)",
          checked: false
        }
      ]
    },
    {
      id: "mapeamento-por-area",
      title: "2. Mapeamento por Área da Empresa",
      items: [
        {
          id: "mapear-rh",
          label: "Mapeie tratamentos de dados do RH (funcionários, candidatos)",
          checked: false
        },
        {
          id: "mapear-comercial",
          label: "Mapeie tratamentos do Comercial/Vendas (clientes, prospects)",
          checked: false
        },
        {
          id: "mapear-marketing",
          label: "Mapeie tratamentos do Marketing (leads, newsletters, campanhas)",
          checked: false
        },
        {
          id: "mapear-ti",
          label: "Mapeie sistemas e bancos de dados da TI",
          checked: false
        },
        {
          id: "mapear-financeiro",
          label: "Mapeie tratamentos do Financeiro (dados bancários, transações)",
          checked: false
        },
        {
          id: "mapear-outras-areas",
          label: "Mapeie outras áreas relevantes (atendimento, logística, etc.)",
          checked: false
        }
      ]
    },
    {
      id: "detalhamento-processos",
      title: "3. Detalhamento de Cada Processo",
      items: [
        {
          id: "listar-dados-coletados",
          label: "Liste todos os dados pessoais coletados em cada processo",
          checked: false
        },
        {
          id: "identificar-fontes",
          label: "Identifique as fontes de coleta (formulários, contratos, sistemas)",
          checked: false
        },
        {
          id: "definir-finalidades",
          label: "Defina claramente a finalidade de cada tratamento",
          checked: false
        },
        {
          id: "identificar-base-legal",
          label: "Identifique a base legal para cada tratamento",
          checked: false
        },
        {
          id: "mapear-armazenamento",
          label: "Mapeie onde e como os dados são armazenados",
          checked: false
        },
        {
          id: "identificar-acessos",
          label: "Identifique quem tem acesso aos dados (pessoas e sistemas)",
          checked: false
        },
        {
          id: "definir-retencao",
          label: "Defina o período de retenção de cada categoria de dados",
          checked: false
        },
        {
          id: "mapear-compartilhamento",
          label: "Mapeie com quem os dados são compartilhados (fornecedores, parceiros)",
          checked: false
        },
        {
          id: "documentar-descarte",
          label: "Documente como os dados são descartados ao final do ciclo",
          checked: false
        }
      ]
    },
    {
      id: "consolidacao-inventario",
      title: "4. Consolidação do Inventário de Dados",
      items: [
        {
          id: "compilar-informacoes",
          label: "Compile todas as informações coletadas em um inventário centralizado",
          checked: false
        },
        {
          id: "classificar-dados",
          label: "Classifique os dados por sensibilidade (dados comuns vs. sensíveis)",
          checked: false
        },
        {
          id: "criar-fluxogramas",
          label: "Crie fluxogramas dos principais fluxos de dados",
          checked: false
        },
        {
          id: "validar-informacoes",
          label: "Valide as informações com os responsáveis de cada área",
          checked: false
        }
      ]
    },
    {
      id: "analise-riscos-seguranca",
      title: "5. Análise de Riscos de Segurança",
      items: [
        {
          id: "avaliar-controles-acesso",
          label: "Avalie os controles de acesso aos dados (físico e lógico)",
          checked: false
        },
        {
          id: "verificar-criptografia",
          label: "Verifique se dados sensíveis estão criptografados",
          checked: false
        },
        {
          id: "analisar-backup",
          label: "Analise procedimentos de backup e recuperação",
          checked: false
        },
        {
          id: "avaliar-vulnerabilidades",
          label: "Identifique vulnerabilidades técnicas nos sistemas",
          checked: false
        },
        {
          id: "revisar-seguranca-fisica",
          label: "Revise a segurança física dos locais de armazenamento",
          checked: false
        },
        {
          id: "classificar-riscos-seguranca",
          label: "Classifique os riscos de segurança por criticidade (alto, médio, baixo)",
          checked: false
        }
      ]
    },
    {
      id: "avaliacao-impacto",
      title: "6. Avaliação de Impacto dos Riscos",
      items: [
        {
          id: "identificar-tratamentos-alto-risco",
          label: "Identifique tratamentos de alto risco que requerem RIPD (Relatório de Impacto)",
          checked: false
        },
        {
          id: "avaliar-impacto-titulares",
          label: "Avalie o impacto potencial sobre os direitos dos titulares",
          checked: false
        },
        {
          id: "estimar-impacto-reputacional",
          label: "Estime o impacto reputacional de possíveis incidentes",
          checked: false
        },
        {
          id: "calcular-impacto-financeiro",
          label: "Calcule o impacto financeiro de multas e sanções potenciais",
          checked: false
        },
        {
          id: "documentar-riscos",
          label: "Documente todos os riscos identificados em um relatório",
          checked: false
        },
        {
          id: "priorizar-riscos",
          label: "Priorize os riscos por criticidade e urgência",
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
          🚩 Fase 3 - Mapeamento e Análise de Riscos
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Mapeamento completo dos processos e avaliação dos riscos de privacidade e segurança
        </p>
      </div>

      {/* Toolbar de UX (Recolher tudo / Expandir tudo + atalhos E/C) */}
      <PhaseToolbar phase="fase-3" />

      {/* E-books Interativos */}
      <PhaseEbooksManager phase="fase-3" />

      {/* Descrição da Fase */}
      <PhaseSection
        phase="fase-3"
        section="descricao"
        title="Descrição da Fase"
        icon="📄"
        subtitle="Visão geral da fase"
        defaultOpen={true}
        accent="blue"
      >
      <PhaseDescriptionManager
        phase="fase-3"
        noCard
        defaultContent={`
<p class="text-gray-700 dark:text-gray-300">
            Esta fase combina o mapeamento detalhado de todos os processos de tratamento de dados 
            pessoais com a análise dos riscos associados a cada tratamento.
          </p>
          
          <h4 class="text-lg font-semibold mt-4 mb-2">Parte 1: Mapeamento de Processos</h4>
          <p class="text-gray-700 dark:text-gray-300">
            O mapeamento deve documentar para cada processo de tratamento:
          </p>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Quais dados pessoais são coletados</li>
            <li>Como são coletados (formulários, contratos, sistemas)</li>
            <li>Para que finalidade são utilizados</li>
            <li>Qual a base legal (consentimento, contrato, obrigação legal, etc.)</li>
            <li>Onde são armazenados</li>
            <li>Quem tem acesso a esses dados</li>
            <li>Por quanto tempo são mantidos</li>
            <li>Com quem são compartilhados</li>
            <li>Como são descartados</li>
          </ul>

          <h4 class="text-lg font-semibold mt-4 mb-2">Parte 2: Análise de Riscos</h4>
          <p class="text-gray-700 dark:text-gray-300">
            Para cada processo mapeado, avalie os riscos de segurança e privacidade:
          </p>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Riscos de vazamento ou acesso não autorizado</li>
            <li>Adequação das medidas de segurança existentes</li>
            <li>Vulnerabilidades técnicas e organizacionais</li>
            <li>Impacto potencial sobre os titulares em caso de incidente</li>
            <li>Riscos regulatórios e reputacionais</li>
          </ul>

          <div class="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mt-4">
            <p class="text-sm text-amber-800 dark:text-amber-200">
              <strong>⚠️ Importante:</strong> O mapeamento deve incluir TODOS os departamentos da empresa. 
              Cada área trata dados de forma diferente e todas devem estar em conformidade. A análise de 
              riscos deve ser realizada para cada processo mapeado.
            </p>
          </div>

          <h4 class="text-lg font-semibold mt-4 mb-2">Resultado Esperado:</h4>
          <p class="text-gray-700 dark:text-gray-300">
            Ao final desta fase, a empresa deve ter um <strong>Inventário de Dados</strong> completo 
            e um <strong>Relatório de Análise de Riscos</strong>, documentando todo o ciclo de vida 
            dos dados pessoais e os riscos associados a cada tratamento.
          </p>
        `}
      />
      </PhaseSection>

      {/* Orientações sobre a fase */}
      <PhaseInfoManager phase="fase-3" section="howto" />

      {/* Checklist de Implementação */}
      <PhaseSection
        phase="fase-3"
        section="checklist"
        title="Checklist de Implementação"
        icon="✅"
        subtitle="Itens de controle pra acompanhar o progresso da fase"
        accent="emerald"
      >
        <PhaseChecklist phase="fase-3" sections={checklistSections} noCard />
      </PhaseSection>

      {/* Na prática - Links para aplicativos externos */}
      <PhasePracticalLinks phase="fase-3" />

      {/* Documentação da Fase */}
      <PhaseSection
        phase="fase-3"
        section="documentacao"
        title="Documentação da Fase"
        icon="📂"
        subtitle="E-books, textos, PDFs e vídeos relacionados a esta fase"
        accent="blue"
      >
        <PhaseDocumentsUpload phase="fase-3" noCard />
      </PhaseSection>
        </div>
        <PhaseTOC phase="fase-3" />
      </div>
    </>
  );
}


