// Análise de Risco do Operador — baseada no art. 4º da Resolução CD/ANPD
// nº 2, de 27 de janeiro de 2022.
//
// Regra do art. 4º (alto risco):
//   "Será considerado de alto risco o tratamento de dados pessoais que
//    atender cumulativamente a pelo menos um critério geral e um critério
//    específico"
//
// A Resolução só define ALTO. Pra ter granularidade pedagógica, usamos a
// mesma régua do modelo de Inventário de Terceiros (que estende a Res. nº 2):
//
//   ≥ 1 geral E ≥ 1 específico  → ALTO
//   só ≥ 1 geral OU só ≥ 1 esp. → MÉDIO
//   nenhum                       → BAIXO

export type FatorRiscoId =
  | "GERAL_LARGA_ESCALA"
  | "GERAL_AFETAR_INTERESSES"
  | "ESPECIFICO_TECNOLOGIAS_EMERGENTES"
  | "ESPECIFICO_VIGILANCIA_PUBLICA"
  | "ESPECIFICO_DECISOES_AUTOMATIZADAS"
  | "ESPECIFICO_SENSIVEIS_VULNERAVEIS";

export type FatorRisco = {
  id: FatorRiscoId;
  categoria: "geral" | "especifico";
  rotulo: string;
  descricao: string;
  exemplo: string; // ex pedagógico Vegas
};

export const FATORES_RISCO_ANPD: FatorRisco[] = [
  // === Critérios Gerais (art. 4º, I) ===
  {
    id: "GERAL_LARGA_ESCALA",
    categoria: "geral",
    rotulo: "Tratamento em larga escala",
    descricao:
      "Número significativo de titulares, considerando volume de dados, " +
      "duração, frequência e extensão geográfica do tratamento (art. 4º, §1º).",
    exemplo:
      "Ex: sistema da Ouvidoria processa 1.200 manifestações/ano de cidadãos " +
      "→ larga escala. CIEE processa 640 candidaturas/ano → larga escala.",
  },
  {
    id: "GERAL_AFETAR_INTERESSES",
    categoria: "geral",
    rotulo: "Pode afetar significativamente interesses e direitos fundamentais",
    descricao:
      "Tratamento que pode impedir o exercício de direitos ou utilização de um " +
      "serviço, ou causar danos materiais/morais (discriminação, integridade " +
      "física, imagem, reputação, fraudes, roubo de identidade — art. 4º, §2º).",
    exemplo:
      "Ex: empresa de segurança que tem acesso a prontuários do Posto pode " +
      "causar danos morais aos pacientes em caso de vazamento. Ouvidoria " +
      "lida com denúncias — vazamento pode causar retaliação.",
  },
  // === Critérios Específicos (art. 4º, II) ===
  {
    id: "ESPECIFICO_TECNOLOGIAS_EMERGENTES",
    categoria: "especifico",
    rotulo: "Uso de tecnologias emergentes ou inovadoras",
    descricao:
      "Operador usa IA, biometria, reconhecimento facial, blockchain, IoT ou " +
      "tecnologias similares cujos impactos à privacidade ainda não são " +
      "plenamente conhecidos.",
    exemplo:
      "Ex: sistema de Ouvidoria com triagem automática por IA → tecnologia " +
      "emergente. Câmeras com reconhecimento facial seriam outro exemplo.",
  },
  {
    id: "ESPECIFICO_VIGILANCIA_PUBLICA",
    categoria: "especifico",
    rotulo: "Vigilância ou controle de zonas acessíveis ao público",
    descricao:
      "Monitoramento por câmeras ou outros meios em espaços abertos ao público " +
      "(praças, ruas, estações, aeroportos, bibliotecas, etc — art. 2º, IV).",
    exemplo:
      "Ex: empresa de segurança VegaSeg opera 12 câmeras com gravação no " +
      "Posto de Saúde, onde transita público → vigilância em zona acessível.",
  },
  {
    id: "ESPECIFICO_DECISOES_AUTOMATIZADAS",
    categoria: "especifico",
    rotulo: "Decisões tomadas unicamente com base em tratamento automatizado",
    descricao:
      "Decisões que definem perfil pessoal, profissional, de saúde, consumo, " +
      "crédito ou aspectos da personalidade do titular, sem revisão humana.",
    exemplo:
      "Ex: triagem automática de manifestações da Ouvidoria por palavras-chave " +
      "que define prioridade/encaminhamento → decisão automatizada (art. 20 LGPD).",
  },
  {
    id: "ESPECIFICO_SENSIVEIS_VULNERAVEIS",
    categoria: "especifico",
    rotulo: "Dados sensíveis OU de crianças, adolescentes ou idosos",
    descricao:
      "Tratamento de dados pessoais sensíveis (origem racial/étnica, convicção " +
      "religiosa, opinião política, sindicato, saúde, vida sexual, genéticos, " +
      "biométricos vinculados — art. 5º, II) ou de titulares vulneráveis.",
    exemplo:
      "Ex: VegaSeg acessa área onde prontuários (dados de saúde) são armazenados. " +
      "OuviTech recebe denúncias que podem conter dados de saúde do denunciante " +
      "como contexto. CIEE trata dados de estagiários menores de idade.",
  },
];

