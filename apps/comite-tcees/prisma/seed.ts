// =============================================================================
// SEED — dados reais do Plano de Trabalho do Comitê Executivo de Proteção de
// Dados Pessoais do TCEES (biênio 2026-2027), extraídos do DOCX oficial.
// Idempotente: limpa as tabelas do módulo e recarrega. NÃO mexe em usuários
// existentes além de garantir o admin/coordenador inicial.
// =============================================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper: data local (mês 1-indexado para legibilidade).
const d = (ano: number, mes: number, dia: number) => new Date(ano, mes - 1, dia);

// ---------------------------------------------------------------------------
// EIXOS
// ---------------------------------------------------------------------------
const EIXOS = [
  { codigo: "A", nome: "Governança / Homologação", ordem: 1, descricao: "Aprovação formal dos documentos do PGP, atos normativos, consulta prévia obrigatória." },
  { codigo: "B", nome: "Inventário / Riscos / RIPDs", ordem: 2, descricao: "Refazimento do IDP dos 12 prioritários, extensão ao universo, GAP, RIPDs definitivos." },
  { codigo: "C", nome: "Documentos institucionais externos", ordem: 3, descricao: "Aviso de Privacidade, Política de Cookies, cláusulas-padrão para operadores, Termo de Confidencialidade." },
  { codigo: "D", nome: "Cultura organizacional / Capacitação", ordem: 4, descricao: "Engajamento de lideranças, trilhas formativas, comunicação interna, Enfoc nos jurisdicionados." },
  { codigo: "E", nome: "Monitoramento / Métricas / Auditoria", ordem: 5, descricao: "Painel de Maturidade, indicadores, auditoria interna, prestação de contas." },
];

// ---------------------------------------------------------------------------
// MEMBROS (Seção 1.5)
// ---------------------------------------------------------------------------
const MEMBROS = [
  { nome: "Rodrigo Coelho do Carmo", funcao: "Presidente", cargo: "Conselheiro do TCEES", unidade: "Presidência do Comitê", ordem: 1 },
  { nome: "Durval Senna da Silva", funcao: "Coordenador", cargo: "Auditor de Controle Externo", unidade: "Ouvidoria", matricula: "202.694", inciso: "VI", ordem: 2 },
  { nome: "Anderson Gomes Barbosa", funcao: "Encarregado titular", cargo: "Encarregado (DPO) — art. 41 LGPD", unidade: "SEGAFI", matricula: "203.604", inciso: "I, a", email: "encarregado@tcees.tc.br", ordem: 3 },
  { nome: "Marcos Rogério Bozzi da Luz", funcao: "Encarregado substituto", unidade: "SEGAFI", matricula: "203.611", inciso: "I, b", ordem: 4 },
  { nome: "Pedro da Paiva Brito Filho", funcao: "Membro", unidade: "SEGAFI", matricula: "203.613", inciso: "I, c", ordem: 5 },
  { nome: "Bruno Fardin Faé", funcao: "Membro", unidade: "SEGEX", matricula: "203.537", inciso: "II, a", ordem: 6 },
  { nome: "Jackson Camatta", funcao: "Membro", unidade: "SEGEX", matricula: "203.034", inciso: "II, b", ordem: 7 },
  { nome: "Régis Vicentini Silotti", funcao: "Membro", unidade: "SEGEX", matricula: "203.204", inciso: "II, c", ordem: 8 },
  { nome: "Rogerio Oliveira de Jesus", funcao: "Membro", unidade: "SEGEX", matricula: "202.571", inciso: "II, d", ordem: 9 },
  { nome: "Pedro Alberto Busatto Broseghini", funcao: "Membro", unidade: "SGTI", matricula: "203.522", inciso: "III", ordem: 10 },
  { nome: "Claudia Duarte Ribeiro", funcao: "Membro", unidade: "SGS", matricula: "203.130", inciso: "IV", ordem: 11 },
  { nome: "Rodrigo Lamari da Costa Pereira", funcao: "Membro", unidade: "Corregedoria", matricula: "203.186", inciso: "V", ordem: 12 },
  { nome: "Bianca Tristão Sandri", funcao: "Membro", unidade: "ECP", matricula: "202.946", inciso: "VII", ordem: 13 },
  { nome: "Walter Júnior Cabral de Lima", funcao: "Membro", unidade: "MPC junto ao TCEES", matricula: "203.771", inciso: "VIII", ordem: 14 },
  { nome: "Eliane Cabrini Ramalho", funcao: "Membro", unidade: "Designação da Presidência", matricula: "204.227", inciso: "IX", ordem: 15 },
];

