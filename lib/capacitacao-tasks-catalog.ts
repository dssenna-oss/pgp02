/**
 * Catálogo de tarefas de sensibilização (Checkpoint 18 — botão "Importar
 * checklist"). 18 tarefas organizadas pelos 5 eixos do programa de
 * capacitação permanente, baseadas no documento de referência e na LGPD.
 *
 * Cada item gera uma `Task` em /dashboard/tarefas com:
 *   - title prefixado pelo eixo
 *   - category: "Capacitação"
 *   - description: contexto operacional
 *   - dueDate: null (DPO define depois)
 */

import type { CapacitacaoEixo } from "@/lib/capacitacao-helpers";

export interface CapacitacaoTaskTemplate {
  /** Slug único pra dedup idempotente */
  slug: string;
  eixo: CapacitacaoEixo;
  title: string;
  description: string;
}

export const CAPACITACAO_TASK_CATALOG: ReadonlyArray<CapacitacaoTaskTemplate> = [
  // ===== ONBOARDING (3) =====
  {
    slug: "onboarding-modulo-boas-vindas",
    eixo: "ONBOARDING",
    title: "Criar Módulo de Boas-vindas LGPD (vídeo/e-learning)",
    description:
      "Treinamento obrigatório antes do acesso aos sistemas da empresa. Conteúdo: conceitos básicos da LGPD, direitos dos titulares, canais de denúncia interna. Aplicar a TODOS os novos colaboradores e prestadores de serviço (Art. 41§2º I).",
  },
  {
    slug: "onboarding-termo-confidencialidade",
    eixo: "ONBOARDING",
    title: "Implementar Termo de Confidencialidade na contratação",
    description:
      "Inserir cláusula explícita de proteção de dados no contrato de admissão. Promover sessão de explicação prática dos deveres de sigilo descritos no contrato. Vincular ao processo de RH.",
  },
  {
    slug: "onboarding-kit-boas-vindas",
    eixo: "ONBOARDING",
    title: "Produzir Kit de Boas-vindas Digital",
    description:
      "Guia de bolso com: (1) contatos do DPO/Encarregado, (2) os 10 mandamentos da privacidade na empresa, (3) exemplos práticos de erros comuns, (4) canais oficiais para dúvidas.",
  },

  // ===== PÍLULAS (3) =====
  {
    slug: "pilulas-newsletter-mensal",
    eixo: "PILULAS",
    title: "Lançar Newsletter mensal \"Privacidade em Foco\"",
    description:
      "Boletim curto com: casos reais de mercado, erros comuns e como evitá-los, atualizações da ANPD. Periodicidade mensal. Distribuição pra TODOS os colaboradores via e-mail.",
  },
  {
    slug: "pilulas-wallpaper-informativo",
    eixo: "PILULAS",
    title: "Criar wallpaper / proteção de tela com lembretes de privacidade",
    description:
      "Aproveitar as máquinas corporativas pra exibir lembretes rápidos rotativos (ex: \"Bloqueie sua tela ao sair da mesa\", \"Pense antes de copiar dados\"). Padronizar arte em coordenação com Marketing.",
  },
  {
    slug: "pilulas-canal-slack",
    eixo: "PILULAS",
    title: "Abrir canal Slack/Teams sobre LGPD",
    description:
      "Espaço dedicado pra dúvidas rápidas, compartilhamento de boas práticas e divulgação de novidades. Moderado pelo DPO ou Auxiliar designado.",
  },

  // ===== PRÁTICA / GAMIFICAÇÃO (3) =====
  {
    slug: "pratica-simulado-phishing",
    eixo: "PRATICA",
    title: "Programar primeiro Simulado de Phishing",
    description:
      "Envio de e-mails falsos controlados pela TI pra testar a atenção da equipe. Quem clica recebe reforço educativo imediato (não punitivo). Recomendado: 4× ao ano. Engajamento típico: 70%+ de participação após 2 ciclos.",
  },
  {
    slug: "pratica-quiz-mensal",
    eixo: "PRATICA",
    title: "Lançar Quiz mensal premiado (gamificação)",
    description:
      "Competição entre departamentos sobre regras de privacidade — usar Kahoot, Mentimeter ou ferramenta similar. Premiação simbólica pro setor com maior taxa de acerto. Aumenta adesão sem ar de obrigação.",
  },
  {
    slug: "pratica-data-cleaning",
    eixo: "PRATICA",
    title: "Realizar Workshop de \"Data Cleaning\" (Mesas Limpas)",
    description:
      "Dia específico em que cada equipe revisa pastas (físicas e digitais) e descarta dados sem base legal vigente pra retenção. Reduz exposição e cumpre o princípio da minimização (Art. 6º III).",
  },

  // ===== DEPARTAMENTAL (4) =====
  {
    slug: "departamental-privacy-by-design",
    eixo: "DEPARTAMENTAL",
    title: "Workshop Privacy by Design — TI / Produto / Marketing",
    description:
      "Ensinar as equipes técnicas a construir sistemas já pensando na proteção de dados desde o desenho (Privacy by Design / by Default). Inclui revisão de fluxos, configurações default mais seguras, minimização e privacidade por padrão.",
  },
  {
    slug: "departamental-atendimento-titular",
    eixo: "DEPARTAMENTAL",
    title: "Treinamento Atendimento ao Titular (SAC)",
    description:
      "Capacitar SAC e atendimento pra identificar e encaminhar solicitações de titulares: acesso, retificação, anonimização, eliminação, portabilidade, oposição (Art. 18). Modelos de resposta + prazos legais.",
  },
  {
    slug: "departamental-diretoria",
    eixo: "DEPARTAMENTAL",
    title: "Capacitação Diretoria — Riscos jurídicos e governança",
    description:
      "Apresentação executiva pra C-level: dosimetria de penalidades (Art. 52§1º), responsabilidade solidária com operadores, cases recentes de sanções da ANPD, ROI de governança. Tone from the Top é determinante.",
  },
  {
    slug: "departamental-terceiros",
    eixo: "DEPARTAMENTAL",
    title: "Workshop com terceiros — Cláusulas e obrigações",
    description:
      "Sessão direcionada a operadores/prestadores de serviço sobre cláusulas contratuais LGPD, deveres de confidencialidade e limites do tratamento. Reduz risco de responsabilidade solidária por incidente do operador.",
  },

  // ===== MONITORAMENTO (3) =====
  {
    slug: "monitoramento-matriz-treinamento",
    eixo: "MONITORAMENTO",
    title: "Implementar Matriz de Treinamento (controle de conclusão)",
    description:
      "Planilha ou sistema que registra quem concluiu cada módulo, com data e percentual. Essencial como evidência em fiscalização da ANPD (Art. 52§1º VIII — dosimetria atenuante).",
  },
  {
    slug: "monitoramento-pesquisa-clima",
    eixo: "MONITORAMENTO",
    title: "Aplicar Pesquisa de Clima de Privacidade (anual)",
    description:
      "Questionário pra medir o quanto os colaboradores se sentem seguros e informados sobre o tema. Gera baseline e mede evolução ano a ano. Feedback orienta ajustes na campanha.",
  },
  {
    slug: "monitoramento-revisao-semestral",
    eixo: "MONITORAMENTO",
    title: "Revisão Semestral de conteúdo",
    description:
      "Atualizar materiais com base em novas guias orientativas da ANPD, jurisprudência e cases relevantes. Frequência mínima: 2× ao ano. Documentar versões revisadas (anexar ao Plano de Ação).",
  },

  // ===== ESTRATÉGICAS (2) =====
  {
    slug: "estrategica-guardioes-privacidade",
    eixo: "DEPARTAMENTAL",
    title: "Programa \"Guardiões da Privacidade\" — multiplicadores",
    description:
      "Identificar colaboradores influentes (incluindo veteranos) e dar treinamento avançado pra serem multiplicadores nos próprios departamentos. Veterano resistente aceita melhor orientação de colega de longa data do que de consultor externo.",
  },
  {
    slug: "estrategica-shadowing-dpo",
    eixo: "MONITORAMENTO",
    title: "Shadowing do DPO — observar rotina dos departamentos",
    description:
      "Encarregado passa tempo observando a rotina técnica dos setores. Identifica onde a complexidade do compliance não condiz com a realidade da operação — ajusta processo pra fazer sentido no fluxo de trabalho real, reduz resistência orgânica.",
  },
];
