// Modelos prontos de LIA (Legítimo Interesse Assessment) — instrumento
// pedagógico usado na Reflexão Final do curso pra demonstrar quando o
// uso de "legítimo interesse" como base legal (Art. 7º IX LGPD) precisa
// ser sustentado por uma LIA, e quando essa LIA reprova o tratamento.
//
// Não é o mini-app interativo do app principal (lgpd-pgp.vercel.app
// /dashboard/lia) — aqui são apenas EXEMPLOS já preenchidos, projetáveis
// no telão durante o debrief. Dois modelos: um por incidente do curso.
//
// CONEXÃO COM AS PEGADINHAS:
//   - LIA-PM se refere à Pegadinha #1 (Posto envia lista de pacientes
//     hipertensos pra empresa de marketing parceira)
//   - LIA-CM se refere à Pegadinha #4 (Ouvidoria envia newsletter
//     trimestral aos cidadãos que reclamaram)
//
// CONEXÃO COM A LGPD:
//   - Art. 7º IX — base legal "legítimo interesse"
//   - Art. 10 §3º — exige LIA quando se usa essa base
//   - Art. 11 — base legal pra dados SENSÍVEIS (NÃO inclui legítimo interesse)
//   - Teste de Balanceamento: titular esperaria razoavelmente? Direitos
//     impactados? Salvaguardas suficientes?

export type StatusVeredito = "ok" | "alerta" | "bloqueio";

export type PerguntaLia = {
  pergunta: string;
  resposta: string;
  obs?: string; // contexto adicional / artigo legal
};

export type EtapaLia = {
  titulo: string;   // ex.: "1. Finalidade", "2. Necessidade", "3. Balanceamento"
  icone: string;    // emoji
  descricao: string; // resumo da etapa
  perguntas: PerguntaLia[];
  veredito: {
    status: StatusVeredito;
    texto: string;
  };
};

export type LiaModelo = {
  id: string;
  orgao: "PM" | "CM";
  emoji: string;             // emoji do órgão
  titulo: string;            // ex.: "Marketing direto via parceiro do Posto"
  processoFonte: string;     // qual processo do Inventário esta LIA cobriria
  tentativaBaseLegal: string; // "Art. 7º IX (legítimo interesse)"
  contexto: string;          // descrição do tratamento que motivou a LIA
  pegadinhaRef: string;      // qual pegadinha do curso esta LIA expõe
  etapas: EtapaLia[];
  vereditoFinal: {
    status: "bloqueio" | "reprovada" | "aprovada";
    titulo: string;
    explicacao: string;
    recomendacao: string;
  };
};

// ─── LIA #1 — Prefeitura: Marketing parceiro do Posto ────────────────────

