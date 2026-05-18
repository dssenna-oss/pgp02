// Erros pedagógicos plantados no auto-preenchimento do Aviso.
//
// Quando o DPO clica em "✨ Auto-preencher do PGP", o gerador injeta erros
// clássicos no markdown. Grupos atentos detectam e reportam pelo botão
// "🔍 Sinalizar erro". Reports ficam em policy.errosReportados (texto livre).
// Facilitador classifica oralmente no debrief.

export type ErroPlantadoId =
  | "BASE_LEGAL_CONSENTIMENTO"
  | "SENSIVEIS_SILENCIADOS"
  | "RETENCAO_VAGA"
  | "LINGUAGEM_JURIDIQUES"
  | "TRANSFERENCIA_NEGADA_SEM_CHECAR"
  | "CANAL_DSR_GENERICO";

export type ErroPlantado = {
  id: ErroPlantadoId;
  rotulo: string;
  secao: string;
  descricaoPedagogica: string;
  artigoLgpd: string;
  dicaDoFacilitador: string;
};

export const CATALOGO_ERROS_PLANTADOS: ErroPlantado[] = [
  {
    id: "BASE_LEGAL_CONSENTIMENTO",
    rotulo: "Base legal incorreta — usa 'consentimento' pra atividade pública",
    secao: "Seção 4 — Base legal",
    descricaoPedagogica:
      "Serviço público (Posto de Saúde, Tribuna, Ouvidoria, Estagiários) NÃO usa " +
      "consentimento como base legal. O correto é 'execução de políticas públicas' " +
      "(art. 7º, III) ou 'obrigação legal' (art. 7º, II). Consentimento exige " +
      "possibilidade real de recusa — o cidadão que precisa do SUS não pode 'recusar' " +
      "o cadastro e ainda ser atendido.",
    artigoLgpd: "Art. 7º, II, III · Art. 11, II 'a'",
    dicaDoFacilitador:
      "Pergunte 'qual seria a base correta?' — premie grupo que cita art. 7º III ou " +
      "art. 11 II 'a'. Quem passou batido, explique no debrief.",
  },
  {
    id: "SENSIVEIS_SILENCIADOS",
    rotulo: "Dados sensíveis silenciados",
    secao: "Seção 3 — Quais dados tratamos",
    descricaoPedagogica:
      "Quando o processo tem dadosSensiveis=true no Inventário (ex: prontuário do " +
      "Posto, denúncias da Ouvidoria), o Aviso deveria informar isso AO TITULAR. " +
      "O auto-preencher omitiu a marca '(inclui dados pessoais sensíveis)' — viola " +
      "transparência (art. 6º, VI) e dever de informação sobre sensíveis (art. 11).",
    artigoLgpd: "Art. 5º, II · Art. 6º, VI · Art. 11",
    dicaDoFacilitador:
      "Confira no Inventário quais processos têm dadosSensiveis=true. Procure no " +
      "Aviso a menção 'sensíveis' nessas seções. Se está omitido, é erro plantado.",
  },
  {
    id: "RETENCAO_VAGA",
    rotulo: "Retenção vaga ('pelo tempo necessário')",
    secao: "Seção 5 — Por quanto tempo guardamos",
    descricaoPedagogica:
      "LGPD exige prazo CLARO e ESPECÍFICO de retenção (art. 16). Texto genérico " +
      "como 'pelo tempo necessário às finalidades' não cumpre transparência " +
      "(art. 6º, VI) nem necessidade (art. 6º, III). Mesmo com prazos específicos " +
      "no Inventário, o auto-preencher substituiu por uma frase genérica.",
    artigoLgpd: "Art. 6º, III, VI · Art. 16",
    dicaDoFacilitador:
      "Compare o que está no Inventário (retenção por processo) com o Aviso. " +
      "Se sumiram os prazos específicos, é erro plantado.",
  },
  {
    id: "LINGUAGEM_JURIDIQUES",
    rotulo: "Linguagem juridiquês ('outrossim', 'consoante') em vez de clara",
    secao: "Seção 6 — Como protegemos seus dados",
    descricaoPedagogica:
      "Princípio do livre acesso e da transparência (art. 6º, VI) exige linguagem " +
      "CLARA, ADEQUADA E OSTENSIVA pro titular comum. 'Outrossim', 'consoante o " +
      "disposto', 'mutatis mutandis' são juridiquês — afastam o cidadão da " +
      "informação. Aviso bom é em português simples.",
    artigoLgpd: "Art. 6º, VI · Art. 9º (informação clara)",
    dicaDoFacilitador:
      "Procure palavras como 'outrossim', 'consoante', 'mister', 'destarte'. " +
      "Pergunte: 'sua mãe entenderia esta seção?'",
  },
  {
    id: "TRANSFERENCIA_NEGADA_SEM_CHECAR",
    rotulo: "Transferência internacional negada sem checar operadores",
    secao: "Seção 8 — Transferência internacional",
    descricaoPedagogica:
      "Diz 'não realizamos transferência internacional' sem verificar os operadores " +
      "cadastrados. Mas o OuviTech (sistema de Ouvidoria SaaS) pode ter servidores " +
      "fora do BR — cloud global. Buffet pode usar Google Forms (servidores nos EUA). " +
      "Negar sem checar é informar errado o titular (art. 33).",
    artigoLgpd: "Art. 33 · Art. 9º (transparência)",
    dicaDoFacilitador:
      "Pergunte: 'algum operador usa cloud global ou SaaS? Onde estão os servidores?' " +
      "Quem investigou tem ponto. Cite a Resolução CD/ANPD nº 20/2024.",
  },
  {
    id: "CANAL_DSR_GENERICO",
    rotulo: "Canal DSR genérico em vez do canal real estruturado",
    secao: "Seção 11 — Como exercer seus direitos",
    descricaoPedagogica:
      "Usa contato genérico ('dpo@empresa.gov.br') em vez do canal funcional que o " +
      "grupo estruturou na M4a (Direitos do Titular). O canal precisa estar VIVO, " +
      "acessível e divulgado (art. 18 §6º). Prometer um canal que não existe é " +
      "estelionato regulatório.",
    artigoLgpd: "Art. 18 · Art. 18 §6º · Art. 19, II",
    dicaDoFacilitador:
      "Compare: o e-mail do Aviso é o mesmo do Encarregado cadastrado em Fase 1? " +
      "Existe canal alternativo (formulário web)? Quem alinhou tem ponto.",
  },
];

