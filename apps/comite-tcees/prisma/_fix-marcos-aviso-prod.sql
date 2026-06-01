-- ============================================================
-- Comite TCEES — alinhar Marcos + Aviso ao Plano de Trabalho oficial
-- (Secao 6 do Plano lista 11 marcos; Aviso vence 30/09/2026)
-- Idempotente.
-- ============================================================

-- 1) Remover 2 marcos que NAO constam na Secao 6 do Plano
DELETE FROM marcos WHERE descricao IN (
  'RIPDs definitivos concluídos para os processos prioritários',
  'Painel de Indicadores em operação plena'
);

-- 2) Aviso de Privacidade: ATRASADO -> A_INICIAR (prazo 30/09/2026; ainda nao venceu)
UPDATE entregas
   SET status = 'A_INICIAR'
 WHERE titulo = 'Publicação do Aviso de Privacidade institucional no portal'
   AND status = 'ATRASADO';

-- conferencia (esperado: 11 marcos, 0 entregas atrasadas)
SELECT count(*) AS total_marcos FROM marcos;
SELECT count(*) AS entregas_atrasadas FROM entregas WHERE status = 'ATRASADO';
