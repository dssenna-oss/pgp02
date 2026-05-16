// Seeds dos 4 processos pré-cadastrados de Vegas — usados pela tela "Criar turma".
// Cada processo chega ao grupo "rascunhado pela metade": nome + setor + finalidade básica.
// Faltam: titulares, dados coletados, base legal, retenção, compartilhamentos, medidas.
// As pegadinhas estão no briefing impresso (não no app, pra não revelar).

export type ProcessoSeed = {
  nome: string;
  setor: string;
  finalidade: string;
  papelDono: string; // qual papel é o "dono" do processo (= createdBy)
};

export const PROCESSOS_PM: ProcessoSeed[] = [
  {
    nome: "Atendimento no Posto de Saúde Dr. Joaquim Bento",
    setor: "Secretaria Municipal de Saúde",
    finalidade:
      "Prestar atendimento médico ambulatorial à população de Vegas. Manter prontuário eletrônico " +
      "no sistema 'Saúde+Municipal' desde 2023, com agendamento online e SMS de aviso de exames. " +
      "Atende 80 cidadãos/dia (5 dias/semana, 7h-17h). Inclui programa de hipertensos e diabéticos.",
    papelDono: "SAUDE",
  },
  {
    nome: "Sistema de Contratação de Estagiários",
    setor: "Gestão de Pessoas / RH",
    finalidade:
      "Receber e processar inscrições de estagiários para a Prefeitura de Vegas. Cerca de 320 " +
      "candidatos por seleção, 2 vezes ao ano. Formulário online no portal institucional. Após " +
      "seleção, contrato é formalizado via CIEE.",
    papelDono: "RH",
  },
];

export const PROCESSOS_CM: ProcessoSeed[] = [
  {
    nome: "Programa Tribuna Livre + Audiências Públicas",
    setor: "Cerimonial / Plenário",
    finalidade:
      "Permitir que cidadãos de Vegas se inscrevam para falar em sessões da Câmara sobre temas " +
      "de interesse público. 480 inscritos nos últimos 12 meses. Sessões transmitidas ao vivo no " +
      "YouTube oficial (gravação permanente). Pauta é enviada aos 15 vereadores 24h antes da sessão.",
    papelDono: "CERIMONIAL",
  },
  {
    nome: "Ouvidoria Municipal",
    setor: "Ouvidoria",
    finalidade:
      "Receber manifestações da população (denúncias, sugestões, reclamações, elogios) por " +
      "formulário web, e-mail e telefone 0800. 1.200 manifestações/ano. Manifestação anônima " +
      "permitida. Equipe de 3 servidoras processa e encaminha para o setor competente.",
    papelDono: "OUVIDORIA",
  },
];

// Papéis dentro de cada órgão — mapeamento papel → email + nome amigável + role
export type PapelDef = {
  papel: string;
  emailPrefix: string;
  nomeAmigavel: string;
  role: "DPO" | "MEMBER";
  responsabilidade: string;
};

export const PAPEIS_PM: PapelDef[] = [
  { papel: "DPO",          emailPrefix: "dpo",          nomeAmigavel: "DPO / Encarregado(a)",                role: "DPO",    responsabilidade: "Conduz M0, aprova os 2 processos, publica o Aviso, gera Comunicação ANPD" },
  { papel: "SAUDE",        emailPrefix: "saude",        nomeAmigavel: "Sec. de Saúde",                       role: "MEMBER", responsabilidade: "Dono(a) do Processo 1 — Atendimento no Posto. Conhece rotina." },
  { papel: "RH",           emailPrefix: "rh",           nomeAmigavel: "RH / Gestão de Pessoas",              role: "MEMBER", responsabilidade: "Dono(a) do Processo 2 — Estagiários. Conhece documentos e edital." },
  { papel: "TI",           emailPrefix: "ti",           nomeAmigavel: "TI / Tecnologia",                     role: "MEMBER", responsabilidade: "Apoia: armazenamento, backup, controle de acesso, logs. Avalia Segurança no GAP." },
  { papel: "COMUNICACAO",  emailPrefix: "comunicacao",  nomeAmigavel: "Comunicação / Procuradoria",          role: "MEMBER", responsabilidade: "Apoia DPO no Aviso (clareza pro cidadão) e na Comunicação ANPD." },
];

export const PAPEIS_CM: PapelDef[] = [
  { papel: "DPO",           emailPrefix: "dpo",          nomeAmigavel: "DPO / Encarregado(a)",                role: "DPO",    responsabilidade: "Idem PM" },
  { papel: "CERIMONIAL",    emailPrefix: "cerimonial",   nomeAmigavel: "Cerimonial / Plenário",               role: "MEMBER", responsabilidade: "Dono(a) do Processo 1 — Tribuna Livre" },
  { papel: "OUVIDORIA",     emailPrefix: "ouvidoria",    nomeAmigavel: "Ouvidoria",                           role: "MEMBER", responsabilidade: "Dono(a) do Processo 2 — Ouvidoria Municipal" },
  { papel: "TI",            emailPrefix: "ti",           nomeAmigavel: "TI / Tecnologia",                     role: "MEMBER", responsabilidade: "Idem PM" },
  { papel: "PROCURADORIA",  emailPrefix: "procuradoria", nomeAmigavel: "Procuradoria / Jurídico",             role: "MEMBER", responsabilidade: "Apoia DPO em redação formal do Aviso + Comunicação ANPD" },
];

export function papeisPorOrgao(orgao: "PM" | "CM"): PapelDef[] {
  return orgao === "PM" ? PAPEIS_PM : PAPEIS_CM;
}

export function processosPorOrgao(orgao: "PM" | "CM"): ProcessoSeed[] {
  return orgao === "PM" ? PROCESSOS_PM : PROCESSOS_CM;
}
