// Timeline das 7 missões pro Painel do Facilitador.
// Cada bolinha tem: status (DONE/DOING/IDLE), label curta, contador opcional,
// timestamp de início (createdAt da 1ª entidade) e última atividade.
//
// Status:
//   DONE  → critério da missão batido (mesmo da sidebar dos participantes)
//   DOING → tem algum progresso parcial mas ainda não fechou
//   IDLE  → nada começou
//
// "Tempo gasto na missão atual" = now - createdAt da 1ª entidade da missão.

export type StatusMissao = "DONE" | "DOING" | "IDLE";

export type BolinhaMissao = {
  id: string; // ex: "m1"
  label: string; // ex: "M1"
  nomeCurto: string; // ex: "Inventário"
  status: StatusMissao;
  contador?: string; // ex: "2/2", "4/10", "3"
  duracaoEsperadaSeg: number; // pra alerta de "passou do tempo"
  inicioEm?: string; // ISO — createdAt da 1ª entidade
  ultimaAtividadeEm?: string; // ISO — updatedAt da mais recente
};

export const DURACOES_ESPERADAS_SEG: Record<string, number> = {
  m1: 25 * 60,
  m2: 15 * 60,
  m3: 10 * 60,
  m4a_ripd: 4 * 60,
  m4a_terceiros: 2 * 60,
  m4a_dsr: 2 * 60,
  m4b: 12 * 60,
  m5: 25 * 60,
};

type Entrada = { createdAt: Date; updatedAt: Date };

function bounds(items: Entrada[]) {
  if (!items.length) return { inicio: undefined, ultima: undefined };
  const inicio = new Date(Math.min(...items.map((i) => i.createdAt.getTime())));
  const ultima = new Date(Math.max(...items.map((i) => i.updatedAt.getTime())));
  return { inicio, ultima };
}

// Distingue entidades CRIADAS pela API de seed (criar-turma cria 2 processos +
// 2 operadores em RASCUNHO num único POST -- updatedAt fica praticamente igual
// ao createdAt) das entidades TOCADAS pelo participante (qualquer salvar/edição
// faz updatedAt subir bem além de createdAt).
//
// Margem de 2s cobre o tempo do POST de seed inteiro com folga.
function foiTocado(e: Entrada): boolean {
  return e.updatedAt.getTime() - e.createdAt.getTime() > 2000;
}

export type TimelineInput = {
  inventarios: { status: string; createdAt: Date; updatedAt: Date }[];
  riscos: { status: string; createdAt: Date; updatedAt: Date }[];
  gapAnswers: { createdAt: Date; updatedAt: Date }[];
  ripds: { status: string; createdAt: Date; updatedAt: Date }[];
  // clausulasSelecionadas: IDs das cláusulas LGPD que o DPO escolheu pro
  // aditamento DOCX. Quando length > 0, a missão Terceiros considera o
  // operador "entregue" (mesmo critério do `m4a_terceiros` da sidebar).
  operadores: { createdAt: Date; updatedAt: Date; clausulasSelecionadas: string[] }[];
  dsrs: { createdAt: Date; updatedAt: Date }[];
  aviso: { status: string | null; createdAt?: Date; updatedAt?: Date } | null;
  incidentes: { status: string; createdAt: Date; updatedAt: Date }[];
};