// ---------------------------------------------------------------------------
// MARCOS CRÍTICOS (Seção 6.3)
// ---------------------------------------------------------------------------
const MARCOS = [
  { data: d(2026, 5, 26), descricao: "Protocolo do Plano de Trabalho junto à SEGOV", eixoCodigos: "A", tipo: "NORMAL", status: "CONCLUIDO", ordem: 1 },
  { data: d(2026, 6, 30), descricao: "Aprovação formal do PGP v1.0, Política Interna e PRI pela Administração Superior", eixoCodigos: "A", tipo: "NORMAL", status: "EM_ANDAMENTO", ordem: 2 },
  { data: d(2026, 6, 30), descricao: "Edição de ato normativo institucionalizando consulta prévia obrigatória ao Comitê", eixoCodigos: "A", tipo: "NORMAL", status: "A_INICIAR", ordem: 3 },
  { data: d(2026, 9, 30), descricao: "Refazimento do IDP dos 12 processos prioritários sob metodologia atualizada", eixoCodigos: "B", tipo: "NORMAL", status: "A_INICIAR", ordem: 4 },
  { data: d(2026, 9, 30), descricao: "Publicação do Aviso de Privacidade institucional no portal", eixoCodigos: "C", tipo: "NORMAL", status: "A_INICIAR", ordem: 5 },
  { data: d(2026, 11, 30), descricao: "RIPDs definitivos concluídos para os processos prioritários", eixoCodigos: "B", tipo: "NORMAL", status: "A_INICIAR", ordem: 6 },
  { data: d(2026, 12, 31), descricao: "PGP CONSOLIDADO E EM FUNCIONAMENTO — marco-mãe do biênio", eixoCodigos: "A,B,C,D,E", tipo: "MAE", status: "CRITICO", ordem: 7 },
  { data: d(2026, 12, 31), descricao: "Relatório Anual de Resultados 2026 protocolado junto à SEGOV", eixoCodigos: "A,E", tipo: "NORMAL", status: "A_INICIAR", ordem: 8 },
  { data: d(2027, 6, 30), descricao: "Inventário consolidado estendido ao universo dos processos remanescentes", eixoCodigos: "B", tipo: "NORMAL", status: "A_INICIAR", ordem: 9 },
  { data: d(2027, 6, 30), descricao: "Cláusulas LGPD em 100% dos contratos vigentes com operadores", eixoCodigos: "C", tipo: "NORMAL", status: "A_INICIAR", ordem: 10 },
  { data: d(2027, 9, 30), descricao: "1ª Auditoria Interna do PGP concluída", eixoCodigos: "E", tipo: "NORMAL", status: "A_INICIAR", ordem: 11 },
  { data: d(2027, 11, 30), descricao: "Painel de Indicadores em operação plena", eixoCodigos: "E", tipo: "NORMAL", status: "A_INICIAR", ordem: 12 },
  { data: d(2027, 12, 31), descricao: "Relatório Final do Biênio + Plano de Trabalho 2028-2029 protocolado", eixoCodigos: "A,E", tipo: "NORMAL", status: "A_INICIAR", ordem: 13 },
];

