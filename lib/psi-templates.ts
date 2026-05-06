/**
 * Template inicial pra criar uma nova PSI (Política de Segurança da
 * Informação) — sugestões de texto institucional pré-preenchido pra
 * cada uma das 7 seções, baseadas em ISO/IEC 27001/27002 e NIST CSF.
 *
 * O usuário pode editar livremente. Estas são sugestões, não obrigatórias.
 *
 * Usado por POST /api/psi quando criando uma PSI nova.
 */

import { type PsiData, emptyPsiData } from "./psi-helpers";

/** Texto sugerido pra cada campo. Tudo opcional — user pode apagar. */
export function buildPsiSeed(companyName?: string | null): PsiData {
  const company = companyName?.trim() || "[Razão Social da empresa]";
  const data = emptyPsiData();

  data.header = {
    vigencia: `${new Date().getFullYear()}–${new Date().getFullYear() + 1}`,
    aplicabilidade: `Esta política aplica-se a TODOS os colaboradores, terceiros, prestadores de serviço, estagiários e demais pessoas que tenham acesso a ativos de informação da ${company}, em qualquer modalidade de vínculo.`,
    ultimaRevisao: new Date().toISOString().slice(0, 10),
    frequenciaRevisao: "Anual ou após incidentes críticos.",
  };

  data.s1.declaracao = `A ${company} declara o compromisso institucional com a proteção da informação como ativo estratégico, atendendo aos princípios de confidencialidade, integridade e disponibilidade. Esta política é parte integrante do Programa de Governança em Privacidade (PGP), em conformidade com a LGPD (Lei nº 13.709/2018), e referencia as melhores práticas de ISO/IEC 27001/27002 e NIST Cybersecurity Framework.`;
  data.s1.responsabilidades = `• **Alta Direção** — patrocina o programa de SI, aprova esta política e provê recursos.\n• **Encarregado (DPO)** — responsável pela conformidade LGPD e ponto de contato com a ANPD.\n• **Comitê de Segurança** — delibera sobre riscos, incidentes e exceções.\n• **Gestores de área** — garantem aderência da equipe e aplicam controles em seus processos.\n• **Colaboradores** — cumprem a política, reportam incidentes e participam dos treinamentos.`;

  data.s2.inventarioAtivos = `Os ativos de informação (sistemas, bancos de dados, equipamentos, contratos, documentos físicos) são inventariados e mantidos atualizados pelos respectivos proprietários, com registro de criticidade e classificação.`;
  data.s2.classificacaoInformacao = `As informações são classificadas em quatro níveis:\n• **Pública** — divulgação irrestrita.\n• **Interna** — uso restrito a colaboradores.\n• **Confidencial** — acesso autorizado caso a caso.\n• **Restrita** — dados sensíveis, dados pessoais sensíveis, segredos comerciais (acesso mínimo necessário).`;

  data.s3.politicaAcesso = `O acesso a ativos é concedido segundo o **princípio do menor privilégio** e da **necessidade de saber**. Solicitações são formalizadas, aprovadas pelo gestor da informação e registradas pelo time de TI/Segurança.`;
  data.s3.autenticacao = `• Senhas seguem complexidade mínima (12+ caracteres, maiúsculas, números, caracteres especiais) e expiram em até 180 dias.\n• Autenticação multifator (MFA) é obrigatória para sistemas críticos, acesso administrativo e acesso remoto.\n• Compartilhamento de credenciais é proibido.`;
  data.s3.revisaoAcessos = `Os acessos são revisados a cada 6 meses pelo proprietário do ativo. Acessos de colaboradores desligados são revogados no mesmo dia útil do desligamento.`;

  data.s4.criptografiaEmTransito = `Toda comunicação que transporta dados sensíveis ou pessoais utiliza protocolos criptografados (TLS 1.2+, HTTPS, SFTP, VPN com IPSec/WireGuard). Comunicações em texto plano são proibidas para dados confidenciais e restritos.`;
  data.s4.criptografiaEmRepouso = `Bancos de dados que armazenam dados pessoais sensíveis são criptografados em repouso. Backups são criptografados antes de gravação ou transmissão. Discos de notebooks corporativos utilizam criptografia integral (BitLocker/FileVault).`;
  data.s4.gestaoChaves = `Chaves criptográficas são gerenciadas em cofre dedicado (KMS, HSM ou solução equivalente), com rotação ao menos anual e revogação imediata em caso de comprometimento.`;

  data.s5.perimetro = `O acesso físico aos locais que hospedam ativos críticos (data centers, salas de servidores, arquivos físicos) é controlado por crachás, biometria ou chave, com registro de entradas e saídas.`;
  data.s5.energiaAmbiente = `Ambientes críticos contam com nobreak, gerador de emergência, ar-condicionado redundante e detecção/supressão de incêndio adequados ao tipo de risco.`;
  data.s5.descarteFisico = `Mídias e documentos contendo dados pessoais ou confidenciais são descartados de forma segura: trituração para papel, destruição física para discos rígidos e mídias removíveis, com registro formal.`;

  data.s6.deteccaoMonitoramento = `Logs de sistemas críticos são coletados, centralizados e monitorados por solução de SIEM ou ferramenta equivalente. Alertas de eventos suspeitos são tratados pela equipe de resposta a incidentes.`;
  data.s6.respostaIncidente = `Todo incidente de segurança envolvendo dados pessoais é registrado no mini-app de Incidentes (módulo do PGP). Incidentes com risco relevante aos titulares são comunicados à ANPD em até **72 horas** (Art. 48 LGPD), conforme template DOCX previsto na Resolução CD/ANPD nº 15/2024.`;
  data.s6.comunicacao = `Canais oficiais para reporte de incidentes: e-mail dedicado ([incidentes@empresa.com]) e telefone do Encarregado. Colaboradores são treinados a reportar suspeitas em até 1 hora útil.`;

  data.s7.backupEstrategia = `Backups completos diários e backups incrementais a cada 4 horas para sistemas críticos. Mantém-se cópia em localização geograficamente distinta (offsite ou cloud) e cópias retidas conforme política de retenção (mínimo 90 dias).`;
  data.s7.rtoRpo = `• **RTO (Recovery Time Objective)** — 4 horas para sistemas críticos, 24 horas para sistemas de apoio.\n• **RPO (Recovery Point Objective)** — máximo de 4 horas de perda aceitável para sistemas críticos.`;
  data.s7.testesRecuperacao = `O Plano de Continuidade de Negócio (PCN) e o Plano de Recuperação de Desastres (DRP) são testados anualmente. Os resultados dos testes são documentados e geram itens de melhoria no Plano de Ação.`;

  return data;
}