// === Heurística de matching: report do grupo → ID do erro plantado ===
// Usado pelo painel facilitador pra estimar quais erros o grupo detectou.
// Conservador: só marca match se a descrição contém pelo menos 1 palavra-chave
// específica do erro. Quem quiser pode marcar match=null e o facilitador
// classifica oralmente no debrief.

const PALAVRAS_CHAVE_POR_ERRO: Record<ErroPlantadoId, string[]> = {
  BASE_LEGAL_CONSENTIMENTO: [
    "consentimento", "consent", "art. 7", "base legal", "política pública",
    "politica publica", "art. 11", "obrigação legal", "obrigacao legal",
  ],
  SENSIVEIS_SILENCIADOS: [
    "sensível", "sensivel", "sensíveis", "sensiveis", "art. 5", "art. 11",
    "saúde", "saude", "biométric", "biometric", "religião", "religiao",
  ],
  RETENCAO_VAGA: [
    "retenção", "retencao", "prazo", "art. 16", "tempo necessário",
    "tempo necessario", "vago", "vaga", "genérico", "generico",
    "específico", "especifico",
  ],
  LINGUAGEM_JURIDIQUES: [
    "juridiquês", "juridiques", "linguagem", "clara", "outrossim",
    "consoante", "mutatis", "destarte", "complicad", "difícil entender",
    "dificil entender", "art. 6", "transparência", "transparencia",
  ],
  TRANSFERENCIA_NEGADA_SEM_CHECAR: [
    "transferência internacional", "transferencia internacional", "art. 33",
    "cloud", "saas", "servidor", "exterior", "estrangeir", "ouvitech",
    "fora do brasil", "fora do br",
  ],
  CANAL_DSR_GENERICO: [
    "canal", "dsr", "genérico", "generico", "encarregado", "dpo@",
    "art. 18", "direitos do titular", "contato", "real",
  ],
};

export function detectarErroPorPalavraChave(
  descricao: string,
): ErroPlantadoId | null {
  const norm = descricao.toLowerCase();
  // Conta matches por erro — retorna o de maior pontuação
  let melhor: { id: ErroPlantadoId; pontos: number } | null = null;
  for (const [id, palavras] of Object.entries(PALAVRAS_CHAVE_POR_ERRO) as Array<[ErroPlantadoId, string[]]>) {
    const matches = palavras.filter((p) => norm.includes(p)).length;
    if (matches > 0 && (!melhor || matches > melhor.pontos)) {
      melhor = { id, pontos: matches };
    }
  }
  return melhor?.id || null;
}