// ---------------------------------------------------------------------------
// ENTREGAS (Seções 6.4 a 6.10) — biênio completo
// status: CONCLUIDO | EM_ANDAMENTO | A_INICIAR | ATRASADO
// ---------------------------------------------------------------------------
type EntregaSeed = {
  titulo: string; eixoCodigo: string; trimestre: string; responsavel: string;
  prazoTexto: string; prazoData?: Date; status: string;
};
const ENTREGAS: EntregaSeed[] = [
  // Q2 2026 — maio a junho (consolidação inicial)
  { titulo: "Protocolo do Plano de Trabalho junto à SEGOV", eixoCodigo: "A", trimestre: "Q2-2026", responsavel: "Presidência do Comitê", prazoTexto: "26/05/2026", prazoData: d(2026, 5, 26), status: "CONCLUIDO" },
  { titulo: "Submissão do PGP v1.0, minuta da Política Interna e PRI à Administração Superior", eixoCodigo: "A", trimestre: "Q2-2026", responsavel: "Presidência + Coordenação", prazoTexto: "31/05/2026", prazoData: d(2026, 5, 31), status: "CONCLUIDO" },
  { titulo: "Minuta de ato normativo de consulta prévia obrigatória", eixoCodigo: "A", trimestre: "Q2-2026", responsavel: "Coordenação + CJU", prazoTexto: "15/06/2026", prazoData: d(2026, 6, 15), status: "EM_ANDAMENTO" },
  { titulo: "Aprovação formal do PGP v1.0, Política Interna e PRI", eixoCodigo: "A", trimestre: "Q2-2026", responsavel: "CSA", prazoTexto: "30/06/2026", prazoData: d(2026, 6, 30), status: "A_INICIAR" },
  { titulo: "Diagnóstico de adequação dos contratos críticos (Convênio IPAJM e videomonitoramento)", eixoCodigo: "B", trimestre: "Q2-2026", responsavel: "Coordenação + CJU + SGTI", prazoTexto: "30/06/2026", prazoData: d(2026, 6, 30), status: "EM_ANDAMENTO" },
  { titulo: "Enfoc 2026 LGPD — Polo Venda Nova (20 Unidades Gestoras)", eixoCodigo: "D", trimestre: "Q2-2026", responsavel: "Coordenação + ECP", prazoTexto: "25/05/2026", prazoData: d(2026, 5, 25), status: "CONCLUIDO" },
  { titulo: "Reunião de alinhamento com SEGOV, SGTI, CJU e ECP", eixoCodigo: "D", trimestre: "Q2-2026", responsavel: "Presidência + Coordenação", prazoTexto: "30/06/2026", prazoData: d(2026, 6, 30), status: "A_INICIAR" },

  // Q3 2026 — julho a setembro (consolidação técnica)
  { titulo: "Constituição formal da Equipe de Proteção de Dados Pessoais", eixoCodigo: "A", trimestre: "Q3-2026", responsavel: "Comitê + Presidência do Tribunal", prazoTexto: "Q3/2026", status: "A_INICIAR" },
  { titulo: "Publicação do ato normativo de consulta prévia obrigatória", eixoCodigo: "A", trimestre: "Q3-2026", responsavel: "Presidência do Tribunal", prazoTexto: "Q3/2026", status: "A_INICIAR" },
  { titulo: "Refazimento do Inventário (IDP) dos 12 processos prioritários", eixoCodigo: "B", trimestre: "Q3-2026", responsavel: "Encarregado + Equipe + unidades", prazoTexto: "30/09/2026", prazoData: d(2026, 9, 30), status: "A_INICIAR" },
  { titulo: "Início da extensão do Inventário aos demais processos", eixoCodigo: "B", trimestre: "Q3-2026", responsavel: "Encarregado + Equipe + unidades", prazoTexto: "Q3/2026", status: "A_INICIAR" },
  { titulo: "GAP Analysis atualizado", eixoCodigo: "B", trimestre: "Q3-2026", responsavel: "Encarregado + Equipe", prazoTexto: "Q3/2026", status: "A_INICIAR" },
  { titulo: "Publicação do Aviso de Privacidade institucional no portal", eixoCodigo: "C", trimestre: "Q3-2026", responsavel: "Coordenação + SECOM + SGTI", prazoTexto: "30/09/2026", prazoData: d(2026, 9, 30), status: "ATRASADO" },
  { titulo: "Política de Cookies específica", eixoCodigo: "C", trimestre: "Q3-2026", responsavel: "Coordenação + SGTI", prazoTexto: "Q3/2026", status: "A_INICIAR" },
  { titulo: "Aprovação das cláusulas-padrão LGPD para inclusão em contratos", eixoCodigo: "C", trimestre: "Q3-2026", responsavel: "Coordenação + CJU", prazoTexto: "Q3/2026", status: "A_INICIAR" },
  { titulo: "Trilha formativa em LGPD integrada à ECP (carreira)", eixoCodigo: "D", trimestre: "Q3-2026", responsavel: "ECP + Coordenação", prazoTexto: "Q3/2026", status: "A_INICIAR" },
  { titulo: "Campanha institucional de relançamento dos cursos EAD internos", eixoCodigo: "D", trimestre: "Q3-2026", responsavel: "SECOM + Coordenação", prazoTexto: "Q3/2026", status: "A_INICIAR" },
  { titulo: "Engajamento das lideranças das unidades estratégicas — workshop dirigido", eixoCodigo: "D", trimestre: "Q3-2026", responsavel: "Presidência do Comitê + Coordenação", prazoTexto: "Q3/2026", status: "A_INICIAR" },
  { titulo: "Definição dos indicadores e métricas do PGP em operação", eixoCodigo: "E", trimestre: "Q3-2026", responsavel: "Coordenação + Encarregado", prazoTexto: "Q3/2026", status: "A_INICIAR" },

  // Q4 2026 — outubro a dezembro (entrega do marco-mãe)
  { titulo: "RIPDs definitivos dos 12 processos prioritários", eixoCodigo: "B", trimestre: "Q4-2026", responsavel: "Encarregado + Equipe + unidades", prazoTexto: "30/11/2026", prazoData: d(2026, 11, 30), status: "A_INICIAR" },
  { titulo: "Conclusão da 1ª onda de extensão do Inventário", eixoCodigo: "B", trimestre: "Q4-2026", responsavel: "Encarregado + Equipe", prazoTexto: "Q4/2026", status: "A_INICIAR" },
  { titulo: "Início da adequação contratual — cláusulas LGPD (IPAJM, videomonitoramento, contratos com dados sensíveis)", eixoCodigo: "C", trimestre: "Q4-2026", responsavel: "Coordenação + CJU + áreas contratantes", prazoTexto: "Q4/2026", status: "A_INICIAR" },
  { titulo: "1ª onda de capacitação obrigatória de servidores que tratam dados pessoais", eixoCodigo: "D", trimestre: "Q4-2026", responsavel: "ECP + Coordenação", prazoTexto: "Q4/2026", status: "A_INICIAR" },
  { titulo: "Painel de Indicadores institucional do PGP — versão inicial", eixoCodigo: "E", trimestre: "Q4-2026", responsavel: "Coordenação", prazoTexto: "Q4/2026", status: "A_INICIAR" },
  { titulo: "Entrega formal do PGP consolidado à Administração Superior", eixoCodigo: "A", trimestre: "Q4-2026", responsavel: "Comitê + Presidência", prazoTexto: "31/12/2026", prazoData: d(2026, 12, 31), status: "A_INICIAR" },
  { titulo: "Relatório Anual de Resultados 2026 protocolado junto à SEGOV", eixoCodigo: "E", trimestre: "Q4-2026", responsavel: "Presidência + Coordenação", prazoTexto: "31/12/2026", prazoData: d(2026, 12, 31), status: "A_INICIAR" },

  // Q1 2027 — janeiro a março (consolidação operacional)
  { titulo: "Continuidade da extensão do Inventário (2ª onda)", eixoCodigo: "B", trimestre: "Q1-2027", responsavel: "Encarregado + Equipe", prazoTexto: "Q1/2027", status: "A_INICIAR" },
  { titulo: "RIPDs adicionais para processos identificados como críticos", eixoCodigo: "B", trimestre: "Q1-2027", responsavel: "Encarregado + Equipe", prazoTexto: "Q1/2027", status: "A_INICIAR" },
  { titulo: "Cláusulas LGPD em 50% dos contratos vigentes", eixoCodigo: "C", trimestre: "Q1-2027", responsavel: "Coordenação + CJU", prazoTexto: "Q1/2027", status: "A_INICIAR" },
  { titulo: "2ª onda de capacitação obrigatória", eixoCodigo: "D", trimestre: "Q1-2027", responsavel: "ECP + Coordenação", prazoTexto: "Q1/2027", status: "A_INICIAR" },
  { titulo: "Operação plena do painel de indicadores", eixoCodigo: "E", trimestre: "Q1-2027", responsavel: "Coordenação", prazoTexto: "Q1/2027", status: "A_INICIAR" },
  { titulo: "Revisão da Política Interna à luz da execução de 2026", eixoCodigo: "A", trimestre: "Q1-2027", responsavel: "Comitê", prazoTexto: "Q1/2027", status: "A_INICIAR" },

  // Q2 2027 — abril a junho
  { titulo: "Conclusão da extensão do Inventário ao universo dos processos identificados", eixoCodigo: "B", trimestre: "Q2-2027", responsavel: "Encarregado + Equipe", prazoTexto: "Q2/2027", status: "A_INICIAR" },
  { titulo: "Cláusulas LGPD em 100% dos contratos vigentes com tratamento por terceiros", eixoCodigo: "C", trimestre: "Q2-2027", responsavel: "Coordenação + CJU + áreas contratantes", prazoTexto: "Q2/2027", status: "A_INICIAR" },
  { titulo: "Modelo institucional de Termo de Confidencialidade para servidores e terceirizados", eixoCodigo: "C", trimestre: "Q2-2027", responsavel: "Coordenação + SEGAFI", prazoTexto: "Q2/2027", status: "A_INICIAR" },
  { titulo: "Edições especiais do Enfoc 2027 LGPD para novas UGs jurisdicionadas", eixoCodigo: "D", trimestre: "Q2-2027", responsavel: "Coordenação + ECP", prazoTexto: "Q2/2027", status: "A_INICIAR" },
  { titulo: "Revisão dos RIPDs publicados (ciclo de 12 meses)", eixoCodigo: "E", trimestre: "Q2-2027", responsavel: "Encarregado + Equipe", prazoTexto: "Q2/2027", status: "A_INICIAR" },

  // Q3 2027 — julho a setembro (auditoria)
  { titulo: "1ª Auditoria Interna do PGP — escopo institucional", eixoCodigo: "E", trimestre: "Q3-2027", responsavel: "Controle Interno + Coordenação", prazoTexto: "Q3/2027", status: "A_INICIAR" },
  { titulo: "Avaliação de aderência da gestão de operadores", eixoCodigo: "E", trimestre: "Q3-2027", responsavel: "Controle Interno", prazoTexto: "Q3/2027", status: "A_INICIAR" },
  { titulo: "3ª onda de capacitação — reciclagem das categorias funcionais", eixoCodigo: "D", trimestre: "Q3-2027", responsavel: "ECP + Coordenação", prazoTexto: "Q3/2027", status: "A_INICIAR" },
  { titulo: "Edição de ato normativo de revisão da Resolução TC nº 358/2021, se necessário", eixoCodigo: "A", trimestre: "Q3-2027", responsavel: "Comitê + CJU", prazoTexto: "Q3/2027", status: "A_INICIAR" },

  // Q4 2027 — outubro a dezembro (encerramento do biênio)
  { titulo: "Painel de Indicadores em operação plena com série histórica de 24 meses", eixoCodigo: "E", trimestre: "Q4-2027", responsavel: "Coordenação", prazoTexto: "Q4/2027", status: "A_INICIAR" },
  { titulo: "Atendimento das recomendações da Auditoria Interna", eixoCodigo: "E", trimestre: "Q4-2027", responsavel: "Comitê + áreas", prazoTexto: "Q4/2027", status: "A_INICIAR" },
  { titulo: "Relatório Final do Biênio 2026-2027 (art. 4º §3º, Portaria 22/2026)", eixoCodigo: "E", trimestre: "Q4-2027", responsavel: "Presidência do Comitê", prazoTexto: "Q4/2027", status: "A_INICIAR" },
  { titulo: "Plano de Trabalho 2028-2029 apresentado", eixoCodigo: "A", trimestre: "Q4-2027", responsavel: "Comitê", prazoTexto: "Q4/2027", status: "A_INICIAR" },
  { titulo: "Encaminhamento do Relatório Final ao CSA e à SEGOV", eixoCodigo: "A", trimestre: "Q4-2027", responsavel: "Presidência do Comitê", prazoTexto: "Q4/2027", status: "A_INICIAR" },
];

