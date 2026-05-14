/**
 * Definições das seções de um Aviso de Privacidade por Serviço.
 *
 * Vocabulário fechado — `lib/aviso-privacidade-builder.ts` percorre estas
 * definições em ordem pra montar o markdown. UI mostra cada uma como
 * checkbox no editor split do DPO.
 *
 * `required: true` significa que a seção é obrigatória pelo Art. 9º
 * LGPD + orientação ANPD e não pode ser desativada (checkbox travado).
 */

export type AvisoSectionId =
  | "controlador"
  | "finalidade"
  | "base_legal"
  | "dados_coletados"
  | "compartilhamento"
  | "retencao"
  | "direitos_titular"
  | "seguranca"
  | "transferencia_internacional"
  | "cookies";

export interface AvisoSectionDef {
  id: AvisoSectionId;
  title: string;
  /** Frase curta mostrada abaixo do título no checkbox da UI. */
  description: string;
  /** True = trava o checkbox em LIGADO. */
  required: boolean;
  /** Ordem absoluta no documento final. */
  order: number;
}

export const AVISO_SECTIONS: readonly AvisoSectionDef[] = [
  {
    id: "controlador",
    title: "Quem é o controlador dos seus dados",
    description: "Organização + contato do Encarregado (DPO). Sempre presente.",
    required: true,
    order: 1,
  },
  {
    id: "finalidade",
    title: "Pra que servem seus dados neste serviço",
    description: 'Vem do campo "Finalidade" do Inventário.',
    required: false,
    order: 2,
  },
  {
    id: "base_legal",
    title: "Em que base legal nos apoiamos",
    description: "Vem dos campos Base Legal (Art. 7º) e Sensíveis (Art. 11).",
    required: false,
    order: 3,
  },
  {
    id: "dados_coletados",
    title: "Quais dados pessoais coletamos",
    description: 'Vem dos campos "Dados Pessoais" do Inventário.',
    required: false,
    order: 4,
  },
  {
    id: "compartilhamento",
    title: "Com quem podemos compartilhar",
    description: 'Vem dos campos "Compartilhamento" do Inventário.',
    required: false,
    order: 5,
  },
  {
    id: "retencao",
    title: "Por quanto tempo guardamos seus dados",
    description: 'Vem do campo "Retenção" do Inventário.',
    required: false,
    order: 6,
  },
  {
    id: "direitos_titular",
    title: "Seus direitos como titular dos dados",
    description: "Lista do Art. 18 LGPD + canal pra exercer (DPO). Sempre presente.",
    required: true,
    order: 7,
  },
  {
    id: "seguranca",
    title: "Como protegemos seus dados",
    description: 'Vem do campo "Segurança" do Inventário.',
    required: false,
    order: 8,
  },
  {
    id: "transferencia_internacional",
    title: "Transferência internacional de dados",
    description: "Inclua se houver dados sendo enviados pra fora do Brasil.",
    required: false,
    order: 9,
  },
  {
    id: "cookies",
    title: "Cookies e tecnologias do serviço",
    description: "Inclua se o serviço usa cookies próprios.",
    required: false,
    order: 10,
  },
] as const;

export const AVISO_SECTION_BY_ID = Object.fromEntries(
  AVISO_SECTIONS.map((s) => [s.id, s] as const),
) as Record<AvisoSectionId, AvisoSectionDef>;

/**
 * Estado de inclusão por seção, salvo em `ServicePrivacyNotice.includedSections`.
 * `content` opcional fica reservado pra evolução futura (override
 * de texto por seção); por enquanto o builder ignora.
 */
export type IncludedSections = Partial<
  Record<AvisoSectionId, { included: boolean; content?: string }>
>;

/**
 * Default das seções pra um Aviso recém-criado: tudo ligado, exceto
 * `transferencia_internacional` e `cookies` (incluídas só sob demanda
 * pra evitar texto "não se aplica" no documento público).
 */
export function defaultIncludedSections(): IncludedSections {
  const out: IncludedSections = {};
  for (const s of AVISO_SECTIONS) {
    const includeDefault =
      s.required ||
      (s.id !== "transferencia_internacional" && s.id !== "cookies");
    out[s.id] = { included: includeDefault };
  }
  return out;
}

/**
 * Aplica regra de seção obrigatória: força included=true em required,
 * preserva o resto.
 */
export function normalizeIncludedSections(
  raw: IncludedSections | null | undefined,
): IncludedSections {
  const base = defaultIncludedSections();
  if (!raw || typeof raw !== "object") return base;
  for (const s of AVISO_SECTIONS) {
    const entry = (raw as any)[s.id];
    if (entry && typeof entry === "object") {
      base[s.id] = {
        included: s.required ? true : Boolean(entry.included),
        ...(typeof entry.content === "string" ? { content: entry.content } : {}),
      };
    } else if (s.required) {
      base[s.id] = { included: true };
    }
  }
  return base;
}
