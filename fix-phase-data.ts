import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // Buscar o usuário e sua empresa
  const user = await prisma.user.findFirst({
    where: {
      email: "clubedoservidor@protonmail.com"
    },
    include: {
      company: true
    }
  });
  
  if (!user) {
    console.log("❌ Usuário não encontrado!");
    return;
  }
  
  if (!user.companyId) {
    console.log("❌ Usuário não tem empresa vinculada!");
    return;
  }
  
  console.log(`✅ Usuário encontrado: ${user.email}`);
  console.log(`✅ Company ID: ${user.companyId}`);
  console.log(`✅ Empresa: ${user.company?.companyName || 'Sem nome'}`);
  
  // Deletar todos os dados antigos de PhaseInfo
  await prisma.phaseInfo.deleteMany({});
  console.log('\n🗑️  Dados antigos removidos');
  
  // Criar dados atualizados com o companyId correto
  const correctCompanyId = user.companyId;
  
  const phasesData = [
    {
      phase: "preliminar",
      howToProceed: `<div class="space-y-6">
  <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
    <h3 class="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
      <span class="text-2xl">🎯</span> Objetivo da Fase Preliminar
    </h3>
    <p class="text-blue-800 dark:text-blue-200">
      Estabelecer o compromisso organizacional com a privacidade e proteção de dados, preparando a empresa para implementar um programa robusto de governança em conformidade com a LGPD.
    </p>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</span>
      Sensibilização da Alta Direção
    </h3>
    <div class="pl-10 space-y-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">📊 Apresentação Executiva</h4>
        <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>Prepare uma apresentação sobre os riscos de não conformidade com a LGPD</li>
          <li>Demonstre impactos financeiros: multas de até 2% do faturamento (limite de R$ 50 milhões por infração)</li>
          <li>Apresente casos reais de sanções aplicadas pela ANPD</li>
          <li>Mostre os benefícios competitivos da conformidade (confiança do cliente, diferencial de mercado)</li>
        </ul>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">💼 Reunião Estratégica</h4>
        <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>Agende reunião com CEO, diretores e principais stakeholders</li>
          <li>Duração recomendada: 1h30 a 2h</li>
          <li>Formalize a importância da privacidade como valor corporativo</li>
          <li>Documente as decisões e compromissos assumidos</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</span>
      Estabelecimento de Política de Privacidade e Proteção de Dados
    </h3>
    <div class="pl-10 space-y-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">📋 Estrutura da Política</h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-3">
          A política deve conter os seguintes elementos obrigatórios:
        </p>
        <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li><strong>Princípios Fundamentais:</strong> Finalidade, adequação, necessidade, transparência, segurança, etc.</li>
          <li><strong>Papéis e Responsabilidades:</strong> Controlador, Operador, Encarregado (DPO)</li>
          <li><strong>Direitos dos Titulares:</strong> Acesso, correção, anonimização, portabilidade, eliminação</li>
          <li><strong>Base Legal:</strong> Consentimento, execução contratual, cumprimento de obrigação legal, etc.</li>
          <li><strong>Medidas de Segurança:</strong> Técnicas, administrativas e físicas</li>
          <li><strong>Gestão de Incidentes:</strong> Procedimentos de notificação e resposta</li>
          <li><strong>Transferência Internacional:</strong> Se aplicável, condições e garantias</li>
          <li><strong>Canal de Comunicação:</strong> Contato do Encarregado/DPO</li>
        </ul>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">✍️ Elaboração e Aprovação</h4>
        <ol class="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>Formar grupo de trabalho: jurídico, TI, compliance, RH, áreas de negócio</li>
          <li>Revisar políticas e processos existentes</li>
          <li>Redigir a política alinhada à realidade e maturidade da organização</li>
          <li>Submeter à aprovação da Alta Direção</li>
          <li>Publicar e divulgar internamente (intranet, e-mail, treinamentos)</li>
          <li>Estabelecer periodicidade de revisão (recomendado: anualmente ou quando houver mudanças)</li>
        </ol>
      </div>
      
      <div class="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
        <p class="text-sm text-amber-800 dark:text-amber-200">
          <strong>⚠️ Importante:</strong> A política deve ser acessível a todos os colaboradores e estar disponível de forma clara e objetiva. Considere criar versões resumidas para públicos diferentes (executivos, operacional, fornecedores).
        </p>
      </div>
    </div>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</span>
      Alocação de Recursos
    </h3>
    <div class="pl-10 space-y-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">💰 Orçamento</h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-3">
          Estimativa de investimento para implementação do programa:
        </p>
        <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li><strong>Consultoria especializada:</strong> R$ 30.000 a R$ 150.000 (dependendo do porte)</li>
          <li><strong>Ferramentas tecnológicas:</strong> R$ 10.000 a R$ 100.000/ano (gestão de consentimento, mapeamento, etc.)</li>
          <li><strong>Treinamentos:</strong> R$ 5.000 a R$ 30.000</li>
          <li><strong>Adequações técnicas:</strong> R$ 20.000 a R$ 200.000 (infraestrutura, segurança, processos)</li>
          <li><strong>Recursos humanos:</strong> Contratação ou designação de DPO e equipe de privacidade</li>
        </ul>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">👥 Pessoas</h4>
        <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>Definir quem será responsável pelo programa (pode ser interno ou terceirizado)</li>
          <li>Considerar contratação ou capacitação de profissionais especializados</li>
          <li>Estabelecer dedicação de tempo de cada área envolvida</li>
          <li>Nomear representantes de privacidade em cada departamento (Privacy Champions)</li>
        </ul>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">⏱️ Cronograma</h4>
        <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li><strong>Fase Preliminar:</strong> 1-2 meses</li>
          <li><strong>Fases 1-3:</strong> 3-6 meses (mapeamento e diagnóstico)</li>
          <li><strong>Fases 4-5:</strong> 4-8 meses (adequação e implementação)</li>
          <li><strong>Fases 6-7:</strong> Contínuo (monitoramento e melhoria)</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
    <h3 class="text-lg font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
      <span class="text-2xl">✅</span> Checklist de Finalização da Fase
    </h3>
    <ul class="space-y-2 text-green-800 dark:text-green-200">
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Reunião com Alta Direção realizada e documentada
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Política de Privacidade e Proteção de Dados aprovada
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Orçamento aprovado e recursos alocados
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Cronograma do programa estabelecido
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Comunicação inicial sobre o programa realizada
      </li>
    </ul>
  </div>

  <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
    <p class="text-sm text-blue-800 dark:text-blue-200">
      <strong>💡 Dica Final:</strong> A fase preliminar é fundamental para o sucesso de todo o programa. Não apresse essa etapa. Um compromisso sólido da liderança e uma política bem estruturada são a base de uma governança efetiva de privacidade.
    </p>
  </div>
</div>`
    },
    {
      phase: "fase-1",
      howToProceed: `<div class="space-y-6">
  <div class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
    <h3 class="text-xl font-bold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2">
      <span class="text-2xl">🎯</span> Objetivo da Fase 1
    </h3>
    <p class="text-purple-800 dark:text-purple-200">
      Estruturar uma equipe multidisciplinar qualificada e definir claramente os papéis e responsabilidades para garantir a governança efetiva de privacidade e proteção de dados na organização.
    </p>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span class="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</span>
      Definição de Papéis Estratégicos
    </h3>
    <div class="pl-10 space-y-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">👔 Controlador</h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-2">
          <strong>Definição:</strong> Pessoa natural ou jurídica a quem competem as decisões referentes ao tratamento de dados pessoais.
        </p>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-2"><strong>Responsabilidades:</strong></p>
        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
          <li>Determinar finalidades e meios do tratamento de dados</li>
          <li>Garantir conformidade com a LGPD e regulamentações</li>
          <li>Implementar medidas de segurança técnicas e organizacionais</li>
          <li>Responder perante a ANPD em caso de fiscalização</li>
          <li>Designar e apoiar o Encarregado (DPO)</li>
        </ul>
        <p class="text-gray-700 dark:text-gray-300 text-sm mt-2">
          <strong>✅ Ação:</strong> Formalize em documento interno quem é o Controlador (geralmente a própria empresa na figura de seu representante legal).
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">⚙️ Operador</h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-2">
          <strong>Definição:</strong> Pessoa natural ou jurídica que realiza o tratamento de dados em nome do Controlador.
        </p>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-2"><strong>Responsabilidades:</strong></p>
        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
          <li>Seguir instruções do Controlador</li>
          <li>Manter segurança e confidencialidade dos dados</li>
          <li>Auxiliar o Controlador na resposta a solicitações de titulares</li>
          <li>Notificar incidentes de segurança imediatamente</li>
          <li>Manter registros de operações de tratamento</li>
        </ul>
        <p class="text-gray-700 dark:text-gray-300 text-sm mt-2">
          <strong>✅ Ação:</strong> Identifique quem são os Operadores (fornecedores de TI, plataformas de CRM, parceiros que tratam dados em nome da empresa). Formalize contratos com cláusulas específicas de proteção de dados.
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">🛡️ Encarregado / DPO (Data Protection Officer)</h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-2">
          <strong>Definição:</strong> Profissional indicado para atuar como canal de comunicação entre o Controlador, titulares e a ANPD.
        </p>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-2"><strong>Requisitos:</strong></p>
        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
          <li>Conhecimento jurídico e técnico em proteção de dados</li>
          <li>Capacidade de comunicação clara e objetiva</li>
          <li>Independência funcional (não pode responder hierarquicamente às áreas operacionais)</li>
          <li>Disponibilidade para treinamentos e atualização contínua</li>
        </ul>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-2"><strong>Responsabilidades:</strong></p>
        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
          <li>Receber e responder solicitações de titulares</li>
          <li>Orientar funcionários e contratados sobre práticas de proteção de dados</li>
          <li>Atuar como ponto focal com a ANPD</li>
          <li>Executar auditorias internas periódicas</li>
          <li>Avaliar e recomendar melhorias no programa de privacidade</li>
        </ul>
        <p class="text-gray-700 dark:text-gray-300 text-sm mt-2">
          <strong>✅ Ação:</strong> Nomeie formalmente o DPO por meio de documento corporativo (pode ser interno ou terceirizado). Publique o nome e contato do DPO nos canais oficiais da empresa (site, política de privacidade).
        </p>
      </div>
    </div>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span class="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</span>
      Formação do Comitê de Privacidade (Recomendado para empresas médias/grandes)
    </h3>
    <div class="pl-10 space-y-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">👥 Composição da Equipe</h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-3">
          Monte uma equipe multidisciplinar com representantes das seguintes áreas:
        </p>
        <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li><strong>Jurídico/Compliance:</strong> Interpretação da lei, contratos e políticas</li>
          <li><strong>TI/Segurança da Informação:</strong> Implementação técnica, controles de acesso, criptografia</li>
          <li><strong>RH:</strong> Tratamento de dados de colaboradores, treinamentos</li>
          <li><strong>Marketing:</strong> Gestão de consentimento, comunicação com clientes</li>
          <li><strong>Vendas/Comercial:</strong> Dados de prospects e clientes, CRM</li>
          <li><strong>Operações:</strong> Processos internos, fornecedores</li>
          <li><strong>Auditoria Interna:</strong> Monitoramento de conformidade</li>
        </ul>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">📋 Atribuições do Comitê</h4>
        <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>Reuniões periódicas (mensais ou trimestrais) para revisar ações do programa</li>
          <li>Análise de riscos e aprovação de ações mitigatórias</li>
          <li>Validação de novos processos que envolvam tratamento de dados</li>
          <li>Decisão sobre investimentos em tecnologias de privacidade</li>
          <li>Avaliação de incidentes e determinação de respostas apropriadas</li>
        </ul>
      </div>
      
      <div class="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
        <p class="text-sm text-amber-800 dark:text-amber-200">
          <strong>⚠️ Para pequenas empresas:</strong> Se não for viável formar um comitê, designe ao menos 2-3 pessoas chave (ex: proprietário, responsável TI e uma pessoa de operações) para atuar de forma colaborativa.
        </p>
      </div>
    </div>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span class="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</span>
      Privacy Champions (Embaixadores de Privacidade)
    </h3>
    <div class="pl-10 space-y-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">🌟 O que são?</h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm">
          São colaboradores designados em cada departamento para atuar como referência em privacidade, disseminando boas práticas e conectando suas áreas ao DPO e ao Comitê de Privacidade.
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">💪 Benefícios</h4>
        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
          <li>Capilaridade: levar a cultura de privacidade a todos os níveis</li>
          <li>Identificação precoce de riscos e não conformidades</li>
          <li>Facilitação na implementação de mudanças operacionais</li>
          <li>Criação de rede de apoio ao DPO</li>
        </ul>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">✅ Ação</h4>
        <ol class="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
          <li>Selecionar 1 representante por departamento (perfil proativo e comunicativo)</li>
          <li>Oferecer treinamento específico em privacidade</li>
          <li>Definir atribuições claras (ex: revisar processos locais, alertar sobre novos riscos)</li>
          <li>Estabelecer canal de comunicação direto com o DPO</li>
          <li>Reconhecer publicamente o papel desses colaboradores</li>
        </ol>
      </div>
    </div>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span class="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">4</span>
      Documentação e Formalização
    </h3>
    <div class="pl-10 space-y-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">📄 Documentos Essenciais</h4>
        <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li><strong>Termo de Nomeação do DPO:</strong> Documento formal assinado pela Alta Direção</li>
          <li><strong>Matriz RACI de Privacidade:</strong> Quem é Responsável, Accountable, Consultado, Informado em cada atividade</li>
          <li><strong>Organograma do Programa:</strong> Representação visual da estrutura de governança</li>
          <li><strong>Termo de Confidencialidade:</strong> Para todos os membros da equipe</li>
          <li><strong>Job Description do DPO:</strong> Especificação de responsabilidades e autoridades</li>
        </ul>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">✍️ Passo a Passo</h4>
        <ol class="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>Redigir os documentos baseados em templates do mercado ou consultoria</li>
          <li>Revisar com o jurídico interno</li>
          <li>Submeter à aprovação da Alta Direção</li>
          <li>Coletar assinaturas e arquivar de forma segura</li>
          <li>Divulgar internamente (comunicado, intranet)</li>
          <li>Incluir no portal de privacidade (quando aplicável)</li>
        </ol>
      </div>
    </div>
  </div>

  <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
    <h3 class="text-lg font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
      <span class="text-2xl">✅</span> Checklist de Finalização da Fase 1
    </h3>
    <ul class="space-y-2 text-green-800 dark:text-green-200">
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Controlador formalmente identificado e documentado
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Operadores mapeados e contratos revisados
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        DPO nomeado e divulgado (nome e contato publicados)
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Comitê de Privacidade formado (ou responsáveis definidos)
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Privacy Champions designados em cada área
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Documentação completa e arquivada
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Comunicação interna realizada
      </li>
    </ul>
  </div>

  <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
    <p class="text-sm text-purple-800 dark:text-purple-200">
      <strong>💡 Dica Final:</strong> A equipe formada nesta fase será o motor do programa de governança. Invista tempo na seleção e treinamento dessas pessoas. Uma equipe engajada e bem preparada é o diferencial entre um programa burocrático e um programa efetivo.
    </p>
  </div>
</div>`
    }
  ];
  
  // Inserir dados para fase preliminar e fase 1 (exemplo)
  for (const phaseData of phasesData) {
    await prisma.phaseInfo.create({
      data: {
        companyId: correctCompanyId,
        phase: phaseData.phase,
        howToProceed: phaseData.howToProceed
      }
    });
    console.log(`✅ Criada fase: ${phaseData.phase}`);
  }
  
  console.log('\n🎉 Dados atualizados com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