// ---------------------------------------------------------------------------
// REUNIÕES
// ---------------------------------------------------------------------------
const REUNIOES = [
  {
    titulo: "Reunião ordinária do Comitê", data: d(2026, 6, 1), hora: "14h", local: "Sala do Pleno",
    pauta: "Continuação da 1ª reunião sob nova Presidência do Comitê.",
    decisoes: null, totalConvocados: 15, presentes: null, status: "AGENDADA", ordem: 1,
  },
  {
    titulo: "1ª reunião sob a nova presidência", data: d(2026, 5, 11), hora: null, local: null,
    pauta: "Apresentação do Coordenador ao Presidente; diagnóstico do estado atual da adequação; definição das prioridades do biênio.",
    decisoes: "Priorizar a homologação dos 3 documentos (PGP v1.0, PRI, Política Interna); propor ato normativo de consulta prévia obrigatória; protocolar o Plano de Trabalho na SEGOV.",
    totalConvocados: 15, presentes: 12, status: "REALIZADA", ataUrl: null, ordem: 2,
  },
];

// ---------------------------------------------------------------------------
// CONSULTAS PRÉVIAS (Seção 5.11)
// ---------------------------------------------------------------------------
const CONSULTAS = [
  {
    titulo: "Convênio TCE-ES ↔ IPAJM — operador terceirizado com acesso a dados sensíveis",
    area: "SEGAFI / IPAJM", parecerCju: "favorável", status: "RESPONDIDA", respondidaEm: d(2026, 5, 15), abertaEm: d(2026, 5, 1),
    descricao: "Manifestação favorável com 2 ressalvas formais: amparo legal nos arts. 7º e 11 da LGPD e registro da gravidade da omissão da contratação de operador nas negociações iniciais. Minuta de Portaria proposta para institucionalizar consulta prévia.", ordem: 1,
  },
  {
    titulo: "Contratação do serviço de videomonitoramento",
    area: "SEGAFI + SGTI", parecerCju: null, status: "EM_ANALISE", abertaEm: d(2026, 5, 10),
    descricao: "Comitê/Encarregado não incluídos nas etapas iniciais. Em avaliação: base legal (art. 23), RIPD específico e medidas de segurança (art. 46).", ordem: 2,
  },
  {
    titulo: "Inventariação contratual de operadores (terceirizados)",
    area: "Diversas contratantes", parecerCju: "favorável", status: "PENDENCIA",
    descricao: "Setor estratégico com operadores ativos respondeu negativamente à solicitação de relação completa de contratos/convênios. CJU emitiu parecer favorável à adequação; execução pendente.", ordem: 3,
  },
];

