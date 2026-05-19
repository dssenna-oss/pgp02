// Formulários estruturados de resposta a incidente (Missão 5).
//
// Ideia pedagógica: a equipe TEM que estar preparada COM ANTECEDÊNCIA.
// Quando o incidente acontece, o DPO está sob pressão (talvez no celular).
// Em vez de texto livre, oferecemos OPÇÕES PRÉ-MAPEADAS (checkboxes) que:
//   1. Aceleram o preenchimento (1 clique vs digitar)
//   2. Forçam o DPO a pensar nas categorias certas
//   3. Funcionam bem em mobile
//   4. Reforçam: "essa lista deveria estar no seu Plano de Resposta a
//      Incidentes (PRI), pré-aprovado"

// === Formulário Comunicação ANPD ===
// Itens 1-3 (identificação, descrição, cronologia) vêm dos campos do
// próprio Incident. Itens 4-9 são as opções abaixo.

export type FormularioAnpd = {
  naturezaDados?: string[];
  titularesNumero?: string;
  titularesCategorias?: string[];
  medidasTecnicas?: string[];
  riscos?: string[];
  medidasMitigacao?: string[];
  motivoAtraso?: string;
};

export const OPCOES_NATUREZA_DADOS: Array<{ id: string; rotulo: string; sensivel?: boolean }> = [
  { id: "CADASTRAIS",        rotulo: "Cadastrais (nome, CPF, RG, endereço, telefone, e-mail)" },
  { id: "SENSIVEL_SAUDE",    rotulo: "Sensíveis — saúde (prontuários, exames, diagnósticos, medicação)", sensivel: true },
  { id: "SENSIVEL_BIOMETRICO", rotulo: "Sensíveis — biométricos (digital, face, voz, íris)", sensivel: true },
  { id: "SENSIVEL_RACIAL",   rotulo: "Sensíveis — origem racial ou étnica", sensivel: true },
  { id: "SENSIVEL_RELIGIAO", rotulo: "Sensíveis — convicção religiosa", sensivel: true },
  { id: "SENSIVEL_POLITICA", rotulo: "Sensíveis — opinião política / sindicato", sensivel: true },
  { id: "SENSIVEL_SEXUAL",   rotulo: "Sensíveis — vida sexual", sensivel: true },
  { id: "FINANCEIROS",       rotulo: "Financeiros (renda, contas, cartões, transações)" },
  { id: "PROFISSIONAIS",     rotulo: "Profissionais (cargo, empresa, salário, histórico)" },
  { id: "LOCALIZACAO",       rotulo: "Localização / geolocalização" },
  { id: "IMAGENS",           rotulo: "Imagens / vídeos" },
  { id: "CREDENCIAIS",       rotulo: "Senhas / credenciais de acesso" },
  { id: "MENORES",           rotulo: "De crianças e adolescentes (titulares vulneráveis)" },
  { id: "IDOSOS",            rotulo: "De idosos (titulares vulneráveis)" },
];

export const OPCOES_CATEGORIAS_TITULARES: Array<{ id: string; rotulo: string }> = [
  { id: "CIDADAOS",     rotulo: "Cidadãos / usuários de serviço público" },
  { id: "PACIENTES",    rotulo: "Pacientes do serviço de saúde" },
  { id: "SERVIDORES_ATIVOS",   rotulo: "Servidores efetivos / em atividade" },
  { id: "SERVIDORES_INATIVOS", rotulo: "Servidores inativos / aposentados / pensionistas" },
  { id: "ESTAGIARIOS",  rotulo: "Estagiários / temporários" },
  { id: "TERCEIRIZADOS", rotulo: "Terceirizados / prestadores de serviço" },
  { id: "FORNECEDORES", rotulo: "Fornecedores / contatos comerciais" },
  { id: "MENORES",      rotulo: "Crianças e adolescentes" },
  { id: "IDOSOS",       rotulo: "Idosos" },
  { id: "DENUNCIANTES", rotulo: "Denunciantes / usuários da Ouvidoria" },
];