const LIA_PM: LiaModelo = {
  id: "lia-pm",
  orgao: "PM",
  emoji: "🛕",
  titulo: "Marketing direto via parceiro do Posto Dr. Joaquim Bento",
  processoFonte: "PM Processo 1 — Atendimento no Posto de Saúde",
  tentativaBaseLegal: "Art. 7º IX LGPD (legítimo interesse)",
  contexto:
    "O Posto envia mensalmente uma lista nominal com telefone dos pacientes hipertensos e diabéticos pra uma empresa de marketing parceira do município, que vende 'campanhas de vacinação personalizadas via WhatsApp'. A direção do Posto achou que isso era OK porque 'é pra ajudar o paciente'.",
  pegadinhaRef: "Pegadinha #1 — Posto + Marketing Parceiro",
  etapas: [
    {
      titulo: "1. Teste de Finalidade",
      icone: "🎯",
      descricao:
        "Avaliação se o legítimo interesse pretendido é legítimo, lícito e claramente articulado (Art. 10 LGPD).",
      perguntas: [
        {
          pergunta: "Descreva o legítimo interesse pretendido",
          resposta:
            "Comunicar pacientes crônicos (hipertensos/diabéticos) sobre ações de saúde personalizadas via parceiro de marketing — campanhas de vacinação por WhatsApp.",
          obs: "Articulação genérica. Mistura interesse PÚBLICO (saúde) com interesse PRIVADO (parceiro comercial), o que enfraquece o argumento.",
        },
        {
          pergunta: "O interesse é lícito? Justifique.",
          resposta:
            "NÃO. Compartilhar dados de saúde (sensíveis) com terceiro privado, sem consentimento específico do titular, viola o Art. 11 da LGPD.",
          obs: "Art. 11 LGPD exige consentimento específico/destacado pra dados sensíveis, OU uma das hipóteses do Art. 11 II (tutela da saúde, proteção da vida, etc.) — nenhuma se aplica ao envio comercial.",
        },
        {
          pergunta: "Há concretude e articulação clara?",
          resposta: "Parcial. A finalidade é concreta mas confunde interesse público com interesse de terceiro.",
        },
      ],
      veredito: {
        status: "alerta",
        texto:
          "Finalidade ambígua e legalmente questionável — mistura tutela da saúde (que justificaria) com fim comercial via terceiro (que não justifica).",
      },
    },
    {
      titulo: "2. Teste de Necessidade",
      icone: "⚖️",
      descricao:
        "Avaliação se o tratamento é estritamente necessário ou se existe meio menos invasivo (princípio da minimização).",
      perguntas: [
        {
          pergunta: "Há meio menos invasivo de atingir a finalidade?",
          resposta:
            "SIM, múltiplos: (1) comunicação direta pelo próprio Posto via app de saúde institucional, sem compartilhar com terceiros; (2) consentimento prévio coletado no atendimento; (3) ações de saúde anônimas (campanhas gerais não-segmentadas); (4) parceria com a Secretaria Estadual de Saúde, dentro do sistema público.",
          obs: "Princípio da minimização (Art. 6º III LGPD) exige usar o meio que MENOS exponha o titular.",
        },
        {
          pergunta: "Os dados são proporcionais à finalidade?",
          resposta:
            "NÃO. Compartilhar lista NOMINAL com telefone vai além do necessário — bastaria envio anônimo agregado pra ações populacionais.",
        },
      ],
      veredito: {
        status: "bloqueio",
        texto:
          "FALHA no teste de Necessidade. Existem múltiplas alternativas menos invasivas que não foram exploradas.",
      },
    },
    {
      titulo: "3. Teste de Balanceamento",
      icone: "⚖️",
      descricao:
        "Avaliação se direitos e liberdades fundamentais do titular prevalecem sobre o legítimo interesse (Art. 10 §3º).",
      perguntas: [
        {
          pergunta: "O titular esperaria razoavelmente esse tratamento?",
          resposta:
            "NÃO. Paciente que vai ao Posto NÃO espera que seus dados de saúde sejam compartilhados com empresa de marketing — mesmo que sob justificativa de ação de saúde. Quebra de expectativa grave.",
        },
        {
          pergunta: "Que direitos do titular são impactados?",
          resposta:
            "Vários: privacidade dos dados sensíveis de saúde, sigilo médico, possível estigmatização (vizinhos sabendo que é hipertenso/diabético), risco de uso indevido pelo parceiro (revenda, vazamento, marketing fora do escopo).",
        },
        {
          pergunta: "Há salvaguardas suficientes (DPA, criptografia, etc.)?",
          resposta:
            "NÃO. Não há contrato de operador (DPA Art. 39), os dados são enviados por arquivo sem criptografia, sem auditoria, sem prazo de descarte definido. Risco MUITO alto.",
        },
      ],
      veredito: {
        status: "bloqueio",
        texto:
          "BLOQUEADA — direitos do titular prevalecem fortemente sobre o interesse pretendido. Risco desproporcional.",
      },
    },
  ],
  vereditoFinal: {
    status: "bloqueio",
    titulo: "❌ LIA BLOQUEADA — dados sensíveis (Art. 11 LGPD)",
    explicacao:
      "O tratamento envolve dados pessoais SENSÍVEIS (dados de saúde — Art. 5º II LGPD). Pra dados sensíveis, a LGPD NÃO admite legítimo interesse como base legal — exige consentimento específico (Art. 11 I) OU uma das hipóteses do Art. 11 II (que não se aplicam aqui). A LIA nem deveria ter sido iniciada: o sistema bloqueia automaticamente a aprovação quando o processo tem dados sensíveis vinculados.",
    recomendacao:
      "ENCERRAR o tratamento imediatamente. Se houver interesse legítimo em ação de saúde, refazer COM consentimento específico do paciente, OU canalizar pela própria estrutura pública (Sec. Estadual de Saúde), OU restringir a comunicações anônimas/agregadas.",
  },
};

// ─── LIA #2 — Câmara: Newsletter trimestral da Ouvidoria ──────────────────