// ---------------------------------------------------------------------------
// DOCUMENTOS
// ---------------------------------------------------------------------------
const DOCUMENTOS = [
  { nome: "Programa de Governança em Privacidade (PGP)", tipo: "Instrumento mater", versao: "v1.0", status: "PENDENTE_APROVACAO", atualizadoEm: "25/06/2024", ordem: 1 },
  { nome: "Plano de Resposta a Incidentes (PRI)", tipo: "Procedimento", versao: "2024", status: "PENDENTE_APROVACAO", atualizadoEm: "2024", ordem: 2 },
  { nome: "Política Interna de Proteção de Dados", tipo: "Política", versao: "Minuta v1", status: "PENDENTE_APROVACAO", atualizadoEm: "2024", ordem: 3 },
  { nome: "Aviso de Privacidade institucional", tipo: "Documento externo", versao: null, status: "A_ELABORAR", atualizadoEm: "—", ordem: 4 },
  { nome: "Política de Cookies", tipo: "Documento externo", versao: null, status: "A_ELABORAR", atualizadoEm: "—", ordem: 5 },
  { nome: "Resolução TC nº 358/2021", tipo: "Norma interna", versao: null, status: "HOMOLOGADO", atualizadoEm: "28/09/2021", ordem: 6 },
  { nome: "Portaria Normativa nº 22/2026", tipo: "Norma interna", versao: null, status: "HOMOLOGADO", atualizadoEm: "27/03/2026", ordem: 7 },
  { nome: "Ata — 1ª reunião (nova presidência)", tipo: "Ata de reunião", versao: null, status: "REGISTRADA", atualizadoEm: "11/05/2026", ordem: 8 },
];

