// Types for PGP System

export interface User {
  id: string;
  name?: string | null;
  email: string;
  companyId?: string | null;
  company?: Company | null;
}

export interface Company {
  id: string;
  companyName: string;
  tradeName?: string | null;
  cnpj?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  legalRepresentative?: string | null;
  dpoName?: string | null;
  dpoEmail?: string | null;
  dpoPhone?: string | null;
  businessSector?: string | null;
  employeesCount?: number | null;
}

export interface DataInventory {
  id: string;
  companyId: string;
  serviceName: string;
  dataCategory: string;
  personalData: string;
  legalBasis: string;
  purpose: string;
  dataSubjects: string;
  retention: string;
  storage: string;
  sharing?: string | null;
  security: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskAssessment {
  id: string;
  companyId: string;
  processName: string;
  riskDescription: string;
  likelihood: string;
  impact: string;
  riskLevel: string;
  controls: string;
  recommendations: string;
  responsibleArea: string;
  deadline?: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// GAP Analysis (Checkpoint 9): catálogo fixo de 119 controles em
// `lib/gap-catalog.ts`. Resposta por linha do template oficial — vide
// modelos `GapAnswer` e `GapSnapshot` em `prisma/schema.prisma`.

export interface ActionPlan {
  id: string;
  companyId: string;
  action: string;
  description: string;
  objective: string;
  responsibleArea: string;
  responsible: string;
  startDate: Date;
  endDate: Date;
  priority: string;
  status: string;
  progress: number;
  resources?: string | null;
  budget?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  companyId: string;
  title: string;
  type: string;
  content: string;
  version: string;
  status: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Incident {
  id: string;
  companyId: string;
  title: string;
  description: string;
  incidentType: string;
  severity: string;
  affectedData: string;
  affectedSubjects?: number | null;
  cause?: string | null;
  detectionDate: Date;
  reportDate: Date;
  containmentActions?: string | null;
  correctiveActions?: string | null;
  preventiveActions?: string | null;
  status: string;
  reportedToAnpd: boolean;
  anpdReportDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Form types
export type CompanyFormData = Omit<Company, 'id'>;
export type DataInventoryFormData = Omit<DataInventory, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>;
export type RiskAssessmentFormData = Omit<RiskAssessment, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>;
export type ActionPlanFormData = Omit<ActionPlan, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>;
export type DocumentFormData = Omit<Document, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>;
export type IncidentFormData = Omit<Incident, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>;

// Constants
export const DATA_CATEGORIES = [
  'Dados Pessoais',
  'Dados Pessoais Sensíveis',
  'Dados Anonimizados',
  'Dados Públicos'
] as const;

export const LEGAL_BASIS = [
  'Consentimento',
  'Execução de contrato',
  'Obrigação legal',
  'Interesse legítimo',
  'Proteção da vida',
  'Exercício regular de direitos'
] as const;

export const RISK_LEVELS = [
  'Baixo',
  'Médio',
  'Alto',
  'Crítico'
] as const;

export const PRIORITIES = [
  'Alta',
  'Média',
  'Baixa'
] as const;

export const STATUS_OPTIONS = [
  'Não Iniciado',
  'Em andamento',
  'Concluído',
  'Pendente',
  'Cancelado'
] as const;

export const INCIDENT_TYPES = [
  'Vazamento de dados',
  'Acesso não autorizado',
  'Perda de dados',
  'Alteração não autorizada',
  'Falha de sistema',
  'Erro humano',
  'Ataque cibernético'
] as const;

export const SEVERITY_LEVELS = [
  'Baixa',
  'Média',
  'Alta',
  'Crítica'
] as const;

export const DOCUMENT_TYPES = [
  'privacy_policy',
  'terms_of_use',
  'cookie_notice',
  'data_processing_agreement',
  'privacy_notice',
  'security_policy',
  'incident_plan',
  'ripd',
  'gap_analysis',
  'action_plan',
  'data_inventory'
] as const;

export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};