const LIA_CM: LiaModelo = {
  id: "lia-cm",
  orgao: "CM",
  emoji: "🏛",
  titulo: "Newsletter trimestral da Ouvidoria aos cidadãos que reclamaram",
  processoFonte: "CM Processo 2 — Adequação da Ouvidoria Municipal",
  tentativaBaseLegal: "Art. 7º IX LGPD (legítimo interesse)",
  contexto:
    "A Ouvidoria envia trimestralmente uma 'newsletter com os principais temas das manifestações' pra TODOS os cidadãos que entraram em contato no ano. Justificativa interna: 'transparência ativa' e 'interesse legítimo da Câmara em informar a sociedade'.",
  pegadinhaRef: "Pegadinha #4 — Newsletter da Ouvidoria",
  etapas: [
    {
      titulo: "1. Teste de Finalidade",
      icone: "🎯",
      descricao:
        "Avaliação se o legítimo interesse pretendido é legítimo, lícito e claramente articulado (Art. 10 LGPD).",
      perguntas: [
        {
          pergunta: "Descreva o legítimo interesse pretendido",
          resposta:
            "Informar cidadãos que contataram a Ouvidoria sobre os principais temas e posicionamentos discutidos no trimestre, fortalecendo o princípio constitucional de transparência ativa do Poder Legislativo Municipal.",
        },
        {
          pergunta: "O interesse é lícito? Justifique.",
          resposta:
            "SIM em tese. Transparência é princípio constitucional (Art. 37 CF/88) e a Lei de Acesso à Informação (Lei 12.527/2011) reforça a divulgação ativa de informações públicas. O Art. 7º IX LGPD admite legítimo interesse pra órgãos públicos no exercício de suas funções.",
          obs: "MAS: o fato de o INTERESSE ser lícito não significa que ESSE TRATAMENTO específico passa no teste — vai ser avaliado nas etapas seguintes.",
        },
        {
          pergunta: "Há concretude e articulação clara?",
          resposta: "SIM. Finalidade bem articulada (transparência ativa) e ação concreta (newsletter trimestral).",
        },
      ],
      veredito: {
        status: "ok",
        texto: "Passa no teste de Finalidade. Interesse é lícito e bem articulado.",
      },
    },
    {
      titulo: "2. Teste de Necessidade",
      icone: "⚖️",
      descricao:
        "Avaliação se o tratamento é estritamente necessário ou se existe meio menos invasivo (princípio da minimização).",
      perguntas: [
        {
          pergunta: "Há meio menos invasivo de atingir a finalidade?",
          resposta:
            "SIM, múltiplos: (1) publicação do relatório trimestral no portal público da Câmara (qualquer cidadão acessa, sem tratamento de dados); (2) opt-in voluntário no momento da reclamação (campo 'quer receber atualizações?' no formulário); (3) envio só pros cidadãos que pediram retorno na manifestação original.",
          obs: "Princípio da minimização (Art. 6º III LGPD): o tratamento deve usar o meio que MENOS exponha o titular.",
        },
        {
          pergunta: "Os dados usados são proporcionais à finalidade?",
          resposta:
            "PARCIAL. Email do cidadão é suficiente — não precisa cruzar com conteúdo da manifestação dele. Mas usar a base inteira de reclamantes é desproporcional, dado que muitos só queriam resolver um problema pontual.",
        },
      ],
      veredito: {
        status: "alerta",
        texto:
          "FALHA no teste de Necessidade. Há alternativas claramente menos invasivas (publicação pública, opt-in) que não foram exploradas. Tratamento DESNECESSÁRIO da forma como foi feito.",
      },
    },
    {
      titulo: "3. Teste de Balanceamento",
      icone: "⚖️",
      descricao:
        "Avaliação se direitos e liberdades fundamentais do titular prevalecem sobre o legítimo interesse (Art. 10 §3º).",
      perguntas: [
        {
          pergunta: "O titular esperaria razoavelmente esse tratamento?",
          resposta:
            "NÃO. Cidadão que reclamou de buraco na rua, barulho do vizinho ou serviço público falho NÃO espera receber newsletter trimestral sobre temas legislativos. Quebra clara de expectativa.",
          obs: "Teste da expectativa razoável é central no Balanceamento (orientação ANPD).",
        },
        {
          pergunta: "Que direitos do titular são impactados?",
          resposta:
            "Direito à NÃO-PERTURBAÇÃO (não receber comunicações não solicitadas), direito à MINIMIZAÇÃO (uso além do necessário), e potencial direito de OPOSIÇÃO (Art. 18 §2º) — mas sem opt-out fácil, o cidadão fica preso.",
        },
        {
          pergunta: "Há salvaguardas suficientes (opt-out, transparência, etc.)?",
          resposta:
            "NÃO. Não há aviso prévio no momento da reclamação, opt-out não é claro (só link pequeno no fim do email, em texto cinza), e a newsletter pode conter temas sensíveis que exponham o cidadão se cair em mãos erradas.",
        },
      ],
      veredito: {
        status: "bloqueio",
        texto:
          "FALHA no Balanceamento. Direitos e expectativas do titular PREVALECEM sobre o interesse legítimo da Câmara.",
      },
    },
  ],
  vereditoFinal: {
    status: "reprovada",
    titulo: "❌ LIA REPROVADA — Balanceamento falha",
    explicacao:
      "Embora o interesse pretendido seja lícito (transparência ativa) e o tratamento não envolva dados sensíveis, a LIA REPROVA o tratamento porque: (1) há alternativas menos invasivas que não foram exploradas (publicação pública, opt-in), (2) o titular não espera razoavelmente esse uso quando reclama na Ouvidoria, (3) falta salvaguarda básica (opt-out claro, aviso prévio).",
    recomendacao:
      "DESCONTINUAR o envio com base em legítimo interesse. Reformular pra: (a) opt-in voluntário no momento da reclamação, com campo claro 'quero receber a newsletter trimestral'; (b) publicar o relatório no portal público da Câmara (qualquer cidadão acessa); (c) pra quem pediu retorno explícito, manter comunicação só sobre o caso dele.",
  },
};

// ─── EXPORT ───────────────────────────────────────────────────────────────

export const LIA_MODELOS: LiaModelo[] = [LIA_PM, LIA_CM];

export function getLiaModelo(id: string): LiaModelo | undefined {
  return LIA_MODELOS.find((m) => m.id === id);
}