// ---------------------------------------------------------------------------
// INDICADORES (Seção 9)
// ---------------------------------------------------------------------------
type IndSeed = { codigo: string; eixoCodigo: string; descricao: string; tipo: string; unidade?: string; meta2026?: string; meta2027?: string; valorAtual?: string; status?: string };
const INDICADORES: IndSeed[] = [
  // Eixo A
  { codigo: "A1", eixoCodigo: "A", descricao: "Documentos institucionais aprovados (PGP, Política, PRI)", tipo: "Estrutural", unidade: "un.", meta2026: "3/3", meta2027: "manter", valorAtual: "0/3", status: "EM_RISCO" },
  { codigo: "A2", eixoCodigo: "A", descricao: "Ato normativo de consulta prévia obrigatória publicado", tipo: "Estrutural", unidade: "sim/não", meta2026: "sim (Q3)", meta2027: "—", valorAtual: "Não", status: "A_INICIAR" },
  { codigo: "A3", eixoCodigo: "A", descricao: "Equipe de Proteção de Dados Pessoais constituída", tipo: "Estrutural", unidade: "sim/não", meta2026: "sim (Q3)", meta2027: "—", valorAtual: "Não", status: "A_INICIAR" },
  { codigo: "A4", eixoCodigo: "A", descricao: "Resoluções/Portarias institucionais editadas no biênio", tipo: "Estrutural", unidade: "un.", meta2026: "≥ 4", meta2027: "≥ 4", valorAtual: "1", status: "EM_ANDAMENTO" },
  { codigo: "A5", eixoCodigo: "A", descricao: "Consultas prévias atendidas pelo Comitê", tipo: "Processual", unidade: "un. acum.", meta2026: "≥ 5", meta2027: "≥ 12", valorAtual: "1", status: "EM_ANDAMENTO" },
  { codigo: "A6", eixoCodigo: "A", descricao: "Tempo médio de manifestação em consulta prévia", tipo: "Processual", unidade: "dias úteis", meta2026: "≤ 15", meta2027: "≤ 10", valorAtual: "—", status: "A_INICIAR" },
  { codigo: "A7", eixoCodigo: "A", descricao: "Relatórios anuais protocolados na SEGOV", tipo: "Estrutural", unidade: "un.", meta2026: "1", meta2027: "2", valorAtual: "0", status: "A_INICIAR" },
  { codigo: "A8", eixoCodigo: "A", descricao: "Reuniões do Comitê realizadas", tipo: "Processual", unidade: "un. anual", meta2026: "≥ 6", meta2027: "≥ 8", valorAtual: "1", status: "EM_ANDAMENTO" },
  { codigo: "A9", eixoCodigo: "A", descricao: "Taxa de execução do planejamento anual do Comitê (KR3 SEGOV)", tipo: "Resultado", unidade: "%", meta2026: "≥ 70%", meta2027: "≥ 80%", valorAtual: "—", status: "A_INICIAR" },
  // Eixo B
  { codigo: "B1", eixoCodigo: "B", descricao: "Processos prioritários com IDP refeito sob metodologia atualizada", tipo: "Resultado", unidade: "% (12)", meta2026: "100% (Q3)", meta2027: "manter", valorAtual: "0%", status: "A_INICIAR" },
  { codigo: "B2", eixoCodigo: "B", descricao: "Processos remanescentes inventariados", tipo: "Resultado", unidade: "% (~103)", meta2026: "≥ 60%", meta2027: "100%", valorAtual: "0%", status: "A_INICIAR" },
  { codigo: "B3", eixoCodigo: "B", descricao: "PGP consolidado entregue (marco-mãe)", tipo: "Estrutural", unidade: "sim/não", meta2026: "sim (31/12)", meta2027: "—", valorAtual: "Não", status: "A_INICIAR" },
  { codigo: "B4", eixoCodigo: "B", descricao: "RIPDs definitivos publicados", tipo: "Resultado", unidade: "un.", meta2026: "≥ 12", meta2027: "≥ 24 acum.", valorAtual: "0", status: "A_INICIAR" },
  { codigo: "B5", eixoCodigo: "B", descricao: "Tempo médio de elaboração de RIPD", tipo: "Processual", unidade: "dias úteis", meta2026: "≤ 60", meta2027: "≤ 45", valorAtual: "—", status: "A_INICIAR" },
  { codigo: "B6", eixoCodigo: "B", descricao: "GAP Analysis atualizado", tipo: "Estrutural", unidade: "sim/não", meta2026: "sim (Q3)", meta2027: "sim (anual)", valorAtual: "Não", status: "A_INICIAR" },
  { codigo: "B7", eixoCodigo: "B", descricao: "Controles GAP aderentes", tipo: "Resultado", unidade: "%", meta2026: "≥ 50%", meta2027: "≥ 80%", valorAtual: "—", status: "A_INICIAR" },
  { codigo: "B8", eixoCodigo: "B", descricao: "Análise de Riscos consolidada (matriz P×I)", tipo: "Estrutural", unidade: "sim/não", meta2026: "sim (Q3)", meta2027: "sim (anual)", valorAtual: "Não", status: "A_INICIAR" },
  // Eixo C
  { codigo: "C1", eixoCodigo: "C", descricao: "Aviso de Privacidade institucional publicado no Portal", tipo: "Estrutural", unidade: "sim/não", meta2026: "sim (Q3)", meta2027: "manter", valorAtual: "Não", status: "ATRASADO" },
  { codigo: "C2", eixoCodigo: "C", descricao: "Política de Cookies publicada", tipo: "Estrutural", unidade: "sim/não", meta2026: "sim (Q3)", meta2027: "manter", valorAtual: "Não", status: "A_INICIAR" },
  { codigo: "C3", eixoCodigo: "C", descricao: "Cláusulas-padrão LGPD aprovadas pelo Comitê e CJU", tipo: "Estrutural", unidade: "sim/não", meta2026: "sim (Q3)", meta2027: "—", valorAtual: "Não", status: "A_INICIAR" },
  { codigo: "C4", eixoCodigo: "C", descricao: "Cláusulas LGPD em contratos vigentes", tipo: "Resultado", unidade: "% contratos", meta2026: "≥ 30%", meta2027: "100% (Q2)", valorAtual: "0%", status: "A_INICIAR" },
  { codigo: "C5", eixoCodigo: "C", descricao: "Contratos críticos adequados (IPAJM, videomonitoramento)", tipo: "Resultado", unidade: "un./un.", meta2026: "2/2 (Q4)", meta2027: "—", valorAtual: "0/2", status: "A_INICIAR" },
  { codigo: "C6", eixoCodigo: "C", descricao: "Termo de Confidencialidade institucional revisado", tipo: "Estrutural", unidade: "sim/não", meta2026: "—", meta2027: "sim (Q2)", valorAtual: "Não", status: "A_INICIAR" },
  { codigo: "C7", eixoCodigo: "C", descricao: "Operadores institucionais mapeados em inventário próprio", tipo: "Resultado", unidade: "un.", meta2026: "universo conhecido", meta2027: "universo completo", valorAtual: "—", status: "A_INICIAR" },
  // Eixo D
  { codigo: "D1", eixoCodigo: "D", descricao: "Servidores capacitados em LGPD", tipo: "Resultado", unidade: "% efetivo", meta2026: "≥ 50%", meta2027: "≥ 80%", valorAtual: "—", status: "EM_ANDAMENTO" },
  { codigo: "D2", eixoCodigo: "D", descricao: "Lideranças institucionais capacitadas", tipo: "Resultado", unidade: "% chefias", meta2026: "≥ 70%", meta2027: "100%", valorAtual: "0%", status: "A_INICIAR" },
  { codigo: "D3", eixoCodigo: "D", descricao: "Servidores que tratam dados — capacitação obrigatória", tipo: "Resultado", unidade: "%", meta2026: "≥ 80%", meta2027: "100%", valorAtual: "—", status: "A_INICIAR" },
  { codigo: "D4", eixoCodigo: "D", descricao: "Treinamentos realizados", tipo: "Processual", unidade: "un.", meta2026: "≥ 8", meta2027: "≥ 12", valorAtual: "—", status: "EM_ANDAMENTO" },
  { codigo: "D5", eixoCodigo: "D", descricao: "Participação nos cursos EAD internos", tipo: "Processual", unidade: "matrículas", meta2026: "≥ 100", meta2027: "≥ 250", valorAtual: "—", status: "A_INICIAR" },
  { codigo: "D6", eixoCodigo: "D", descricao: "UGs jurisdicionadas capacitadas via Enfoc LGPD", tipo: "Resultado", unidade: "un. acum.", meta2026: "≥ 20", meta2027: "≥ 40", valorAtual: "20", status: "EM_ANDAMENTO" },
  { codigo: "D7", eixoCodigo: "D", descricao: "Servidores e Membros com Termo de Compromisso ativo", tipo: "Estrutural", unidade: "% efetivo", meta2026: "manter", meta2027: "manter", valorAtual: "—", status: "EM_ANDAMENTO" },
  { codigo: "D8", eixoCodigo: "D", descricao: "Campanhas institucionais de sensibilização realizadas", tipo: "Processual", unidade: "un.", meta2026: "≥ 2", meta2027: "≥ 4", valorAtual: "—", status: "A_INICIAR" },
  // Eixo E
  { codigo: "E1", eixoCodigo: "E", descricao: "Painel de Indicadores do PGP em operação", tipo: "Estrutural", unidade: "sim/não", meta2026: "sim — inicial (Q4)", meta2027: "sim — pleno (Q1)", valorAtual: "Parcial", status: "EM_ANDAMENTO" },
  { codigo: "E2", eixoCodigo: "E", descricao: "Solicitações de titulares recebidas", tipo: "Processual", unidade: "un.", meta2026: "acompanhar", meta2027: "acompanhar", valorAtual: "—", status: "A_INICIAR" },
  { codigo: "E3", eixoCodigo: "E", descricao: "Tempo médio de resposta ao titular", tipo: "Processual", unidade: "dias", meta2026: "≤ prazo Res. ANPD 18/2024", meta2027: "≤ prazo", valorAtual: "—", status: "A_INICIAR" },
  { codigo: "E4", eixoCodigo: "E", descricao: "Reclamações de titulares formalmente recebidas", tipo: "Processual", unidade: "un.", meta2026: "acompanhar", meta2027: "acompanhar", valorAtual: "—", status: "A_INICIAR" },
  { codigo: "E5", eixoCodigo: "E", descricao: "Incidentes de segurança tratados", tipo: "Processual", unidade: "un.", meta2026: "acompanhar", meta2027: "acompanhar", valorAtual: "—", status: "A_INICIAR" },
  { codigo: "E6", eixoCodigo: "E", descricao: "Incidentes comunicados à ANPD (art. 48 LGPD)", tipo: "Processual", unidade: "un.", meta2026: "acompanhar", meta2027: "acompanhar", valorAtual: "—", status: "A_INICIAR" },
  { codigo: "E7", eixoCodigo: "E", descricao: "Tempo médio entre detecção e comunicação à ANPD", tipo: "Processual", unidade: "h/dias", meta2026: "≤ Res. 15/2024", meta2027: "manter", valorAtual: "—", status: "A_INICIAR" },
  { codigo: "E8", eixoCodigo: "E", descricao: "1ª Auditoria Interna do PGP concluída", tipo: "Estrutural", unidade: "sim/não", meta2026: "—", meta2027: "sim (Q3)", valorAtual: "Não", status: "A_INICIAR" },
  { codigo: "E9", eixoCodigo: "E", descricao: "Recomendações de auditoria atendidas", tipo: "Resultado", unidade: "%", meta2026: "—", meta2027: "≥ 80% (Q4)", valorAtual: "—", status: "A_INICIAR" },
  { codigo: "E10", eixoCodigo: "E", descricao: "Revisões de RIPDs publicados (ciclo anual)", tipo: "Processual", unidade: "un.", meta2026: "—", meta2027: "100% vigentes", valorAtual: "—", status: "A_INICIAR" },
  // Impacto (top-level)
  { codigo: "I1", eixoCodigo: "IMPACTO", descricao: "Índice de Maturidade do PGP — 5 pilares ponderados", tipo: "Impacto", unidade: "0-100", meta2026: "≥ 60", meta2027: "≥ 80", valorAtual: "—", status: "EM_ANDAMENTO" },
  { codigo: "I2", eixoCodigo: "IMPACTO", descricao: "Score de Diagnóstico de Privacidade", tipo: "Impacto", unidade: "0-100", meta2026: "≥ 55", meta2027: "≥ 75", valorAtual: "—", status: "EM_ANDAMENTO" },
  { codigo: "I3", eixoCodigo: "IMPACTO", descricao: "Posicionamento nacional entre Tribunais de Contas", tipo: "Impacto", unidade: "ranking", meta2026: "manter/melhorar", meta2027: "1º SE / 2º BR", valorAtual: "1º SE · 2º BR", status: "CONCLUIDO" },
  { codigo: "I4", eixoCodigo: "IMPACTO", descricao: "Aderência ao PNTP — Dimensão 15", tipo: "Impacto", unidade: "%", meta2026: "100%", meta2027: "100%", valorAtual: "—", status: "EM_ANDAMENTO" },
  { codigo: "I5", eixoCodigo: "IMPACTO", descricao: "Cumprimento do prazo legal interno — PGP até 31/12/2026", tipo: "Impacto", unidade: "sim/não", meta2026: "sim", meta2027: "—", valorAtual: "Em curso", status: "EM_ANDAMENTO" },
];

