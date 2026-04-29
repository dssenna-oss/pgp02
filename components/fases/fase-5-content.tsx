


"use client";

import PhaseDocumentsUpload from "./phase-documents-upload";
import PhaseInfoManager from "./phase-info-manager";
import PhaseChecklist from "./phase-checklist";
import PhaseDescriptionManager from "./phase-description-manager";
import PhasePracticalLinks from "./phase-practical-links";
import PhaseEbooksManager from "./phase-ebooks-manager";

export default function Fase5Content() {
  // Definir o checklist da Fase 5
  const checklistSections = [
    {
      id: "elaboracao-plano",
      title: "1. Elaboração do Plano de Ação",
      items: [
        {
          id: "listar-gaps-riscos",
          label: "Liste todos os gaps e riscos identificados na Fase 3",
          checked: false
        },
        {
          id: "priorizar-acoes",
          label: "Priorize as ações por criticidade, urgência e impacto",
          checked: false
        },
        {
          id: "definir-responsaveis",
          label: "Defina responsáveis específicos para cada ação",
          checked: false
        },
        {
          id: "estabelecer-prazos",
          label: "Estabeleça prazos realistas para cada ação",
          checked: false
        },
        {
          id: "estimar-recursos",
          label: "Estime recursos necessários (financeiros, humanos, tecnológicos)",
          checked: false
        },
        {
          id: "definir-indicadores",
          label: "Defina indicadores para medir o sucesso de cada ação",
          checked: false
        }
      ]
    },
    {
      id: "adequacao-politicas",
      title: "2. Adequação de Políticas e Documentos",
      items: [
        {
          id: "criar-politica-privacidade",
          label: "Crie ou atualize a Política de Privacidade pública",
          checked: false
        },
        {
          id: "criar-politica-interna",
          label: "Crie Política Interna de Proteção de Dados",
          checked: false
        },
        {
          id: "atualizar-termos-uso",
          label: "Atualize Termos de Uso e Consentimento",
          checked: false
        },
        {
          id: "criar-avisos-privacidade",
          label: "Crie avisos de privacidade específicos para cada finalidade",
          checked: false
        },
        {
          id: "revisar-contratos",
          label: "Revise e atualize contratos com fornecedores e parceiros",
          checked: false
        }
      ]
    },
    {
      id: "adequacao-processos",
      title: "3. Adequação de Processos",
      items: [
        {
          id: "implementar-coleta-consentimento",
          label: "Implemente processos adequados de coleta de consentimento",
          checked: false
        },
        {
          id: "criar-processo-direitos",
          label: "Crie processo para atendimento aos direitos dos titulares",
          checked: false
        },
        {
          id: "implementar-gestao-incidentes",
          label: "Implemente processo de gestão de incidentes de segurança",
          checked: false
        },
        {
          id: "definir-retencao-dados",
          label: "Defina e implemente políticas de retenção e descarte de dados",
          checked: false
        },
        {
          id: "adequar-coleta-dados",
          label: "Adeque formulários e processos de coleta de dados",
          checked: false
        }
      ]
    },
    {
      id: "medidas-seguranca",
      title: "4. Implementação de Medidas de Segurança",
      items: [
        {
          id: "implementar-controles-acesso",
          label: "Implemente controles de acesso baseados em função e necessidade",
          checked: false
        },
        {
          id: "implementar-criptografia",
          label: "Implemente criptografia para dados sensíveis (em trânsito e em repouso)",
          checked: false
        },
        {
          id: "configurar-logs-auditoria",
          label: "Configure logs e trilhas de auditoria",
          checked: false
        },
        {
          id: "implementar-backup",
          label: "Implemente e teste procedimentos de backup e recuperação",
          checked: false
        },
        {
          id: "atualizar-seguranca-sistemas",
          label: "Atualize medidas de segurança em sistemas e aplicações",
          checked: false
        },
        {
          id: "implementar-anonimizacao",
          label: "Implemente técnicas de anonimização/pseudonimização quando aplicável",
          checked: false
        }
      ]
    },
    {
      id: "adequacao-tecnologica",
      title: "5. Adequação Tecnológica",
      items: [
        {
          id: "atualizar-sistemas",
          label: "Atualize sistemas para suportar requisitos de privacidade",
          checked: false
        },
        {
          id: "implementar-ferramentas-gestao",
          label: "Implemente ferramentas de gestão de privacidade (se aplicável)",
          checked: false
        },
        {
          id: "ajustar-formularios-web",
          label: "Ajuste formulários web para conformidade (consentimento, minimização)",
          checked: false
        },
        {
          id: "implementar-portal-titular",
          label: "Implemente portal ou canal para solicitações de titulares",
          checked: false
        }
      ]
    },
    {
      id: "acompanhamento-plano",
      title: "6. Acompanhamento do Plano de Ação",
      items: [
        {
          id: "criar-cronograma-detalhado",
          label: "Crie cronograma detalhado de implementação",
          checked: false
        },
        {
          id: "agendar-reunioes-acompanhamento",
          label: "Agende reuniões periódicas de acompanhamento",
          checked: false
        },
        {
          id: "documentar-implementacoes",
          label: "Documente todas as implementações e evidências de conformidade",
          checked: false
        },
        {
          id: "monitorar-indicadores",
          label: "Monitore indicadores de progresso estabelecidos",
          checked: false
        },
        {
          id: "reportar-diretoria",
          label: "Reporte progresso regularmente para a diretoria",
          checked: false
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🚩 Fase 5 - Plano de Ação e Adequação
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Elaboração e implementação de medidas corretivas e preventivas
        </p>
      </div>

      {/* E-books Interativos */}
      <PhaseEbooksManager phase="fase-5" />

      {/* Descrição da Fase */}
      <PhaseDescriptionManager 
        phase="fase-5" 
        defaultContent={`
<p class="text-gray-700 dark:text-gray-300">
            Com base nos riscos e lacunas identificadas na Fase 3, esta etapa consiste em criar um 
            plano de ação detalhado para corrigir as não conformidades e implementar as melhorias 
            necessárias para adequação à LGPD.
          </p>
          
          <h4 class="text-lg font-semibold mt-4 mb-2">Elementos do Plano de Ação:</h4>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Priorização:</strong> Organize as ações por criticidade e urgência</li>
            <li><strong>Responsáveis:</strong> Defina quem será responsável por cada ação</li>
            <li><strong>Prazos:</strong> Estabeleça cronograma realista para implementação</li>
            <li><strong>Recursos:</strong> Identifique os recursos necessários (financeiros, humanos, tecnológicos)</li>
            <li><strong>Indicadores:</strong> Defina como medir o sucesso de cada ação</li>
          </ul>

          <h4 class="text-lg font-semibold mt-4 mb-2">Ações Típicas:</h4>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Criação/atualização de Políticas de Privacidade</li>
            <li>Adequação de contratos e termos de uso</li>
            <li>Implementação de medidas de segurança técnicas</li>
            <li>Treinamento de colaboradores</li>
            <li>Adequação de processos de coleta e consentimento</li>
            <li>Criação de procedimentos para atendimento aos direitos dos titulares</li>
            <li>Implementação de gestão de incidentes</li>
          </ul>

          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4">
            <p class="text-sm text-green-800 dark:text-green-200">
              <strong>✅ Dica:</strong> Mantenha registro detalhado de todas as ações implementadas. 
              Esta documentação será importante para demonstrar conformidade e o princípio da 
              accountability (prestação de contas) exigido pela LGPD.
            </p>
          </div>
        `}
      />

      {/* Orientações sobre a fase */}
      <PhaseInfoManager phase="fase-5" section="howto" />

      {/* Considerações sobre a fase */}
      <PhaseChecklist phase="fase-5" sections={checklistSections} />

      {/* Na prática - Links para aplicativos externos */}
      <PhasePracticalLinks phase="fase-5" />

      {/* Documentação da Fase */}
      <PhaseDocumentsUpload phase="fase-5" />
    </div>
  );
}

