
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Hash da senha para o usuário admin (lida de env var; fallback só pra dev)
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'changeme-dev-only'
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn('⚠️  SEED_ADMIN_PASSWORD não definida; usando senha padrão de dev. NÃO use em produção.')
  }
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  // Criar empresa de teste
  const company = await prisma.company.upsert({
    where: { cnpj: '12.345.678/0001-90' },
    update: {},
    create: {
      companyName: 'TechCorp Soluções Ltda',
      tradeName: 'TechCorp',
      cnpj: '12.345.678/0001-90',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      phone: '(11) 99999-9999',
      email: 'contato@techcorp.com.br',
      website: 'https://www.techcorp.com.br',
      legalRepresentative: 'João Silva Santos',
      dpoName: 'Maria Fernanda Oliveira',
      dpoEmail: 'dpo@techcorp.com.br',
      dpoPhone: '(11) 88888-8888',
      businessSector: 'Tecnologia da Informação',
      employeesCount: 150,
    },
  })

  // Criar usuário admin
  const user = await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com' },
    update: { isActive: true, role: 'admin', password: hashedPassword },
    create: {
      name: 'Admin',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
      password: hashedPassword,
      companyId: company.id,
      isActive: true,
      role: 'admin',
    },
  })

  // Criar inventário de dados de exemplo
  await prisma.dataInventory.createMany({
    data: [
      {
        companyId: company.id,
        serviceName: 'Sistema de CRM',
        dataCategory: 'Dados Pessoais',
        personalData: 'Nome, e-mail, telefone, CPF',
        legalBasis: 'Execução de contrato',
        purpose: 'Gestão de relacionamento com clientes',
        dataSubjects: 'Clientes atuais e potenciais',
        retention: '5 anos após término do contrato',
        storage: 'Servidor AWS (São Paulo)',
        sharing: 'Não compartilhado',
        security: 'Criptografia AES-256, controle de acesso',
      },
      {
        companyId: company.id,
        serviceName: 'Sistema de RH',
        dataCategory: 'Dados Pessoais Sensíveis',
        personalData: 'Nome, CPF, RG, dados de saúde, endereço',
        legalBasis: 'Obrigação legal',
        purpose: 'Gestão de recursos humanos',
        dataSubjects: 'Colaboradores',
        retention: '30 anos após desligamento',
        storage: 'Servidor local',
        sharing: 'Compartilhado com contador',
        security: 'Backup diário, firewall, controle de acesso biométrico',
      },
    ],
  })

  // Criar análise de riscos de exemplo
  await prisma.riskAssessment.createMany({
    data: [
      {
        companyId: company.id,
        processName: 'Coleta de dados no site',
        riskDescription: 'Vazamento de dados pessoais através de vulnerabilidade web',
        likelihood: 'Médio',
        impact: 'Alto',
        riskLevel: 'Alto',
        controls: 'HTTPS, validação de entrada, WAF',
        recommendations: 'Implementar monitoramento 24/7 e testes de penetração trimestrais',
        responsibleArea: 'TI',
        status: 'Em andamento',
      },
      {
        companyId: company.id,
        processName: 'Backup de dados',
        riskDescription: 'Perda de dados por falha no sistema de backup',
        likelihood: 'Baixo',
        impact: 'Alto',
        riskLevel: 'Médio',
        controls: 'Backup automático diário, armazenamento em nuvem',
        recommendations: 'Implementar teste de restore mensal',
        responsibleArea: 'TI',
        status: 'Pendente',
      },
    ],
  })

  // Criar GAP Analysis de exemplo
  await prisma.gapAnalysis.createMany({
    data: [
      {
        companyId: company.id,
        requirement: 'Art. 9º - Consentimento do titular',
        currentStatus: 'Parcialmente Implementado',
        evidence: 'Formulário de consentimento existe mas não está claro',
        gap: 'Consentimento não específico para cada finalidade',
        recommendation: 'Revisar formulários para consentimento granular',
        priority: 'Alta',
        responsibleArea: 'Jurídico',
      },
      {
        companyId: company.id,
        requirement: 'Art. 48 - Comunicação de incidentes',
        currentStatus: 'Não Implementado',
        evidence: 'Não há processo formal',
        gap: 'Falta procedimento para comunicação à ANPD',
        recommendation: 'Criar plano de resposta a incidentes',
        priority: 'Alta',
        responsibleArea: 'Segurança',
      },
    ],
  })

  // Criar plano de ação de exemplo
  await prisma.actionPlan.createMany({
    data: [
      {
        companyId: company.id,
        action: 'Implementar Privacy by Design',
        description: 'Incorporar princípios de privacidade desde a concepção em todos os novos projetos',
        objective: 'Garantir conformidade com LGPD em novos desenvolvimentos',
        responsibleArea: 'Desenvolvimento',
        responsible: 'Pedro Santos',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-30'),
        priority: 'Alta',
        status: 'Em andamento',
        progress: 30,
        resources: 'Treinamento equipe, consultoria especializada',
        budget: 25000.00,
      },
      {
        companyId: company.id,
        action: 'Revisar contratos com terceiros',
        description: 'Adequar cláusulas contratuais para conformidade com LGPD',
        objective: 'Garantir que operadores cumpram obrigações de proteção de dados',
        responsibleArea: 'Jurídico',
        responsible: 'Ana Costa',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-05-31'),
        priority: 'Média',
        status: 'Não Iniciado',
        progress: 0,
        resources: 'Revisão jurídica, negociação com fornecedores',
        budget: 15000.00,
      },
    ],
  })

  console.log('✅ Seed concluído com sucesso!')
  console.log(`👤 Usuário de teste criado: ${user.email}`)
  console.log(`🏢 Empresa de teste criada: ${company.companyName}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
