import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const fase3Content = `<div class="space-y-6">
  <div class="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
    <h3 class="text-xl font-bold text-orange-900 dark:text-orange-100 mb-4 flex items-center gap-2">
      <span class="text-2xl">🎯</span> Objetivo da Fase 3
    </h3>
    <p class="text-orange-800 dark:text-orange-200">
      Identificar, avaliar e priorizar riscos à privacidade e proteção de dados, estabelecendo estratégias de mitigação para garantir a conformidade e proteger os direitos dos titulares.
    </p>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span class="bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</span>
      Identificação de Riscos
    </h3>
    <div class="pl-10 space-y-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">🔍 Fontes de Risco</h4>
        <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li><strong>Falhas técnicas:</strong> Vulnerabilidades em sistemas, acessos não autorizados, ataques cibernéticos</li>
          <li><strong>Erros humanos:</strong> Envio de dados para destinatários errados, perda de dispositivos, compartilhamento inadequado</li>
          <li><strong>Processos inadequados:</strong> Ausência de políticas, falta de treinamento, controles insuficientes</li>
          <li><strong>Terceiros:</strong> Fornecedores sem conformidade, vazamentos em parceiros</li>
          <li><strong>Regulatórios:</strong> Descumprimento da LGPD, outras leis setoriais</li>
        </ul>
      </div>

      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">📋 Metodologia de Identificação</h4>
        <ol class="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li><strong>Revisão do inventário de dados:</strong> Analisar cada tratamento mapeado na Fase 2</li>
          <li><strong>Workshops com áreas:</strong> Brainstorming sobre possíveis cenários de risco</li>
          <li><strong>Análise de incidentes passados:</strong> Verificar histórico de problemas</li>
          <li><strong>Benchmarking:</strong> Estudar casos de outras empresas do setor</li>
          <li><strong>Consulta a frameworks:</strong> ISO 27001, NIST, OWASP</li>
        </ol>
      </div>
    </div>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span class="bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</span>
      Avaliação e Classificação de Riscos
    </h3>
    <div class="pl-10 space-y-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">📊 Matriz de Riscos</h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-3">
          Utilize uma matriz de probabilidade vs. impacto:
        </p>
        <table class="w-full text-xs text-gray-700 dark:text-gray-300 border-collapse">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-700">
              <th class="border border-gray-300 p-2">Probabilidade / Impacto</th>
              <th class="border border-gray-300 p-2 bg-green-100 dark:bg-green-900/30">Baixo</th>
              <th class="border border-gray-300 p-2 bg-yellow-100 dark:bg-yellow-900/30">Médio</th>
              <th class="border border-gray-300 p-2 bg-red-100 dark:bg-red-900/30">Alto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border p-2 bg-red-100 dark:bg-red-900/30 font-semibold">Alta</td>
              <td class="border p-2 bg-yellow-200 dark:bg-yellow-800/50">Moderado</td>
              <td class="border p-2 bg-red-200 dark:bg-red-800/50">Alto</td>
              <td class="border p-2 bg-red-300 dark:bg-red-700/70">Crítico</td>
            </tr>
            <tr>
              <td class="border p-2 bg-yellow-100 dark:bg-yellow-900/30 font-semibold">Média</td>
              <td class="border p-2 bg-green-200 dark:bg-green-800/50">Baixo</td>
              <td class="border p-2 bg-yellow-200 dark:bg-yellow-800/50">Moderado</td>
              <td class="border p-2 bg-red-200 dark:bg-red-800/50">Alto</td>
            </tr>
            <tr>
              <td class="border p-2 bg-green-100 dark:bg-green-900/30 font-semibold">Baixa</td>
              <td class="border p-2 bg-green-200 dark:bg-green-800/50">Baixo</td>
              <td class="border p-2 bg-green-200 dark:bg-green-800/50">Baixo</td>
              <td class="border p-2 bg-yellow-200 dark:bg-yellow-800/50">Moderado</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">🎯 Critérios de Avaliação</h4>
        <div class="space-y-3">
          <div>
            <p class="font-semibold text-gray-800 dark:text-gray-200 mb-1">Probabilidade (Chance de ocorrer):</p>
            <ul class="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-4">
              <li><strong>Baixa (1):</strong> Raro, improvável nos próximos 2 anos</li>
              <li><strong>Média (2):</strong> Possível, pode ocorrer no próximo ano</li>
              <li><strong>Alta (3):</strong> Provável, pode ocorrer nos próximos 6 meses</li>
            </ul>
          </div>
          <div>
            <p class="font-semibold text-gray-800 dark:text-gray-200 mb-1">Impacto (Consequências):</p>
            <ul class="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-4">
              <li><strong>Baixo (1):</strong> Afeta poucos titulares, dados não sensíveis, impacto financeiro/reputacional mínimo</li>
              <li><strong>Médio (2):</strong> Afeta quantidade moderada de titulares, alguns dados sensíveis, impacto financeiro e reputacional relevante</li>
              <li><strong>Alto (3):</strong> Afeta muitos titulares, dados sensíveis ou críticos, grande impacto financeiro (multas), dano reputacional severo</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
        <h4 class="font-semibold text-amber-900 dark:text-amber-100 mb-2">💡 Exemplo Prático</h4>
        <p class="text-sm text-amber-800 dark:text-amber-200">
          <strong>Risco:</strong> Vazamento de dados de clientes por acesso não autorizado ao CRM<br/>
          <strong>Probabilidade:</strong> Média (2) - Sistema com autenticação básica, histórico de tentativas<br/>
          <strong>Impacto:</strong> Alto (3) - Dados de 10.000 clientes, inclui CPF e endereço<br/>
          <strong>Nível de Risco:</strong> ALTO (2 x 3 = 6) - Requer ação prioritária
        </p>
      </div>
    </div>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span class="bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</span>
      Estratégias de Tratamento de Riscos
    </h3>
    <div class="pl-10 space-y-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">🛡️ Opções de Tratamento</h4>
        <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li><strong>Mitigar:</strong> Implementar controles para reduzir probabilidade ou impacto (ex: criptografia, autenticação multifator)</li>
          <li><strong>Transferir:</strong> Compartilhar o risco (ex: seguro cibernético, cláusulas contratuais com terceiros)</li>
          <li><strong>Aceitar:</strong> Assumir o risco quando custo de mitigação supera benefício (apenas para riscos baixos)</li>
          <li><strong>Evitar:</strong> Eliminar a atividade que gera o risco (ex: parar de coletar dados desnecessários)</li>
        </ul>
      </div>

      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">📝 Plano de Ação</h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-2">
          Para cada risco identificado, documente:
        </p>
        <ol class="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
          <li><strong>Descrição do risco:</strong> O que pode acontecer?</li>
          <li><strong>Classificação:</strong> Baixo/Moderado/Alto/Crítico</li>
          <li><strong>Controles existentes:</strong> O que já está implementado?</li>
          <li><strong>Controles adicionais necessários:</strong> O que precisa ser feito?</li>
          <li><strong>Responsável:</strong> Quem vai implementar?</li>
          <li><strong>Prazo:</strong> Até quando?</li>
          <li><strong>Status:</strong> Pendente/Em andamento/Concluído</li>
        </ol>
      </div>
    </div>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span class="bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">4</span>
      Avaliação de Impacto à Proteção de Dados (DPIA/RIPD)
    </h3>
    <div class="pl-10 space-y-3">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">❓ Quando é obrigatório?</h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm mb-2">
          A LGPD exige RIPD (Relatório de Impacto) quando o tratamento puder gerar risco ou dano relevante aos titulares:
        </p>
        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
          <li>Tratamento de dados sensíveis em larga escala</li>
          <li>Decisões automatizadas (IA, algoritmos)</li>
          <li>Monitoramento sistemático de áreas públicas</li>
          <li>Tratamento de dados de menores ou vulneráveis</li>
          <li>Transferência internacional de dados</li>
          <li>Novos produtos/serviços que usem tecnologias inovadoras</li>
        </ul>
      </div>

      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">📄 Estrutura do RIPD</h4>
        <ol class="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
          <li>Descrição detalhada do processo/projeto</li>
          <li>Necessidade e proporcionalidade do tratamento</li>
          <li>Riscos identificados aos direitos e liberdades dos titulares</li>
          <li>Medidas, salvaguardas e mecanismos de mitigação</li>
          <li>Consulta ao Encarregado/DPO</li>
          <li>Conclusão sobre viabilidade do projeto</li>
        </ol>
        <p class="text-gray-700 dark:text-gray-300 text-sm mt-2">
          <strong>✅ Ação:</strong> Para processos de alto risco identificados na Fase 3, realize um RIPD completo antes de prosseguir. Utilize o módulo RIPD deste sistema para documentar.
        </p>
      </div>
    </div>
  </div>

  <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
    <h3 class="text-lg font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
      <span class="text-2xl">✅</span> Checklist de Finalização da Fase 3
    </h3>
    <ul class="space-y-2 text-green-800 dark:text-green-200">
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Todos os riscos identificados e documentados
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Matriz de riscos aplicada e riscos classificados
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Estratégias de tratamento definidas para cada risco
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Responsáveis e prazos atribuídos
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        RIPD realizado para processos de alto risco
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 border-2 border-green-600 rounded"></span>
        Registro de riscos aprovado pela Alta Direção
      </li>
    </ul>
  </div>

  <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
    <p class="text-sm text-orange-800 dark:text-orange-200">
      <strong>💡 Dica Final:</strong> A gestão de riscos não é estática. Revise e atualize o registro de riscos continuamente, especialmente quando houver: novos processos, alterações em sistemas, mudanças regulatórias ou incidentes de segurança.
    </p>
  </div>
</div>`;

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "clubedoservidor@protonmail.com" }
  });
  
  if (!user || !user.companyId) {
    console.log("❌ Usuário/empresa não encontrado!");
    return;
  }
  
  const companyId = user.companyId;
  
  await prisma.phaseInfo.upsert({
    where: {
      companyId_phase: {
        companyId: companyId,
        phase: "fase-3"
      }
    },
    update: {
      howToProceed: fase3Content
    },
    create: {
      companyId: companyId,
      phase: "fase-3",
      howToProceed: fase3Content
    }
  });
  
  console.log("✅ Fase 3 inserida/atualizada");
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
