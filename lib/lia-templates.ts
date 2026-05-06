/**
 * Templates seed da LIA (Checkpoint 21).
 *
 * Define a estrutura de perguntas que aparece no editor de LIA — labels,
 * dicas explicativas, tipo de campo (texto livre / radio / checkbox) e
 * opções pra escolhas categóricas. Usado pelo `<LiaEditor>` pra renderizar
 * o formulário sem hardcodar perguntas no JSX.
 *
 * Manter sincronizado com `LiaData` em `lib/lia-helpers.ts`.
 */

import type { LiaData } from "./lia-helpers";

export type FieldType = "textarea" | "radio" | "checkbox-group";

export interface LiaQuestion {
  /** Caminho dot-notation no LiaData. Ex.: "s1.interesseDescricao" */
  path: string;
  /** Pergunta exibida ao usuário. */
  label: string;
  /** Texto auxiliar abaixo da label (dica/explicação/base legal). */
  hint?: string;
  /** Obrigatória pra considerar a etapa "completa". */
  required?: boolean;
  /** Tipo do campo. */
  type: FieldType;
  /** Opções pra `radio` (label + value). */
  options?: ReadonlyArray<{ value: string; label: string; tone?: "ok" | "warning" | "danger" }>;
  /** Sub-checkboxes pra `checkbox-group` (path → label). */
  checkboxes?: ReadonlyArray<{ key: string; label: string }>;
  /** Marca a pergunta como "verificação bloqueante" (visual destacado). */
  blocking?: boolean;
}

export interface LiaSectionTemplate {
  key: keyof LiaData & `s${number}`;
  title: string;
  subtitle: string;
  questions: ReadonlyArray<LiaQuestion>;
}