// === Aplicação dos erros no markdown ===
export type ContextoErros = {
  temProcessoSensivel: boolean;
  quantidadeOperadores: number;
};

export function aplicarErrosPlantados(
  mdLimpo: string,
  ctx: ContextoErros,
): { md: string; erros: ErroPlantadoId[] } {
  let md = mdLimpo;
  const aplicados: ErroPlantadoId[] = [];

  // === Erro 1: Base legal errada (consentimento pra todos) ===
  const sec4Regex = /## 4\. Base legal do tratamento\n\n[\s\S]*?(?=\n## 5\.)/;
  const sec4Match = md.match(sec4Regex);
  if (sec4Match) {
    const sec4Original = sec4Match[0];
    const sec4Errada = sec4Original.replace(
      /(- \*\*[^*]+:\*\*) [^\n]+/g,
      "$1 Consentimento do titular (art. 7º, I LGPD).",
    );
    if (sec4Errada !== sec4Original) {
      md = md.replace(sec4Regex, sec4Errada);
      aplicados.push("BASE_LEGAL_CONSENTIMENTO");
    }
  }

  // === Erro 2: Dados sensíveis silenciados ===
  if (ctx.temProcessoSensivel) {
    const antes = md;
    md = md.replace(/ \*\(inclui dados pessoais sens[íi]veis[^)]*\)\*/g, "");
    if (md !== antes) aplicados.push("SENSIVEIS_SILENCIADOS");
  }

  // === Erro 3: Retenção vaga ===
  const sec5Regex = /## 5\. Por quanto tempo guardamos seus dados\n\n[\s\S]*?(?=\n## 6\.)/;
  if (sec5Regex.test(md)) {
    md = md.replace(
      sec5Regex,
      `## 5. Por quanto tempo guardamos seus dados\n\n` +
      `Os dados pessoais são mantidos pelo tempo necessário ao cumprimento das ` +
      `finalidades para as quais foram coletados.\n\n`,
    );
    aplicados.push("RETENCAO_VAGA");
  }

  // === Erro 4: Linguagem juridiquês (Seção 6) ===
  const sec6Regex = /## 6\. Como protegemos seus dados\n\n[\s\S]*?(?=\n## 7\.)/;
  if (sec6Regex.test(md)) {
    md = md.replace(
      sec6Regex,
      `## 6. Como protegemos seus dados\n\n` +
      `Outrossim, consoante o disposto no art. 46 da Lei nº 13.709/2018, mister ` +
      `se faz consignar que esta instituição adota, mutatis mutandis, medidas ` +
      `técnico-administrativas hábeis a obstaculizar acessos não consentâneos, ` +
      `bem como infortúnios acidentais ou ilícitos atinentes à destruição, ` +
      `extravio, alteração, comunicação ou difusão dos dados pessoais consignados ` +
      `em nossos cadastros, restando assegurada, destarte, a confidencialidade, ` +
      `integridade e disponibilidade das informações sub examine.\n\n`,
    );
    aplicados.push("LINGUAGEM_JURIDIQUES");
  }

  // === Erro 5: Transferência internacional negada sem checar ===
  // O auto-preencher já gera "Atualmente, não realizamos..." então o erro
  // existe sempre que há operadores SaaS cadastrados. Marcamos como plantado
  // se há QUALQUER operador (controle pra debrief).
  if (ctx.quantidadeOperadores > 0) {
    aplicados.push("TRANSFERENCIA_NEGADA_SEM_CHECAR");
  }

  // === Erro 6: Canal DSR genérico ===
  const sec11Regex = /(## 11\. Como exercer seus direitos\n\n[\s\S]*?\*\*Para exercer seus direitos[^*]+\*\*\n\n)([\s\S]*?)(?=\n\nO prazo)/;
  const sec11Match = md.match(sec11Regex);
  if (sec11Match) {
    const cabecalho = sec11Match[1];
    md = md.replace(
      sec11Regex,
      `${cabecalho}- E-mail genérico: **dpo@orgao.gov.br**\n- Telefone: 0800 disponível em horário comercial`,
    );
    aplicados.push("CANAL_DSR_GENERICO");
  }

  return { md, erros: aplicados };
}
