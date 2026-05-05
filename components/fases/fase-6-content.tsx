


"use client";

import PhaseDocumentsUpload from "./phase-documents-upload";
import PhaseInfoManager from "./phase-info-manager";
import PhaseChecklist from "./phase-checklist";
import PhaseDescriptionManager from "./phase-description-manager";
import PhasePracticalLinks from "./phase-practical-links";
import PhaseEbooksManager from "./phase-ebooks-manager";
import PhaseSection from "./phase-section";
import PhaseToolbar from "./phase-toolbar";

export default function Fase6Content() {
  // Definir o checklist da Fase 6
  const checklistSections = [
    {
      id: "politicas-externas",
      title: "1. Políticas Externas (Para Titulares)",
      items: [
        {
          id: "elaborar-politica-privacidade",
          label: "Elabore Política de Privacidade completa e transparente",
          checked: false
        },
        {
          id: "criar-avisos-coleta",
          label: "Crie avisos de privacidade específicos para cada ponto de coleta",
          checked: false
        },
        {
          id: "elaborar-termos-consentimento",
          label: "Elabore termos de consentimento claros e específicos",
          checked: false
        },
        {
          id: "publicar-politicas",
          label: "Publique as políticas no site e canais de comunicação",
          checked: false
        }
      ]
    },
    {
      id: "politicas-internas",
      title: "2. Políticas Internas (Para Colaboradores)",
      items: [
        {
          id: "criar-politica-interna-dados",
          label: "Crie Política Interna de Proteção de Dados",
          checked: false
        },
        {
          id: "elaborar-politica-seguranca",
          label: "Elabore Política de Segurança da Informação",
          checked: false
        },
        {
          id: "criar-politica-uso-aceitavel",
          label: "Crie Política de Uso Aceitável de Recursos de TI",
          checked: false
        },
        {
          id: "criar-codigo-conduta",
          label: "Crie Código de Conduta sobre privacidade e proteção de dados",
          checked: false
        }
      ]
    },
    {
      id: "procedimentos-operacionais",
      title: "3. Procedimentos Operacionais Padrão (POPs)",
      items: [
        {
          id: "pop-direitos-titulares",
          label: "Crie POP para atendimento aos direitos dos titulares",
          checked: false
        },
        {
          id: "pop-gestao-incidentes",
          label: "Crie POP para gestão de incidentes de segurança",
          checked: false
        },
        {
          id: "pop-gestao-consentimento",
          label: "Crie POP para gestão de consentimentos",
          checked: false
        },
        {
          id: "pop-retencao-descarte",
          label: "Crie POP para retenção e descarte de dados",
          checked: false
        }
      ]
    },
    {
      id: "documentos-contratuais",
      title: "4. Documentos Contratuais",
      items: [
        {
          id: "clausulas-fornecedores",
          label: "Elabore cláusulas de proteção de dados para contratos com fornecedores",
          checked: false
        },
        {
          id: "acordo-controlador-operador",
          label: "Crie modelo de Acordo de Controlador-Operador",
          checked: false
        },
        {
          id: "termo-confidencialidade",
          label: "Elabore Termo de Confidencialidade para colaboradores",
          checked: false
        }
      ]
    },
    {
      id: "adequacao-processos",
      title: "5. Adequação de Processos",
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
          id: "adequar-coleta-dados",
          label: "Adeque formulários e processos de coleta de dados",
          checked: false
        }
      ]
    },
    {
      id: "medidas-seguranca",
      title: "6. Implementação de Medidas de Segurança",
      items: [
        {
          id: "implementar-controles-acesso",
          label: "Implemente controles de acesso baseados em função e necessidade",
          checked: false
        },
        {
          id: "implementar-criptografia",
          label: "Implemente criptografia para dados sensíveis",
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
        }
      ]
    },
    {
      id: "planejamento-treinamento",
      title: "7. Planejamento do Programa de Treinamento",
      items: [
        {
          id: "mapear-publicos",
          label: "Mapeie os diferentes públicos-alvo (geral, específico, gestão, DPO)",
          checked: false
        },
        {
          id: "definir-conteudos",
          label: "Defina conteúdos específicos para cada público",
          checked: false
        },
        {
          id: "escolher-metodologias",
          label: "Escolha metodologias de treinamento (presencial, online, híbrido)",
          checked: false
        },
        {
          id: "estabelecer-cronograma",
          label: "Estabeleça cronograma de treinamentos",
          checked: false
        }
      ]
    },
    {
      id: "treinamento-geral",
      title: "8. Treinamento Geral (Todos os Colaboradores)",
      items: [
        {
          id: "fundamentos-lgpd",
          label: "Treine sobre fundamentos da LGPD",
          checked: false
        },
        {
          id: "conceitos-basicos",
          label: "Explique conceitos básicos (dados pessoais, sensíveis, tratamento)",
          checked: false
        },
        {
          id: "direitos-titulares",
          label: "Ensine sobre direitos dos titulares",
          checked: false
        },
        {
          id: "boas-praticas-diarias",
          label: "Treine boas práticas de segurança no dia a dia",
          checked: false
        }
      ]
    },
    {
      id: "treinamento-especifico",
      title: "9. Treinamento Específico por Área",
      items: [
        {
          id: "treinar-ti",
          label: "Treine equipe de TI sobre segurança técnica e gestão de acessos",
          checked: false
        },
        {
          id: "treinar-rh",
          label: "Treine RH sobre tratamento de dados de funcionários e candidatos",
          checked: false
        },
        {
          id: "treinar-marketing",
          label: "Treine Marketing sobre consentimento e comunicações",
          checked: false
        },
        {
          id: "treinar-comercial",
          label: "Treine área Comercial sobre coleta e uso de dados de clientes",
          checked: false
        }
      ]
    },
    {
      id: "conscientizacao-continua",
      title: "10. Programa de Conscientização Contínua",
      items: [
        {
          id: "criar-campanhas-internas",
          label: "Crie campanhas internas de conscientização",
          checked: false
        },
        {
          id: "enviar-newsletters",
          label: "Envie newsletters periódicas sobre proteção de dados",
          checked: false
        },
        {
          id: "realizar-workshops",
          label: "Realize workshops temáticos periódicos",
          checked: false
        }
      ]
    },
    {
      id: "registro-evidencias",
      title: "11. Registro e Evidências",
      items: [
        {
          id: "registrar-implementacoes",
          label: "Registre todas as implementações realizadas",
          checked: false
        },
        {
          id: "documentar-treinamentos",
          label: "Documente todos os treinamentos realizados (data, participantes, conteúdo)",
          checked: false
        },
        {
          id: "arquivar-evidencias",
          label: "Arquive evidências de conformidade",
          checked: false
        },
        {
          id: "versionar-documentos",
          label: "Implemente versionamento de todos os documentos",
          checked: false
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🚩 Fase 6 - Execução
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Implementação de documentação, políticas, medidas de segurança e treinamentos
        </p>
      </div>

      {/* Toolbar de UX (Recolher tudo / Expandir tudo + atalhos E/C) */}
      <PhaseToolbar phase="fase-6" />

      {/* E-books Interativos */}
      <PhaseEbooksManager phase="fase-6" />

      {/* Orientações sobre a fase - Como fazer */}
      <PhaseInfoManager phase="fase-6" section="howto" />

      {/* Considerações sobre a fase - Objetivos e orientações */}
      <PhaseSection
        phase="fase-6"
        section="consideracoes"
        title="Considerações sobre a fase"
        icon="💭"
        subtitle="Reflexões estratégicas e operacionais"
        accent="violet"
      >
      <PhaseDescriptionManager
        phase="fase-6"
        section="consideracoes"
        title="Considerações sobre a fase"
        noCard
        defaultContent={`
          <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 class="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4">🎯 Objetivos da Fase 6 - Execução</h3>
            
            <p class="text-gray-700 dark:text-gray-300 mb-4">
              A Fase 6 marca o momento de <strong>colocar em prática tudo o que foi planejado</strong> nas fases anteriores. 
              É onde a adequação à LGPD sai do papel e se torna realidade operacional na organização.
            </p>

            <h4 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mt-4 mb-3">📋 Principais Objetivos:</h4>
            
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <span class="text-2xl">📄</span>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">Implementar Políticas e Documentação</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Criar e publicar políticas de privacidade externas e internas, procedimentos operacionais padrão (POPs), 
                    contratos adequados e avisos de privacidade conforme planejado nas fases anteriores.
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <span class="text-2xl">🔐</span>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">Executar Medidas de Segurança</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Implementar controles técnicos e organizacionais identificados na análise de riscos: 
                    criptografia, controles de acesso, logs de auditoria, backups e demais medidas de proteção de dados.
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <span class="text-2xl">⚙️</span>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">Adequar Processos Operacionais</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Ajustar processos de coleta de dados, gestão de consentimentos, atendimento aos direitos dos titulares 
                    e resposta a incidentes conforme os planos de ação estabelecidos.
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <span class="text-2xl">🎓</span>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">Realizar Treinamentos e Conscientização</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Executar programa de treinamento para todos os colaboradores (geral e específico por área), 
                    garantindo que todos entendam seus papéis e responsabilidades na proteção de dados.
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <span class="text-2xl">✅</span>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">Registrar Evidências de Compliance</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Documentar todas as implementações, registrar treinamentos realizados e arquivar evidências que 
                    demonstrem o cumprimento do princípio da accountability exigido pela LGPD.
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mt-4 border border-yellow-200 dark:border-yellow-800">
              <p class="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚡ Ponto de Atenção:</strong> Esta fase exige coordenação entre múltiplas áreas da organização. 
                O DPO deve atuar como facilitador, garantindo que todas as ações do Plano de Ação sejam executadas 
                dentro dos prazos estabelecidos e com a qualidade necessária.
              </p>
            </div>

            <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4 border border-green-200 dark:border-green-800">
              <p class="text-sm text-green-800 dark:text-green-200">
                <strong>🎯 Resultado Esperado:</strong> Ao final desta fase, a organização deve ter todas as políticas, 
                procedimentos e medidas de segurança operacionais, com equipes treinadas e conscientes de suas 
                responsabilidades na proteção de dados pessoais.
              </p>
            </div>
          </div>
        `}
      />
      </PhaseSection>

      {/* Checklist de Implementação */}
      <PhaseSection
        phase="fase-6"
        section="checklist"
        title="Checklist de Implementação"
        icon="✅"
        subtitle="Itens de controle pra acompanhar o progresso da fase"
        accent="emerald"
      >
        <PhaseChecklist phase="fase-6" sections={checklistSections} noCard />
      </PhaseSection>

      {/* Na prática - Links para aplicativos externos */}
      <PhasePracticalLinks phase="fase-6" />

      {/* Documentação da Fase */}
      <PhaseSection
        phase="fase-6"
        section="documentacao"
        title="Documentação da Fase"
        icon="📂"
        subtitle="E-books, textos, PDFs e vídeos relacionados a esta fase"
        accent="blue"
      >
        <PhaseDocumentsUpload phase="fase-6" noCard />
      </PhaseSection>
    </div>
  );
}


