// Pacote ATIVO de controles GAP — 10 controles curados (ou customizados pelo
// facilitador via /admin/pacote-gap).
//
// A partir desta refatoração, o "pacote" vem do catálogo de 30 (gap-catalogo.ts)
// e respeita a escolha do facilitador armazenada em CursoTurma.gapPacote.
// Quando vazio, usa PACOTE_DEFAULT_IDS.

import { prisma } from "./prisma";
import {
  GAP_CATALOGO,
  PACOTE_DEFAULT_IDS,
  getPacotePorIds,
  type ControleCatalogo,
} from "./gap-catalogo";

// Compat: alguns lugares ainda importam o tipo "Controle".
export type Controle = ControleCatalogo;

/**
 * Pacote ativo pra uma company (grupo). Lê CursoTurma.gapPacote do grupo.
 * Se vazio (turma não customizou), retorna o pacote default.
 */
export async function getPacoteAtivo(companyId: string): Promise<ControleCatalogo[]> {
  const grupo = await prisma.cursoGrupo.findUnique({
    where: { companyId },
    select: { turma: { select: { gapPacote: true } } },
  });
  const ids = grupo?.turma?.gapPacote;
  if (ids && ids.length > 0) return getPacotePorIds(ids);
  return getPacotePorIds(PACOTE_DEFAULT_IDS);
}

/**
 * Compat: pacote default acessível como const sincrono.
 * Usado por código que não tem companyId em mãos (ex: actions internas que
 * precisam do nome de um controle pelo ID histórico).
 * NÃO usar isso pra renderizar o pacote do usuário — use getPacoteAtivo.
 */
export const GAP_PACOTE: ControleCatalogo[] = getPacotePorIds(PACOTE_DEFAULT_IDS);

/** Re-export pra evitar atrito em quem busca controle por ID. */
export { GAP_CATALOGO };
