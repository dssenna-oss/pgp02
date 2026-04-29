


"use client";

import PhaseDocumentsUpload from "./phase-documents-upload";
import PhaseInfoManager from "./phase-info-manager";
import PhaseChecklist from "./phase-checklist";
import PhaseDescriptionManager from "./phase-description-manager";
import PhasePracticalLinks from "./phase-practical-links";
import PhaseEbooksManager from "./phase-ebooks-manager";

export default function Fase7Content() {
  // Definir o checklist da Fase 7
  const checklistSections = [
    {
      id: "estrutura-monitoramento",
      title: "1. Estruturação do Monitoramento",
      items: [
        {
          id: "definir-indicadores-chave",
          label: "Defina indicadores-chave de performance (KPIs) de privacidade",
          checked: false
        },
        {
          id: "estabelecer-metas",
          label: "Estabeleça metas para cada indicador",
          checked: false
        },
        {
          id: "criar-dashboard",
          label: "Crie dashboard de monitoramento de conformidade",
          checked: false
        },
        {
          id: "definir-periodicidade-medicao",
          label: "Defina periodicidade de medição (mensal, trimestral)",
          checked: false
        },
        {
          id: "designar-responsaveis-kpis",
          label: "Designe responsáveis por cada KPI",
          checked: false
        }
      ]
    },
    {
      id: "implementacao-kpis",
      title: "2. Implementação de KPIs",
      items: [
        {
          id: "monitorar-tempo-resposta",
          label: "Monitore tempo médio de resposta a solicitações de titulares",
          checked: false
        },
        {
          id: "monitorar-incidentes",
          label: "Monitore número e severidade de incidentes de segurança",
          checked: false
        },
        {
          id: "acompanhar-treinamentos",
          label: "Acompanhe percentual de colaboradores treinados",
          checked: false
        },
        {
          id: "medir-conformidade-processos",
          label: "Meça índice de conformidade dos processos",
          checked: false
        },
        {
          id: "controlar-solicitacoes-titulares",
          label: "Controle volume de solicitações de titulares por tipo",
          checked: false
        },
        {
          id: "avaliar-fornecedores",
          label: "Avalie conformidade de fornecedores/operadores",
          checked: false
        }
      ]
    },
    {
      id: "auditorias-periodicas",
      title: "3. Auditorias Periódicas",
      items: [
        {
          id: "agendar-auditorias-internas",
          label: "Agende auditorias internas (no mínimo anuais)",
          checked: false
        },
        {
          id: "definir-escopo-auditoria",
          label: "Defina escopo de cada auditoria",
          checked: false
        },
        {
          id: "preparar-checklist-auditoria",
          label: "Prepare checklist de auditoria baseado na LGPD",
          checked: false
        },
        {
          id: "realizar-auditoria",
          label: "Realize auditorias conforme cronograma",
          checked: false
        },
        {
          id: "documentar-achados",
          label: "Documente todos os achados e não conformidades",
          checked: false
        },
        {
          id: "plano-acao-auditoria",
          label: "Crie plano de ação para correção de não conformidades",
          checked: false
        },
        {
          id: "considerar-auditoria-externa",
          label: "Considere auditorias externas/certificações (ISO 27001, etc.)",
          checked: false
        }
      ]
    },
    {
      id: "gestao-incidentes-continua",
      title: "4. Gestão Contínua de Incidentes",
      items: [
        {
          id: "manter-registro-incidentes",
          label: "Mantenha registro atualizado de todos os incidentes",
          checked: false
        },
        {
          id: "analisar-causas-raiz",
          label: "Analise causas raiz dos incidentes",
          checked: false
        },
        {
          id: "implementar-acoes-preventivas",
          label: "Implemente ações preventivas para evitar recorrência",
          checked: false
        },
        {
          id: "testar-plano-resposta",
          label: "Teste periodicamente o plano de resposta a incidentes",
          checked: false
        },
        {
          id: "atualizar-procedimentos",
          label: "Atualize procedimentos com base em lições aprendidas",
          checked: false
        }
      ]
    },
    {
      id: "revisao-documentacao",
      title: "5. Revisão e Atualização de Documentação",
      items: [
        {
          id: "revisar-politicas-anualmente",
          label: "Revise todas as políticas pelo menos anualmente",
          checked: false
        },
        {
          id: "atualizar-inventario-dados",
          label: "Atualize o inventário de dados regularmente",
          checked: false
        },
        {
          id: "revisar-contratos-fornecedores",
          label: "Revise contratos com fornecedores periodicamente",
          checked: false
        },
        {
          id: "atualizar-avisos-privacidade",
          label: "Atualize avisos de privacidade quando houver mudanças",
          checked: false
        },
        {
          id: "versionar-mudancas",
          label: "Versione e documente todas as mudanças",
          checked: false
        }
      ]
    },
    {
      id: "atualizacao-legislativa",
      title: "6. Acompanhamento Legislativo e Regulatório",
      items: [
        {
          id: "acompanhar-anpd",
          label: "Acompanhe publicações da ANPD (guias, resoluções)",
          checked: false
        },
        {
          id: "monitorar-jurisprudencia",
          label: "Monitore jurisprudência e decisões judiciais",
          checked: false
        },
        {
          id: "participar-eventos",
          label: "Participe de eventos e fóruns sobre privacidade",
          checked: false
        },
        {
          id: "atualizar-praticas",
          label: "Atualize práticas conforme novas orientações",
          checked: false
        },
        {
          id: "comunicar-mudancas",
          label: "Comunique mudanças relevantes para a organização",
          checked: false
        }
      ]
    },
    {
      id: "avaliacao-fornecedores-continua",
      title: "7. Avaliação Contínua de Fornecedores",
      items: [
        {
          id: "reavaliar-fornecedores",
          label: "Reavalie fornecedores/operadores periodicamente",
          checked: false
        },
        {
          id: "auditar-operadores-criticos",
          label: "Audite operadores críticos",
          checked: false
        },
        {
          id: "verificar-incidentes-fornecedores",
          label: "Verifique se fornecedores tiveram incidentes de segurança",
          checked: false
        },
        {
          id: "atualizar-contratos-fornecedores",
          label: "Atualize contratos quando necessário",
          checked: false
        }
      ]
    },
    {
      id: "melhoria-continua",
      title: "8. Ciclo de Melhoria Contínua",
      items: [
        {
          id: "reunioes-periodicas-governanca",
          label: "Realize reuniões periódicas do comitê de governança",
          checked: false
        },
        {
          id: "analisar-indicadores",
          label: "Analise indicadores e identifique oportunidades de melhoria",
          checked: false
        },
        {
          id: "priorizar-melhorias",
          label: "Priorize e implemente melhorias identificadas",
          checked: false
        },
        {
          id: "incorporar-melhores-praticas",
          label: "Incorpore melhores práticas do mercado",
          checked: false
        },
        {
          id: "avaliar-novas-tecnologias",
          label: "Avalie e implemente novas tecnologias de proteção",
          checked: false
        },
        {
          id: "documentar-evolucao",
          label: "Documente a evolução do programa de governança",
          checked: false
        }
      ]
    },
    {
      id: "relatorios-prestacao-contas",
      title: "9. Relatórios e Prestação de Contas",
      items: [
        {
          id: "preparar-relatorios-periodicos",
          label: "Prepare relatórios periódicos para a diretoria",
          checked: false
        },
        {
          id: "documentar-accountability",
          label: "Documente evidências de accountability (prestação de contas)",
          checked: false
        },
        {
          id: "reportar-metricas",
          label: "Reporte métricas e evolução do programa",
          checked: false
        },
        {
          id: "apresentar-resultados-anuais",
          label: "Apresente resultados anuais para stakeholders",
          checked: false
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🚩 Fase 7 - Monitoramento Contínuo e Melhoria
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Acompanhamento contínuo, auditorias e evolução do programa de governança
        </p>
      </div>

      {/* E-books Interativos */}
      <PhaseEbooksManager phase="fase-7" />

      {/* Descrição da Fase */}
      <PhaseDescriptionManager 
        phase="fase-7" 
        defaultContent={`
<p class="text-gray-700 dark:text-gray-300">
            A conformidade com a LGPD não é um projeto com início, meio e fim, mas um processo contínuo. 
            Esta última fase estabelece os mecanismos de monitoramento, auditoria e melhoria contínua do 
            programa de governança de dados.
          </p>
          
          <h4 class="text-lg font-semibold mt-4 mb-2">Atividades de Monitoramento:</h4>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <strong>Auditorias Periódicas:</strong> Internas e/ou externas para verificar conformidade
            </li>
            <li>
              <strong>Indicadores de Performance (KPIs):</strong> Métricas para medir eficácia do programa
            </li>
            <li>
              <strong>Revisão de Políticas:</strong> Atualização periódica da documentação
            </li>
            <li>
              <strong>Gestão de Incidentes:</strong> Acompanhamento e análise de eventos de segurança
            </li>
            <li>
              <strong>Avaliação de Fornecedores:</strong> Verificação contínua de operadores
            </li>
            <li>
              <strong>Atualização Legislativa:</strong> Acompanhamento de mudanças na legislação
            </li>
          </ul>

          <h4 class="text-lg font-semibold mt-4 mb-2">Indicadores Sugeridos:</h4>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Tempo médio de resposta a solicitações de titulares</li>
            <li>Número de incidentes de segurança reportados</li>
            <li>Percentual de colaboradores treinados</li>
            <li>Índice de conformidade em auditorias</li>
            <li>Tempo médio para correção de não conformidades</li>
            <li>Número de DPIAs (avaliações de impacto) realizadas</li>
          </ul>

          <h4 class="text-lg font-semibold mt-4 mb-2">Melhoria Contínua:</h4>
          <p class="text-gray-700 dark:text-gray-300">
            Com base nos indicadores e auditorias, identifique oportunidades de melhoria:
          </p>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Ajuste de processos que não estão funcionando</li>
            <li>Implementação de novas tecnologias de proteção</li>
            <li>Reforço de treinamentos em áreas problemáticas</li>
            <li>Atualização de políticas conforme evolução da empresa</li>
            <li>Incorporação de melhores práticas do mercado</li>
          </ul>

          <div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mt-4">
            <p class="text-sm text-indigo-800 dark:text-indigo-200">
              <strong>🔄 Ciclo PDCA:</strong> Utilize o ciclo Plan-Do-Check-Act (Planejar-Executar-Verificar-Agir) 
              como metodologia para melhoria contínua. A adequação à LGPD é uma jornada, não um destino.
            </p>
          </div>

          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4">
            <p class="text-sm text-green-800 dark:text-green-200">
              <strong>✅ Parabéns!</strong> Ao chegar nesta fase, sua empresa terá um programa robusto 
              de governança de dados. Mantenha o compromisso com a proteção de dados e a conformidade 
              contínua.
            </p>
          </div>
        `}
      />

      {/* Orientações sobre a fase */}
      <PhaseInfoManager phase="fase-7" section="howto" />

      {/* Considerações sobre a fase */}
      <PhaseChecklist phase="fase-7" sections={checklistSections} />

      {/* Na prática - Links para aplicativos externos */}
      <PhasePracticalLinks phase="fase-7" />

      {/* Documentação da Fase */}
      <PhaseDocumentsUpload phase="fase-7" />
    </div>
  );
}