export const OPCOES_MEDIDAS_TECNICAS: Array<{ id: string; rotulo: string }> = [
  { id: "TLS",          rotulo: "Criptografia em trânsito (TLS 1.2+)" },
  { id: "AT_REST",      rotulo: "Criptografia em repouso (AES-256 ou similar)" },
  { id: "RBAC",         rotulo: "Controle de acesso por perfil de usuário (RBAC)" },
  { id: "MFA",          rotulo: "Autenticação multifator (MFA / 2FA)" },
  { id: "LOGS",         rotulo: "Logs de acesso e auditoria" },
  { id: "BACKUP",       rotulo: "Backup regular com restore testado" },
  { id: "PSI",          rotulo: "Política de Segurança da Informação aprovada" },
  { id: "TREINAMENTO",  rotulo: "Treinamento periódico em proteção de dados" },
  { id: "PRI",          rotulo: "Plano de Resposta a Incidentes (PRI)" },
  { id: "NDA",          rotulo: "Acordo de Confidencialidade dos colaboradores (NDA)" },
  { id: "SEGREGACAO",   rotulo: "Segregação de ambientes (dev/prod)" },
  { id: "ANONIMIZACAO", rotulo: "Anonimização / pseudonimização de dados" },
  { id: "FIREWALL",     rotulo: "Firewall e/ou WAF" },
  { id: "ANTIVIRUS",    rotulo: "Antimalware em estações e servidores" },
  { id: "NENHUMA",      rotulo: "Nenhuma das anteriores (CRÍTICO — alta vulnerabilidade)" },
];

export const OPCOES_RISCOS: Array<{ id: string; rotulo: string }> = [
  { id: "DISCRIMINACAO", rotulo: "Discriminação (racial, religiosa, política, social)" },
  { id: "FRAUDE",        rotulo: "Fraude financeira (golpes, transferências indevidas)" },
  { id: "ROUBO_ID",      rotulo: "Roubo de identidade (uso indevido em outros sistemas)" },
  { id: "REPUTACAO",     rotulo: "Dano à reputação (exposição pública)" },
  { id: "CONSTRANGIMENTO", rotulo: "Constrangimento / exposição vexatória" },
  { id: "PERSEGUICAO",   rotulo: "Perseguição física / stalking" },
  { id: "CHANTAGEM",     rotulo: "Chantagem / extorsão" },
  { id: "VAZAMENTO_SEC", rotulo: "Vazamento secundário (revenda entre criminosos)" },
  { id: "PSICOLOGICO",   rotulo: "Impacto psicológico / dano moral" },
  { id: "DISCRIMINACAO_SAUDE", rotulo: "Discriminação baseada em condição de saúde" },
  { id: "RECUSA_SERVICOS", rotulo: "Recusa indevida de serviços / produtos" },
];

export const OPCOES_MEDIDAS_MITIGACAO: Array<{ id: string; rotulo: string }> = [
  { id: "CONTENCAO",       rotulo: "Contenção imediata (acesso bloqueado, sistema isolado)" },
  { id: "FORENSE",         rotulo: "Investigação forense iniciada" },
  { id: "BO_POLICIA",      rotulo: "Notificação às autoridades policiais (BO)" },
  { id: "ANPD",            rotulo: "Notificação à ANPD (esta comunicação)" },
  { id: "TITULARES",       rotulo: "Notificação aos titulares afetados" },
  { id: "RESET_SENHAS",    rotulo: "Reset de senhas / credenciais comprometidas" },
  { id: "REVISAO_LOGS",    rotulo: "Revisão de logs e identificação de causa raiz" },
  { id: "TREINAMENTO_ADIC", rotulo: "Treinamento adicional pra equipe envolvida" },
  { id: "REVISAO_PSI",     rotulo: "Revisão da Política de Segurança da Informação" },
  { id: "AUDITORIA_EXT",   rotulo: "Auditoria externa de segurança contratada" },
  { id: "MONITORAMENTO",   rotulo: "Monitoramento intensificado pelos próximos 30 dias" },
  { id: "SUPORTE_TITULAR", rotulo: "Canal de suporte aos titulares afetados (Encarregado)" },
  { id: "RIPD",            rotulo: "Atualização do RIPD do(s) processo(s) afetado(s)" },
];

