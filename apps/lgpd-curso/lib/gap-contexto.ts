// Contexto pedagógico do GAP: os 119 controles em 28 domínios da matriz
// oficial (template "Matriz de Controles e Avaliação de Gaps" — LGPD PRO).
// O curso usa apenas 10 controles curados (lib/gap-pacote.ts) representando
// 5 áreas críticas. Esta lista é mostrada como ESPELHO pra participantes
// entenderem a escala real do trabalho de adequação.
//
// Origem: extraído de lib/gap-catalog.ts do app principal PGP — contagens
// confirmadas via `grep -c domainCode` no catálogo gerado a partir do XLSX
// oficial (GAP_TOTAL = 119 as const).

export type DominioGap = {
  nome: string;
  qtdControles: number;
  cobertoNoCurso: boolean; // Se algum dos 10 controles do curso toca este domínio
  resumo: string;
};

export const DOMINIOS_GAP_COMPLETO: DominioGap[] = [
  { nome: "Estratégia de privacidade",                                                          qtdControles: 1,  cobertoNoCurso: false, resumo: "Comitê, política institucional, alocação de recursos." },
  { nome: "Programa de Governança em Privacidade",                                              qtdControles: 8,  cobertoNoCurso: true,  resumo: "Política do PGP, métricas, revisões anuais. Cobertura parcial no M3." },
  { nome: "DPO",                                                                                qtdControles: 3,  cobertoNoCurso: true,  resumo: "Designação formal, autonomia, canal direto com titulares." },
  { nome: "Agentes de tratamento de dados",                                                     qtdControles: 2,  cobertoNoCurso: false, resumo: "Distinção controlador / operador / encarregado documentada." },
  { nome: "Tratamento dos dados pessoais",                                                      qtdControles: 12, cobertoNoCurso: true,  resumo: "Inventário, finalidade, princípios. Base do M1." },
  { nome: "Tratamento dos dados pessoais sensíveis",                                            qtdControles: 2,  cobertoNoCurso: false, resumo: "Cuidados extras com saúde, religião, política, biometria." },
  { nome: "Tratamento dos dados pessoais sensíveis — Com ou sem consentimento",                 qtdControles: 10, cobertoNoCurso: false, resumo: "10 hipóteses do Art. 11 LGPD." },
  { nome: "Tratamento dos dados pessoais sensíveis — Crianças e adolescentes — Consentimento",  qtdControles: 1,  cobertoNoCurso: false, resumo: "Art. 14 LGPD — consentimento específico do(a) responsável legal." },
  { nome: "Tratamento dos dados pessoais sensíveis — Crianças e adolescentes — Procedimentos públicos", qtdControles: 1, cobertoNoCurso: false, resumo: "Tratamento por órgão público sem consentimento (Art. 14 §3º)." },
  { nome: "Tratamento dos dados pessoais sensíveis — Crianças e adolescentes — Jogos / internet", qtdControles: 1, cobertoNoCurso: false, resumo: "Limites pra plataformas digitais voltadas a menores." },
  { nome: "Tratamento dos dados pessoais sensíveis — Compartilhamento entre controladores",     qtdControles: 2,  cobertoNoCurso: false, resumo: "Quando 2+ controladores compartilham sensíveis." },
  { nome: "Tratamento dos dados pessoais sensíveis — Estudos e pesquisas de saúde pública",     qtdControles: 3,  cobertoNoCurso: false, resumo: "Cuidados específicos pra pesquisa científica." },
  { nome: "Tratamento de dados pessoais — Obtenção / Revogação do Consentimento",               qtdControles: 3,  cobertoNoCurso: false, resumo: "Como pedir, como facilitar a revogação, como guardar prova." },
  { nome: "Tratamento dos dados pessoais — Atualização do Consentimento",                       qtdControles: 1,  cobertoNoCurso: false, resumo: "Renovação periódica do consentimento." },
  { nome: "Tratamento dos dados pessoais — Compartilhamento de dados",                          qtdControles: 2,  cobertoNoCurso: false, resumo: "Critérios pra compartilhar com outros agentes." },
  { nome: "Tratamento dos dados pessoais — Anonimização",                                       qtdControles: 2,  cobertoNoCurso: false, resumo: "Quando dá pra anonimizar e sair do escopo da LGPD." },
  { nome: "Tratamento dos dados pessoais — Legitimação de uso de dados",                        qtdControles: 5,  cobertoNoCurso: true,  resumo: "Base legal (Art. 7º e 11). Cobertura parcial no M3." },
  { nome: "Tratamento dos dados pessoais — Dados públicos",                                     qtdControles: 2,  cobertoNoCurso: false, resumo: "Cuidados com dados manifestamente tornados públicos." },
  { nome: "Tratamento dos dados pessoais — Tratamento de dados obrigatória",                    qtdControles: 2,  cobertoNoCurso: false, resumo: "Hipóteses em que o tratamento é obrigatório por lei." },
  { nome: "Tratamento de dados pessoais — poder público",                                       qtdControles: 7,  cobertoNoCurso: false, resumo: "Regras específicas pra órgãos públicos (Art. 23-30)." },
  { nome: "Término do Tratamento de Dados",                                                     qtdControles: 12, cobertoNoCurso: false, resumo: "Eliminação, anonimização, transferência ao titular ao fim do tratamento." },
  { nome: "Direito dos titulares dos dados",                                                    qtdControles: 6,  cobertoNoCurso: true,  resumo: "Acesso, correção, eliminação, portabilidade etc. Cobertura parcial no M3." },
  { nome: "Privacy By Design",                                                                  qtdControles: 3,  cobertoNoCurso: false, resumo: "Privacidade embutida no projeto desde o início, não retrofit." },
  { nome: "Segurança da Informação",                                                            qtdControles: 9,  cobertoNoCurso: true,  resumo: "Controle de acesso, criptografia, MFA, backup, logs. Cobertura parcial no M3." },
  { nome: "Gestão de Incidentes de Privacidade",                                                qtdControles: 3,  cobertoNoCurso: true,  resumo: "Plano de resposta, comunicação ANPD/titulares. Cobertura parcial no M3." },
  { nome: "DPIA (Avaliação de Impacto)",                                                        qtdControles: 4,  cobertoNoCurso: false, resumo: "RIPD formal pra tratamentos de alto risco. Feito na M4a, não testado no M3." },
  { nome: "Contratos",                                                                          qtdControles: 1,  cobertoNoCurso: false, resumo: "Cláusulas LGPD em contratos com operadores. Feito na M4a, não testado no M3." },
  { nome: "Transferência internacional de dados",                                               qtdControles: 11, cobertoNoCurso: false, resumo: "Quando os dados saem do Brasil — Art. 33-36." },
];

export const GAP_CONTEXTO_RESUMO = {
  totalControles: DOMINIOS_GAP_COMPLETO.reduce((s, d) => s + d.qtdControles, 0),
  totalDominios: DOMINIOS_GAP_COMPLETO.length,
  cobertosNoCurso: DOMINIOS_GAP_COMPLETO.filter((d) => d.cobertoNoCurso).length,
};
