// Pegadinhas plantadas nos 4 processos de Vegas — versão estruturada pro app.
//
// As pegadinhas estão nos briefings impressos da Modalidade B (e originalmente
// só eram comentadas oralmente pelo facilitador no debrief). Agora vão também
// pro mini-app "Caça às Pegadinhas" (`/dashboard/caca-pegadinhas`), onde cada
// grupo tem que decidir se identifica problema em cada um dos seus 2 processos
// ANTES de ver o gabarito.
//
// Cada órgão (PM/CM) tem 2 pegadinhas — uma por processo. Cada grupo só vê os
// 2 do seu próprio órgão.

export type PegadinhaProcessoId =
  | "PM_POSTO_MARKETING"        // PM Processo 1
  | "PM_ESTAGIARIOS_OPTIN"      // PM Processo 2
  | "CM_TRIBUNA_INSTAGRAM"      // CM Processo 1
  | "CM_OUVIDORIA_NEWSLETTER";  // CM Processo 2

export type PegadinhaProcesso = {
  id: PegadinhaProcessoId;
  orgao: "PM" | "CM";
  // Match com o seed em `lib/seeds/processos-vegas.ts` — usa contém pra ser
  // tolerante a pequenas variações no nome cadastrado pelo grupo.
  matchNomeProcesso: string;
  // Rotulo curto pro card
  rotuloCurto: string;
  // Trecho do briefing (será exibido no card do quiz, em estilo "citação")
  trechoBriefing: string;
  // Por que é pegadinha — texto pedagógico apresentado no gabarito
  porqueEpegadinha: string;
  artigoLgpd: string;
  // Dica do facilitador pra conduzir a discussão presencial
  dicaDoFacilitador: string;
};

