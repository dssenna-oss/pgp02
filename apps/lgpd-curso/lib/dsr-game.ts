// DSR Surpresa (Missão 4a) — cenários disparados pelo facilitador e
// pontuação pedagógica.
//
// O DPO escolhe entre 3 opções neutras (sem nenhuma indicação visual do que é
// "certo"):
//   1. Responder agora            → vazou dados sem checar identidade → −10
//   2. Não responder agora        → procrastinou, "vencimento tá longe" → 0
//   3. Outros (especificar)       → texto livre. Facilitador lê no debrief.
//                                   Pontuação 0 — a discussão revela quem teve
//                                   a sacada de pedir identidade (art. 19 §1º)
//                                   sem o app entregar a resposta de graça.
//
// Valores legados (CONFIRMATION_REQUESTED/DENIED_NO_ID/etc) ficam no enum
// porque ainda existem em DSRs criados antes do refator de UI.
//
// A pontuação NÃO é mostrada pro DPO durante o jogo (suspense pedagógico).
// Aparece só no Painel do Facilitador e no Resumo Final da Turma.

export type GameAction =
  // === Valores ativos (UI atual) ===
  | "RESPONDED"              // 1ª opção: respondeu direto sem confirmar identidade
  | "POSTPONED"              // 2ª opção: deixou pra depois ("vencimento tá longe")
  | "OTHER"                  // 3ª opção: texto livre no campo "Outros"
  // === Valores legados (UI anterior — mantidos por compat) ===
  | "CONFIRMATION_REQUESTED"
  | "RESPONDED_AFTER_CONFIRMATION"
  | "RESPONDED_WITHOUT_CONFIRMATION"
  | "DENIED_NO_ID";

export type CenarioDsr = {
  orgao: "PM" | "CM";
  titularNome: string;
  titularContato: string;
  tipoSolicitacao: "ACESSO" | "CORRECAO" | "EXCLUSAO" | "INFO";
  descricao: string;
  // Pegadinha pedagógica: o "titular" não comprovou identidade. DPO bom
  // precisa pedir documento antes de qualquer ação.
  pegadinha: string;
};

// 4 cenários — 2 PM + 2 CM. Aprovados pelo user 2026-05-18.
export const CENARIOS_DSR: CenarioDsr[] = [
  {
    orgao: "PM",
    titularNome: "José da Silva",
    titularContato: "jose.dasilva.candidato@gmail.com",
    tipoSolicitacao: "EXCLUSAO",
    descricao:
      "Olá. Meu nome é José da Silva, participei de um processo seletivo de estagiários da Prefeitura " +
      "há alguns meses e gostaria que vocês apagassem todos os meus dados do banco de currículos. " +
      "Solicito a exclusão imediata. Aguardo retorno por este e-mail.",
    pegadinha:
      "Pedido por e-mail comum, sem cópia de documento. Há mais de um 'José da Silva' " +
      "no banco de currículos (homônimos). Responder sem confirmar identidade pode excluir " +
      "dados do José errado OU pode ser um terceiro tentando atrapalhar a vida do candidato.",
  },
  {
    orgao: "PM",
    titularNome: "Maria Pereira",
    titularContato: "(27) 99876-5432",
    tipoSolicitacao: "CORRECAO",
    descricao:
      "Bom dia, sou paciente do Posto Dr. Joaquim Bento. Por favor atualizem meu endereço " +
      "para Bairro Central, Rua ABC nº 10, e meu telefone para (27) 9876-5432. " +
      "Preciso receber os SMS de exames no número novo. Obrigada.",
    pegadinha:
      "Pedido de correção em prontuário (dado sensível de saúde) feito por SMS/WhatsApp, " +
      "sem nenhuma comprovação. Pode ser ex-companheiro tentando localizar a paciente — " +
      "atualizar o endereço sem verificar identidade vira facilitar perseguição.",
  },
  {
    orgao: "CM",
    titularNome: "João da Silva",
    titularContato: "joao.silva.tribuna@outlook.com",
    tipoSolicitacao: "EXCLUSAO",
    descricao:
      "Sou João da Silva, CPF 789.456.123-00. Quero que apaguem todos os meus dados " +
      "do cadastro da Tribuna Livre — nome, telefone, endereço, tema da fala e a gravação da sessão. " +
      "Solicito a exclusão urgente. Obrigado.",
    pegadinha:
      "CPF informado é INVÁLIDO (não passa no dígito verificador). Há um João da Silva real " +
      "inscrito na Tribuna. Responder sem verificar identidade pode excluir dados do João real " +
      "OU dar pistas pro pedinte de que 'esse cadastro existe'.",
  },
  {
    orgao: "CM",
    titularNome: "Cidadão Anônimo",
    titularContato: "cidadao.curioso@protonmail.com",
    tipoSolicitacao: "INFO",
    descricao:
      "Olá. Sou um cidadão que entrou em contato com a Ouvidoria recentemente. " +
      "Gostaria de saber como vocês tratam meus dados pessoais, quem tem acesso a eles, " +
      "se compartilham com outros órgãos e por quanto tempo guardam as manifestações. " +
      "Obrigado pela atenção.",
    pegadinha:
      "Pedido de informação genérica sem identificação. O cidadão pode ser legítimo, " +
      "mas a Ouvidoria não tem como ligar este e-mail a uma manifestação específica. " +
      "Informações GERAIS sobre tratamento são públicas (Art. 9º) e devem estar no Aviso " +
      "de Privacidade — não exigem identificação. Mas dados ESPECÍFICOS da manifestação " +
      "dele exigem confirmar quem é.",
  },
];