export const LIA_TEMPLATE: ReadonlyArray<LiaSectionTemplate> = [
  // ============================================================
  // Etapa 1 — Teste de Finalidade
  // ============================================================
  {
    key: "s1",
    title: "Teste de Finalidade",
    subtitle:
      "Avaliação se o legítimo interesse pretendido é legítimo, lícito e claramente articulado, conforme exigido pelo Art. 10 da LGPD.",
    questions: [
      {
        path: "s1.interesseDescricao",
        label: "Descreva o legítimo interesse pretendido neste tratamento",
        hint:
          "Articule de forma clara e específica qual interesse a organização busca atender. Não pode ser genérico (ex.: 'melhorar o negócio'). Bons exemplos: 'reduzir fraude em transações', 'comunicar novidades a clientes existentes'.",
        type: "textarea",
        required: true,
      },
      {
        path: "s1.interesseLicito",
        label: "O interesse é lícito (não viola lei, regulamento ou direito)?",
        hint: "Art. 5º LGPD + legislação setorial aplicável.",
        type: "radio",
        required: true,
        options: [
          { value: "sim", label: "Sim, é lícito", tone: "ok" },
          { value: "nao", label: "Não", tone: "danger" },
        ],
      },
      {
        path: "s1.interesseLicitoJustificativa",
        label: "Justifique a licitude do interesse",
        hint: "Cite leis, regulamentos ou políticas internas que ampararam a análise.",
        type: "textarea",
        required: true,
      },
      {
        path: "s1.interesseEspecifico",
        label: "Por que o interesse é específico (e não genérico)?",
        hint:
          "Detalhe o objetivo concreto. Quanto mais específico, mais defensável o legítimo interesse.",
        type: "textarea",
        required: true,
      },
      {
        path: "s1.previsaoLegal",
        label:
          "Há previsão legal, regulatória ou contratual que ampara este interesse?",
        hint:
          "Opcional. Quando existe (ex.: lei setorial, norma técnica), reforça a defensabilidade.",
        type: "textarea",
      },
    ],
  },

  // ============================================================
  // Etapa 2 — Teste de Necessidade
  // ============================================================
  {
    key: "s2",
    title: "Teste de Necessidade",
    subtitle:
      "Avaliação se o tratamento é necessário pra atingir a finalidade declarada, e se há alternativas menos invasivas aos direitos dos titulares.",
    questions: [
      {
        path: "s2.estritamenteNecessario",
        label: "O tratamento é estritamente necessário pra atingir a finalidade?",
        hint:
          "Justifique por que essa é a forma adequada de atingir o objetivo. Considere alternativas e diga por que não são suficientes.",
        type: "textarea",
        required: true,
      },
      {
        path: "s2.alternativaMenosInvasiva",
        label: "Há alternativa menos invasiva aos direitos dos titulares?",
        type: "radio",
        required: true,
        options: [
          { value: "sim_adotada", label: "Sim, e foi adotada", tone: "ok" },
          { value: "sim_inviavel", label: "Sim, mas não é viável", tone: "warning" },
          { value: "nao", label: "Não há alternativa", tone: "ok" },
        ],
      },
      {
        path: "s2.alternativaJustificativa",
        label: "Justifique a escolha da alternativa (ou a ausência de alternativa)",
        type: "textarea",
        required: true,
      },
      {
        path: "s2.dadosMinimosTratados",
        label: "Quais dados pessoais são tratados?",
        hint:
          "Liste os campos coletados e justifique cada um. Princípio da minimização (Art. 6º III LGPD): só o estritamente necessário.",
        type: "textarea",
        required: true,
      },
      {
        path: "s2.minimizacao",
        label: "Práticas de minimização aplicadas",
        hint: "Marque as que se aplicam ao tratamento.",
        type: "checkbox-group",
        checkboxes: [
          { key: "avaliouEssenciais", label: "Avaliamos quais campos são realmente essenciais" },
          { key: "removeuOpcionais", label: "Removemos campos opcionais não-essenciais" },
          { key: "pseudonimizou", label: "Aplicamos pseudonimização quando possível" },
          { key: "definiuRetencao", label: "Definimos prazo de retenção compatível com a finalidade" },
        ],
      },
      {
        path: "s2.dadosSensiveis",
        label: "🚨 Verificação bloqueante: o tratamento envolve DADOS SENSÍVEIS?",
        hint:
          "Dados sensíveis (origem racial, convicção religiosa, opinião política, saúde, vida sexual, biometria, etc.) NÃO podem usar legítimo interesse — Art. 11 LGPD exige consentimento específico ou hipóteses do §2º.",
        type: "radio",
        required: true,
        blocking: true,
        options: [
          { value: "sim", label: "Sim — preciso mudar a base legal", tone: "danger" },
          { value: "nao", label: "Não — apenas dados comuns", tone: "ok" },
        ],
      },
      {
        path: "s2.criancaAdolescente",
        label: "🚨 Verificação bloqueante: o tratamento envolve dados de crianças/adolescentes?",
        hint:
          "Crianças (até 12 anos) e adolescentes têm regime especial — Art. 14 LGPD exige consentimento específico de pelo menos um dos pais ou responsável. Legítimo interesse é vedado.",
        type: "radio",
        required: true,
        blocking: true,
        options: [
          { value: "sim", label: "Sim — preciso mudar a base legal", tone: "danger" },
          { value: "nao", label: "Não — apenas titulares adultos", tone: "ok" },
        ],
      },
    ],
  },

  // ============================================================
  // Etapa 3 — Teste de Balanceamento
  // ============================================================
  {
    key: "s3",
    title: "Teste de Balanceamento",
    subtitle:
      "Avaliação final: o legítimo interesse do controlador prevalece sobre os direitos e expectativas dos titulares? Quais salvaguardas mitigam impactos negativos?",
    questions: [
      {
        path: "s3.direitosTitulares",
        label: "Quais direitos dos titulares são potencialmente afetados?",
        hint:
          "Considere: privacidade, autodeterminação informativa, liberdade de não ser perfilado, etc. Art. 17 e 18 LGPD listam direitos garantidos.",
        type: "textarea",
        required: true,
      },
      {
        path: "s3.expectativaTitulares",
        label: "Os titulares poderiam razoavelmente esperar este tratamento?",
        hint:
          "Pense no contexto da relação: cliente que comprou produto espera comunicação relacionada. Mas dados de cadastro não geram expectativa de revenda a terceiros.",
        type: "radio",
        required: true,
        options: [
          { value: "esperam", label: "Sim, é razoável esperar", tone: "ok" },
          { value: "incerto", label: "Incerto / depende do segmento", tone: "warning" },
          { value: "nao_esperam", label: "Não esperariam — surpresa", tone: "danger" },
        ],
      },
      {
        path: "s3.expectativaJustificativa",
        label: "Justifique a expectativa do titular",
        hint: "Como você sabe? Pesquisa, contexto da relação, normas do setor?",
        type: "textarea",
        required: true,
      },
      {
        path: "s3.impactoPositivo",
        label: "Impactos positivos do tratamento (pro titular ou pra sociedade)",
        hint:
          "O que o titular ganha? Quais externalidades positivas existem (segurança coletiva, prevenção a fraude, etc.)?",
        type: "textarea",
        required: true,
      },
      {
        path: "s3.impactoNegativo",
        label: "Impactos negativos / riscos pros titulares",
        hint:
          "Reconheça honestamente: incômodo, perda de privacidade, vazamento potencial, perfilagem indesejada, etc.",
        type: "textarea",
        required: true,
      },
      {
        path: "s3.salvaguardas",
        label: "Salvaguardas implementadas pra mitigar impactos",
        hint: "Marque as que se aplicam ao tratamento.",
        type: "checkbox-group",
        checkboxes: [
          { key: "criptografia", label: "Criptografia em trânsito e/ou em repouso" },
          { key: "anonimizacao", label: "Anonimização ou pseudonimização quando aplicável" },
          { key: "optOut", label: "Mecanismo claro de opt-out / oposição" },
          { key: "transparencia", label: "Transparência ativa (aviso de privacidade detalhado)" },
          { key: "auditoria", label: "Logs e auditoria do tratamento" },
        ],
      },
      {
        path: "s3.decisaoFinal",
        label: "Decisão final: o legítimo interesse prevalece?",
        hint:
          "Se 'não prevalece', o tratamento NÃO pode usar Art. 7º IX — escolha outra base legal ou suspenda o tratamento.",
        type: "radio",
        required: true,
        options: [
          { value: "prevalece", label: "Sim, o legítimo interesse prevalece", tone: "ok" },
          { value: "nao_prevalece", label: "Não — preciso revisar a base legal", tone: "danger" },
        ],
      },
      {
        path: "s3.decisaoJustificativa",
        label: "Justificativa da decisão final",
        hint:
          "Sintetize o balanceamento: por que o interesse legítimo é proporcional aos direitos do titular, considerando salvaguardas e impactos.",
        type: "textarea",
        required: true,
      },
    ],
  },
];