// ---------------------------------------------------------------------------
// NOTIFICAÇÕES (estado de exemplo coerente com o Plano)
// ---------------------------------------------------------------------------
const NOTIFICACOES = [
  { tipo: "ATRASO", titulo: "Entrega atrasada: Publicação do Aviso de Privacidade institucional", descricao: "Eixo C · clique para abrir a entrega", eixoCodigo: "C", href: "/dashboard/plano", lida: false },
  { tipo: "DOCUMENTO", titulo: "Documento aguardando aprovação: PGP v1.0", descricao: "Pendente de homologação pela Administração Superior.", href: "/dashboard/documentos", lida: false },
  { tipo: "REUNIAO", titulo: "Reunião do Comitê em 19/06/2026", descricao: "Confirme sua presença.", href: "/dashboard/reunioes", lida: false },
  { tipo: "PRAZO", titulo: "Prazo se aproximando: minuta de ato de consulta prévia (15/06/2026)", descricao: "Eixo A", eixoCodigo: "A", href: "/dashboard/plano", lida: true },
  { tipo: "CONSULTA", titulo: "Nova consulta prévia registrada: serviço de videomonitoramento", descricao: "Em análise pelo Comitê.", href: "/dashboard/consultas", lida: true },
  { tipo: "MARCO", titulo: "Marco concluído: Protocolo do Plano de Trabalho junto à SEGOV", descricao: "26/05/2026", href: "/dashboard/plano", lida: true },
];

