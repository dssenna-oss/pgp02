

"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import PhaseDocumentsUpload from "./phase-documents-upload";
import PhaseInfoManager from "./phase-info-manager";
import PhaseChecklist from "./phase-checklist";
import PhaseDescriptionManager from "./phase-description-manager";
import PhasePracticalLinks from "./phase-practical-links";
import PhaseEbooksManager from "./phase-ebooks-manager";
import PhaseSection from "./phase-section";
import PhaseToolbar from "./phase-toolbar";

export default function FasePrelimimarContent() {
  // Definir o checklist da Fase Preliminar
  const checklistSections = [
    {
      id: "sensibilizacao",
      title: "1. Sensibilização da Alta Direção",
      items: [
        {
          id: "apresentacao-executiva",
          label: "Prepare uma apresentação sobre os riscos de não conformidade com a LGPD",
          checked: false
        },
        {
          id: "impactos-financeiros",
          label: "Demonstre impactos financeiros: multas de até 2% do faturamento (limite de R$ 50 milhões por infração)",
          checked: false
        },
        {
          id: "casos-anpd",
          label: "Apresente casos reais de sanções aplicadas pela ANPD",
          checked: false
        },
        {
          id: "beneficios-conformidade",
          label: "Mostre os benefícios competitivos da conformidade (confiança do cliente, diferencial de mercado)",
          checked: false
        }
      ]
    },
    {
      id: "aprovacao-recursos",
      title: "2. Aprovação de Recursos",
      items: [
        {
          id: "orcamento-inicial",
          label: "Defina orçamento inicial para o Programa de Governança em Privacidade",
          checked: false
        },
        {
          id: "previsao-tecnologia",
          label: "Inclua previsão para tecnologias (anonimização, criptografia, sistemas de gestão)",
          checked: false
        },
        {
          id: "previsao-consultoria",
          label: "Reserve recursos para consultoria jurídica e técnica especializada",
          checked: false
        },
        {
          id: "definicao-dpo",
          label: "Aprove contratação ou designação do Encarregado de Dados (DPO)",
          checked: false
        }
      ]
    },
    {
      id: "engajamento-equipe",
      title: "3. Engajamento da Equipe",
      items: [
        {
          id: "comunicacao-interna",
          label: "Prepare comunicação interna sobre o início do Programa de Conformidade",
          checked: false
        },
        {
          id: "identificar-areas",
          label: "Identifique áreas-chave que participarão (TI, Jurídico, RH, Marketing, Comercial)",
          checked: false
        },
        {
          id: "cronograma-preliminar",
          label: "Estabeleça cronograma preliminar com marcos principais",
          checked: false
        },
        {
          id: "responsabilidades",
          label: "Defina responsabilidades preliminares de cada área envolvida",
          checked: false
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🚩 Fase Preliminar - Sensibilização e Engajamento
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Conscientização da diretoria sobre a importância da adequação à LGPD
        </p>
      </div>

      {/* Toolbar de UX (Recolher tudo / Expandir tudo + atalhos E/C) */}
      <PhaseToolbar phase="preliminar" />

      {/* E-books Interativos */}
      <PhaseEbooksManager phase="preliminar" />

      {/* Descrição da Fase */}
      <PhaseSection
        phase="preliminar"
        section="descricao"
        title="Descrição da Fase"
        icon="📄"
        subtitle="Visão geral · objetivos · investimentos sugeridos"
        defaultOpen={true}
        accent="blue"
      >
      <PhaseDescriptionManager
        phase="preliminar"
        noCard
        defaultContent={`
<p class="text-gray-700 dark:text-gray-300">
            Esta primeira etapa ocorre basicamente para conscientizar a diretoria da Empresa sobre a 
            importância de se adequar à LGPD.
          </p>
          
          <h4 class="text-lg font-semibold mt-4 mb-2">Objetivos Principais:</h4>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Explicar quais os pilares da lei</li>
            <li>Definir quais são os dados pessoais e quais são os dados pessoais sensíveis</li>
            <li>Informar sobre as jurisprudências existentes sobre a matéria (nacional e internacional)</li>
            <li>Demonstrar os benefícios que a empresa terá no relacionamento com os clientes, 
                trabalhadores e prestadores de serviço ao proteger os dados pessoais que obtém</li>
          </ul>

          <Alert class="mt-4">
            <AlertDescription>
              <strong>⚠️ Não esqueça da previsão de Orçamento:</strong> Nesta etapa é fundamental que as 
              partes envolvidas definam quanto poderá ser gasto para a adequação. Isto porque existem 
              medidas práticas a serem utilizadas.
            </AlertDescription>
          </Alert>

          <h4 class="text-lg font-semibold mt-4 mb-2">Exemplos de Investimentos:</h4>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Contratação de programa para anonimização dos dados</li>
            <li>Método a ser utilizado para a guarda/tratamento dos dados</li>
            <li>Contratação/definição da pessoa do Operador e do Encarregado</li>
            <li>Dentre outras necessidades identificadas</li>
          </ul>
        `}
      />
      </PhaseSection>

      {/* Considerações sobre a fase */}
      <PhaseSection
        phase="preliminar"
        section="consideracoes"
        title="Considerações sobre a fase"
        icon="💭"
        subtitle="Cultura, treinamento, governança, evolução"
        accent="violet"
      >
      <PhaseDescriptionManager
        phase="preliminar"
        section="consideracoes"
        title="Considerações sobre a fase"
        noCard
        defaultContent={`
          <h3 class="text-2xl font-bold mb-4">🎯 Objetivo da Fase Preliminar</h3>
          <p class="text-gray-700 dark:text-gray-300 mb-6">
            Consolidar a cultura de privacidade na organização, garantir a sustentabilidade do programa e preparar a empresa para responder efetivamente a incidentes de segurança e fiscalizações da ANPD.
          </p>

          <h4 class="text-xl font-semibold mt-6 mb-3">1 Cultura Organizacional de Privacidade</h4>
          
          <h5 class="text-lg font-semibold mt-4 mb-2">🧠 Conscientização Contínua</h5>
          <p class="text-gray-700 dark:text-gray-300 mb-2"><strong>Estratégias para manter a privacidade sempre presente:</strong></p>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
            <li><strong>Comunicação Regular:</strong> Newsletter mensal sobre privacidade, cases de sucesso, dicas práticas</li>
            <li><strong>Campanhas Temáticas:</strong> Semana da Privacidade, Dia de Proteção de Dados (28 de janeiro)</li>
            <li><strong>Gamificação:</strong> Quiz sobre LGPD, ranking de áreas mais engajadas, prêmios simbólicos</li>
            <li><strong>Histórias Reais:</strong> Compartilhar cases de incidentes e lições aprendidas</li>
            <li><strong>Líderes como Exemplos:</strong> Alta Direção demonstrando compromisso com privacidade</li>
          </ul>

          <h5 class="text-lg font-semibold mt-4 mb-2">🎓 Programa de Treinamento Permanente</h5>
          <p class="text-gray-700 dark:text-gray-300 mb-2"><strong>Estruture diferentes níveis:</strong></p>
          
          <div class="ml-4 space-y-3">
            <div>
              <p class="font-semibold text-gray-800 dark:text-gray-200">📘 Nível Básico (Todos):</p>
              <ul class="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                <li>O que é LGPD, direitos dos titulares, boas práticas</li>
                <li>O que fazer em caso de incidente</li>
                <li>Duração: 1h, obrigatório na integração + reciclagem anual</li>
              </ul>
            </div>

            <div>
              <p class="font-semibold text-gray-800 dark:text-gray-200">📗 Nível Intermediário (Áreas que tratam dados):</p>
              <ul class="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                <li>Bases legais, gestão de consentimento, atendimento a titulares</li>
                <li>Contratos com terceiros</li>
                <li>Duração: 2-3h, anual</li>
              </ul>
            </div>

            <div>
              <p class="font-semibold text-gray-800 dark:text-gray-200">📕 Nível Avançado (DPO, TI, Jurídico):</p>
              <ul class="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                <li>Análise de riscos, RIPD, Privacy by Design</li>
                <li>Resposta a incidentes, relacionamento com ANPD</li>
                <li>Duração: 8-16h, cursos especializados</li>
              </ul>
            </div>
          </div>

          <h5 class="text-lg font-semibold mt-4 mb-2">🏅 Reconhecimento e Incentivos</h5>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
            <li>Prêmio "Guardião da Privacidade" para colaborador destaque</li>
            <li>Certificados de conclusão de treinamentos</li>
            <li>Reconhecimento público em eventos internos</li>
            <li>Incluir conformidade em avaliações de desempenho</li>
          </ul>

          <h4 class="text-xl font-semibold mt-6 mb-3">2 Gestão de Incidentes de Segurança</h4>
          
          <h5 class="text-lg font-semibold mt-4 mb-2">🚨 Plano de Resposta a Incidentes</h5>
          <p class="text-gray-700 dark:text-gray-300 mb-2"><strong>Processo claro e ágil:</strong></p>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
            <li><strong>Detecção e Notificação:</strong> Canal específico para reportar (qualquer colaborador pode reportar)</li>
            <li><strong>Avaliação Inicial (&lt;24h):</strong> Classificar gravidade, identificar dados afetados, ativar equipe</li>
            <li><strong>Contenção (imediato):</strong> Isolar sistemas, bloquear acessos, preservar evidências</li>
            <li><strong>Investigação:</strong> Causa raiz, extensão do dano, impactos aos titulares</li>
            <li><strong>Comunicação:</strong> Interna (Alta Direção), Titulares (se risco relevante), ANPD (se risco/dano relevante)</li>
            <li><strong>Remediação:</strong> Corrigir vulnerabilidade, implementar controles adicionais</li>
            <li><strong>Lições Aprendidas:</strong> Documentar, revisar processos, treinar equipe</li>
          </ul>

          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <p class="text-blue-800 dark:text-blue-200">
              💡 <strong>Use a área de Gestão de Incidentes deste sistema para registrar e acompanhar todos os incidentes</strong>
            </p>
          </div>

          <h5 class="text-lg font-semibold mt-4 mb-2">⚠️ Critérios para Comunicação à ANPD</h5>
          <p class="text-gray-700 dark:text-gray-300 mb-2">
            A LGPD exige comunicação quando houver risco ou dano relevante aos titulares. Exemplos:
          </p>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
            <li>Vazamento de dados sensíveis (saúde, biometria, origem racial)</li>
            <li>Grande volume de dados pessoais comprometidos</li>
            <li>Dados de menores de idade</li>
            <li>Possibilidade de fraude financeira ou roubo de identidade</li>
            <li>Dano à reputação ou discriminação dos titulares</li>
          </ul>

          <h5 class="text-lg font-semibold mt-4 mb-2">🧪 Simulações e Testes</h5>
          <p class="text-gray-700 dark:text-gray-300 mb-2">
            Realize simulações periódicas (tabletop exercises):
          </p>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
            <li>Cenário hipotético: "Ataque ransomware criptografou nosso banco de dados"</li>
            <li>Reúna a equipe de resposta e execute o plano passo a passo</li>
            <li>Identifique gargalos, gaps, pontos de melhoria</li>
            <li>Frequência: Ao menos 1 vez por ano</li>
          </ul>

          <h4 class="text-xl font-semibold mt-6 mb-3">3 Relacionamento com ANPD</h4>
          
          <h5 class="text-lg font-semibold mt-4 mb-2">🏛️ Postura Proativa</h5>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
            <li>Manter contato do DPO publicado e atualizado</li>
            <li>Responder prontamente a comunicações da ANPD</li>
            <li>Participar de consultas públicas quando aplicável</li>
            <li>Acompanhar orientações e guias publicados</li>
            <li>Considerar adesão voluntária a programas de autorregulação</li>
          </ul>

          <h5 class="text-lg font-semibold mt-4 mb-2">🔍 Preparação para Fiscalização</h5>
          <p class="text-gray-700 dark:text-gray-300 mb-2">
            Se a ANPD iniciar fiscalização, esteja pronto:
          </p>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
            <li><strong>Documentação Organizada:</strong> Política, inventário, consentimentos, contratos, RIPDs, treinamentos, evidências de segurança, solicitações de titulares, auditorias</li>
            <li><strong>Equipe Preparada:</strong> DPO e jurídico como pontos focais, briefing para áreas, ser transparente e cooperativo</li>
            <li><strong>Resposta Tempestiva:</strong> Atender prazos da ANPD, fornecer informações completas</li>
            <li><strong>Plano de Contingência:</strong> Se não conformidades apontadas, ter plano de ação pronto</li>
          </ul>

          <h4 class="text-xl font-semibold mt-6 mb-3">4 Sustentabilidade do Programa</h4>
          
          <h5 class="text-lg font-semibold mt-4 mb-2">💰 Orçamento Permanente</h5>
          <p class="text-gray-700 dark:text-gray-300 mb-2">
            Garanta recursos recorrentes:
          </p>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
            <li>Manutenção de ferramentas e sistemas</li>
            <li>Treinamentos anuais</li>
            <li>Consultoria externa quando necessário</li>
            <li>Atualização de tecnologias de segurança</li>
            <li>Participação em eventos e capacitações</li>
          </ul>

          <h5 class="text-lg font-semibold mt-4 mb-2">👥 Sucessão e Continuidade</h5>
          <p class="text-gray-700 dark:text-gray-300 mb-2">
            Prepare para transições:
          </p>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
            <li>Documentar processos claramente (não depender de conhecimento individual)</li>
            <li>Cross-training: mais de uma pessoa capacitada</li>
            <li>Plano de sucessão do DPO</li>
            <li>Onboarding estruturado para novos membros</li>
          </ul>

          <h5 class="text-lg font-semibold mt-4 mb-2">📈 Evolução e Inovação</h5>
          <p class="text-gray-700 dark:text-gray-300 mb-2">
            Privacidade como vantagem competitiva:
          </p>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
            <li>Comunicar transparência como diferencial de mercado</li>
            <li>Selo ou certificação de conformidade em materiais</li>
            <li>Inovar em soluções que aumentem privacidade (PETs)</li>
            <li>Tornar-se referência em privacidade no setor</li>
          </ul>
        `}
      />

      </PhaseSection>

      {/* Checklist de Implementação */}
      <PhaseSection
        phase="preliminar"
        section="checklist"
        title="Checklist de Implementação"
        icon="✅"
        subtitle="Itens de controle pra acompanhar o progresso da fase"
        accent="emerald"
      >
        <PhaseChecklist phase="preliminar" sections={checklistSections} noCard />
      </PhaseSection>

      {/* Na prática - Links para aplicativos externos */}
      <PhasePracticalLinks phase="preliminar" />

      {/* Documentação da Fase */}
      <PhaseSection
        phase="preliminar"
        section="documentacao"
        title="Documentação da Fase"
        icon="📂"
        subtitle="E-books, textos, PDFs e vídeos relacionados a esta fase"
        accent="blue"
      >
        <PhaseDocumentsUpload phase="preliminar" noCard />
      </PhaseSection>
    </div>
  );
}
