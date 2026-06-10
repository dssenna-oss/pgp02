// Gera o "Guia de Condução" (DOCX 1-2 páginas) pra o facilitador imprimir.
// Roda fora do servidor:  npx tsx scripts/_gen-guia-conducao.mts
// A lib monta E empacota (devolve Buffer) — o script só escreve o arquivo.

import { mkdirSync, writeFileSync } from "node:fs";
import * as Graw from "../lib/guia-conducao-docx";

const G: any = (Graw as any).default ?? Graw;

const OUT_DIR = "C:/Users/User/Downloads";
const OUT = `${OUT_DIR}/Guia_de_Conducao_Painel.docx`;

mkdirSync(OUT_DIR, { recursive: true });
const buf = await G.gerarGuiaConducaoBuffer();
writeFileSync(OUT, buf);
console.log(`✅ Guia gerado: ${OUT} (${(buf.length / 1024).toFixed(1)} KB)`);