export const PEGADINHAS_PROCESSOS: PegadinhaProcesso[] = [
  {
    id: "PM_POSTO_MARKETING",
    orgao: "PM",
    matchNomeProcesso: "Posto de Saúde",
    rotuloCurto: "Posto de Saúde — empresa de marketing parceira",
    trechoBriefing:
      "O posto também envia 'relatórios mensais com lista nominal e telefone dos pacientes hipertensos e diabéticos' pra uma empresa de marketing parceira do município, que vende 'serviço de campanhas de vacinação personalizadas via WhatsApp'. A direção do posto acha que isso é OK porque 'é pra ajudar o paciente'.",
    porqueEpegadinha:
      "Compartilhar lista nominal + dados de saúde com fim comercial NÃO é finalidade de saúde pública. Falta base legal específica do Art. 11 (dados sensíveis) e contraria o princípio da finalidade (Art. 6º I). Mesmo que a empresa seja 'parceira', tratamento secundário com dados sensíveis exige consentimento específico do titular ou hipótese explícita do Art. 11 — não basta a finalidade declarada do processo original.",
    artigoLgpd: "Art. 6º I (finalidade) · Art. 11 (dados sensíveis) · Art. 39 (operador)",
    dicaDoFacilitador:
      "Pergunte 'qual base legal autoriza enviar dado sensível pra empresa comercial?'. Premie grupo que cita Art. 11 e diferencia 'parceira pra fim público' de 'parceira pra fim comercial'. Note também: falta DPA (Data Processing Agreement) com a empresa.",
  },
  {
    id: "PM_ESTAGIARIOS_OPTIN",
    orgao: "PM",
    matchNomeProcesso: "Estagiários",
    rotuloCurto: "Estagiários — newsletter com checkbox pré-marcado",
    trechoBriefing:
      "O e-mail automático que vai pro candidato após a inscrição também envia 'newsletter da Prefeitura' sobre eventos culturais — a caixa de check 'aceito receber comunicados' vem marcada por padrão no formulário.",
    porqueEpegadinha:
      "Consentimento marcado por padrão (opt-out) NÃO é consentimento válido segundo a LGPD. O Art. 5º XII exige manifestação 'livre, informada, inequívoca e por meio de declaração ou ato afirmativo claro'. O padrão deve ser opt-in: caixa desmarcada por padrão, o titular marca se quiser. Adicionalmente, a finalidade 'eventos culturais' é distinta da finalidade do processo (seleção de estagiários) — exige consentimento separado.",
    artigoLgpd: "Art. 5º XII · Art. 8º (consentimento) · Art. 6º I (finalidade)",
    dicaDoFacilitador:
      "Pergunte: 'caixa pré-marcada é consentimento válido?'. Quem responder 'não, exige ato afirmativo' acerta. Cite Resolução CD/ANPD nº 4/2024 (sanções) — multas por consentimento inválido vão de 0.5 a 2% do faturamento.",
  },
  {
    id: "CM_TRIBUNA_INSTAGRAM",
    orgao: "CM",
    matchNomeProcesso: "Tribuna",
    rotuloCurto: "Tribuna Livre — reels no Instagram sem aviso",
    trechoBriefing:
      "Após a sessão, o setor de Comunicação publica reels no Instagram da Câmara com 'trechos das melhores falas' — incluindo nome do cidadão na legenda. O formulário de inscrição avisa sobre a transmissão ao vivo no YouTube, mas não menciona o Instagram.",
    porqueEpegadinha:
      "A base legal (execução de políticas públicas + interesse público) cobre a transmissão ao vivo no YouTube — finalidade declarada e prevista no edital de inscrição. Reels editados no Instagram extrapolam essa finalidade: viram comunicação institucional/marketing, com público diferente, alcance diferente, expectativa diferente do cidadão. É uso secundário sem informação prévia ao titular (Art. 6º I, IV; Art. 9º).",
    artigoLgpd: "Art. 6º I (finalidade) · Art. 6º IV (livre acesso) · Art. 9º (informação)",
    dicaDoFacilitador:
      "Pergunte 'o cidadão sabia que ia parar em reels de Instagram quando se inscreveu?'. Aprofunde: 'transmissão pública' tem alcance institucional; 'reels' tem alcance de marketing — não são equivalentes. O formulário precisaria avisar AMBOS os canais.",
  },
  {
    id: "CM_OUVIDORIA_NEWSLETTER",
    orgao: "CM",
    matchNomeProcesso: "Ouvidoria",
    rotuloCurto: "Ouvidoria — newsletter trimestral pra quem reclamou",
    trechoBriefing:
      "A Ouvidoria envia trimestralmente uma 'newsletter com os principais temas das manifestações' pra TODOS os cidadãos que entraram em contato no ano. A justificativa interna é 'transparência ativa'. A base legal alegada é 'interesse legítimo da Câmara em informar a sociedade'.",
    porqueEpegadinha:
      "Interesse legítimo (Art. 10) exige teste de balanceamento: a finalidade legítima do controlador supera os direitos do titular naquele contexto? Aqui NÃO passa — o titular procurou a Ouvidoria pra resolver UMA questão específica, não pra receber newsletter. A expectativa razoável dele NÃO inclui ser mailing recorrente. Mistura de finalidades sem informação prévia (Art. 6º I, VI). Adicionalmente, 'transparência ativa' é princípio da LAI (Lei nº 12.527/2011), que se cumpre publicando no portal — não no e-mail individual de quem reclamou.",
    artigoLgpd: "Art. 6º I, VI · Art. 10 (interesse legítimo) · Lei nº 12.527/2011 (LAI)",
    dicaDoFacilitador:
      "Pergunte 'o cidadão esperava receber newsletter quando reclamou de buraco na rua?'. Quem responde 'não, expectativa não bate' acerta. Aprofunde: legítimo interesse precisa de finalidade compatível + expectativa razoável + balanceamento documentado. Sem isso, é só marketing disfarçado.",
  },
];

export function getPegadinhasPorOrgao(orgao: "PM" | "CM"): PegadinhaProcesso[] {
  return PEGADINHAS_PROCESSOS.filter((p) => p.orgao === orgao);
}

export function getPegadinhaById(id: PegadinhaProcessoId): PegadinhaProcesso | undefined {
  return PEGADINHAS_PROCESSOS.find((p) => p.id === id);
}