async function main() {
  console.log("🌱 Seed do Comitê LGPD (TCEES) — iniciando…");

  // Identidade do Comitê (upsert da linha única)
  await prisma.comite.deleteMany();
  await prisma.comite.create({
    data: {
      instituicao: "Tribunal de Contas do Estado do Espírito Santo — TCEES",
      sigla: "TCEES",
      nomeComite: "Comitê Executivo de Proteção de Dados Pessoais",
      bienio: "2026-2027",
      cnpj: "28.483.014/0001-22",
      sede: "Rua José Alexandre Buaiz, nº 157 — Enseada do Suá, Vitória/ES — CEP 29.050-913",
      portal: "www.tcees.tc.br",
      canalEncarregado: "encarregado@tcees.tc.br · (27) 3334-7601",
      vinculoSegov: "Reporta-se à Presidência do Tribunal; acompanhamento pela SEGOV (Plano Bienal 2026-2027 — Diretriz 3).",
      marcoMae: "PGP consolidado e em funcionamento + Relatório Anual 2026",
      marcoMaePrazo: d(2026, 12, 31),
    },
  });

  // Usuários iniciais (não apaga existentes — upsert por email)
  const senhaHash = await bcrypt.hash("comite2026", 10);
  await prisma.user.upsert({
    where: { email: "coordenador@tcees.tc.br" },
    update: {},
    create: { email: "coordenador@tcees.tc.br", name: "Durval Senna da Silva", password: senhaHash, role: "COORDENADOR" },
  });
  await prisma.user.upsert({
    where: { email: "admin@tcees.tc.br" },
    update: {},
    create: { email: "admin@tcees.tc.br", name: "Administrador", password: senhaHash, role: "ADMIN" },
  });

  // Tabelas do módulo — limpa e recarrega (idempotente)
  await prisma.$transaction([
    prisma.eixo.deleteMany(),
    prisma.membro.deleteMany(),
    prisma.entrega.deleteMany(),
    prisma.marco.deleteMany(),
    prisma.reuniao.deleteMany(),
    prisma.consultaPrevia.deleteMany(),
    prisma.documento.deleteMany(),
    prisma.indicador.deleteMany(),
    prisma.notificacao.deleteMany(),
  ]);

  await prisma.eixo.createMany({ data: EIXOS });
  await prisma.membro.createMany({ data: MEMBROS });
  await prisma.entrega.createMany({ data: ENTREGAS.map((e, i) => ({ ...e, ordem: i })) });
  await prisma.marco.createMany({ data: MARCOS });
  await prisma.reuniao.createMany({ data: REUNIOES as any });
  await prisma.consultaPrevia.createMany({ data: CONSULTAS as any });
  await prisma.documento.createMany({ data: DOCUMENTOS as any });
  await prisma.indicador.createMany({ data: INDICADORES.map((x, i) => ({ ...x, ordem: i })) });
  await prisma.notificacao.createMany({ data: NOTIFICACOES });

  console.log(`✅ Seed concluído:
   ${EIXOS.length} eixos · ${MEMBROS.length} membros · ${ENTREGAS.length} entregas
   ${MARCOS.length} marcos · ${REUNIOES.length} reuniões · ${CONSULTAS.length} consultas
   ${DOCUMENTOS.length} documentos · ${INDICADORES.length} indicadores · ${NOTIFICACOES.length} notificações
   Login inicial: coordenador@tcees.tc.br / comite2026`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
