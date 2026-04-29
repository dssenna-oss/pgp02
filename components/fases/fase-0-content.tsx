
// Fase 0 - Entendendo o PGP - Componente de conteúdo

"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import PhaseDocumentsUpload from "./phase-documents-upload";
import PhaseInfoManager from "./phase-info-manager";
import PhaseChecklist from "./phase-checklist";
import PhaseDescriptionManager from "./phase-description-manager";
import PhasePracticalLinks from "./phase-practical-links";

export default function Fase0Content() {
  // Definir o checklist da Fase 0 - Entendendo o PGP
  const checklistSections = [
    {
      id: "compreensao-conceitual",
      title: "1. Compreensão Conceitual do PGP",
      items: [
        {
          id: "conceito-pgp",
          label: "Entender que o PGP é um programa contínuo (não um projeto com início, meio e fim)",
          checked: false
        },
        {
          id: "art-50-lgpd",
          label: "Estudar o Art. 50 da LGPD sobre boas práticas de governança",
          checked: false
        },
        {
          id: "diferenca-projeto-programa",
          label: "Compreender a diferença entre projeto (pontual) e programa (permanente)",
          checked: false
        },
        {
          id: "ciclo-pdca",
          label: "Conhecer o ciclo PDCA (Plan-Do-Check-Act) aplicado à privacidade",
          checked: false
        }
      ]
    },
    {
      id: "modelos-implementacao",
      title: "2. Modelos de Implementação",
      items: [
        {
          id: "top-down",
          label: "Compreender o modelo Top-Down (iniciado pela alta administração)",
          checked: false
        },
        {
          id: "bottom-up",
          label: "Conhecer o modelo Bottom-Up (iniciado por setores técnicos)",
          checked: false
        },
        {
          id: "avaliar-contexto",
          label: "Avaliar qual modelo é mais adequado ao contexto da organização",
          checked: false
        },
        {
          id: "areas-chave",
          label: "Identificar áreas-chave para início (Jurídico, TI, RH, Controladoria, Ouvidoria)",
          checked: false
        }
      ]
    },
    {
      id: "estrutura-governanca",
      title: "3. Estrutura de Governança",
      items: [
        {
          id: "papel-presidencia",
          label: "Entender o papel da alta administração na institucionalização do PGP",
          checked: false
        },
        {
          id: "comite-protecao",
          label: "Conhecer a estrutura do Comitê de Proteção de Dados Pessoais (CPDP)",
          checked: false
        },
        {
          id: "papel-dpo",
          label: "Compreender as atribuições do Encarregado de Dados (DPO)",
          checked: false
        },
        {
          id: "linha-responsabilidade",
          label: "Mapear a linha de responsabilidade (estratégico, tático, operacional, técnico)",
          checked: false
        }
      ]
    },
    {
      id: "atores-centrais",
      title: "4. Atores Centrais da LGPD",
      items: [
        {
          id: "titular-dados",
          label: "Definir quem são os titulares de dados na organização",
          checked: false
        },
        {
          id: "controlador",
          label: "Identificar se a organização atua como controlador de dados",
          checked: false
        },
        {
          id: "operador",
          label: "Verificar se há atuação como operador de dados",
          checked: false
        },
        {
          id: "anpd-relacao",
          label: "Compreender a relação com a ANPD (Autoridade Nacional de Proteção de Dados)",
          checked: false
        },
        {
          id: "perfil-dpo",
          label: "Definir o perfil ideal do DPO (conhecimentos jurídicos, técnicos e de gestão de riscos)",
          checked: false
        }
      ]
    },
    {
      id: "etapas-pgp",
      title: "5. Etapas do Programa de Governança",
      items: [
        {
          id: "etapa-iniciacao",
          label: "Estudar a Etapa 1: Iniciação e Planejamento (designação DPO, análise de maturidade, inventário)",
          checked: false
        },
        {
          id: "etapa-construcao",
          label: "Conhecer a Etapa 2: Construção e Execução (políticas, Privacy by Design, RIPD)",
          checked: false
        },
        {
          id: "etapa-monitoramento",
          label: "Entender a Etapa 3: Monitoramento (KPIs, gestão de incidentes, relatórios)",
          checked: false
        },
        {
          id: "avaliacao-maturidade",
          label: "Estudar modelos de avaliação de maturidade (CGM-SP, Governo Federal)",
          checked: false
        }
      ]
    },
    {
      id: "kit-governanca",
      title: "6. Kit de Governança Bottom-Up",
      items: [
        {
          id: "relatorio-riscos",
          label: "Conhecer o Relatório Técnico de Riscos e Vulnerabilidades",
          checked: false
        },
        {
          id: "minuta-portaria",
          label: "Estudar a Minuta de Portaria de criação do CPDP",
          checked: false
        },
        {
          id: "politica-privacidade",
          label: "Analisar o modelo de Política Institucional de Privacidade",
          checked: false
        },
        {
          id: "inventario-template",
          label: "Familiarizar-se com o Template de Inventário de Dados",
          checked: false
        },
        {
          id: "plano-acao",
          label: "Revisar o modelo de Plano de Ação LGPD",
          checked: false
        },
        {
          id: "guia-sensibilizacao",
          label: "Ler o Guia de Sensibilização da Alta Administração",
          checked: false
        }
      ]
    },
    {
      id: "aspectos-juridicos",
      title: "7. Aspectos Jurídicos e de Compliance",
      items: [
        {
          id: "responsabilidades",
          label: "Compreender as responsabilidades administrativa, civil e penal pelo descumprimento da LGPD",
          checked: false
        },
        {
          id: "sancoes-anpd",
          label: "Conhecer exemplos de sanções aplicadas pela ANPD",
          checked: false
        },
        {
          id: "risco-reputacional",
          label: "Avaliar riscos reputacionais de vazamentos ou uso indevido de dados",
          checked: false
        },
        {
          id: "integracao-compliance",
          label: "Entender a integração entre programas de compliance e governança de dados",
          checked: false
        }
      ]
    },
    {
      id: "procedimentos-iniciais",
      title: "8. Procedimentos Iniciais Recomendados",
      items: [
        {
          id: "grupo-trabalho",
          label: "Formar Grupo de Trabalho (GT) com representantes de áreas-chave",
          checked: false
        },
        {
          id: "mapear-tratamentos",
          label: "Iniciar mapeamento preliminar dos tratamentos de dados pessoais",
          checked: false
        },
        {
          id: "identificar-lacunas",
          label: "Identificar lacunas legais e técnicas (ausência de políticas, sistemas inseguros)",
          checked: false
        },
        {
          id: "plano-preliminar",
          label: "Elaborar plano de adequação preliminar com ações graduais",
          checked: false
        },
        {
          id: "capacitacao-interna",
          label: "Planejar capacitações internas para servidores que tratam dados pessoais",
          checked: false
        },
        {
          id: "termo-compromisso",
          label: "Preparar minuta de termo de adesão ou portaria de compromisso institucional",
          checked: false
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          📚 Entendendo o PGP - Programa de Governança em Privacidade
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          O início da jornada de adequação: compreendendo conceitos, modelos e estruturas fundamentais
        </p>
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <AlertDescription className="text-gray-700 dark:text-gray-300">
          <strong>💡 Sobre esta fase:</strong> Esta fase introdutória apresenta os conceitos fundamentais do 
          Programa de Governança em Privacidade (PGP), explicando o que é, como funciona, quem são os atores 
          envolvidos e quais são os caminhos possíveis para iniciar a jornada de adequação à LGPD. 
          É uma fase de compreensão e preparação conceitual que antecede a execução prática das demais fases.
        </AlertDescription>
      </Alert>

      {/* E-book Heyzine */}
      <PhaseInfoManager phase="entendendo-pgp" section="heyzine" />

      {/* Descrição da Fase */}
      <PhaseDescriptionManager 
        phase="entendendo-pgp" 
        defaultContent={`
          <h3 class="text-xl font-bold mt-4 mb-3 text-gray-900 dark:text-white">O que é o PGP?</h3>
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            O <strong>Programa de Governança em Privacidade (PGP)</strong> é uma boa prática prevista no 
            Art. 50 da LGPD, concebido para estabelecer uma metodologia abrangente que influencie permanentemente 
            os processos de tomada de decisão, baseada em riscos e melhorias contínuas na maturidade de proteção 
            de dados. Diferente de um projeto (que tem início, meio e fim), o programa é contínuo e pode conter 
            vários projetos para atingir seus objetivos.
          </p>

          <h4 class="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white">
            Questão Inicial: Modelos Top-Down ou Bottom-Up?
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            Como iniciar um programa de governança em privacidade? Existem dois principais modelos:
          </p>

          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
            <h5 class="font-semibold text-blue-900 dark:text-blue-300 mb-2">🔝 Modelo Top-Down (Ideal)</h5>
            <p class="text-gray-700 dark:text-gray-300 mb-2">
              O ideal é que o processo de adequação seja institucionalizado a partir da alta administração, 
              preferencialmente com o apoio formal da autoridade máxima (Presidente, Diretor-Geral, Secretários).
            </p>
            <ul class="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
              <li>Ato administrativo formal (portaria, decreto ou resolução)</li>
              <li>Definição de diretrizes estratégicas</li>
              <li>Alocação de recursos (orçamento, equipe, capacitação, ferramentas)</li>
            </ul>
          </div>

          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
            <h5 class="font-semibold text-green-900 dark:text-green-300 mb-2">
              📊 Modelo Bottom-Up (Alternativa)
            </h5>
            <p class="text-gray-700 dark:text-gray-300 mb-2">
              Quando a alta gestão ainda não internalizou a importância da privacidade, é viável iniciar 
              um movimento técnico e incremental. Áreas que podem puxar a iniciativa:
            </p>
            <ul class="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
              <li><strong>Controladoria Interna ou Ouvidoria</strong> – compliance e transparência</li>
              <li><strong>TI ou Segurança da Informação</strong> – sistemas e bancos de dados</li>
              <li><strong>Assessoria Jurídica</strong> – interpretação e aplicação da LGPD</li>
              <li><strong>Gestão de Pessoas</strong> – dados de servidores e terceirizados</li>
            </ul>
          </div>

          <h4 class="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white">
            Estrutura de Governança
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            A implementação eficaz do PGP requer uma estrutura organizacional clara:
          </p>

          <div class="overflow-x-auto mb-4">
            <table class="min-w-full border-collapse border border-gray-300 dark:border-gray-700 text-sm">
              <thead class="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th class="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">Nível</th>
                  <th class="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">Responsável</th>
                  <th class="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">Função Principal</th>
                </tr>
              </thead>
              <tbody class="text-gray-700 dark:text-gray-300">
                <tr>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2 font-semibold">Estratégico</td>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2">
                    Presidência / Plenário / Secretaria-Geral
                  </td>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2">
                    Instituir o programa, designar o DPO, garantir recursos
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2 font-semibold">Tático</td>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2">
                    Comitê de Proteção de Dados (CPDP)
                  </td>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2">
                    Planejar, supervisionar e acompanhar o programa
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2 font-semibold">Operacional</td>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2">
                    Unidades técnicas e administrativas
                  </td>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2">
                    Executar ações de adequação e manter conformidade
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2 font-semibold">Técnico</td>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2">
                    TI e Segurança da Informação
                  </td>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2">
                    Implantar controles de segurança e gestão de riscos
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2 font-semibold">Jurídico</td>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2">
                    Procuradoria / Assessoria Jurídica
                  </td>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2">
                    Analisar legalidade, revisar contratos e políticas
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2 font-semibold">Controle</td>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2">
                    Auditoria Interna / Controladoria
                  </td>
                  <td class="border border-gray-300 dark:border-gray-700 px-4 py-2">
                    Avaliar efetividade e conformidade das medidas
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 class="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white">
            Atores Centrais da LGPD
          </h4>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Titular:</strong> A pessoa natural a quem os dados se referem</li>
            <li><strong>Controlador:</strong> A quem competem as decisões sobre o tratamento de dados</li>
            <li><strong>Operador:</strong> Quem realiza o tratamento de dados em nome do controlador</li>
            <li><strong>ANPD:</strong> Autoridade Nacional de Proteção de Dados (órgão fiscalizador)</li>
            <li><strong>Encarregado (DPO):</strong> Figura central para a governança e conformidade</li>
          </ul>

          <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mt-4">
            <h5 class="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
              ⚠️ Papel do Encarregado (DPO)
            </h5>
            <p class="text-gray-700 dark:text-gray-300 mb-2">
              O DPO atua como o principal canal de comunicação entre o controlador, os titulares dos dados e a ANPD.
            </p>
            <ul class="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
              <li>Aceitar reclamações e comunicações dos titulares</li>
              <li>Receber comunicações da ANPD e tomar as medidas necessárias</li>
              <li>Orientar funcionários sobre práticas de proteção de dados</li>
              <li>Assessorar na elaboração de RIPDs</li>
              <li>Monitorar a conformidade das atividades de tratamento</li>
            </ul>
            <p class="text-gray-700 dark:text-gray-300 mt-3 text-sm">
              <strong>Importante:</strong> O DPO deve ter autonomia técnica e não pode acumular funções que gerem 
              conflito de interesses (ex: não pode ser gestor de TI ou de sistemas).
            </p>
          </div>

          <h4 class="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white">
            Etapas do Programa de Governança
          </h4>
          
          <div class="space-y-3 mb-4">
            <div class="border-l-4 border-blue-500 pl-4 py-2">
              <h5 class="font-semibold text-gray-900 dark:text-white">Etapa 1: Iniciação e Planejamento</h5>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Designar DPO, alinhar expectativas com alta administração, analisar maturidade, mapear processos 
                e realizar inventário de dados.
              </p>
            </div>
            
            <div class="border-l-4 border-green-500 pl-4 py-2">
              <h5 class="font-semibold text-gray-900 dark:text-white">Etapa 2: Construção e Execução</h5>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Elaborar políticas, implantar Privacy by Design, criar RIPD, adequar contratos, elaborar 
                Termo de Uso e Política de Privacidade.
              </p>
            </div>
            
            <div class="border-l-4 border-purple-500 pl-4 py-2">
              <h5 class="font-semibold text-gray-900 dark:text-white">Etapa 3: Monitoramento</h5>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Definir KPIs, implantar gestão de incidentes, analisar e reportar resultados, garantir 
                melhoria contínua (ciclo PDCA).
              </p>
            </div>
          </div>

          <h4 class="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white">
            Kit de Governança Bottom-Up
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Para organizações que iniciam o programa sem apoio formal da alta administração, o Kit de Governança 
            Bottom-Up oferece ferramentas práticas:
          </p>
          <ul class="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
            <li>Relatório Técnico de Riscos e Vulnerabilidades</li>
            <li>Minuta de Portaria de Criação do Comitê de Proteção de Dados</li>
            <li>Política Institucional de Privacidade e Proteção de Dados</li>
            <li>Inventário de Atividades de Tratamento de Dados (planilha)</li>
            <li>Plano de Ação LGPD – Cronograma de Adequação</li>
            <li>Guia de Sensibilização da Alta Administração</li>
          </ul>

          <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mt-6">
            <h5 class="font-semibold text-red-900 dark:text-red-300 mb-2">
              🚨 Implicações do Descumprimento
            </h5>
            <p class="text-gray-700 dark:text-gray-300 mb-2">
              A inobservância da LGPD acarreta:
            </p>
            <ul class="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
              <li><strong>Responsabilidade Administrativa:</strong> Advertências, multas (até 2% do faturamento, 
              limitado a R$ 50 milhões por infração), bloqueio de dados</li>
              <li><strong>Risco Reputacional:</strong> Vazamentos ou uso indevido causam sérios prejuízos à 
              reputação institucional</li>
              <li><strong>Responsabilidade Civil e Penal:</strong> Em certas situações, pode haver 
              responsabilização pessoal</li>
            </ul>
          </div>

          <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-6">
            <h5 class="font-semibold text-gray-900 dark:text-white mb-2">
              📊 Próximos Passos
            </h5>
            <p class="text-gray-700 dark:text-gray-300 text-sm">
              Após compreender os conceitos fundamentais desta fase, a organização estará preparada para:
            </p>
            <ol class="list-decimal pl-6 space-y-1 text-gray-700 dark:text-gray-300 text-sm mt-2">
              <li>Iniciar a <strong>Fase Preliminar</strong> de Sensibilização e Engajamento</li>
              <li>Formar o Grupo de Trabalho (Fase 1)</li>
              <li>Realizar o Diagnóstico Inicial (Fase 2)</li>
              <li>Executar as demais fases do Programa de Governança em Privacidade</li>
            </ol>
          </div>
        `}
      />

      {/* Checklist de Implementação */}
      <PhaseChecklist phase="entendendo-pgp" sections={checklistSections} />

      {/* Na prática - Links para aplicativos externos */}
      <PhasePracticalLinks phase="entendendo-pgp" />

      {/* Documentação da Fase */}
      <PhaseDocumentsUpload phase="entendendo-pgp" />
    </div>
  );
}
