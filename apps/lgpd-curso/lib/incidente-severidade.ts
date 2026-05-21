// Classificação objetiva de severidade de incidente (Frente 2 — PRI).
// Substitui o "achismo": o DPO responde fatores objetivos e a severidade é
// calculada. Régua aprovada pelo DPO em 2026-05-20, baseada na Resolução
// CD/ANPD nº 15/2024 (gatilho de "risco ou dano relevante").

import type { FormularioAnpd } from "@/lib/incidente-formulario";
import { OPCOES_NATUREZA_DADOS } from "@/lib/incidente-formulario";

export type Severidade = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

export type SeveridadeFatores = {
  houveAcesso: boolean; // houve acesso/perda/exposição efetiva? (não = quase-incidente)
  sensivel: boolean; // dado sensível afetado
  vulneravel: boolean; // titulares vulneráveis (menores/idosos)
  volume: boolean; // volume considerável de titulares
  exposicao: boolean; // exposição pública ou irreversível
};

export const FATORES_VAZIOS: SeveridadeFatores = {
  houveAcesso: false,
  sensivel: false,
  vulneravel: false,
  volume: false,
  exposicao: false,
};

export const FATORES_AGRAVANTES: {
  id: keyof SeveridadeFatores;
  rotulo: string;
  descricao: string;
}[] = [
  {
    id: "sensivel",
    rotulo: "Dado sensível afetado",
    descricao: "Saúde, biometria, origem racial, religião, opinião política ou vida sexual.",
  },
  {
    id: "vulneravel",
    rotulo: "Titulares vulneráveis",
    descricao: "Crianças, adolescentes ou idosos entre os afetados.",
  },
  {
    id: "volume",
    rotulo: "Volume considerável",
    descricao: "Centenas de titulares afetados ou mais.",
  },
  {
    id: "exposicao",
    rotulo: "Exposição pública ou irreversível",
    descricao: "Dado publicado na internet ou vazado sem recuperação possível.",
  },
];

// Régua: sem acesso efetivo = quase-incidente contido = BAIXA.
// Com acesso: 0 agravantes = MÉDIA, 1 = ALTA, 2 ou mais = CRÍTICA.
export function calcularSeveridade(f: SeveridadeFatores): Severidade {
  if (!f.houveAcesso) return "BAIXA";
  const agravantes = contarAgravantes(f);
  if (agravantes >= 2) return "CRITICA";
  if (agravantes === 1) return "ALTA";
  return "MEDIA";
}

export function contarAgravantes(f: SeveridadeFatores): number {
  return [f.sensivel, f.vulneravel, f.volume, f.exposicao].filter(Boolean).length;
}

// Pré-marca sensível/vulnerável a partir do que o DPO já informou no
// formulário ANPD do incidente — reduz retrabalho.
export function prefillFatores(
  base: SeveridadeFatores,
  formularioAnpd: FormularioAnpd | null | undefined,
): SeveridadeFatores {
  if (!formularioAnpd) return base;
  const natureza = formularioAnpd.naturezaDados || [];
  const categorias = formularioAnpd.titularesCategorias || [];
  const idsSensiveis = OPCOES_NATUREZA_DADOS.filter((o) => o.sensivel).map((o) => o.id);
  const temSensivel = natureza.some((id) => idsSensiveis.includes(id));
  const temVulneravel =
    natureza.includes("MENORES") ||
    natureza.includes("IDOSOS") ||
    categorias.includes("MENORES") ||
    categorias.includes("IDOSOS");
  return {
    ...base,
    sensivel: base.sensivel || temSensivel,
    vulneravel: base.vulneravel || temVulneravel,
  };
}

// Normaliza o JSON cru do banco pra SeveridadeFatores (ou null se ausente).
export function parseFatores(raw: unknown): SeveridadeFatores | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    houveAcesso: !!r.houveAcesso,
    sensivel: !!r.sensivel,
    vulneravel: !!r.vulneravel,
    volume: !!r.volume,
    exposicao: !!r.exposicao,
  };
}
