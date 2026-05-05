


"use client";

import PhaseDocumentsUpload from "./phase-documents-upload";
import PhaseInfoManager from "./phase-info-manager";
import PhaseChecklist from "./phase-checklist";
import PhaseDescriptionManager from "./phase-description-manager";
import PhasePracticalLinks from "./phase-practical-links";
import PhaseEbooksManager from "./phase-ebooks-manager";
import PhaseSection from "./phase-section";
import PhaseToolbar from "./phase-toolbar";

export default function Fase4Content() {
  // Definir o checklist da Fase 4
  const checklistSections = [
    {
      id: "preparacao-gap-analysis",
      title: "1. Preparação para GAP Analysis",
      items: [
        {
          id: "revisar-inventario-riscos",
          label: "Revise o inventário de dados e relatório de riscos da Fase 3",
          checked: false
        },
        {
          id: "definir-metodologia-gap",
          label: "Defina a metodologia de análise de lacunas",
          checked: false
        },
        {
          id: "preparar-templates-gap",
          label: "Prepare templates para documentação de gaps identificados",
          checked: false
        },
        {
          id: "estudar-requisitos-lgpd",
          label: "Estude detalhadamente os requisitos da LGPD aplicáveis",
          checked: false
        }
      ]
    },
    {
      id: "gap-bases-legais",
      title: "2. GAP: Bases Legais e Consentimento",
      items: [
        {
          id: "verificar-bases-legais",
          label: "Verifique se todos os tratamentos possuem base legal adequada",
          checked: false
        },
        {
          id: "avaliar-consentimentos",
          label: "Avalie se os consentimentos são coletados de forma válida (específico, livre, informado)",
          checked: false
        },
        {
          id: "verificar-documentacao-bases",
          label: "Verifique se as bases legais estão documentadas para cada tratamento",
          checked: false
        },
        {
          id: "identificar-tratamentos-sem-base",
          label: "Identifique tratamentos sem base legal clara",
          checked: false
        }
      ]
    },
    {
      id: "gap-transparencia",
      title: "3. GAP: Transparência e Direitos dos Titulares",
      items: [
        {
          id: "avaliar-politica-privacidade",
          label: "Avalie se a política de privacidade é completa e acessível",
          checked: false
        },
        {
          id: "verificar-avisos-coleta",
          label: "Verifique se há avisos de privacidade em todos os pontos de coleta",
          checked: false
        },
        {
          id: "avaliar-processos-direitos",
          label: "Avalie se há processos para atender direitos dos titulares (acesso, correção, exclusão)",
          checked: false
        },
        {
          id: "verificar-canal-titular",
          label: "Verifique se há canal claro para solicitações de titulares",
          checked: false
        },
        {
          id: "avaliar-prazo-resposta",
          label: "Avalie se há processo para responder solicitações no prazo legal",
          checked: false
        }
      ]
    },
    {
      id: "gap-seguranca",
      title: "4. GAP: Medidas de Segurança",
      items: [
        {
          id: "verificar-controles-acesso",
          label: "Verifique lacunas nos controles de acesso",
          checked: false
        },
        {
          id: "identificar-falta-criptografia",
          label: "Identifique dados sensíveis não criptografados",
          checked: false
        },
        {
          id: "avaliar-monitoramento",
          label: "Avalie lacunas em logs e monitoramento",
          checked: false
        },
        {
          id: "verificar-backup",
          label: "Verifique adequação de backup e recuperação",
          checked: false
        },
        {
          id: "identificar-vulnerabilidades",
          label: "Identifique vulnerabilidades de segurança não tratadas",
          checked: false
        }
      ]
    },
    {
      id: "gap-contratos",
      title: "5. GAP: Contratos e Fornecedores",
      items: [
        {
          id: "verificar-clausulas-fornecedores",
          label: "Verifique se contratos com fornecedores têm cláusulas de proteção de dados",
          checked: false
        },
        {
          id: "avaliar-acordos-operadores",
          label: "Avalie se há acordos formais de controlador-operador",
          checked: false
        },
        {
          id: "verificar-diligencia-fornecedores",
          label: "Verifique se há processo de due diligence de fornecedores",
          checked: false
        },
        {
          id: "identificar-contratos-inadequados",
          label: "Identifique contratos que precisam ser atualizados",
          checked: false
        }
      ]
    },
    {
      id: "gap-governanca",
      title: "6. GAP: Governança e Documentação",
      items: [
        {
          id: "verificar-politicas-internas",
          label: "Verifique lacunas em políticas internas de proteção de dados",
          checked: false
        },
        {
          id: "avaliar-procedimentos",
          label: "Avalie se há procedimentos operacionais documentados",
          checked: false
        },
        {
          id: "verificar-registro-tratamentos",
          label: "Verifique se há registro de atividades de tratamento (ROPA)",
          checked: false
        },
        {
          id: "avaliar-gestao-incidentes",
          label: "Avalie se há processo de gestão de incidentes",
          checked: false
        },
        {
          id: "verificar-privacidade-design",
          label: "Verifique se há implementação de privacy by design",
          checked: false
        }
      ]
    },
    {
      id: "gap-retencao",
      title: "7. GAP: Retenção e Descarte",
      items: [
        {
          id: "avaliar-politica-retencao",
          label: "Avalie se os períodos de retenção estão definidos e documentados",
          checked: false
        },
        {
          id: "verificar-processo-descarte",
          label: "Verifique se há processo adequado de descarte de dados",
          checked: false
        },
        {
          id: "identificar-dados-desnecessarios",
          label: "Identifique dados sendo mantidos além do necessário",
          checked: false
        }
      ]
    },
    {
      id: "gap-treinamento",
      title: "8. GAP: Treinamento e Conscientização",
      items: [
        {
          id: "verificar-programa-treinamento",
          label: "Verifique se há programa de treinamento em LGPD",
          checked: false
        },
        {
          id: "avaliar-conscientizacao",
          label: "Avalie o nível de conscientização dos colaboradores",
          checked: false
        },
        {
          id: "identificar-necessidades-capacitacao",
          label: "Identifique necessidades de capacitação por área",
          checked: false
        }
      ]
    },
    {
      id: "consolidacao-gaps",
      title: "9. Consolidação e Priorização",
      items: [
        {
          id: "documentar-todos-gaps",
          label: "Documente todas as lacunas identificadas",
          checked: false
        },
        {
          id: "classificar-gaps-criticidade",
          label: "Classifique os gaps por criticidade (alto, médio, baixo)",
          checked: false
        },
        {
          id: "priorizar-gaps",
          label: "Priorize os gaps considerando risco e urgência",
          checked: false
        },
        {
          id: "estimar-esforco",
          label: "Estime esforço e recursos para corrigir cada gap",
          checked: false
        },
        {
          id: "elaborar-relatorio-gap",
          label: "Elabore relatório consolidado de GAP Analysis",
          checked: false
        },
        {
          id: "apresentar-diretoria",
          label: "Apresente os resultados para a alta direção",
          checked: false
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🚩 Fase 4 - GAP Analysis
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Análise de lacunas entre o estado atual e os requisitos da LGPD
        </p>
      </div>

      {/* Toolbar de UX (Recolher tudo / Expandir tudo + atalhos E/C) */}
      <PhaseToolbar phase="fase-4" />

      {/* E-books Interativos */}
      <PhaseEbooksManager phase="fase-4" />

      {/* Descrição da Fase */}
      <PhaseSection
        phase="fase-4"
        section="descricao"
        title="Descrição da Fase"
        icon="📄"
        subtitle="Visão geral da fase"
        defaultOpen={true}
        accent="blue"
      >
      <PhaseDescriptionManager
        phase="fase-4"
        noCard
        defaultContent={`
<p class="text-gray-700 dark:text-gray-300">
            Com base no mapeamento e análise de riscos da Fase 3, esta etapa identifica as lacunas 
            (gaps) entre o estado atual da empresa e os requisitos estabelecidos pela LGPD e boas 
            práticas de proteção de dados.
          </p>
          
          <h4 class="text-lg font-semibold mt-4 mb-2">O que é GAP Analysis?</h4>
          <p class="text-gray-700 dark:text-gray-300">
            É uma análise sistemática que compara o "estado atual" (AS-IS) com o "estado desejado" 
            (TO-BE) de conformidade, identificando todas as lacunas que precisam ser endereçadas.
          </p>

          <h4 class="text-lg font-semibold mt-4 mb-2">Áreas Avaliadas:</h4>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <strong>Bases Legais:</strong> Todos os tratamentos possuem base legal adequada e documentada?
            </li>
            <li>
              <strong>Transparência:</strong> As políticas e avisos de privacidade são completos e acessíveis?
            </li>
            <li>
              <strong>Direitos dos Titulares:</strong> Há processos para atender às solicitações?
            </li>
            <li>
              <strong>Segurança:</strong> As medidas de segurança são adequadas aos riscos?
            </li>
            <li>
              <strong>Contratos:</strong> Fornecedores e parceiros têm cláusulas adequadas?
            </li>
            <li>
              <strong>Governança:</strong> Há políticas, procedimentos e documentação adequados?
            </li>
            <li>
              <strong>Retenção:</strong> Períodos de retenção estão definidos e respeitados?
            </li>
            <li>
              <strong>Treinamento:</strong> Colaboradores estão capacitados e conscientizados?
            </li>
          </ul>

          <h4 class="text-lg font-semibold mt-4 mb-2">Priorização de Gaps:</h4>
          <p class="text-gray-700 dark:text-gray-300">
            As lacunas devem ser priorizadas considerando:
          </p>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Criticidade do risco associado</li>
            <li>Impacto potencial sobre os titulares</li>
            <li>Exposição a sanções regulatórias</li>
            <li>Esforço e custo de correção</li>
            <li>Dependências entre gaps</li>
          </ul>

          <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mt-4">
            <p class="text-sm text-red-800 dark:text-red-200">
              <strong>🚨 Atenção:</strong> Esta análise é fundamental para priorizar as ações corretivas 
              que serão implementadas na próxima fase. Seja completo e objetivo na identificação dos gaps, 
              pois eles guiarão todo o plano de ação.
            </p>
          </div>

          <h4 class="text-lg font-semibold mt-4 mb-2">Resultado Esperado:</h4>
          <p class="text-gray-700 dark:text-gray-300">
            Ao final desta fase, a empresa deve ter um <strong>Relatório de GAP Analysis</strong> 
            completo, com todas as lacunas identificadas, classificadas e priorizadas, servindo de 
            base para o Plano de Ação da próxima fase.
          </p>
        `}
      />
      </PhaseSection>

      {/* Orientações sobre a fase */}
      <PhaseInfoManager phase="fase-4" section="howto" />

      {/* Checklist de Implementação */}
      <PhaseSection
        phase="fase-4"
        section="checklist"
        title="Checklist de Implementação"
        icon="✅"
        subtitle="Itens de controle pra acompanhar o progresso da fase"
        accent="emerald"
      >
        <PhaseChecklist phase="fase-4" sections={checklistSections} noCard />
      </PhaseSection>

      {/* Na prática - Links para aplicativos externos */}
      <PhasePracticalLinks phase="fase-4" />

      {/* Documentação da Fase */}
      <PhaseSection
        phase="fase-4"
        section="documentacao"
        title="Documentação da Fase"
        icon="📂"
        subtitle="E-books, textos, PDFs e vídeos relacionados a esta fase"
        accent="blue"
      >
        <PhaseDocumentsUpload phase="fase-4" noCard />
      </PhaseSection>
    </div>
  );
}