// === Formulário Carta aos Titulares ===

export type FormularioTitulares = {
  dadosAfetados?: string[];
  oQueFizemos?: string[];
};

// Linguagem amigável pro cidadão comum (sem juridiquês)
export const OPCOES_DADOS_AFETADOS: Array<{ id: string; rotulo: string }> = [
  { id: "NOME",        rotulo: "Seu nome" },
  { id: "CPF",         rotulo: "Seu CPF" },
  { id: "RG",          rotulo: "Seu RG ou outro documento de identificação" },
  { id: "ENDERECO",    rotulo: "Seu endereço residencial" },
  { id: "TELEFONE",    rotulo: "Seu telefone" },
  { id: "EMAIL",       rotulo: "Seu e-mail" },
  { id: "SAUDE",       rotulo: "Informações sobre sua saúde (prontuário, exames, diagnósticos)" },
  { id: "FINANCEIRO",  rotulo: "Informações financeiras (renda, conta bancária, cartão)" },
  { id: "IMAGEM",      rotulo: "Sua imagem (foto, vídeo)" },
  { id: "SENHA",       rotulo: "Sua senha de acesso ao nosso sistema" },
  { id: "COMUNICACAO", rotulo: "Conteúdo das comunicações que você nos enviou" },
  { id: "PROFISSIONAL", rotulo: "Informações profissionais (cargo, salário, vínculo)" },
  { id: "MENORES",     rotulo: "Dados de criança ou adolescente sob sua responsabilidade" },
];

export const OPCOES_O_QUE_FIZEMOS: Array<{ id: string; rotulo: string }> = [
  { id: "BLOQUEIO",        rotulo: "Bloqueamos imediatamente o acesso afetado" },
  { id: "INVESTIGACAO",    rotulo: "Investigamos a causa do incidente" },
  { id: "COMUNICOU_ANPD",  rotulo: "Comunicamos o incidente à ANPD nos prazos legais" },
  { id: "REFORCO_CONTROLE", rotulo: "Reforçamos nossos controles de segurança" },
  { id: "RESET_SENHAS",    rotulo: "Resetamos senhas que possam ter sido expostas" },
  { id: "AUTORIDADES",     rotulo: "Notificamos as autoridades competentes (polícia, MP)" },
  { id: "TREINAMENTO",     rotulo: "Treinamos novamente nossa equipe" },
  { id: "AUDITORIA",       rotulo: "Contratamos auditoria externa de segurança" },
  { id: "MONITORAMENTO",   rotulo: "Estamos monitorando atividades suspeitas relacionadas" },
  { id: "SUPORTE_CANAL",   rotulo: "Estamos disponíveis pra suporte pelo canal do Encarregado" },
  { id: "ASSESSORIA_JUR",  rotulo: "Disponibilizamos orientação jurídica gratuita" },
];

// === Helpers de completude e geração de texto ===

export function completudeAnpd(f: FormularioAnpd | null | undefined): { preenchidos: number; total: number } {
  const total = 6; // 4-natureza, 5-titulares, 6-medidas, 7-riscos, 8-mitigacao, 9-atraso(opcional não conta)
  let preenchidos = 0;
  if (f?.naturezaDados && f.naturezaDados.length > 0) preenchidos++;
  if (f?.titularesNumero && f.titularesNumero.trim() && f?.titularesCategorias && f.titularesCategorias.length > 0) preenchidos++;
  if (f?.medidasTecnicas && f.medidasTecnicas.length > 0) preenchidos++;
  if (f?.riscos && f.riscos.length > 0) preenchidos++;
  if (f?.medidasMitigacao && f.medidasMitigacao.length > 0) preenchidos++;
  // item 9 (motivo de atraso) é opcional — só conta se preenchido
  if (f?.motivoAtraso && f.motivoAtraso.trim()) preenchidos++;
  return { preenchidos: Math.min(preenchidos, total), total };
}