export function montarTimeline(input: TimelineInput): BolinhaMissao[] {
  const aprov = (i: { status: string }) => i.status === "APROVADO";

  // M1 — Inventário.
  // DOING só se algum processo foi TOCADO (RASCUNHO + edição) OU saiu de
  // RASCUNHO (SUBMETIDO/APROVADO/DEVOLVIDO). Sem isso, os 2 processos
  // pré-cadastrados da seed apareciam como "iniciado há 33min" antes da
  // turma começar.
  const invAprovados = input.inventarios.filter(aprov).length;
  const inventariosTocados = input.inventarios.filter(
    (i) => i.status !== "RASCUNHO" || foiTocado(i)
  );
  const m1Bounds = bounds(inventariosTocados);
  const m1: BolinhaMissao = {
    id: "m1",
    label: "M1",
    nomeCurto: "Inventário",
    status:
      invAprovados >= 2 ? "DONE" :
      inventariosTocados.length > 0 ? "DOING" : "IDLE",
    contador: `${invAprovados}/${Math.max(2, input.inventarios.length)}`,
    duracaoEsperadaSeg: DURACOES_ESPERADAS_SEG.m1,
    inicioEm: m1Bounds.inicio?.toISOString(),
    ultimaAtividadeEm: m1Bounds.ultima?.toISOString(),
  };

  // M2 — Riscos
  const riscosAprovados = input.riscos.filter(aprov).length;
  const m2Bounds = bounds(input.riscos);
  const m2: BolinhaMissao = {
    id: "m2",
    label: "M2",
    nomeCurto: "Riscos",
    status:
      riscosAprovados > 0 ? "DONE" :
      input.riscos.length > 0 ? "DOING" : "IDLE",
    contador: input.riscos.length > 0 ? `${riscosAprovados}/${input.riscos.length}` : undefined,
    duracaoEsperadaSeg: DURACOES_ESPERADAS_SEG.m2,
    inicioEm: m2Bounds.inicio?.toISOString(),
    ultimaAtividadeEm: m2Bounds.ultima?.toISOString(),
  };

  // M3 — GAP
  const m3Bounds = bounds(input.gapAnswers);
  const m3: BolinhaMissao = {
    id: "m3",
    label: "M3",
    nomeCurto: "GAP",
    status:
      input.gapAnswers.length >= 10 ? "DONE" :
      input.gapAnswers.length > 0 ? "DOING" : "IDLE",
    contador: `${input.gapAnswers.length}/10`,
    duracaoEsperadaSeg: DURACOES_ESPERADAS_SEG.m3,
    inicioEm: m3Bounds.inicio?.toISOString(),
    ultimaAtividadeEm: m3Bounds.ultima?.toISOString(),
  };

  // M4a — RIPD + Terceiros + DSR (mostra como 1 bolinha consolidada).
  // DONE quando os 3 estão preenchidos:
  //   • RIPD: ≥1 APROVADO
  //   • Terceiros: TODOS os operadores com cláusulas LGPD selecionadas
  //     (mesmo critério do `m4a_terceiros` da sidebar — alinhado pra não
  //     divergir entre as 2 telas. Antes era só `foiTocado`, que era frouxo
  //     demais: deixava o painel marcar ✓ enquanto a sidebar do participante
  //     mostrava o item como pendente).
  //   • DSR: ≥1 criada
  // DOING quando qualquer um foi tocado.
  const ripdAprovados = input.ripds.filter(aprov).length;
  const operadoresTocados = input.operadores.filter(foiTocado);
  const operadoresCompletos =
    input.operadores.length > 0 &&
    input.operadores.every((o) => (o.clausulasSelecionadas?.length ?? 0) > 0);
  const m4aDone =
    ripdAprovados > 0 &&
    operadoresCompletos &&
    input.dsrs.length > 0;
  const m4aTouched =
    input.ripds.length > 0 || operadoresTocados.length > 0 || input.dsrs.length > 0;
  const m4aBounds = bounds([...input.ripds, ...operadoresTocados, ...input.dsrs]);
  const m4aTotal = (ripdAprovados > 0 ? 1 : 0) + (operadoresCompletos ? 1 : 0) + (input.dsrs.length > 0 ? 1 : 0);
  const m4a: BolinhaMissao = {
    id: "m4a",
    label: "M4a",
    nomeCurto: "RIPD · Terceiros · DSR",
    status: m4aDone ? "DONE" : m4aTouched ? "DOING" : "IDLE",
    contador: `${m4aTotal}/3`,
    duracaoEsperadaSeg:
      DURACOES_ESPERADAS_SEG.m4a_ripd + DURACOES_ESPERADAS_SEG.m4a_terceiros + DURACOES_ESPERADAS_SEG.m4a_dsr,
    inicioEm: m4aBounds.inicio?.toISOString(),
    ultimaAtividadeEm: m4aBounds.ultima?.toISOString(),
  };

  // M4b — Aviso
  const m4b: BolinhaMissao = {
    id: "m4b",
    label: "M4b",
    nomeCurto: "Aviso",
    status:
      input.aviso?.status === "PUBLICADO" ? "DONE" :
      input.aviso?.status === "RASCUNHO" ? "DOING" : "IDLE",
    duracaoEsperadaSeg: DURACOES_ESPERADAS_SEG.m4b,
    inicioEm: input.aviso?.createdAt?.toISOString(),
    ultimaAtividadeEm: input.aviso?.updatedAt?.toISOString(),
  };

  // M5 — Incidentes (movido de RASCUNHO conta como DONE)
  const incMovidos = input.incidentes.filter((i) => i.status !== "RASCUNHO").length;
  const m5Bounds = bounds(input.incidentes);
  const m5: BolinhaMissao = {
    id: "m5",
    label: "M5",
    nomeCurto: "Incidente",
    status:
      incMovidos > 0 ? "DONE" :
      input.incidentes.length > 0 ? "DOING" : "IDLE",
    contador: input.incidentes.length > 0 ? `${incMovidos}/${input.incidentes.length}` : undefined,
    duracaoEsperadaSeg: DURACOES_ESPERADAS_SEG.m5,
    inicioEm: m5Bounds.inicio?.toISOString(),
    ultimaAtividadeEm: m5Bounds.ultima?.toISOString(),
  };

  // M6 — Reflexão Final (não tem entidade no banco; entra DONE se tudo M1-M5 fechou)
  const tudoFechou =
    m1.status === "DONE" &&
    m2.status === "DONE" &&
    m3.status === "DONE" &&
    m4a.status === "DONE" &&
    m4b.status === "DONE" &&
    m5.status === "DONE";
  const m6: BolinhaMissao = {
    id: "m6",
    label: "Fim",
    nomeCurto: "Reflexão Final",
    status: tudoFechou ? "DONE" : "IDLE",
    duracaoEsperadaSeg: 15 * 60,
  };

  return [m1, m2, m3, m4a, m4b, m5, m6];
}

// Acha a "missão atual" (1ª que está DOING; se nenhuma, 1ª IDLE; se todas DONE, M6)
export function missaoAtual(timeline: BolinhaMissao[]): BolinhaMissao | null {
  const doing = timeline.find((b) => b.status === "DOING");
  if (doing) return doing;
  const idle = timeline.find((b) => b.status === "IDLE");
  if (idle) return idle;
  return timeline[timeline.length - 1] || null;
}

export function segundosNaMissaoAtual(b: BolinhaMissao | null): number | null {
  if (!b?.inicioEm) return null;
  return Math.floor((Date.now() - new Date(b.inicioEm).getTime()) / 1000);
}
