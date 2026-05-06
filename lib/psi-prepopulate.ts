/**
 * Pré-população da PSI com dados do NIST CSF (CP22) — Checkpoint 26 / Fatia 3.
 *
 * Quando há respostas NIST CSF cadastradas, enriquece o seed da PSI
 * com referências aos scores de cada função NIST mapeada à seção:
 *   - Função ID (Identificar) → Seção 2 (Gestão de Ativos)
 *   - Função PR (Proteger)    → Seções 3 (Acesso) + 4 (Criptografia) + 5 (Físico)
 *   - Função DE (Detectar)    → Seção 6 (Incidentes — detecção)
 *   - Função RS (Responder)   → Seção 6 (Incidentes — resposta)
 *   - Função RC (Recuperar)   → Seção 7 (Continuidade)
 *
 * Adiciona uma linha contextual ao final dos textos das seções, citando
 * o score corrente e os pendentes — o user pode editar livremente.
 *
 * Engine pura, sem Prisma.
 */

import type { PsiData } from "./psi-helpers";
import type { CyberScore, FunctionScore } from "./cyber-helpers";

function findFn(score: CyberScore, fn: string): FunctionScore | undefined {
  return score.byFunction.find((f) => f.function === fn);
}

/**
 * Enriquece o `data` da PSI com referências ao score NIST CSF.
 * Modifica o `data` recebido (mutação) e devolve a referência.
 */
export function enrichPsiWithCyber(data: PsiData, score: CyberScore): PsiData {
  const id = findFn(score, "ID");
  const pr = findFn(score, "PR");
  const de = findFn(score, "DE");
  const rs = findFn(score, "RS");
  const rc = findFn(score, "RC");

  // Anotação geral no cabeçalho
  if (score.answered > 0) {
    data.header.aplicabilidade =
      `${data.header.aplicabilidade}\n\n` +
      `**Maturidade Cibernética NIST CSF**: ${score.overall}/100 — ` +
      `${score.answered} de ${score.totalControls} controles avaliados ` +
      `(módulo de Maturidade Cibernética do PGP).`;
  }

  if (id && id.answered > 0) {
    data.s2.inventarioAtivos =
      `${data.s2.inventarioAtivos}\n\n` +
      `[NIST CSF — Função IDENTIFICAR: ${id.score}/100, ` +
      `${id.aderente}/${id.totalControls} controles aderentes. ` +
      `${id.naoAderente > 0 ? `${id.naoAderente} controles não aderentes pendentes de tratamento.` : "Sem pendências."}]`;
  }

  if (pr && pr.answered > 0) {
    const prText =
      `[NIST CSF — Função PROTEGER: ${pr.score}/100, ` +
      `${pr.aderente}/${pr.totalControls} controles aderentes.]`;
    data.s3.politicaAcesso = `${data.s3.politicaAcesso}\n\n${prText}`;
    data.s4.criptografiaEmTransito = `${data.s4.criptografiaEmTransito}\n\n${prText}`;
    data.s5.perimetro = `${data.s5.perimetro}\n\n${prText}`;
  }

  if (de && de.answered > 0) {
    data.s6.deteccaoMonitoramento =
      `${data.s6.deteccaoMonitoramento}\n\n` +
      `[NIST CSF — Função DETECTAR: ${de.score}/100, ` +
      `${de.aderente}/${de.totalControls} controles aderentes. ` +
      `${de.naoAderente > 0 ? `${de.naoAderente} pendências críticas.` : ""}]`.trim();
  }

  if (rs && rs.answered > 0) {
    data.s6.respostaIncidente =
      `${data.s6.respostaIncidente}\n\n` +
      `[NIST CSF — Função RESPONDER: ${rs.score}/100, ` +
      `${rs.aderente}/${rs.totalControls} controles aderentes.]`;
  }

  if (rc && rc.answered > 0) {
    data.s7.backupEstrategia =
      `${data.s7.backupEstrategia}\n\n` +
      `[NIST CSF — Função RECUPERAR: ${rc.score}/100, ` +
      `${rc.aderente}/${rc.totalControls} controles aderentes.]`;
  }

  // Marca controles como aplicados quando a função correspondente tem
  // score alto (≥ 70), sinalizando ao DPO o que provavelmente já está em uso.
  if (id && id.score >= 70) {
    data.s2.controles.possuiInventario = true;
    data.s2.controles.proprietarioDefinido = true;
  }
  if (pr && pr.score >= 70) {
    data.s3.controles.menorPrivilegio = true;
    data.s3.controles.mfaCriticos = true;
    data.s4.controles.tlsObrigatorio = true;
    data.s4.controles.criptografiaRepouso = true;
    data.s5.controles.controleAcessoFisico = true;
  }
  if (de && de.score >= 70) {
    data.s6.controles.logsAtivados = true;
  }
  if (rs && rs.score >= 70) {
    data.s6.controles.planoResposta = true;
    data.s6.controles.notificacao72h = true;
    data.s6.controles.registroIncidentes = true;
  }
  if (rc && rc.score >= 70) {
    data.s7.controles.backupRegular = true;
    data.s7.controles.planoContinuidade = true;
  }

  return data;
}
