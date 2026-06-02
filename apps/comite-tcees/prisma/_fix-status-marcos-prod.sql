-- =============================================================================
-- Fix de dados em PRODUÇÃO (Neon) — auditoria dos status "concluído" do seed
-- =============================================================================
-- Contexto: data/título/eixo dos marcos vieram do Plano oficial (Seção 6), mas o
-- status "CONCLUIDO" foi INFERIDO na carga do seed (o PDF não traz status).
-- Auditoria com o user (01/06/2026):
--   • Protocolo do Plano junto à SEGOV (26/05) ......... EM ANDAMENTO (não concluído)
--   • Submissão do PGP v1.0 + Política Interna + PRI (31/05) ... EM ANDAMENTO
--   • Enfoc 2026 LGPD — Polo Venda Nova (25/05) ........ CONCLUÍDO (mantém)
--
-- Rodar no Neon → SQL Editor (projeto neon-cinnabar-forest), banco acordado.
-- =============================================================================

-- 1) Entregas: Protocolo e Submissão deixam de ser "concluídas"
UPDATE entregas SET status = 'EM_ANDAMENTO'
WHERE titulo IN (
  'Protocolo do Plano de Trabalho junto à SEGOV',
  'Submissão do PGP v1.0, minuta da Política Interna e PRI à Administração Superior'
);

-- 2) Marco correspondente (ordem 1)
UPDATE marcos SET status = 'EM_ANDAMENTO'
WHERE descricao = 'Protocolo do Plano de Trabalho junto à SEGOV';

-- 3) Notificação que anunciava o protocolo como concluído
UPDATE notificacoes
SET titulo = 'Marco em andamento: Protocolo do Plano de Trabalho junto à SEGOV',
    descricao = 'Prazo 26/05/2026'
WHERE titulo = 'Marco concluído: Protocolo do Plano de Trabalho junto à SEGOV';

-- ----------------------------------------------------------------------------
-- Conferência (esperado: as 2 entregas e o marco em EM_ANDAMENTO; Enfoc CONCLUIDO)
-- ----------------------------------------------------------------------------
SELECT titulo, status FROM entregas
WHERE titulo LIKE 'Protocolo%' OR titulo LIKE 'Submissão do PGP%' OR titulo LIKE 'Enfoc%'
ORDER BY titulo;

SELECT descricao, status FROM marcos WHERE descricao = 'Protocolo do Plano de Trabalho junto à SEGOV';
