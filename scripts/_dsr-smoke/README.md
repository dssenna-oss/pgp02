# Smoke tests do mini-app de Requisições de Direitos do Titular

Scripts auxiliares usados durante a implementação (S1 → S5) — não rodam em CI nem em produção.

## Quando usar

- `_smoke-dsr.ts` — valida schema + lib + Prisma Client (cria/lê/deleta uma DSR).
- `_smoke-dsr-s3.ts` — popula 3 requisições com urgências diferentes para inspecionar o painel DPO.
- `_smoke-dsr-s4-check.ts` — checagem do estado do banco (DSRs + Tasks vinculadas).
- `_smoke-dsr-docx.ts` — gera um DOCX-mock da resposta institucional pra revisar layout.

## Como rodar

```bash
npx tsx scripts/_dsr-smoke/_smoke-dsr.ts
npx tsx scripts/_dsr-smoke/_smoke-dsr-s3.ts          # seed visual
npx tsx scripts/_dsr-smoke/_smoke-dsr-s4-check.ts    # diagnóstico
npx tsx scripts/_dsr-smoke/_smoke-dsr-docx.ts        # gera _test-export-resposta.docx
```

Os scripts usam o `DATABASE_URL` do `.env` corrente. **Não execute apontando para Neon prod** sem ter certeza do banco-alvo.
