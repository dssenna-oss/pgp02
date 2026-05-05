

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

export default function Fase1Content() {
  // Definir o checklist da Fase 1
  const checklistSections = [
    {
      id: "comite-multidisciplinar",
      title: "1. Formação do Comitê Multidisciplinar (se aplicável)",
      items: [
        {
          id: "identificar-areas-chave",
          label: "Identifique as áreas-chave: TI, Jurídico, Compliance, RH, Marketing, Comercial",
          checked: false
        },
        {
          id: "nomear-representantes",
          label: "Nomeie representantes de cada área para compor o comitê",
          checked: false
        },
        {
          id: "definir-reunioes",
          label: "Defina periodicidade de reuniões do comitê (mensal recomendado)",
          checked: false
        },
        {
          id: "criar-regimento",
          label: "Crie um regimento interno do comitê com atribuições e responsabilidades",
          checked: false
        }
      ]
    },
    {
      id: "definicao-papeis",
      title: "2. Definição de Papéis e Responsabilidades",
      items: [
        {
          id: "designar-controlador",
          label: "Formalize a designação do Controlador de Dados (geralmente a própria empresa)",
          checked: false
        },
        {
          id: "identificar-operadores",
          label: "Identifique e documente todos os Operadores de Dados (internos e externos)",
          checked: false
        },
        {
          id: "selecionar-dpo",
          label: "Selecione o Encarregado de Dados (DPO) - pode ser funcionário ou terceirizado",
          checked: false
        },
        {
          id: "formalizar-dpo",
          label: "Formalize a nomeação do DPO com documento oficial e comunicação interna",
          checked: false
        },
        {
          id: "publicar-contato-dpo",
          label: "Publique os dados de contato do DPO no site e nos avisos de privacidade",
          checked: false
        }
      ]
    },
    {
      id: "capacitacao-inicial",
      title: "3. Capacitação Inicial da Equipe",
      items: [
        {
          id: "treinamento-comite",
          label: "Promova treinamento inicial sobre LGPD para todos os membros do comitê",
          checked: false
        },
        {
          id: "definir-canais",
          label: "Estabeleça canais de comunicação entre as equipes e o DPO",
          checked: false
        },
        {
          id: "criar-matriz-responsabilidades",
          label: "Crie uma matriz de responsabilidades (RACI) para o programa de governança",
          checked: false
        }
      ]
    },
    {
      id: "estrutura-governanca",
      title: "4. Estruturação da Governança",
      items: [
        {
          id: "definir-hierarquia",
          label: "Defina a estrutura hierárquica do programa de governança",
          checked: false
        },
        {
          id: "estabelecer-processos",
          label: "Estabeleça processos de escalação e tomada de decisão",
          checked: false
        },
        {
          id: "documentar-estrutura",
          label: "Documente toda a estrutura organizacional da governança de dados",
          checked: false
        },
        {
          id: "comunicar-organizacao",
          label: "Comunique a estrutura e responsabilidades para toda a organização",
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
          🚩 Fase 1 - Formação das Equipes de Trabalho
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Definição de responsáveis e estruturação da equipe
        </p>
      </div>

      {/* Toolbar de UX (Recolher tudo / Expandir tudo + atalhos E/C) */}
      <PhaseToolbar phase="fase-1" />

      {/* E-books Interativos */}
      <PhaseEbooksManager phase="fase-1" />

      {/* Descrição da Fase */}
      <PhaseSection
        phase="fase-1"
        section="descricao"
        title="Descrição da Fase"
        icon="📄"
        subtitle="Visão geral da fase"
        defaultOpen={true}
        accent="blue"
      >
      <PhaseDescriptionManager
        phase="fase-1"
        noCard
        defaultContent={`
          <p class="text-gray-700 dark:text-gray-300">
            Essa segunda etapa serve principalmente para as grandes empresas. Contudo, sendo a PJ empresa 
            familiar, de pequeno ou médio porte, ainda que não seja necessário criar um comitê multidisciplinar, 
            será de extrema importância definir quem será o Controlador e o Operador dos dados tratados.
          </p>
          
          <h4 class="text-lg font-semibold mt-4 mb-2">Definições Importantes:</h4>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <strong>Controlador:</strong> Pessoa natural ou jurídica, de direito público ou privado, 
              a quem competem as decisões referentes ao tratamento de dados pessoais
            </li>
            <li>
              <strong>Operador:</strong> Pessoa natural ou jurídica, de direito público ou privado, 
              que realiza o tratamento de dados pessoais em nome do controlador
            </li>
            <li>
              <strong>Encarregado (DPO):</strong> Pessoa indicada pelo controlador e operador para atuar 
              como canal de comunicação entre o controlador, os titulares dos dados e a Autoridade Nacional 
              de Proteção de Dados (ANPD)
            </li>
          </ul>

          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              <strong>💡 Dica:</strong> Após definir os responsáveis, deverá ser nomeado um profissional 
              qualificado para a função de Encarregado. Este profissional deve ter conhecimento em 
              proteção de dados e capacidade técnica para exercer a função.
            </p>
          </div>
        `}
      />
      </PhaseSection>

      {/* Orientações sobre a fase */}
      <PhaseInfoManager phase="fase-1" section="howto" />

      {/* Checklist de Implementação */}
      <PhaseSection
        phase="fase-1"
        section="checklist"
        title="Checklist de Implementação"
        icon="✅"
        subtitle="Itens de controle pra acompanhar o progresso da fase"
        accent="emerald"
      >
        <PhaseChecklist phase="fase-1" sections={checklistSections} noCard />
      </PhaseSection>

      {/* Na prática - Links para aplicativos externos */}
      <PhasePracticalLinks phase="fase-1" />

      {/* Documentação da Fase */}
      <PhaseSection
        phase="fase-1"
        section="documentacao"
        title="Documentação da Fase"
        icon="📂"
        subtitle="E-books, textos, PDFs e vídeos relacionados a esta fase"
        accent="blue"
      >
        <PhaseDocumentsUpload phase="fase-1" noCard />
      </PhaseSection>
        </div>
        <PhaseTOC phase="fase-1" />
      </div>
    </>
  );
}
