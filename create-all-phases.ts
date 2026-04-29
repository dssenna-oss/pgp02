import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "clubedoservidor@protonmail.com" }
  });
  
  if (!user || !user.companyId) {
    console.log("❌ Usuário ou empresa não encontrado!");
    return;
  }
  
  const companyId = user.companyId;
  console.log(`✅ Company ID: ${companyId}`);
  
  // Deletar dados antigos
  await prisma.phaseInfo.deleteMany({});
  console.log('🗑️  Dados antigos removidos\n');
  
  const phases = [
    {
      phase: "preliminar",
      content: `Vou inserir aqui o conteúdo da fase preliminar`
    },
    {
      phase: "fase-1",
      content: `Vou inserir aqui o conteúdo da fase 1`
    },
    {
      phase: "fase-2",
      content: `<div class="space-y-6">
  <div class="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-cyan-200 dark:border-cyan-800">
    <h3 class="text-xl font-bold text-cyan-900 dark:text-cyan-100 mb-4 flex items-center gap-2">
      <span class="text-2xl">🎯</span> Objetivo da Fase 2
    </h3>
    <p class="text-cyan-800 dark:text-cyan-200">
      Realizar um mapeamento completo e preciso de todos os tratamentos de dados pessoais realizados pela organização, criando um inventário estruturado que servirá de base para as demais fases do programa de governança.
    </p>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span class="bg-cyan-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</span>
      Preparação e Planejamento do Mapeamento
    </h3>
    <div class="pl-10 space-y-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">📋 Definição do Escopo</h4>
        <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li><strong>Áreas a serem mapeadas:</strong> Identificar todos os departamentos que coletam, armazenam ou processam dados pessoais (RH, comercial, marketing, TI, financeiro, atendimento, operações)</li>
          <li><strong>Sistemas e ferramentas:</strong> Listar todos os softwares, plataformas, bancos de dados, planilhas, CRMs, ERPs utilizados</li>
          <li><strong>Processos de negócio:</strong> Mapear fluxos operacionais que envolvem dados pessoais (recrutamento, vendas, atendimento ao cliente, etc.)</li>
          <li><strong>Terceiros e fornecedores:</strong> Identificar parceiros externos que tratam dados em nome da empresa</li>
        </ul>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">🛠️ Ferramentas de Apoio</h4>
        <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li><strong>Questionários padronizados:</strong> Criar formulários estruturados para cada área responder (Google Forms, Microsoft Forms, Typeform)</li>
          <li><strong>Planilhas de inventário:</strong> Templates Excel/Google Sheets para consolidar informações</li>
          <li><strong>Softwares especializados:</strong> Plataformas de gestão de privacidade (OneTrust, TrustArc, DataPrivacy Brasil, etc.) - opcional mas recomendado para empresas maiores</li>
          <li><strong>Diagramas de fluxo:</strong> Ferramentas como Lucidchart, Draw.io, Miro para visualizar processos</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span class="bg-cyan-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</span>
      Coleta de Informações
    </h3>
    <div class="pl-10 space-y-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">🎤 Entrevistas com Áreas</h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-2">
          Realizar entrevistas estruturadas com responsáveis de cada departamento:
        </p>
        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
          <li>Quais dados pessoais são coletados? (nome, CPF, e-mail, telefone, endereço, etc.)</li>
          <li>De onde vêm esses dados? (formulários web, aplicativos, e-mails, telefone)</li>
          <li>Para que finalidade são usados?</li>
          <li>Quem tem acesso a esses dados?</li>
          <li>Onde são armazenados? (servidor local, nuvem, planilhas)</li>
          <li>Por quanto tempo são mantidos?</li>
          <li>São compartilhados com terceiros? Quem?</li>
          <li>Há transferência internacional de dados?</li>
        </ul>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">📝 Questionário Modelo</h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-2">Exemplo de perguntas essenciais:</p>
        <ol class="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li><strong>Nome do Processo/Atividade:</strong> (ex: Recrutamento e seleção)</li>
          <li><strong>Categorias de dados tratados:</strong> (marque todas)
            <ul class="list-disc list-inside ml-5 mt-1">
              <li>☐ Dados de identificação (nome, CPF, RG)</li>
              <li>☐ Dados de contato (e-mail, telefone, endereço)</li>
              <li>☐ Dados financeiros (conta bancária, renda)</li>
              <li>☐ Dados sensíveis (saúde, biometria, origem racial, religião)</li>
              <li>☐ Dados de menores de idade</li>
              <li>☐ Outros: _______________</li>
            </ul>
          </li>
          <li><strong>Finalidade específica:</strong> Descrever de forma clara e objetiva</li>
          <li><strong>Base legal:</strong>
            <ul class="list-disc list-inside ml-5 mt-1">
              <li>☐ Consentimento</li>
              <li>☐ Cumprimento de obrigação legal</li>
              <li>☐ Execução de contrato</li>
              <li>☐ Legítimo interesse</li>
              <li>☐ Outras hipóteses legais</li>
            </ul>
          </li>
          <li><strong>Titulares dos dados:</strong> (clientes, colaboradores, fornecedores, etc.)</li>
          <li><strong>Forma de coleta:</strong> (formulário online, presencial, telefone, etc.)</li>
          <li><strong>Sistemas/ferramentas utilizados:</strong> Listar todos</li>
          <li><strong>Tempo de retenção:</strong> Prazo definido e justificativa</li>
          <li><strong>Medidas de segurança aplicadas:</strong> (criptografia, controle de acesso, backups, etc.)</li>
          <li><strong>Compartilhamento:</strong> Com quem? Para que? Base contratual?</li>
        </ol>
      </div>
    </div>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span class="bg-cyan-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</span>
      Estruturação do Inventário de Dados
    </h3>
    <div class="pl-10 space-y-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">📊 Estrutura do Inventário</h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-2">Campos essenciais a documentar:</p>
        <table class="w-full text-sm text-gray-700 dark:text-gray-300">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-700">
              <th class="border border-gray-300 dark:border-gray-600 p-2 text-left">Campo</th>
              <th class="border border-gray-300 dark:border-gray-600 p-2 text-left">Descrição/Exemplo</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="border p-2">ID/Código</td><td class="border p-2">INV-001</td></tr>
            <tr><td class="border p-2">Área responsável</td><td class="border p-2">RH</td></tr>
            <tr><td class="border p-2">Processo/Atividade</td><td class="border p-2">Folha de pagamento</td></tr>
            <tr><td class="border p-2">Categoria de dados</td><td class="border p-2">Dados financeiros, identificação</td></tr>
            <tr><td class="border p-2">Dados específicos</td><td class="border p-2">Nome, CPF, conta bancária, salário</td></tr>
            <tr><td class="border p-2">Finalidade</td><td class="border p-2">Pagamento de salários</td></tr>
            <tr><td class="border p-2">Base legal</td><td class="border p-2">Execução de contrato + obrigação legal</td></tr>
            <tr><td class="border p-2">Titulares</td><td class="border p-2">Colaboradores</td></tr>
            <tr><td class="border p-2">Origem/Coleta</td><td class="border p-2">Documentos admissionais</td></tr>
            <tr><td class="border p-2">Armazenamento</td><td class="border p-2">Sistema de RH (Totvs)</td></tr>
            <tr><td class="border p-2">Retenção</td><td class="border p-2">5 anos após rescisão</td></tr>
            <tr><td class="border p-2">Compartilhamento</td><td class="border p-2">Banco XYZ (pagamento), Contador</td></tr>
            <tr><td class="border p-2">Transferência internacional</td><td class="border p-2">Não</td></tr>
            <tr><td class="border p-2">Segurança</td><td class="border p-2">Acesso restrito, criptografia, backup diário</td></tr>
          </tbody>
        </table>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">🗂️ Organização por Categorias</h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-2">
          Organize o inventário por:
        </p>
        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
          <li><strong>Departamento:</strong> RH, Marketing, Vendas, TI, etc.</li>
          <li><strong>Tipo de titular:</strong> Clientes, colaboradores, fornecedores, visitantes</li>
          <li><strong>Categoria de dados:</strong> Comuns, sensíveis, menores</li>
          <li><strong>Finalidade:</strong> Operacional, marketing, compliance, etc.</li>
          <li><strong>Risco:</strong> Alto, médio, baixo (baseado em sensibilidade e volume)</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span class="bg-cyan-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">4</span>
      Mapeamento de Fluxos de Dados
    </h3>
    <div class="pl-10 space-y-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">🔄 Criação de Data Flow Diagrams</h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-2">
          Para processos críticos, crie diagramas visuais mostrando:
        </p>
        <ol class="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
          <li><strong>Ponto de coleta:</strong> Onde o dado entra no sistema (formulário web, app, etc.)</li>
          <li><strong>Processamento:</strong> Quais sistemas/pessoas manipulam o dado</li>
          <li><strong>Armazenamento:</strong> Onde fica guardado (banco de dados, servidor, nuvem)</li>
          <li><strong>Compartilhamento:</strong> Para onde é enviado (terceiros, parceiros)</li>
          <li><strong>Retenção/Descarte:</strong> Quando e como é eliminado</li>
        </ol>
      </div>
      
      <div class="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
        <p class="text-sm text-amber-800 dark:text-amber-200">
          <strong>💡 Exemplo prático - Fluxo de Cadastro de Cliente:</strong><br/>
          Cliente preenche formulário no site → Dados vão para CRM (Salesforce) → Equipe comercial acessa → Após venda, dados migram para ERP (SAP) → Financeiro acessa → Compartilhado com gateway de pagamento (PagSeguro) → Dados retidos por 5 anos → Após período, anonimizados ou deletados
        </p>
      </div>
    </div>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span class="bg-cyan-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">5</span>
      Revisão e Validação
    </h3>
    <div class="pl-10 space-y-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">🔍 Validação Cruzada</h4>
        <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>Revisar inventário com cada área para confirmar precisão</li>
          <li>Cruzar informações entre TI e áreas de negócio</li>
          <li>Verificar contratos com fornecedores para conferir compartilhamentos</li>
          <li>Auditar sistemas e bancos de dados para confirmar o que está documentado</li>
        </ul>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">✅ Aprovação Final</h4>
        <ol class="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
          <li>Apresentar inventário consolidado ao Comitê de Privacidade</li>
          <li>Ajustar conforme feedback recebido</li>
          <li>Obter aprovação formal da Alta Direção</li>
          <li>Versionar o documento (v1.0) com data</li>
        </ol>
      </div>
    </div>
  </div>

  <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
    <h3 class="text-lg font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
      <span class="text-2xl">✅</span> Checklist de Finalização da Fase 2
    </h3>
    <ul class="space-y-2 text-green-800 dark:text-green-200">
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Todas as áreas mapeadas e documentadas
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Inventário completo com todos os campos obrigatórios preenchidos
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Fluxos de dados dos processos críticos diagramados
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Terceiros e fornecedores identificados
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Bases legais definidas para cada tratamento
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Revisão e validação concluída
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Inventário aprovado e versionado
      </li>
    </ul>
  </div>

  <div class="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800">
    <p class="text-sm text-cyan-800 dark:text-cyan-200">
      <strong>💡 Dica Final:</strong> O mapeamento de dados não é uma atividade única. Estabeleça um processo de atualização contínua do inventário sempre que novos processos, sistemas ou parcerias forem implementados. Recomenda-se revisão completa pelo menos 1 vez ao ano.
    </p>
  </div>
</div>`
    }
  ];
  
  // Criar fases no banco
  for (const phaseData of phases) {
    await prisma.phaseInfo.create({
      data: {
        companyId: companyId,
        phase: phaseData.phase,
        howToProceed: phaseData.content
      }
    });
    console.log(`✅ ${phaseData.phase} criada`);
  }
  
  console.log('\n🎉 Fases criadas com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
