
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

const prisma = new PrismaClient();

const phasesProcedures = {
  'preliminar': `
<div class="space-y-6">
  <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border-l-4 border-blue-600">
    <h3 class="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4">📋 Passo a Passo - Fase Preliminar</h3>
    <p class="text-gray-700 dark:text-gray-300">Siga os passos abaixo para sensibilizar e engajar a diretoria:</p>
  </div>

  <div class="grid gap-4">
    <!-- Passo 1 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          1
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🎯 Agende Reunião com a Diretoria
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Organize uma reunião formal com os principais decisores da empresa para apresentar a importância da LGPD.
          </p>
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              <strong>✅ Checklist:</strong>
            </p>
            <ul class="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 ml-4">
              <li>☐ Definir data e horário com antecedência</li>
              <li>☐ Convidar CEO, diretores e gerentes-chave</li>
              <li>☐ Reservar sala adequada com recursos audiovisuais</li>
              <li>☐ Enviar pauta prévia por e-mail</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 2 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          2
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📊 Prepare Apresentação Executiva
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Monte uma apresentação clara e objetiva sobre os pilares da LGPD e sua relevância para o negócio.
          </p>
          <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <p class="text-sm text-green-800 dark:text-green-200">
              <strong>📌 Conteúdo sugerido:</strong>
            </p>
            <ul class="text-sm text-green-800 dark:text-green-200 mt-2 space-y-1 ml-4">
              <li>• O que é a LGPD e quando entrou em vigor</li>
              <li>• Definição de dados pessoais e dados sensíveis</li>
              <li>• Princípios fundamentais da lei</li>
              <li>• Sanções e multas (até 2% do faturamento)</li>
              <li>• Casos práticos de empresas multadas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 3 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          3
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            💼 Demonstre Benefícios de Negócio
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Mostre como a conformidade traz vantagens competitivas e não é apenas obrigação legal.
          </p>
          <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
            <p class="text-sm text-purple-800 dark:text-purple-200">
              <strong>🎁 Benefícios a destacar:</strong>
            </p>
            <ul class="text-sm text-purple-800 dark:text-purple-200 mt-2 space-y-1 ml-4">
              <li>✨ Maior confiança de clientes e parceiros</li>
              <li>✨ Diferencial competitivo no mercado</li>
              <li>✨ Redução de riscos legais e reputacionais</li>
              <li>✨ Melhoria nos processos internos</li>
              <li>✨ Preparação para certificações (ISO 27001, etc.)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 4 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-amber-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          4
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            💰 Defina Orçamento Preliminar
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Apresente estimativa de investimento necessário para adequação à LGPD.
          </p>
          <div class="bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
            <p class="text-sm text-amber-800 dark:text-amber-200">
              <strong>💵 Itens de investimento:</strong>
            </p>
            <ul class="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1 ml-4">
              <li>💳 Consultoria jurídica especializada</li>
              <li>💳 Ferramentas de gestão e segurança</li>
              <li>💳 Contratação/treinamento do DPO</li>
              <li>💳 Capacitação de equipes</li>
              <li>💳 Adequação de sistemas e processos</li>
              <li>💳 Contingência para imprevistos (10-15%)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 5 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-red-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          5
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ⚖️ Apresente Riscos e Jurisprudências
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Demonstre casos reais de empresas multadas e riscos de não conformidade.
          </p>
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded">
            <p class="text-sm text-red-800 dark:text-red-200">
              <strong>⚠️ Riscos de não conformidade:</strong>
            </p>
            <ul class="text-sm text-red-800 dark:text-red-200 mt-2 space-y-1 ml-4">
              <li>🚫 Multas de até R$ 50 milhões</li>
              <li>🚫 Danos à reputação da marca</li>
              <li>🚫 Perda de clientes e parceiros</li>
              <li>🚫 Processos judiciais de titulares</li>
              <li>🚫 Impedimento de participar de licitações</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 6 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          6
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📝 Obtenha Aprovação e Compromisso
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Formalize o compromisso da diretoria com o programa de governança de privacidade.
          </p>
          <div class="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded">
            <p class="text-sm text-indigo-800 dark:text-indigo-200">
              <strong>✍️ Documentos necessários:</strong>
            </p>
            <ul class="text-sm text-indigo-800 dark:text-indigo-200 mt-2 space-y-1 ml-4">
              <li>📄 Ata de reunião com aprovação formal</li>
              <li>📄 Termo de compromisso assinado</li>
              <li>📄 Cronograma macro do projeto</li>
              <li>📄 Aprovação de orçamento</li>
              <li>📄 Nomeação de responsáveis iniciais</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-6 rounded-lg border-l-4 border-green-600 mt-6">
    <p class="text-green-900 dark:text-green-100 font-semibold">
      ✅ <strong>Resultado Esperado:</strong> Após completar esta fase, a diretoria estará consciente da importância da LGPD, 
      comprometida com o projeto e com orçamento aprovado para prosseguir com as próximas fases.
    </p>
  </div>
</div>
  `,
  
  'fase-1': `
<div class="space-y-6">
  <div class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg border-l-4 border-purple-600">
    <h3 class="text-xl font-bold text-purple-900 dark:text-purple-100 mb-4">👥 Passo a Passo - Formação das Equipes</h3>
    <p class="text-gray-700 dark:text-gray-300">Estruture sua equipe de proteção de dados seguindo estes passos:</p>
  </div>

  <div class="grid gap-4">
    <!-- Passo 1 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          1
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            👔 Identifique o Controlador
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Defina quem será o Controlador dos dados na organização - a pessoa/entidade responsável pelas decisões sobre tratamento de dados.
          </p>
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              <strong>📋 Características do Controlador:</strong>
            </p>
            <ul class="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 ml-4">
              <li>✓ Geralmente é a própria empresa (pessoa jurídica)</li>
              <li>✓ Toma decisões sobre finalidade e meios de tratamento</li>
              <li>✓ É responsável perante a ANPD</li>
              <li>✓ Deve estar identificado na Política de Privacidade</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 2 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          2
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🔧 Defina o(s) Operador(es)
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Identifique quem realizará o tratamento dos dados em nome do controlador (pode ser interno ou terceiro).
          </p>
          <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <p class="text-sm text-green-800 dark:text-green-200">
              <strong>🔍 Operadores típicos:</strong>
            </p>
            <ul class="text-sm text-green-800 dark:text-green-200 mt-2 space-y-1 ml-4">
              <li>• Equipe de TI da empresa (operador interno)</li>
              <li>• Empresas de software/cloud (AWS, Google, Microsoft)</li>
              <li>• Empresas de folha de pagamento</li>
              <li>• Agências de marketing digital</li>
              <li>• Qualquer terceiro que acesse/processe dados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 3 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          3
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🎓 Selecione o Encarregado (DPO)
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Escolha uma pessoa qualificada para ser o DPO - Data Protection Officer (Encarregado pela proteção de dados).
          </p>
          <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
            <p class="text-sm text-purple-800 dark:text-purple-200">
              <strong>✨ Perfil ideal do DPO:</strong>
            </p>
            <ul class="text-sm text-purple-800 dark:text-purple-200 mt-2 space-y-1 ml-4">
              <li>🎯 Conhecimento em LGPD e proteção de dados</li>
              <li>🎯 Habilidade de comunicação (ponte entre empresa, titulares e ANPD)</li>
              <li>🎯 Independência para tomar decisões</li>
              <li>🎯 Pode ser interno ou terceirizado</li>
              <li>🎯 Dedicação compatível com o porte da empresa</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 4 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-amber-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          4
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📢 Formalize as Nomeações
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Documente oficialmente as nomeações e comunique internamente as responsabilidades.
          </p>
          <div class="bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
            <p class="text-sm text-amber-800 dark:text-amber-200">
              <strong>📝 Documentos a criar:</strong>
            </p>
            <ul class="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1 ml-4">
              <li>📄 Termo de nomeação do DPO</li>
              <li>📄 Descrição de funções e responsabilidades</li>
              <li>📄 Comunicado interno para toda empresa</li>
              <li>📄 Registro do canal de contato do DPO</li>
              <li>📄 Atualização do organograma da empresa</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 5 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-teal-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          5
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🏢 Monte Comitê (se aplicável)
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Para empresas maiores, forme um Comitê de Privacidade multidisciplinar.
          </p>
          <div class="bg-teal-50 dark:bg-teal-900/20 p-3 rounded">
            <p class="text-sm text-teal-800 dark:text-teal-200">
              <strong>👥 Composição sugerida:</strong>
            </p>
            <ul class="text-sm text-teal-800 dark:text-teal-200 mt-2 space-y-1 ml-4">
              <li>• DPO (coordenador)</li>
              <li>• Representante da área Jurídica</li>
              <li>• Representante de TI/Segurança da Informação</li>
              <li>• Representante de RH</li>
              <li>• Representante de Compliance</li>
              <li>• Representantes de áreas-chave (Marketing, Vendas, etc.)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 6 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-pink-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          6
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📧 Publique Dados de Contato do DPO
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Torne público o canal de comunicação do DPO conforme exigido pela LGPD.
          </p>
          <div class="bg-pink-50 dark:bg-pink-900/20 p-3 rounded">
            <p class="text-sm text-pink-800 dark:text-pink-200">
              <strong>📢 Onde divulgar:</strong>
            </p>
            <ul class="text-sm text-pink-800 dark:text-pink-200 mt-2 space-y-1 ml-4">
              <li>✉️ Na Política de Privacidade do site</li>
              <li>✉️ No site institucional (seção de contato)</li>
              <li>✉️ Em comunicados internos</li>
              <li>✉️ Disponível para titulares de dados</li>
              <li>✉️ E-mail específico: exemplo - dpo@empresa.com.br</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-6 rounded-lg border-l-4 border-green-600 mt-6">
    <p class="text-green-900 dark:text-green-100 font-semibold">
      ✅ <strong>Resultado Esperado:</strong> Estrutura organizacional definida com papéis claros, DPO nomeado e canais de comunicação estabelecidos.
    </p>
  </div>
</div>
  `,

  'fase-2': `
<div class="space-y-6">
  <div class="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-6 rounded-lg border-l-4 border-cyan-600">
    <h3 class="text-xl font-bold text-cyan-900 dark:text-cyan-100 mb-4">🗺️ Passo a Passo - Mapeamento de Dados</h3>
    <p class="text-gray-700 dark:text-gray-300">Mapeie todos os processos e dados pessoais da sua organização:</p>
  </div>

  <div class="grid gap-4">
    <!-- Passo 1 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          1
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🏗️ Organize a Estrutura do Mapeamento
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Defina como será conduzido o mapeamento e quem participará de cada área.
          </p>
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              <strong>📋 Preparação inicial:</strong>
            </p>
            <ul class="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 ml-4">
              <li>☐ Identifique todas as áreas da empresa</li>
              <li>☐ Nomeie responsáveis por área (key users)</li>
              <li>☐ Crie planilha/ferramenta de inventário de dados</li>
              <li>☐ Agende entrevistas com cada departamento</li>
              <li>☐ Prepare questionário padrão</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 2 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          2
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🔍 Identifique os Tipos de Dados Coletados
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Levante TODOS os dados pessoais tratados pela empresa, categorizando-os.
          </p>
          <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <p class="text-sm text-green-800 dark:text-green-200">
              <strong>🗂️ Categorias de dados:</strong>
            </p>
            <ul class="text-sm text-green-800 dark:text-green-200 mt-2 space-y-1 ml-4">
              <li>📌 <strong>Dados Básicos:</strong> Nome, CPF, RG, data de nascimento, endereço, telefone, e-mail</li>
              <li>📌 <strong>Dados Profissionais:</strong> Cargo, salário, formação, histórico profissional</li>
              <li>📌 <strong>Dados Sensíveis:</strong> Origem racial/étnica, saúde, biometria, orientação sexual</li>
              <li>📌 <strong>Dados Financeiros:</strong> Dados bancários, histórico de pagamentos, inadimplência</li>
              <li>📌 <strong>Dados Comportamentais:</strong> Hábitos de consumo, navegação, preferências</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 3 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          3
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📥 Mapeie as Fontes de Coleta
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Identifique como e onde os dados são coletados pela empresa.
          </p>
          <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
            <p class="text-sm text-purple-800 dark:text-purple-200">
              <strong>📍 Fontes comuns:</strong>
            </p>
            <ul class="text-sm text-purple-800 dark:text-purple-200 mt-2 space-y-1 ml-4">
              <li>• Formulários no site (cadastro, contato)</li>
              <li>• Contratos físicos e digitais</li>
              <li>• E-mails e comunicações</li>
              <li>• Sistemas de CRM e ERP</li>
              <li>• Redes sociais e landing pages</li>
              <li>• Aplicativos mobile</li>
              <li>• Câmeras e controle de acesso</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 4 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-amber-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          4
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🎯 Documente as Finalidades
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Para cada dado coletado, registre PARA QUE ele é utilizado (finalidade específica).
          </p>
          <div class="bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
            <p class="text-sm text-amber-800 dark:text-amber-200">
              <strong>🎯 Exemplos de finalidades:</strong>
            </p>
            <ul class="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1 ml-4">
              <li>✓ Execução de contrato de prestação de serviços</li>
              <li>✓ Cumprimento de obrigação legal/regulatória</li>
              <li>✓ Envio de comunicações de marketing</li>
              <li>✓ Gestão de relacionamento com cliente</li>
              <li>✓ Segurança patrimonial (câmeras)</li>
              <li>✓ Análise de crédito</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 5 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-red-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          5
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🗄️ Identifique Locais de Armazenamento
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Registre ONDE cada tipo de dado está armazenado (sistemas, servidores, nuvem).
          </p>
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded">
            <p class="text-sm text-red-800 dark:text-red-200">
              <strong>💾 Locais típicos:</strong>
            </p>
            <ul class="text-sm text-red-800 dark:text-red-200 mt-2 space-y-1 ml-4">
              <li>☁️ Servidores em nuvem (AWS, Azure, Google Cloud)</li>
              <li>☁️ Servidores locais (on-premise)</li>
              <li>☁️ Banco de dados específicos</li>
              <li>☁️ Sistemas de CRM/ERP</li>
              <li>☁️ Arquivos físicos (pastas, arquivos)</li>
              <li>☁️ E-mails corporativos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 6 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-teal-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          6
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            👥 Mapeie Acessos e Compartilhamentos
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Identifique quem tem acesso aos dados e com quem são compartilhados.
          </p>
          <div class="bg-teal-50 dark:bg-teal-900/20 p-3 rounded">
            <p class="text-sm text-teal-800 dark:text-teal-200">
              <strong>🔐 Pontos de atenção:</strong>
            </p>
            <ul class="text-sm text-teal-800 dark:text-teal-200 mt-2 space-y-1 ml-4">
              <li>• Quais colaboradores têm acesso (por cargo/função)</li>
              <li>• Fornecedores e prestadores de serviço</li>
              <li>• Parceiros comerciais</li>
              <li>• Transferências internacionais (se houver)</li>
              <li>• Órgãos públicos (quando obrigatório)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 7 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          7
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ⏱️ Defina Tempo de Retenção
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Estabeleça por quanto tempo cada tipo de dado será mantido.
          </p>
          <div class="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded">
            <p class="text-sm text-indigo-800 dark:text-indigo-200">
              <strong>⏳ Critérios para definição:</strong>
            </p>
            <ul class="text-sm text-indigo-800 dark:text-indigo-200 mt-2 space-y-1 ml-4">
              <li>📅 Necessidade do negócio</li>
              <li>📅 Prazos legais (ex: 5 anos para dados trabalhistas)</li>
              <li>📅 Finalidade específica (enquanto durar o contrato)</li>
              <li>📅 Consentimento (até revogação)</li>
              <li>📅 Princípio da minimização</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 8 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-pink-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          8
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📊 Consolide o Inventário de Dados
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Compile todas as informações em um documento único e estruturado.
          </p>
          <div class="bg-pink-50 dark:bg-pink-900/20 p-3 rounded">
            <p class="text-sm text-pink-800 dark:text-pink-200">
              <strong>📋 Use a ferramenta de Inventário deste sistema para registrar:</strong>
            </p>
            <ul class="text-sm text-pink-800 dark:text-pink-200 mt-2 space-y-1 ml-4">
              <li>✍️ Tipo de dado</li>
              <li>✍️ Finalidade</li>
              <li>✍️ Base legal</li>
              <li>✍️ Fonte de coleta</li>
              <li>✍️ Local de armazenamento</li>
              <li>✍️ Quem tem acesso</li>
              <li>✍️ Tempo de retenção</li>
              <li>✍️ Medidas de segurança</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-6 rounded-lg border-l-4 border-green-600 mt-6">
    <p class="text-green-900 dark:text-green-100 font-semibold">
      ✅ <strong>Resultado Esperado:</strong> Inventário completo de todos os dados pessoais tratados pela empresa, com mapeamento do ciclo de vida de cada categoria de dados.
    </p>
  </div>
</div>
  `,

  'fase-3': `
<div class="space-y-6">
  <div class="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-lg border-l-4 border-orange-600">
    <h3 class="text-xl font-bold text-orange-900 dark:text-orange-100 mb-4">⚠️ Passo a Passo - Análise de Riscos e GAP</h3>
    <p class="text-gray-700 dark:text-gray-300">Avalie os riscos e identifique lacunas de conformidade:</p>
  </div>

  <div class="grid gap-4">
    <!-- Passo 1 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-red-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          1
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🎯 Revise o Inventário de Dados
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Utilize o inventário criado na Fase 2 como base para análise de riscos.
          </p>
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded">
            <p class="text-sm text-red-800 dark:text-red-200">
              <strong>📋 Preparação:</strong>
            </p>
            <ul class="text-sm text-red-800 dark:text-red-200 mt-2 space-y-1 ml-4">
              <li>☐ Tenha em mãos o inventário completo</li>
              <li>☐ Identifique processos críticos</li>
              <li>☐ Destaque dados sensíveis</li>
              <li>☐ Organize por departamento/sistema</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 2 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-orange-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          2
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🛡️ Avalie Medidas de Segurança Existentes
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Identifique quais medidas de segurança técnicas e organizacionais já existem.
          </p>
          <div class="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
            <p class="text-sm text-orange-800 dark:text-orange-200">
              <strong>🔍 Medidas a verificar:</strong>
            </p>
            <ul class="text-sm text-orange-800 dark:text-orange-200 mt-2 space-y-1 ml-4">
              <li>✓ Controle de acesso (usuários e senhas)</li>
              <li>✓ Criptografia de dados (em repouso e trânsito)</li>
              <li>✓ Backup e recuperação de dados</li>
              <li>✓ Firewall e antivírus</li>
              <li>✓ Políticas de segurança documentadas</li>
              <li>✓ Treinamento de colaboradores</li>
              <li>✓ Logs e monitoramento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 3 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-amber-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          3
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ⚡ Identifique Ameaças e Vulnerabilidades
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Liste possíveis ameaças aos dados e vulnerabilidades nos processos.
          </p>
          <div class="bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
            <p class="text-sm text-amber-800 dark:text-amber-200">
              <strong>⚠️ Ameaças comuns:</strong>
            </p>
            <ul class="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1 ml-4">
              <li>🔴 Ataques cibernéticos (ransomware, phishing)</li>
              <li>🔴 Acesso não autorizado interno</li>
              <li>🔴 Perda ou roubo de dispositivos</li>
              <li>🔴 Erros humanos (envio de dados para destinatário errado)</li>
              <li>🔴 Falhas de fornecedores/operadores</li>
              <li>🔴 Desastres naturais</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 4 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          4
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📊 Classifique Riscos (Probabilidade x Impacto)
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Use matriz de risco para priorizar: qual a probabilidade e qual o impacto de cada ameaça?
          </p>
          <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
            <p class="text-sm text-purple-800 dark:text-purple-200">
              <strong>📈 Matriz de classificação:</strong>
            </p>
            <div class="text-sm text-purple-800 dark:text-purple-200 mt-2 space-y-1">
              <p><strong>Probabilidade:</strong> Baixa (1) | Média (2) | Alta (3)</p>
              <p><strong>Impacto:</strong> Baixo (1) | Médio (2) | Alto (3)</p>
              <p><strong>Risco = Probabilidade × Impacto</strong></p>
              <p class="mt-2">
                🟢 Baixo (1-2) | 🟡 Médio (3-4) | 🔴 Alto (6-9)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 5 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          5
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📋 Realize GAP Analysis (Análise de Lacunas)
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Compare o estado atual com os requisitos da LGPD para identificar o que está faltando.
          </p>
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              <strong>🔎 Perguntas para cada requisito:</strong>
            </p>
            <ul class="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 ml-4">
              <li>❓ Temos base legal para todos os tratamentos?</li>
              <li>❓ Temos Política de Privacidade atualizada?</li>
              <li>❓ Contratos têm cláusulas de proteção de dados?</li>
              <li>❓ Há processo para atender direitos dos titulares?</li>
              <li>❓ Existe plano de resposta a incidentes?</li>
              <li>❓ Colaboradores são treinados regularmente?</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 6 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-teal-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          6
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🔍 Use as Ferramentas do Sistema
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Utilize as funcionalidades de Análise de Riscos e GAP Analysis disponíveis no sistema PGP.
          </p>
          <div class="bg-teal-50 dark:bg-teal-900/20 p-3 rounded">
            <p class="text-sm text-teal-800 dark:text-teal-200">
              <strong>💻 Ferramentas disponíveis:</strong>
            </p>
            <ul class="text-sm text-teal-800 dark:text-teal-200 mt-2 space-y-1 ml-4">
              <li>📊 <strong>Análise de Riscos:</strong> Registre e classifique cada risco identificado</li>
              <li>📊 <strong>GAP Analysis:</strong> Documente lacunas de conformidade</li>
              <li>📊 Gere relatórios automáticos</li>
              <li>📊 Priorize ações corretivas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 7 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          7
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📈 Priorize as Não Conformidades
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Classifique os gaps por criticidade para direcionar as ações da próxima fase.
          </p>
          <div class="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded">
            <p class="text-sm text-indigo-800 dark:text-indigo-200">
              <strong>🎯 Critérios de priorização:</strong>
            </p>
            <ul class="text-sm text-indigo-800 dark:text-indigo-200 mt-2 space-y-1 ml-4">
              <li>🔴 <strong>Crítico:</strong> Alto risco + Fácil de explorar + Alto impacto</li>
              <li>🟡 <strong>Importante:</strong> Risco médio ou difícil de resolver rapidamente</li>
              <li>🟢 <strong>Desejável:</strong> Baixo risco ou impacto limitado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 8 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          8
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📄 Documente os Resultados
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Compile um relatório executivo com todos os riscos e gaps identificados.
          </p>
          <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <p class="text-sm text-green-800 dark:text-green-200">
              <strong>📋 Estrutura do relatório:</strong>
            </p>
            <ul class="text-sm text-green-800 dark:text-green-200 mt-2 space-y-1 ml-4">
              <li>✍️ Sumário executivo</li>
              <li>✍️ Metodologia utilizada</li>
              <li>✍️ Riscos identificados (com classificação)</li>
              <li>✍️ Gaps de conformidade</li>
              <li>✍️ Recomendações prioritárias</li>
              <li>✍️ Anexos (evidências, planilhas)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-6 rounded-lg border-l-4 border-green-600 mt-6">
    <p class="text-green-900 dark:text-green-100 font-semibold">
      ✅ <strong>Resultado Esperado:</strong> Matriz de riscos completa e lista priorizada de não conformidades (gaps) que servirão de base para o Plano de Ação da Fase 4.
    </p>
  </div>
</div>
  `,

  'fase-4': `
<div class="space-y-6">
  <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border-l-4 border-green-600">
    <h3 class="text-xl font-bold text-green-900 dark:text-green-100 mb-4">✅ Passo a Passo - Plano de Ação e Adequação</h3>
    <p class="text-gray-700 dark:text-gray-300">Elabore e implemente o plano de ação para adequação à LGPD:</p>
  </div>

  <div class="grid gap-4">
    <!-- Passo 1 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          1
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📋 Consolide os Gaps Identificados
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Liste todas as não conformidades e riscos identificados na Fase 3.
          </p>
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              <strong>📊 Organize por categoria:</strong>
            </p>
            <ul class="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 ml-4">
              <li>☐ Gaps técnicos (sistemas, segurança)</li>
              <li>☐ Gaps organizacionais (processos, políticas)</li>
              <li>☐ Gaps jurídicos (contratos, bases legais)</li>
              <li>☐ Gaps de pessoas (treinamento, cultura)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 2 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          2
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🎯 Defina Ações Corretivas Específicas
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Para cada gap, defina uma ou mais ações concretas para corrigi-lo.
          </p>
          <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
            <p class="text-sm text-purple-800 dark:text-purple-200">
              <strong>✍️ Exemplo de ações:</strong>
            </p>
            <ul class="text-sm text-purple-800 dark:text-purple-200 mt-2 space-y-1 ml-4">
              <li>• GAP: Falta Política de Privacidade → AÇÃO: Criar e publicar política</li>
              <li>• GAP: Contratos sem cláusulas LGPD → AÇÃO: Revisar e adequar contratos</li>
              <li>• GAP: Sem controle de acesso → AÇÃO: Implementar sistema de permissões</li>
              <li>• GAP: Colaboradores não treinados → AÇÃO: Realizar treinamento LGPD</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 3 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-amber-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          3
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            👥 Atribua Responsáveis por Cada Ação
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Defina claramente quem será responsável pela execução de cada ação.
          </p>
          <div class="bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
            <p class="text-sm text-amber-800 dark:text-amber-200">
              <strong>👔 Possíveis responsáveis:</strong>
            </p>
            <ul class="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1 ml-4">
              <li>• DPO (coordenação geral)</li>
              <li>• TI/Segurança da Informação (ações técnicas)</li>
              <li>• Jurídico (contratos, políticas)</li>
              <li>• RH (treinamentos, procedimentos internos)</li>
              <li>• Cada gestor de área (implementação local)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 4 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-red-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          4
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📅 Estabeleça Prazos Realistas
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Defina cronograma com prazos para conclusão de cada ação.
          </p>
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded">
            <p class="text-sm text-red-800 dark:text-red-200">
              <strong>⏱️ Sugestão de priorização:</strong>
            </p>
            <ul class="text-sm text-red-800 dark:text-red-200 mt-2 space-y-1 ml-4">
              <li>🔴 <strong>Curto prazo (1-3 meses):</strong> Gaps críticos de alto risco</li>
              <li>🟡 <strong>Médio prazo (3-6 meses):</strong> Gaps importantes</li>
              <li>🟢 <strong>Longo prazo (6-12 meses):</strong> Melhorias contínuas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 5 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-teal-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          5
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            💰 Estime Recursos Necessários
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Identifique recursos financeiros, humanos e tecnológicos para cada ação.
          </p>
          <div class="bg-teal-50 dark:bg-teal-900/20 p-3 rounded">
            <p class="text-sm text-teal-800 dark:text-teal-200">
              <strong>💵 Tipos de recursos:</strong>
            </p>
            <ul class="text-sm text-teal-800 dark:text-teal-200 mt-2 space-y-1 ml-4">
              <li>💳 Orçamento (consultoria, software, ferramentas)</li>
              <li>💳 Horas/equipe (dedicação de colaboradores)</li>
              <li>💳 Infraestrutura (servidores, licenças)</li>
              <li>💳 Treinamento/capacitação</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 6 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          6
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📊 Use a Ferramenta de Plano de Ação
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Registre todo o plano de ação na ferramenta específica deste sistema PGP.
          </p>
          <div class="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded">
            <p class="text-sm text-indigo-800 dark:text-indigo-200">
              <strong>💻 Campos a preencher:</strong>
            </p>
            <ul class="text-sm text-indigo-800 dark:text-indigo-200 mt-2 space-y-1 ml-4">
              <li>✓ Descrição da ação</li>
              <li>✓ Responsável</li>
              <li>✓ Prazo</li>
              <li>✓ Status (Pendente/Em andamento/Concluída)</li>
              <li>✓ Prioridade (Baixa/Média/Alta)</li>
              <li>✓ Observações</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 7 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          7
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🚀 Execute as Ações Planejadas
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Implemente as ações conforme o cronograma, começando pelas mais críticas.
          </p>
          <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <p class="text-sm text-green-800 dark:text-green-200">
              <strong>⚙️ Ações típicas a executar:</strong>
            </p>
            <ul class="text-sm text-green-800 dark:text-green-200 mt-2 space-y-1 ml-4">
              <li>✓ Criar/atualizar Política de Privacidade</li>
              <li>✓ Revisar contratos com cláusulas LGPD</li>
              <li>✓ Implementar controles de acesso</li>
              <li>✓ Configurar logs e monitoramento</li>
              <li>✓ Criar procedimento de resposta a incidentes</li>
              <li>✓ Adequar formulários de coleta de dados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 8 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-pink-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          8
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📈 Monitore e Atualize o Status
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Acompanhe o progresso de cada ação e atualize regularmente no sistema.
          </p>
          <div class="bg-pink-50 dark:bg-pink-900/20 p-3 rounded">
            <p class="text-sm text-pink-800 dark:text-pink-200">
              <strong>🔄 Rotina de acompanhamento:</strong>
            </p>
            <ul class="text-sm text-pink-800 dark:text-pink-200 mt-2 space-y-1 ml-4">
              <li>• Reuniões semanais/quinzenais de status</li>
              <li>• Atualização de status no sistema</li>
              <li>• Identificação de bloqueios/impedimentos</li>
              <li>• Ajustes de prazo quando necessário</li>
              <li>• Relatórios de progresso para diretoria</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 9 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-cyan-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-cyan-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          9
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ✅ Valide as Implementações
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Verifique se cada ação foi realmente implementada e está funcionando.
          </p>
          <div class="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded">
            <p class="text-sm text-cyan-800 dark:text-cyan-200">
              <strong>🔍 Formas de validação:</strong>
            </p>
            <ul class="text-sm text-cyan-800 dark:text-cyan-200 mt-2 space-y-1 ml-4">
              <li>☑️ Testes práticos das novas ferramentas</li>
              <li>☑️ Revisão de documentação criada</li>
              <li>☑️ Verificação de contratos assinados</li>
              <li>☑️ Comprovantes de treinamento realizado</li>
              <li>☑️ Evidências fotográficas/screenshots</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 10 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-emerald-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          10
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📄 Documente Tudo
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Mantenha registro completo de todas as ações implementadas (accountability).
          </p>
          <div class="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded">
            <p class="text-sm text-emerald-800 dark:text-emerald-200">
              <strong>📂 Documentação necessária:</strong>
            </p>
            <ul class="text-sm text-emerald-800 dark:text-emerald-200 mt-2 space-y-1 ml-4">
              <li>📁 Políticas e procedimentos criados</li>
              <li>📁 Contratos assinados</li>
              <li>📁 Atas de reuniões</li>
              <li>📁 Listas de presença em treinamentos</li>
              <li>📁 Prints de tela de configurações</li>
              <li>📁 Relatórios de progresso</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-6 rounded-lg border-l-4 border-green-600 mt-6">
    <p class="text-green-900 dark:text-green-100 font-semibold">
      ✅ <strong>Resultado Esperado:</strong> Plano de ação completo, implementado e documentado, com as principais não conformidades corrigidas e riscos mitigados.
    </p>
  </div>
</div>
  `,

  'fase-5': `
<div class="space-y-6">
  <div class="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900/20 dark:to-blue-900/20 p-6 rounded-lg border-l-4 border-slate-600">
    <h3 class="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">📝 Passo a Passo - Documentação e Políticas</h3>
    <p class="text-gray-700 dark:text-gray-300">Crie e formalize toda documentação de governança de dados:</p>
  </div>

  <div class="grid gap-4">
    <!-- Passo 1 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          1
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📋 Liste os Documentos Necessários
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Identifique quais documentos sua empresa precisa criar ou revisar.
          </p>
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              <strong>📄 Documentos essenciais:</strong>
            </p>
            <ul class="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 ml-4">
              <li>☐ Política de Privacidade (externa)</li>
              <li>☐ Política Interna de Proteção de Dados</li>
              <li>☐ Política de Segurança da Informação</li>
              <li>☐ Termos de Uso (se aplicável)</li>
              <li>☐ Termos de Consentimento</li>
              <li>☐ Procedimentos Operacionais (POPs)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 2 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          2
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🌐 Crie/Atualize a Política de Privacidade
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Documento público que informa aos titulares como seus dados são tratados.
          </p>
          <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
            <p class="text-sm text-purple-800 dark:text-purple-200">
              <strong>📌 Conteúdo obrigatório:</strong>
            </p>
            <ul class="text-sm text-purple-800 dark:text-purple-200 mt-2 space-y-1 ml-4">
              <li>• Identificação do controlador</li>
              <li>• Quais dados são coletados</li>
              <li>• Finalidade do tratamento</li>
              <li>• Base legal utilizada</li>
              <li>• Com quem os dados são compartilhados</li>
              <li>• Tempo de retenção</li>
              <li>• Direitos dos titulares</li>
              <li>• Dados de contato do DPO</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 3 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          3
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🏢 Elabore a Política Interna de Dados
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Documento interno que orienta colaboradores sobre tratamento de dados.
          </p>
          <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <p class="text-sm text-green-800 dark:text-green-200">
              <strong>📋 Tópicos a incluir:</strong>
            </p>
            <ul class="text-sm text-green-800 dark:text-green-200 mt-2 space-y-1 ml-4">
              <li>• Princípios e responsabilidades</li>
              <li>• Papéis (controlador, operador, DPO)</li>
              <li>• Regras de coleta e tratamento</li>
              <li>• Medidas de segurança obrigatórias</li>
              <li>• Processo de atendimento a titulares</li>
              <li>• Gestão de incidentes</li>
              <li>• Sanções disciplinares por descumprimento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 4 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-amber-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          4
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🔒 Formalize a Política de Segurança
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Defina medidas técnicas e organizacionais para proteger os dados.
          </p>
          <div class="bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
            <p class="text-sm text-amber-800 dark:text-amber-200">
              <strong>🛡️ Medidas a documentar:</strong>
            </p>
            <ul class="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1 ml-4">
              <li>• Controle de acesso e senhas</li>
              <li>• Criptografia de dados</li>
              <li>• Backup e recuperação</li>
              <li>• Firewall e antivírus</li>
              <li>• Monitoramento e logs</li>
              <li>• Política de mesas limpas</li>
              <li>• Uso de dispositivos pessoais (BYOD)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 5 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-red-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          5
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📜 Adeque Contratos e Termos
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Revise e atualize contratos com cláusulas de proteção de dados.
          </p>
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded">
            <p class="text-sm text-red-800 dark:text-red-200">
              <strong>📝 Contratos a revisar:</strong>
            </p>
            <ul class="text-sm text-red-800 dark:text-red-200 mt-2 space-y-1 ml-4">
              <li>• Contratos com fornecedores (operadores)</li>
              <li>• Contratos de trabalho (colaboradores)</li>
              <li>• Contratos com clientes</li>
              <li>• Termos de uso de plataformas</li>
              <li>• Termos de consentimento</li>
              <li>• Acordos de confidencialidade (NDA)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 6 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-teal-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          6
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🔧 Crie Procedimentos Operacionais (POPs)
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Documente processos passo a passo para operações do dia a dia.
          </p>
          <div class="bg-teal-50 dark:bg-teal-900/20 p-3 rounded">
            <p class="text-sm text-teal-800 dark:text-teal-200">
              <strong>⚙️ POPs essenciais:</strong>
            </p>
            <ul class="text-sm text-teal-800 dark:text-teal-200 mt-2 space-y-1 ml-4">
              <li>• Atendimento a solicitações de titulares</li>
              <li>• Gestão de incidentes de segurança</li>
              <li>• Coleta e validação de consentimento</li>
              <li>• Exclusão/anonimização de dados</li>
              <li>• Onboarding de novos colaboradores</li>
              <li>• Offboarding (desligamento)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 7 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          7
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ✍️ Use Linguagem Clara e Acessível
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Escreva de forma que qualquer pessoa possa compreender.
          </p>
          <div class="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded">
            <p class="text-sm text-indigo-800 dark:text-indigo-200">
              <strong>💡 Boas práticas de redação:</strong>
            </p>
            <ul class="text-sm text-indigo-800 dark:text-indigo-200 mt-2 space-y-1 ml-4">
              <li>✓ Evite jargão técnico excessivo</li>
              <li>✓ Use frases curtas e diretas</li>
              <li>✓ Organize em tópicos e seções</li>
              <li>✓ Destaque informações importantes</li>
              <li>✓ Inclua exemplos práticos</li>
              <li>✓ Revise e peça feedback</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 8 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-pink-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          8
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ✅ Obtenha Aprovação Formal
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Todas as políticas devem ser aprovadas pela diretoria.
          </p>
          <div class="bg-pink-50 dark:bg-pink-900/20 p-3 rounded">
            <p class="text-sm text-pink-800 dark:text-pink-200">
              <strong>📋 Processo de aprovação:</strong>
            </p>
            <ul class="text-sm text-pink-800 dark:text-pink-200 mt-2 space-y-1 ml-4">
              <li>• Revisão jurídica (se necessário)</li>
              <li>• Apresentação para diretoria</li>
              <li>• Ajustes conforme feedback</li>
              <li>• Aprovação formal em ata</li>
              <li>• Assinatura dos responsáveis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 9 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-cyan-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-cyan-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          9
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📢 Publique e Divulgue
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Torne as políticas acessíveis e comunique a toda organização.
          </p>
          <div class="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded">
            <p class="text-sm text-cyan-800 dark:text-cyan-200">
              <strong>📣 Canais de divulgação:</strong>
            </p>
            <ul class="text-sm text-cyan-800 dark:text-cyan-200 mt-2 space-y-1 ml-4">
              <li>• Política de Privacidade no site público</li>
              <li>• Políticas internas na intranet</li>
              <li>• E-mail para todos colaboradores</li>
              <li>• Treinamento de apresentação</li>
              <li>• Versão impressa disponível (se aplicável)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 10 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          10
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🔄 Implemente Controle de Versões
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Mantenha histórico de todas as versões das políticas.
          </p>
          <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <p class="text-sm text-green-800 dark:text-green-200">
              <strong>📁 Sistema de versionamento:</strong>
            </p>
            <ul class="text-sm text-green-800 dark:text-green-200 mt-2 space-y-1 ml-4">
              <li>• Cada documento deve ter número de versão</li>
              <li>• Data de criação e última atualização</li>
              <li>• Registro de alterações (changelog)</li>
              <li>• Responsável pela aprovação</li>
              <li>• Próxima data de revisão</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 11 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-emerald-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          11
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📌 Use o Módulo de Documentos do Sistema
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Utilize a funcionalidade de Gestão de Documentos deste sistema PGP.
          </p>
          <div class="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded">
            <p class="text-sm text-emerald-800 dark:text-emerald-200">
              <strong>💻 Funcionalidades disponíveis:</strong>
            </p>
            <ul class="text-sm text-emerald-800 dark:text-emerald-200 mt-2 space-y-1 ml-4">
              <li>✓ Geração automatizada de documentos</li>
              <li>✓ Templates prontos e personalizáveis</li>
              <li>✓ Controle de versões</li>
              <li>✓ Exportação para Word e PDF</li>
              <li>✓ Armazenamento centralizado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-6 rounded-lg border-l-4 border-green-600 mt-6">
    <p class="text-green-900 dark:text-green-100 font-semibold">
      ✅ <strong>Resultado Esperado:</strong> Documentação completa de governança de dados, aprovada, publicada e acessível para todas as partes interessadas.
    </p>
  </div>
</div>
  `,

  'fase-6': `
<div class="space-y-6">
  <div class="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 p-6 rounded-lg border-l-4 border-violet-600">
    <h3 class="text-xl font-bold text-violet-900 dark:text-violet-100 mb-4">🎓 Passo a Passo - Treinamento e Conscientização</h3>
    <p class="text-gray-700 dark:text-gray-300">Capacite seus colaboradores e dissemine a cultura de proteção de dados:</p>
  </div>

  <div class="grid gap-4">
    <!-- Passo 1 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          1
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🎯 Mapeie os Públicos-Alvo
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Identifique diferentes grupos de colaboradores e suas necessidades de treinamento.
          </p>
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              <strong>👥 Segmente por perfil:</strong>
            </p>
            <ul class="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 ml-4">
              <li>• <strong>Geral:</strong> Todos os colaboradores (treinamento básico)</li>
              <li>• <strong>Operacional:</strong> RH, TI, Marketing, Vendas (aprofundado)</li>
              <li>• <strong>Gestão:</strong> Gerentes e coordenadores</li>
              <li>• <strong>Executivo:</strong> Diretoria e alta gestão</li>
              <li>• <strong>Especializado:</strong> DPO e equipe de privacidade</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 2 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          2
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📚 Defina o Conteúdo Programático
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Estruture o conteúdo de cada treinamento de acordo com o público.
          </p>
          <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
            <p class="text-sm text-purple-800 dark:text-purple-200">
              <strong>📖 Tópicos essenciais (básico):</strong>
            </p>
            <ul class="text-sm text-purple-800 dark:text-purple-200 mt-2 space-y-1 ml-4">
              <li>✓ O que é LGPD e por que é importante</li>
              <li>✓ Conceitos básicos (dados pessoais, sensíveis)</li>
              <li>✓ Direitos dos titulares</li>
              <li>✓ Princípios da proteção de dados</li>
              <li>✓ Boas práticas no dia a dia</li>
              <li>✓ Como identificar/reportar incidentes</li>
              <li>✓ Consequências de não conformidade</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 3 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          3
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🎨 Escolha os Formatos de Treinamento
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Selecione formatos variados para engajar diferentes perfis de aprendizado.
          </p>
          <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <p class="text-sm text-green-800 dark:text-green-200">
              <strong>🎬 Formatos sugeridos:</strong>
            </p>
            <ul class="text-sm text-green-800 dark:text-green-200 mt-2 space-y-1 ml-4">
              <li>• <strong>Workshop presencial/online:</strong> Interativo com exemplos práticos</li>
              <li>• <strong>E-learning:</strong> Curso online assíncrono</li>
              <li>• <strong>Vídeos curtos:</strong> Pílulas de conhecimento (5-10 min)</li>
              <li>• <strong>Cartilhas/infográficos:</strong> Material de consulta rápida</li>
              <li>• <strong>Simulações:</strong> Exercícios práticos e cases</li>
              <li>• <strong>Quiz/gamificação:</strong> Avaliação de conhecimento divertida</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 4 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-amber-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          4
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🗓️ Monte o Cronograma de Treinamentos
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Planeje quando e como os treinamentos serão realizados.
          </p>
          <div class="bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
            <p class="text-sm text-amber-800 dark:text-amber-200">
              <strong>📅 Planejamento:</strong>
            </p>
            <ul class="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1 ml-4">
              <li>• <strong>Inicial:</strong> Treinamento geral para todos (1-2 meses)</li>
              <li>• <strong>Específico:</strong> Por área/departamento (2-3 meses)</li>
              <li>• <strong>Reciclagem:</strong> Anualmente para todos</li>
              <li>• <strong>Onboarding:</strong> Para novos colaboradores</li>
              <li>• <strong>Campanhas:</strong> Trimestrais de conscientização</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 5 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-red-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          5
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🎬 Prepare os Materiais Didáticos
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Crie ou adquira materiais de qualidade para os treinamentos.
          </p>
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded">
            <p class="text-sm text-red-800 dark:text-red-200">
              <strong>📦 Materiais necessários:</strong>
            </p>
            <ul class="text-sm text-red-800 dark:text-red-200 mt-2 space-y-1 ml-4">
              <li>• Apresentação em slides (PowerPoint/Google Slides)</li>
              <li>• Vídeos explicativos</li>
              <li>• Manual/apostila do participante</li>
              <li>• Casos práticos e exercícios</li>
              <li>• Quiz de avaliação</li>
              <li>• Certificado de conclusão</li>
              <li>• Material de apoio (cartilhas, checklists)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 6 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-teal-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          6
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📣 Divulgue e Mobilize
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Comunique antecipadamente e engaje os colaboradores.
          </p>
          <div class="bg-teal-50 dark:bg-teal-900/20 p-3 rounded">
            <p class="text-sm text-teal-800 dark:text-teal-200">
              <strong>📢 Estratégias de comunicação:</strong>
            </p>
            <ul class="text-sm text-teal-800 dark:text-teal-200 mt-2 space-y-1 ml-4">
              <li>• E-mail convite com agenda</li>
              <li>• Cartazes e materiais visuais</li>
              <li>• Apoio da liderança (vídeo do CEO)</li>
              <li>• Teaser/trailer do treinamento</li>
              <li>• Incentivos (certificado, prêmios simbólicos)</li>
              <li>• Lembretes periódicos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 7 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          7
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🎓 Execute os Treinamentos
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Realize os treinamentos conforme planejado com facilitadores qualificados.
          </p>
          <div class="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded">
            <p class="text-sm text-indigo-800 dark:text-indigo-200">
              <strong>🎤 Dicas para execução:</strong>
            </p>
            <ul class="text-sm text-indigo-800 dark:text-indigo-200 mt-2 space-y-1 ml-4">
              <li>✓ Use linguagem simples e exemplos do dia a dia</li>
              <li>✓ Incentive perguntas e discussões</li>
              <li>✓ Relacione com o trabalho real dos participantes</li>
              <li>✓ Use recursos visuais e interativos</li>
              <li>✓ Faça pausas em treinamentos longos</li>
              <li>✓ Aplique exercícios práticos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 8 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-pink-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          8
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ✅ Avalie o Aprendizado
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Aplique avaliações para verificar a absorção do conteúdo.
          </p>
          <div class="bg-pink-50 dark:bg-pink-900/20 p-3 rounded">
            <p class="text-sm text-pink-800 dark:text-pink-200">
              <strong>📊 Formas de avaliação:</strong>
            </p>
            <ul class="text-sm text-pink-800 dark:text-pink-200 mt-2 space-y-1 ml-4">
              <li>• Quiz de múltipla escolha</li>
              <li>• Estudos de caso para análise</li>
              <li>• Simulações práticas</li>
              <li>• Avaliação de reação (satisfação)</li>
              <li>• Critério mínimo de aprovação (ex: 70%)</li>
              <li>• Possibilidade de refazer se necessário</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 9 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-cyan-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-cyan-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          9
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📜 Emita Certificados
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Entregue certificado de conclusão para os participantes aprovados.
          </p>
          <div class="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded">
            <p class="text-sm text-cyan-800 dark:text-cyan-200">
              <strong>🏆 Informações no certificado:</strong>
            </p>
            <ul class="text-sm text-cyan-800 dark:text-cyan-200 mt-2 space-y-1 ml-4">
              <li>• Nome do participante</li>
              <li>• Título do treinamento</li>
              <li>• Carga horária</li>
              <li>• Data de conclusão</li>
              <li>• Assinatura do DPO ou responsável</li>
              <li>• Validade (se aplicável)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 10 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-violet-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-violet-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          10
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📂 Registre e Documente
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Mantenha registro completo de todos os treinamentos realizados.
          </p>
          <div class="bg-violet-50 dark:bg-violet-900/20 p-3 rounded">
            <p class="text-sm text-violet-800 dark:text-violet-200">
              <strong>📋 Documentação necessária:</strong>
            </p>
            <ul class="text-sm text-violet-800 dark:text-violet-200 mt-2 space-y-1 ml-4">
              <li>• Lista de presença (física ou digital)</li>
              <li>• Conteúdo programático</li>
              <li>• Material utilizado</li>
              <li>• Resultados das avaliações</li>
              <li>• Certificados emitidos</li>
              <li>• Feedback dos participantes</li>
              <li>• Fotos/prints de tela (evidências)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 11 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          11
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🔄 Mantenha Campanhas Contínuas
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Crie campanhas periódicas de conscientização para reforçar a cultura.
          </p>
          <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <p class="text-sm text-green-800 dark:text-green-200">
              <strong>💡 Ideias de campanhas:</strong>
            </p>
            <ul class="text-sm text-green-800 dark:text-green-200 mt-2 space-y-1 ml-4">
              <li>• Dica da semana sobre LGPD</li>
              <li>• Dia da Privacidade (28 de janeiro)</li>
              <li>• Quiz mensal com prêmios</li>
              <li>• Cases de sucesso e boas práticas</li>
              <li>• Alertas sobre novas ameaças</li>
              <li>• Newsletter de privacidade</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 12 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-emerald-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          12
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📈 Meça Resultados e Melhore
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Avalie a eficácia dos treinamentos e implemente melhorias.
          </p>
          <div class="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded">
            <p class="text-sm text-emerald-800 dark:text-emerald-200">
              <strong>📊 Indicadores de sucesso:</strong>
            </p>
            <ul class="text-sm text-emerald-800 dark:text-emerald-200 mt-2 space-y-1 ml-4">
              <li>• % de colaboradores treinados</li>
              <li>• Taxa de aprovação nas avaliações</li>
              <li>• Índice de satisfação com o treinamento</li>
              <li>• Redução de incidentes relacionados a erros humanos</li>
              <li>• Feedback qualitativo dos participantes</li>
              <li>• Ajustes no conteúdo baseado no feedback</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-6 rounded-lg border-l-4 border-green-600 mt-6">
    <p class="text-green-900 dark:text-green-100 font-semibold">
      ✅ <strong>Resultado Esperado:</strong> Equipe capacitada e consciente sobre proteção de dados, com cultura de privacidade estabelecida e evidências documentadas de todos os treinamentos realizados.
    </p>
  </div>
</div>
  `,

  'fase-7': `
<div class="space-y-6">
  <div class="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-lg border-l-4 border-indigo-600">
    <h3 class="text-xl font-bold text-indigo-900 dark:text-indigo-100 mb-4">🔄 Passo a Passo - Monitoramento Contínuo</h3>
    <p class="text-gray-700 dark:text-gray-300">Estabeleça processos de monitoramento e melhoria contínua:</p>
  </div>

  <div class="grid gap-4">
    <!-- Passo 1 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          1
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📊 Defina Indicadores de Performance (KPIs)
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Estabeleça métricas para medir a eficácia do programa de governança.
          </p>
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              <strong>📈 KPIs sugeridos:</strong>
            </p>
            <ul class="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 ml-4">
              <li>• Tempo médio de resposta a solicitações de titulares</li>
              <li>• Número de incidentes de segurança reportados</li>
              <li>• % de colaboradores treinados em LGPD</li>
              <li>• Taxa de conformidade em auditorias</li>
              <li>• Tempo para correção de não conformidades</li>
              <li>• Número de RIPDs (avaliações de impacto) realizadas</li>
              <li>• Índice de satisfação dos titulares</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 2 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          2
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🔍 Implemente Monitoramento Contínuo
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Configure sistemas e processos para acompanhamento permanente.
          </p>
          <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
            <p class="text-sm text-purple-800 dark:text-purple-200">
              <strong>🛡️ Áreas a monitorar:</strong>
            </p>
            <ul class="text-sm text-purple-800 dark:text-purple-200 mt-2 space-y-1 ml-4">
              <li>• Logs de acesso a sistemas e dados</li>
              <li>• Solicitações de titulares (abertas/pendentes/concluídas)</li>
              <li>• Incidentes de segurança</li>
              <li>• Alterações em processos de tratamento</li>
              <li>• Novos fornecedores/operadores</li>
              <li>• Mudanças na legislação</li>
              <li>• Feedback de stakeholders</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 3 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          3
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📅 Estabeleça Rotina de Auditorias
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Programe auditorias internas e externas regulares.
          </p>
          <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <p class="text-sm text-green-800 dark:text-green-200">
              <strong>🔎 Tipos de auditoria:</strong>
            </p>
            <ul class="text-sm text-green-800 dark:text-green-200 mt-2 space-y-1 ml-4">
              <li>• <strong>Interna geral:</strong> Semestral ou anual</li>
              <li>• <strong>Por processo:</strong> Trimestral (áreas críticas)</li>
              <li>• <strong>Externa independente:</strong> Anual (opcional)</li>
              <li>• <strong>Surpresa (spot check):</strong> Aleatória</li>
              <li>• <strong>Fornecedores:</strong> Antes da contratação e anual</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 4 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-amber-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          4
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ✅ Realize Auditorias Práticas
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Execute as auditorias de forma estruturada e documentada.
          </p>
          <div class="bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
            <p class="text-sm text-amber-800 dark:text-amber-200">
              <strong>📝 Roteiro de auditoria:</strong>
            </p>
            <ul class="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1 ml-4">
              <li>1. Planejar escopo e cronograma</li>
              <li>2. Preparar checklist de verificação</li>
              <li>3. Coletar evidências (documentos, entrevistas, testes)</li>
              <li>4. Identificar não conformidades</li>
              <li>5. Classificar por criticidade</li>
              <li>6. Elaborar relatório de auditoria</li>
              <li>7. Apresentar resultados aos responsáveis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 5 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-red-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          5
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🚨 Gerencie Incidentes de Forma Estruturada
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Mantenha processo formal para identificar, reportar e resolver incidentes.
          </p>
          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded">
            <p class="text-sm text-red-800 dark:text-red-200">
              <strong>⚡ Fluxo de gestão de incidentes:</strong>
            </p>
            <ul class="text-sm text-red-800 dark:text-red-200 mt-2 space-y-1 ml-4">
              <li>1. <strong>Detecção:</strong> Identificar o incidente</li>
              <li>2. <strong>Contenção:</strong> Limitar o dano</li>
              <li>3. <strong>Análise:</strong> Investigar causa raiz</li>
              <li>4. <strong>Notificação:</strong> Informar ANPD e titulares (se necessário)</li>
              <li>5. <strong>Correção:</strong> Resolver o problema</li>
              <li>6. <strong>Documentação:</strong> Registrar tudo</li>
              <li>7. <strong>Lições aprendidas:</strong> Prevenir recorrência</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 6 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-teal-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          6
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📄 Revise Políticas Periodicamente
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Atualize a documentação conforme mudanças na empresa ou legislação.
          </p>
          <div class="bg-teal-50 dark:bg-teal-900/20 p-3 rounded">
            <p class="text-sm text-teal-800 dark:text-teal-200">
              <strong>🔄 Cronograma de revisão:</strong>
            </p>
            <ul class="text-sm text-teal-800 dark:text-teal-200 mt-2 space-y-1 ml-4">
              <li>• <strong>Anual:</strong> Todas as políticas principais</li>
              <li>• <strong>Imediata:</strong> Quando houver mudança na lei</li>
              <li>• <strong>Quando necessário:</strong> Mudanças significativas no negócio</li>
              <li>• Documentar as alterações (changelog)</li>
              <li>• Comunicar mudanças aos colaboradores</li>
              <li>• Atualizar versão e data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 7 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          7
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            👥 Avalie Fornecedores e Operadores
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Monitore continuamente a conformidade de terceiros que tratam dados.
          </p>
          <div class="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded">
            <p class="text-sm text-indigo-800 dark:text-indigo-200">
              <strong>🔍 Avaliação de fornecedores:</strong>
            </p>
            <ul class="text-sm text-indigo-800 dark:text-indigo-200 mt-2 space-y-1 ml-4">
              <li>• Due diligence antes da contratação</li>
              <li>• Verificação de certificações (ISO 27001, etc.)</li>
              <li>• Questionário de conformidade LGPD</li>
              <li>• Revisão anual do desempenho</li>
              <li>• Auditoria on-site (se aplicável)</li>
              <li>• Plano de ação para não conformidades</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 8 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-pink-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          8
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📚 Acompanhe Atualizações Legislativas
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Mantenha-se atualizado sobre mudanças na LGPD e regulamentações da ANPD.
          </p>
          <div class="bg-pink-50 dark:bg-pink-900/20 p-3 rounded">
            <p class="text-sm text-pink-800 dark:text-pink-200">
              <strong>📡 Fontes de atualização:</strong>
            </p>
            <ul class="text-sm text-pink-800 dark:text-pink-200 mt-2 space-y-1 ml-4">
              <li>• Site oficial da ANPD (www.gov.br/anpd)</li>
              <li>• Newsletters especializadas em privacidade</li>
              <li>• Associações do setor (IAPP, ANPPD)</li>
              <li>• Webinars e eventos sobre LGPD</li>
              <li>• Consultoria jurídica especializada</li>
              <li>• Grupos de discussão profissional</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 9 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-cyan-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-cyan-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          9
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📊 Gere Relatórios Periódicos
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Crie dashboards e relatórios para visualizar o status do programa.
          </p>
          <div class="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded">
            <p class="text-sm text-cyan-800 dark:text-cyan-200">
              <strong>📈 Relatórios a produzir:</strong>
            </p>
            <ul class="text-sm text-cyan-800 dark:text-cyan-200 mt-2 space-y-1 ml-4">
              <li>• <strong>Mensal:</strong> KPIs principais, incidentes, solicitações</li>
              <li>• <strong>Trimestral:</strong> Status de ações corretivas</li>
              <li>• <strong>Semestral:</strong> Resultados de auditorias</li>
              <li>• <strong>Anual:</strong> Relatório executivo completo</li>
              <li>• Dashboard em tempo real (opcional)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 10 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-violet-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-violet-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          10
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🎯 Implemente Melhoria Contínua
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Use os dados coletados para identificar e implementar melhorias.
          </p>
          <div class="bg-violet-50 dark:bg-violet-900/20 p-3 rounded">
            <p class="text-sm text-violet-800 dark:text-violet-200">
              <strong>🔄 Ciclo PDCA:</strong>
            </p>
            <ul class="text-sm text-violet-800 dark:text-violet-200 mt-2 space-y-1 ml-4">
              <li>📋 <strong>Plan (Planejar):</strong> Identificar oportunidades de melhoria</li>
              <li>🚀 <strong>Do (Executar):</strong> Implementar mudanças</li>
              <li>✅ <strong>Check (Verificar):</strong> Medir resultados</li>
              <li>🔄 <strong>Act (Agir):</strong> Padronizar ou ajustar</li>
              <li>Repita o ciclo continuamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 11 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          11
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🏆 Incorpore Melhores Práticas
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Busque continuamente aprimoramento através de benchmarking e inovação.
          </p>
          <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <p class="text-sm text-green-800 dark:text-green-200">
              <strong>✨ Fontes de melhores práticas:</strong>
            </p>
            <ul class="text-sm text-green-800 dark:text-green-200 mt-2 space-y-1 ml-4">
              <li>• Frameworks internacionais (ISO 27001, NIST)</li>
              <li>• Guias da ANPD e outras autoridades</li>
              <li>• Estudos de caso de outras empresas</li>
              <li>• Novas tecnologias de proteção</li>
              <li>• Feedback de stakeholders</li>
              <li>• Participação em fóruns e eventos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Passo 12 -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-emerald-500">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
          12
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            💬 Comunique Resultados
          </h4>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            Mantenha transparência com stakeholders sobre o programa de governança.
          </p>
          <div class="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded">
            <p class="text-sm text-emerald-800 dark:text-emerald-200">
              <strong>📢 Comunicação estratégica:</strong>
            </p>
            <ul class="text-sm text-emerald-800 dark:text-emerald-200 mt-2 space-y-1 ml-4">
              <li>• Apresentação trimestral para diretoria</li>
              <li>• Comunicados internos sobre conquistas</li>
              <li>• Relatório anual de privacidade (opcional)</li>
              <li>• Transparência com clientes sobre práticas</li>
              <li>• Celebração de marcos importantes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-6 rounded-lg border-l-4 border-green-600 mt-6">
    <p class="text-green-900 dark:text-green-100 font-semibold">
      ✅ <strong>Resultado Esperado:</strong> Programa de governança de dados operando de forma contínua, com monitoramento ativo, auditorias regulares e cultura de melhoria contínua estabelecida.
    </p>
    <p class="text-green-800 dark:text-green-200 mt-3">
      🎉 <strong>Parabéns!</strong> Ao implementar todas as 7 fases, sua organização terá um programa robusto e sustentável de conformidade com a LGPD!
    </p>
  </div>
</div>
  `
};