export function completudeTitulares(f: FormularioTitulares | null | undefined): { preenchidos: number; total: number } {
  const total = 2;
  let preenchidos = 0;
  if (f?.dadosAfetados && f.dadosAfetados.length > 0) preenchidos++;
  if (f?.oQueFizemos && f.oQueFizemos.length > 0) preenchidos++;
  return { preenchidos, total };
}

// Gera o texto final da Comunicação ANPD a partir das respostas estruturadas.
// Pode ser exibido como preview ou copiado pra clipboard pelo DPO.
export function gerarTextoAnpd(
  inc: { titulo: string; descricao: string | null; severidade: string; ocorridoEm: Date | null; detectadoEm: Date | null },
  f: FormularioAnpd | null | undefined,
  company: { name: string; cnpj: string | null; dpoName: string | null; dpoEmail: string | null },
): string {
  const naturezaLabels = (f?.naturezaDados || [])
    .map((id) => OPCOES_NATUREZA_DADOS.find((o) => o.id === id)?.rotulo)
    .filter(Boolean);
  const categLabels = (f?.titularesCategorias || [])
    .map((id) => OPCOES_CATEGORIAS_TITULARES.find((o) => o.id === id)?.rotulo)
    .filter(Boolean);
  const medidasLabels = (f?.medidasTecnicas || [])
    .map((id) => OPCOES_MEDIDAS_TECNICAS.find((o) => o.id === id)?.rotulo)
    .filter(Boolean);
  const riscosLabels = (f?.riscos || [])
    .map((id) => OPCOES_RISCOS.find((o) => o.id === id)?.rotulo)
    .filter(Boolean);
  const mitigacaoLabels = (f?.medidasMitigacao || [])
    .map((id) => OPCOES_MEDIDAS_MITIGACAO.find((o) => o.id === id)?.rotulo)
    .filter(Boolean);

  const lista = (items: string[]) => items.length > 0 ? items.map((i) => `   • ${i}`).join("\n") : "   [a preencher]";

  return [
    "COMUNICAÇÃO DE INCIDENTE DE SEGURANÇA COM DADOS PESSOAIS",
    "À AUTORIDADE NACIONAL DE PROTEÇÃO DE DADOS (ANPD)",
    "",
    "(Em atendimento ao art. 48 da LGPD — Lei nº 13.709/2018 — e à Resolução CD/ANPD nº 15, de 24/04/2024)",
    "",
    "1. IDENTIFICAÇÃO DO CONTROLADOR",
    `   ${company.name}`,
    `   CNPJ: ${company.cnpj || "[informar]"}`,
    `   Encarregado: ${company.dpoName || "[informar]"}${company.dpoEmail ? ` (${company.dpoEmail})` : ""}`,
    "",
    "2. DESCRIÇÃO DO INCIDENTE",
    `   Título: ${inc.titulo}`,
    `   Severidade: ${inc.severidade}`,
    `   ${inc.descricao || "[descrição do ocorrido]"}`,
    "",
    "3. CRONOLOGIA",
    `   Ocorrido em: ${inc.ocorridoEm ? new Date(inc.ocorridoEm).toLocaleString("pt-BR") : "[informar]"}`,
    `   Detectado em: ${inc.detectadoEm ? new Date(inc.detectadoEm).toLocaleString("pt-BR") : "[informar]"}`,
    `   Comunicado à ANPD em: ${new Date().toLocaleString("pt-BR")}`,
    "",
    "4. NATUREZA DOS DADOS AFETADOS",
    lista(naturezaLabels as string[]),
    "",
    "5. INFORMAÇÕES SOBRE OS TITULARES",
    `   Número estimado de titulares afetados: ${f?.titularesNumero || "[informar]"}`,
    `   Categorias de titulares:`,
    lista(categLabels as string[]),
    "",
    "6. MEDIDAS TÉCNICAS E ADMINISTRATIVAS DE PROTEÇÃO EXISTENTES",
    lista(medidasLabels as string[]),
    "",
    "7. RISCOS RELACIONADOS AO INCIDENTE",
    lista(riscosLabels as string[]),
    "",
    "8. MEDIDAS ADOTADAS OU EM ANDAMENTO PARA REVERTER/MITIGAR O DANO",
    lista(mitigacaoLabels as string[]),
    "",
    "9. MOTIVO DE EVENTUAL ATRASO NA COMUNICAÇÃO",
    `   ${f?.motivoAtraso?.trim() || "Não houve atraso — comunicação dentro do prazo razoável."}`,
    "",
    `${company.dpoName ? company.dpoName : "Encarregado pelo Tratamento de Dados Pessoais"}`,
    new Date().toLocaleDateString("pt-BR"),
  ].join("\n");
}

