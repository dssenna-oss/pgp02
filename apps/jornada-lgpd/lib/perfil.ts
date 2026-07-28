// Campos do Perfil da instituição — a fonte que preenche os documentos.
// `essencial` conta pra régua de completude mostrada na trilha.

import type { Instituicao } from "@prisma/client";

export type CampoPerfil = {
  campo: keyof Instituicao & string;
  label: string;
  placeholder: string;
  essencial: boolean;
};

export const CAMPOS_PERFIL: CampoPerfil[] = [
  { campo: "nome", label: "Nome da instituição", placeholder: "Prefeitura Municipal de …", essencial: true },
  { campo: "tipo", label: "Tipo de órgão", placeholder: "Prefeitura · Câmara · Autarquia · Tribunal…", essencial: true },
  { campo: "cnpj", label: "CNPJ", placeholder: "00.000.000/0001-00", essencial: true },
  { campo: "endereco", label: "Endereço da sede", placeholder: "Av. Principal, 100 — Centro", essencial: true },
  { campo: "cidade", label: "Cidade", placeholder: "Vitória", essencial: true },
  { campo: "uf", label: "UF", placeholder: "ES", essencial: true },
  { campo: "site", label: "Site oficial", placeholder: "www.instituicao.gov.br", essencial: false },
  { campo: "autoridadeNome", label: "Autoridade máxima — nome", placeholder: "Quem assina Ato e Portaria", essencial: true },
  { campo: "autoridadeCargo", label: "Autoridade máxima — cargo", placeholder: "Prefeito(a) Municipal", essencial: true },
  { campo: "dpoNome", label: "Encarregado(a) (DPO) — nome", placeholder: "Nome completo", essencial: true },
  { campo: "dpoEmail", label: "Encarregado(a) — e-mail", placeholder: "dpo@instituicao.gov.br", essencial: true },
  { campo: "dpoTelefone", label: "Encarregado(a) — telefone", placeholder: "(00) 0000-0000", essencial: true },
  { campo: "dpoSubstituto", label: "Encarregado(a) substituto(a)", placeholder: "Nome (opcional, boa prática)", essencial: false },
  { campo: "canalTitularUrl", label: "Canal do titular (se houver)", placeholder: "Link do formulário de direitos do titular", essencial: false },
];

export function completudePerfil(inst: Partial<Instituicao>): { feitos: number; total: number } {
  const essenciais = CAMPOS_PERFIL.filter((c) => c.essencial);
  const feitos = essenciais.filter((c) => String((inst as any)[c.campo] ?? "").trim().length > 0).length;
  return { feitos, total: essenciais.length };
}