// Template do e-mail "pedir confirmação de identidade" — citações Art. 19 LGPD.
// Editável pelo DPO antes de enviar.
export function templatePedirConfirmacao(cenario: CenarioDsr): string {
  return (
    `Prezado(a) ${cenario.titularNome},\n\n` +
    `Recebemos sua solicitação. Antes de prosseguir, conforme o art. 19, §1º da Lei Geral ` +
    `de Proteção de Dados (Lei nº 13.709/2018), precisamos confirmar sua identidade.\n\n` +
    `Por favor, encaminhe a este mesmo canal:\n` +
    `  • Cópia de documento oficial com foto (RG, CNH ou similar);\n` +
    `  • Selfie segurando o documento;\n` +
    `  • Confirmação do CPF e do canal pelo qual nos contatou originalmente.\n\n` +
    `Após a verificação, sua solicitação será atendida no prazo legal de 15 dias úteis ` +
    `(art. 19, II, LGPD).\n\n` +
    `Atenciosamente,\n` +
    `Encarregado(a) pela Proteção de Dados`
  );
}

// Pontuação por DSR disparado pelo facilitador.
//   RESPONDED                    → −10 (vazou dados sem confirmar identidade)
//   POSTPONED                    → 0 (procrastinou — não foi danoso, não resolveu)
//   OTHER                        → 0 (texto livre; facilitador classifica no debrief)
//   --- legados ---
//   CONFIRMATION_REQUESTED       → +10
//   RESPONDED_AFTER_CONFIRMATION → 0 adicional (já ganhou os +10)
//   RESPONDED_WITHOUT_CONFIRMATION → −10
//   DENIED_NO_ID                 → +5
//   null (não fez nada)          → 0
export function pontosPorAcao(acao: string | null | undefined): number {
  switch (acao) {
    case "RESPONDED":
    case "RESPONDED_WITHOUT_CONFIRMATION":
      return -10;
    case "CONFIRMATION_REQUESTED":
      return 10;
    case "DENIED_NO_ID":
      return 5;
    case "RESPONDED_AFTER_CONFIRMATION":
    case "POSTPONED":
    case "OTHER":
    default:
      return 0;
  }
}

// Soma a pontuação de todos os DSRs disparados pelo facilitador.
export function calcularDsrGameScore(
  dsrs: Array<{ disparoFacilitador?: boolean | null; gameAction?: string | null }>
): number {
  return dsrs
    .filter((d) => d.disparoFacilitador)
    .reduce((acc, d) => acc + pontosPorAcao(d.gameAction), 0);
}

// Resumo amigável da pontuação por grupo.
//   respondeu     — vazou dados (RESPONDED + legado RESPONDED_WITHOUT_CONFIRMATION)
//   postergou     — POSTPONED (procrastinou)
//   outros        — OTHER (escreveu texto livre — facilitador lê no debrief)
//   pediuId       — legado CONFIRMATION_REQUESTED + RESPONDED_AFTER_CONFIRMATION (UI antiga)
//   conservadores — legado DENIED_NO_ID (UI antiga)
//   semAcao       — null
export function resumoPontuacao(
  dsrs: Array<{ disparoFacilitador?: boolean | null; gameAction?: string | null }>
): {
  score: number;
  respondeu: number;
  postergou: number;
  outros: number;
  pediuId: number;
  conservadores: number;
  semAcao: number;
} {
  let score = 0;
  let respondeu = 0;
  let postergou = 0;
  let outros = 0;
  let pediuId = 0;
  let conservadores = 0;
  let semAcao = 0;
  for (const d of dsrs.filter((d) => d.disparoFacilitador)) {
    score += pontosPorAcao(d.gameAction);
    switch (d.gameAction) {
      case "RESPONDED":
      case "RESPONDED_WITHOUT_CONFIRMATION":
        respondeu++;
        break;
      case "POSTPONED":
        postergou++;
        break;
      case "OTHER":
        outros++;
        break;
      case "CONFIRMATION_REQUESTED":
      case "RESPONDED_AFTER_CONFIRMATION":
        pediuId++;
        break;
      case "DENIED_NO_ID":
        conservadores++;
        break;
      default:
        semAcao++;
    }
  }
  return { score, respondeu, postergou, outros, pediuId, conservadores, semAcao };
}