export function gerarTextoTitulares(
  inc: { titulo: string; descricao: string | null; ocorridoEm: Date | null },
  f: FormularioTitulares | null | undefined,
  company: { name: string; dpoName: string | null; dpoEmail: string | null; dpoTelefone: string | null },
): string {
  const dadosLabels = (f?.dadosAfetados || [])
    .map((id) => OPCOES_DADOS_AFETADOS.find((o) => o.id === id)?.rotulo)
    .filter(Boolean);
  const fizemosLabels = (f?.oQueFizemos || [])
    .map((id) => OPCOES_O_QUE_FIZEMOS.find((o) => o.id === id)?.rotulo)
    .filter(Boolean);

  const lista = (items: string[]) => items.length > 0 ? items.map((i) => `• ${i}`).join("\n") : "[a preencher]";

  return [
    "CARTA AOS TITULARES — COMUNICAÇÃO DE INCIDENTE DE SEGURANÇA",
    "(Em atendimento ao art. 48, §1º da LGPD — Lei nº 13.709/2018)",
    "",
    "Prezado(a) titular,",
    "",
    "Vimos por meio desta comunicar a você um incidente de segurança envolvendo dados pessoais sob nossa responsabilidade.",
    "",
    "O QUE ACONTECEU",
    inc.titulo + ".",
    "",
    inc.descricao || "[descrição em linguagem clara]",
    "",
    "QUANDO ACONTECEU",
    inc.ocorridoEm ? `O incidente ocorreu em ${new Date(inc.ocorridoEm).toLocaleString("pt-BR")}.` : "[data e horário]",
    "",
    "QUAIS DADOS SEUS PODEM TER SIDO AFETADOS",
    lista(dadosLabels as string[]),
    "",
    "O QUE FIZEMOS",
    lista(fizemosLabels as string[]),
    "",
    "O QUE VOCÊ PODE FAZER",
    "• Acompanhe atividades suspeitas em sua conta/dados.",
    "• Em caso de dúvida, entre em contato com nosso Encarregado.",
    "",
    "SEUS DIREITOS",
    "Você pode, a qualquer tempo, requisitar acesso, correção, anonimização ou exclusão dos seus dados pessoais, na forma do art. 18 da LGPD.",
    "",
    "NOSSO CANAL",
    `Encarregado pelo Tratamento de Dados Pessoais — ${company.name}`,
    company.dpoEmail ? `E-mail: ${company.dpoEmail}` : "E-mail: [a preencher]",
    company.dpoTelefone ? `Telefone: ${company.dpoTelefone}` : "",
    "",
    "Lamentamos profundamente o ocorrido e reafirmamos nosso compromisso com a proteção dos seus dados.",
    "",
    "Atenciosamente,",
    "",
    company.dpoName || "Encarregado pelo Tratamento de Dados Pessoais",
    company.name,
    new Date().toLocaleDateString("pt-BR"),
  ].filter((l) => l !== undefined).join("\n");
}