// Calcula o nível de risco com base nos fatores marcados.
// Regra do modelo de Inventário (estende o art. 4º):
//   geral ≥ 1 E específico ≥ 1 → ALTO
//   só geral ou só específico → MÉDIO
//   nenhum                    → BAIXO
export function calcularNivelRisco(fatoresMarcados: string[]): "BAIXO" | "MEDIO" | "ALTO" {
  const set = new Set(fatoresMarcados);
  const totalGeral = FATORES_RISCO_ANPD.filter((f) => f.categoria === "geral" && set.has(f.id)).length;
  const totalEspecifico = FATORES_RISCO_ANPD.filter((f) => f.categoria === "especifico" && set.has(f.id)).length;
  if (totalGeral >= 1 && totalEspecifico >= 1) return "ALTO";
  if (totalGeral >= 1 || totalEspecifico >= 1) return "MEDIO";
  return "BAIXO";
}

// Retorna a explicação textual do cálculo (pra mostrar pro DPO entender por
// que aquele risco foi atribuído).
export function explicarRisco(fatoresMarcados: string[]): {
  nivel: "BAIXO" | "MEDIO" | "ALTO";
  totalGeral: number;
  totalEspecifico: number;
  explicacao: string;
} {
  const set = new Set(fatoresMarcados);
  const totalGeral = FATORES_RISCO_ANPD.filter((f) => f.categoria === "geral" && set.has(f.id)).length;
  const totalEspecifico = FATORES_RISCO_ANPD.filter((f) => f.categoria === "especifico" && set.has(f.id)).length;
  const nivel = calcularNivelRisco(fatoresMarcados);
  let explicacao = "";
  if (nivel === "ALTO") {
    explicacao =
      `Pelo menos 1 critério geral (${totalGeral} marcado${totalGeral > 1 ? "s" : ""}) ` +
      `+ pelo menos 1 critério específico (${totalEspecifico}). Conforme art. 4º da Res. ANPD nº 2/2022, ` +
      `o tratamento é considerado de ALTO RISCO. Recomenda-se uso de cláusulas robustas e RIPD.`;
  } else if (nivel === "MEDIO") {
    explicacao =
      totalGeral >= 1
        ? `Apenas critério(s) geral(is) marcado(s) (${totalGeral}). Risco MÉDIO. ` +
          `Não atinge alto risco do art. 4º (faltaria 1 critério específico), mas há fatores relevantes — use cláusulas simples.`
        : `Apenas critério(s) específico(s) marcado(s) (${totalEspecifico}). Risco MÉDIO. ` +
          `Não atinge alto risco do art. 4º (faltaria 1 critério geral), mas há fatores relevantes — use cláusulas simples.`;
  } else {
    explicacao =
      `Nenhum fator de risco marcado. Operador classificado como BAIXO RISCO — ` +
      `as cláusulas essenciais (3 mínimas) são suficientes.`;
  }
  return { nivel, totalGeral, totalEspecifico, explicacao };
}