async function main() {
  console.log('🚀 Iniciando inserção de procedimentos...');

  // Busca a primeira empresa (ou cria uma padrão)
  let company = await prisma.company.findFirst();
  
  if (!company) {
    console.log('📝 Criando empresa padrão...');
    company = await prisma.company.create({
      data: {
        companyName: 'Empresa Padrão',
        email: 'contato@empresa.com.br'
      }
    });
    console.log('✅ Empresa criada com sucesso!');
  }

  console.log(`📌 Usando empresa: ${company.companyName} (ID: ${company.id})`);

  for (const [phase, content] of Object.entries(phasesProcedures)) {
    try {
      console.log(`📝 Processando fase: ${phase}`);
      
      // Verifica se já existe
      const existing = await prisma.phaseInfo.findUnique({
        where: {
          companyId_phase: {
            companyId: company.id,
            phase: phase
          }
        }
      });

      if (existing) {
        // Atualiza
        await prisma.phaseInfo.update({
          where: {
            companyId_phase: {
              companyId: company.id,
              phase: phase
            }
          },
          data: {
            howToProceed: content
          }
        });
        console.log(`✅ Fase ${phase} atualizada com sucesso!`);
      } else {
        // Cria novo
        await prisma.phaseInfo.create({
          data: {
            companyId: company.id,
            phase: phase,
            howToProceed: content
          }
        });
        console.log(`✅ Fase ${phase} criada com sucesso!`);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar fase ${phase}:`, error);
    }
  }

  console.log('🎉 Processo concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro geral:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
