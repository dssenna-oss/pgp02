// Conteúdo institucional das fases do PGP — versão pro app de curso.
//
// Fonte: o app principal (lgpd-pgp.vercel.app) tem cada fase montada em
// components/fases/fase-N-content.tsx via PhaseDescriptionManager (texto
// padrão hardcoded no defaultContent), PhaseChecklist (7 seções hardcoded),
// PhaseInfoManager (Como Proceder, editável por órgão — vem do banco) e
// PhasePracticalLinks (cards do Coloque em Prática, também por órgão).
//
// Aqui no app de curso, replicamos a parte HARDCODED (Descrição + Checklist
// têm fonte limpa) e ESCREVEMOS o Como Proceder + Coloque em Prática com
// tom didático do curso, mencionando Vegas/PM/CM e adicionando a "dica de
// ouro" da Carta de Serviços como fonte de descoberta de processos.
//
// Renderizado por `/facilitador/conteudo-fase/[fase]` — facilitador projeta
// no telão antes da missão correspondente.

export type CalloutBlock = {
  tom: "aviso" | "info" | "sucesso" | "dica";
  titulo?: string;
  texto: string;
};

export type DescricaoBloco =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "callout"; callout: CalloutBlock };

export type ChecklistSecao = {
  id: string;
  titulo: string;
  itens: { id: string; texto: string }[];
};

export type PraticaCard = {
  emoji: string;
  titulo: string;
  descricao: string;
  badge?: string;       // "Missão 1", "💡 Dica de ouro"
  href?: string;        // se navegável dentro do curso
  destaque?: boolean;   // visual amarelo/laranja pra ficar em evidência
  detalhe?: string;     // texto extra que abre no card
};

export type EbookFase = {
  titulo: string;
  descricao: string;
  url: string;
};

export type ConteudoFase = {
  slug: string;
  numero: number;
  titulo: string;
  subtitulo: string;
  missao: string;        // Ex.: "antes das Missões M1 e M2"
  // Lista numerada — espelha o card "E-books Interativos" da prod, que
  // mostra "1, 2, 3..." pra cada e-book. Pra Fase 3 mantemos a Trilha
  // (visão geral) + o e-book específico. Pras Fases 4-7 fica SÓ o
  // específico da fase, conforme orientação do user.
  ebooks: EbookFase[];
  descricao: DescricaoBloco[];
  comoProc: DescricaoBloco[];
  checklist: ChecklistSecao[];
  pratica: PraticaCard[];
};

// ─── FASE 3 — Mapeamento e Análise de Riscos ──────────────────────────────

const FASE_3: ConteudoFase = {
  slug: "fase-3",
  numero: 3,
  titulo: "Fase 3 — Mapeamento e Análise de Riscos",
  subtitulo:
    "Mapeamento completo dos processos e avaliação dos riscos de privacidade e segurança",
  missao: "Antes das Missões M1 (Inventário) e M2 (Análise de Riscos)",
  ebooks: [
    {
      titulo: "Trilha LGPD Descomplicada — Clube do Servidor",
      descricao:
        "Biblioteca completa de e-books interativos sobre as 7 fases do PGP. Visão geral, com vídeos embutidos e resumos.",
      url: "https://heyzine.com/shelf/trilha_lgpd_descomplicada.html",
    },
    {
      titulo: "PGP — Fase 3: Mapeamento de Dados e Análise de Riscos",
      descricao:
        "E-book específico desta fase. Resumo: o processo de mapeamento dos dados pessoais, ferramenta fundamental pra apoiar a gestão de riscos de privacidade e segurança da informação — identificação de dados de cidadãos, colaboradores e fornecedores externos.",
      url: "https://heyzine.com/flip-book/a8d5f1e986.html",
    },
  ],
  descricao: [
    {
      tipo: "paragrafo",
      texto:
        "Esta fase combina o mapeamento detalhado de todos os processos de tratamento de dados pessoais com a análise dos riscos associados a cada tratamento.",
    },
    {
      tipo: "subtitulo",
      texto: "Parte 1: Mapeamento de Processos",
    },
    {
      tipo: "paragrafo",
      texto: "O mapeamento deve documentar para cada processo de tratamento:",
    },
    {
      tipo: "lista",
      itens: [
        "Quais dados pessoais são coletados",
        "Como são coletados (formulários, contratos, sistemas)",
        "Para que finalidade são utilizados",
        "Qual a base legal (consentimento, contrato, obrigação legal, etc.)",
        "Onde são armazenados",
        "Quem tem acesso a esses dados",
        "Por quanto tempo são mantidos",
        "Com quem são compartilhados",
        "Como são descartados",
      ],
    },
    {
      tipo: "subtitulo",
      texto: "Parte 2: Análise de Riscos",
    },
    {
      tipo: "paragrafo",
      texto:
        "Para cada processo mapeado, avalie os riscos de segurança e privacidade:",
    },
    {
      tipo: "lista",
      itens: [
        "Riscos de vazamento ou acesso não autorizado",
        "Adequação das medidas de segurança existentes",
        "Vulnerabilidades técnicas e organizacionais",
        "Impacto potencial sobre os titulares em caso de incidente",
        "Riscos regulatórios e reputacionais",
      ],
    },
    {
      tipo: "callout",
      callout: {
        tom: "aviso",
        titulo: "Importante",
        texto:
          "O mapeamento deve incluir TODOS os departamentos da Instituição. Cada área trata dados de forma diferente e todas devem estar em conformidade. A análise de riscos deve ser realizada para cada processo mapeado.",
      },
    },
    {
      tipo: "subtitulo",
      texto: "Resultado Esperado",
    },
    {
      tipo: "paragrafo",
      texto:
        "Ao final desta fase, a Instituição deve ter um Inventário de Dados completo e um Relatório de Análise de Riscos, documentando todo o ciclo de vida dos dados pessoais e os riscos associados a cada tratamento.",
    },
  ],
  comoProc: [
    {
      tipo: "paragrafo",
      texto:
        "A Fase 3 é onde a maioria dos órgãos públicos tropeça — não por falta de método, mas por subestimar o tamanho do mapeamento. Algumas orientações práticas pra esta fase no curso:",
    },
    {
      tipo: "subtitulo",
      texto: "1. Comece pelos processos que mais expõem o cidadão",
    },
    {
      tipo: "paragrafo",
      texto:
        "Em Vegas, escolhemos 2 processos críticos por órgão pro jogo (Posto de Saúde + Estagiários para a Prefeitura · Tribuna Livre + Ouvidoria para a Câmara). Em um caso real, a recomendação é a mesma — comece pelos processos com dados sensíveis, dados de crianças, ou grande volume de cidadãos atendidos. A vitória rápida vem desses.",
    },
    {
      tipo: "subtitulo",
      texto: "2. A ordem dentro de cada processo importa",
    },
    {
      tipo: "paragrafo",
      texto:
        "Não comece pela base legal — comece pelos TITULARES. A pergunta certa é: quem é o cidadão que entrega o dado? Crianças? Idosos? Pacientes? Esse 'quem' muda toda a análise depois: base legal especial, retenção mais curta, medidas de segurança reforçadas.",
    },
    {
      tipo: "callout",
      callout: {
        tom: "info",
        titulo: "A ordem certa do Inventário",
        texto:
          "titulares → dados coletados → finalidade → base legal → retenção → compartilhamentos → medidas de segurança",
      },
    },
    {
      tipo: "subtitulo",
      texto: "3. Riscos são concretos, não abstratos",
    },
    {
      tipo: "paragrafo",
      texto:
        "Risco não é 'pode haver vazamento'. É 'se o pendrive com 2.300 prontuários sair daqui, esses pacientes sofrem chantagem, estigma, ou perdem emprego'. Conecte cada risco a uma consequência concreta pro titular — isso muda como o grupo posiciona o risco na matriz 3×3.",
    },
    {
      tipo: "subtitulo",
      texto: "4. Aprovação pelo DPO é parte do método",
    },
    {
      tipo: "paragrafo",
      texto:
        "No app, o DPO APROVA ou DEVOLVE COM MOTIVO cada processo do Inventário. Devolver não é punição — é parte do método. Um motivo bem escrito na devolução vira aprendizado pro Contribuidor refazer.",
    },
  ],
  checklist: [
    {
      id: "preparacao",
      titulo: "1. Preparação para o Mapeamento",
      itens: [
        { id: "identificar-departamentos", texto: "Identifique todos os departamentos que coletam/tratam dados pessoais" },
        { id: "agendar-entrevistas", texto: "Agende entrevistas com gestores de cada área" },
        { id: "preparar-questionarios", texto: "Prepare questionários de mapeamento para cada departamento" },
        { id: "definir-metodologia", texto: "Defina a metodologia de documentação (planilhas, software específico, etc.)" },
      ],
    },
    {
      id: "mapeamento-por-area",
      titulo: "2. Mapeamento por Área da Instituição",
      itens: [
        { id: "mapear-rh", texto: "Mapeie tratamentos de dados do RH (servidores, candidatos a estágio)" },
        { id: "mapear-atendimento", texto: "Mapeie tratamentos do Atendimento ao Cidadão (formulários, ouvidoria)" },
        { id: "mapear-comunicacao", texto: "Mapeie tratamentos da Comunicação (transmissões, redes sociais, newsletters)" },
        { id: "mapear-ti", texto: "Mapeie sistemas e bancos de dados da TI" },
        { id: "mapear-financeiro", texto: "Mapeie tratamentos do Financeiro (dados bancários, transações)" },
        { id: "mapear-outras-areas", texto: "Mapeie outras áreas relevantes (saúde, plenário, secretarias, etc.)" },
      ],
    },
    {
      id: "documentacao-processos",
      titulo: "3. Documentação dos Processos",
      itens: [
        { id: "tipos-dados", texto: "Liste tipos de dados pessoais coletados (cadastrais, sensíveis, financeiros)" },
        { id: "finalidades", texto: "Documente finalidades de cada coleta" },
        { id: "bases-legais", texto: "Identifique base legal para cada tratamento (Art. 7º / Art. 11)" },
        { id: "fluxos-dados", texto: "Mapeie fluxos de dados (origem → processamento → destino)" },
        { id: "retencao", texto: "Defina prazos de retenção para cada tipo de dado" },
        { id: "compartilhamentos", texto: "Liste compartilhamentos com terceiros (operadores, controladores conjuntos)" },
      ],
    },
    {
      id: "analise-riscos",
      titulo: "4. Análise de Riscos",
      itens: [
        { id: "identificar-riscos", texto: "Identifique riscos de privacidade para cada processo" },
        { id: "classificar-probabilidade", texto: "Classifique probabilidade (baixa, média, alta) na matriz 3×3" },
        { id: "classificar-impacto", texto: "Classifique impacto (baixo, médio, alto) na matriz 3×3" },
        { id: "documentar-vulnerabilidades", texto: "Documente vulnerabilidades técnicas e organizacionais" },
        { id: "avaliar-controles", texto: "Avalie controles de segurança existentes" },
      ],
    },
    {
      id: "validacao-aprovacao",
      titulo: "5. Validação e Aprovação",
      itens: [
        { id: "revisar-gestores", texto: "Revise mapeamento com gestores das áreas" },
        { id: "validar-juridico", texto: "Valide bases legais com Procuradoria/Jurídico" },
        { id: "aprovacao-dpo", texto: "DPO aprova processos no app (ou devolve com motivo)" },
        { id: "registrar-decisoes", texto: "Registre decisões em ata oficial do Comitê" },
      ],
    },
    {
      id: "manutencao",
      titulo: "6. Manutenção do Inventário",
      itens: [
        { id: "atualizar-mudancas", texto: "Atualize inventário a cada mudança de processo" },
        { id: "revisao-anual", texto: "Realize revisão anual completa" },
        { id: "novos-processos", texto: "Inclua novos processos antes de iniciar tratamento" },
      ],
    },
  ],
  pratica: [
    {
      emoji: "💡",
      titulo: "Carta de Serviços como fonte de descoberta",
      descricao:
        "A Carta de Serviços do órgão é uma fonte rica e muitas vezes ignorada de descoberta de processos. Cada serviço prestado ao cidadão envolve tratamento de dados pessoais por trás — e a Carta lista TODOS os serviços oferecidos pela Instituição.",
      badge: "💡 Dica de ouro do curso",
      destaque: true,
      detalhe:
        "Método prático: pegue a Carta de Serviços do seu órgão, leia serviço por serviço, e pergunte: 'pra prestar esse serviço, quais dados pessoais são coletados? de quem? por quanto tempo guardamos?'. Cada serviço vira potencialmente 1 processo no Inventário. No app principal (lgpd-pgp), o recurso 'Sugerir processos da Carta' faz isso automaticamente com IA — extrai o conteúdo da página da Carta de Serviços online e propõe processos pré-rascunhados pra você revisar e aprovar.",
    },
    {
      emoji: "📦",
      titulo: "Inventário de Dados",
      descricao:
        "No jogo, cada grupo tem 2 processos pré-cadastrados pra completar (PM: Posto de Saúde + Estagiários · CM: Tribuna Livre + Ouvidoria). Contribuidores preenchem, DPO aprova ou devolve com motivo.",
      badge: "Missão 1 · 25 min",
      href: "/dashboard/inventario",
    },
    {
      emoji: "⚠️",
      titulo: "Análise de Riscos",
      descricao:
        "Para cada processo do Inventário, o grupo confirma 2-3 riscos sugeridos, posiciona na matriz 3×3 (Probabilidade × Impacto) e descreve plano de mitigação.",
      badge: "Missão 2 · 15 min",
      href: "/dashboard/riscos",
    },
  ],
};

// ─── PLACEHOLDERS — Fases 4 a 7 (preenchidas nas próximas fatias) ─────────

const FASE_4: ConteudoFase = {
  slug: "fase-4",
  numero: 4,
  titulo: "Fase 4 — GAP Analysis",
  subtitulo: "Análise de lacunas entre o estado atual e os requisitos da LGPD",
  missao: "Antes da Missão M3 (GAP Analysis)",
  ebooks: [
    {
      titulo: "PGP — Fase 4: GAP Analysis",
      descricao:
        "E-book específico desta fase. Diagnóstico das lacunas (gaps) entre o estado atual da Instituição e os requisitos da LGPD — base pra construir o Plano de Ação da Fase 5.",
      url: "https://heyzine.com/flip-book/80b29eeff6.html",
    },
  ],
  descricao: [
    {
      tipo: "paragrafo",
      texto:
        "Com base no mapeamento e análise de riscos da Fase 3, esta etapa identifica as lacunas (gaps) entre o estado atual da Instituição e os requisitos estabelecidos pela LGPD e boas práticas de proteção de dados.",
    },
    { tipo: "subtitulo", texto: "O que é GAP Analysis?" },
    {
      tipo: "paragrafo",
      texto:
        'É uma análise sistemática que compara o "estado atual" (AS-IS) com o "estado desejado" (TO-BE) de conformidade, identificando todas as lacunas que precisam ser endereçadas.',
    },
    { tipo: "subtitulo", texto: "Áreas Avaliadas" },
    {
      tipo: "lista",
      itens: [
        "Bases Legais: todos os tratamentos possuem base legal adequada e documentada?",
        "Transparência: as políticas e avisos de privacidade são completos e acessíveis?",
        "Direitos dos Titulares: há processos para atender às solicitações (Arts. 18 e 19)?",
        "Segurança: as medidas de segurança são adequadas aos riscos?",
        "Contratos: fornecedores e parceiros têm cláusulas adequadas (Art. 39)?",
        "Governança: há políticas, procedimentos e documentação adequados?",
        "Retenção: períodos de retenção estão definidos e respeitados?",
        "Treinamento: colaboradores estão capacitados e conscientizados?",
      ],
    },
    { tipo: "subtitulo", texto: "Priorização de Gaps" },
    { tipo: "paragrafo", texto: "As lacunas devem ser priorizadas considerando:" },
    {
      tipo: "lista",
      itens: [
        "Criticidade do risco associado",
        "Impacto potencial sobre os titulares",
        "Exposição a sanções regulatórias",
        "Esforço e custo de correção",
        "Dependências entre gaps",
      ],
    },
    {
      tipo: "callout",
      callout: {
        tom: "aviso",
        titulo: "Atenção",
        texto:
          "Esta análise é fundamental para priorizar as ações corretivas que serão implementadas na próxima fase (Plano de Ação). Seja completo e objetivo na identificação dos gaps, pois eles guiarão todo o plano de ação.",
      },
    },
    { tipo: "subtitulo", texto: "Resultado Esperado" },
    {
      tipo: "paragrafo",
      texto:
        "Ao final desta fase, a Instituição deve ter um Relatório de GAP Analysis completo, com todas as lacunas identificadas, classificadas e priorizadas, servindo de base para o Plano de Ação da próxima fase.",
    },
  ],
  comoProc: [
    {
      tipo: "paragrafo",
      texto:
        "GAP Analysis é a fase que SEPARA órgãos honestos dos que estão fingindo. A regra é simples: medir maturidade real vale mais que parecer maduro. Algumas orientações pra esta fase no curso:",
    },
    { tipo: "subtitulo", texto: "1. ADERENTE significa praticado, não previsto" },
    {
      tipo: "paragrafo",
      texto:
        'A pegadinha mais comum: marcar ADERENTE porque "existe uma política no papel". Não. ADERENTE é "está sendo PRATICADO de verdade, posso provar com um caso real dos últimos 12 meses". Política guardada em pasta de PDF que ninguém abre não é aderência — é decoração.',
    },
    {
      tipo: "callout",
      callout: {
        tom: "info",
        titulo: "Régua honesta de classificação",
        texto:
          "ADERENTE = praticado E documentado · PARCIAL = praticado mas inconsistente OU documentado mas não praticado · NÃO ADERENTE = não praticado, mesmo que esteja no papel",
      },
    },
    { tipo: "subtitulo", texto: "2. No curso, o pacote é enxuto — 10 controles" },
    {
      tipo: "paragrafo",
      texto:
        "Em uma adequação real, o GAP completo tem 119 controles em 28 domínios. Pra o jogo de 3h, curamos 10 controles que cobrem 5 áreas (Governança, Bases Legais, Direitos, Segurança, Incidentes) com 2 controles por área. A lição não é a profundidade — é o MÉTODO de classificar com honestidade.",
    },
    { tipo: "subtitulo", texto: "3. A linha de justificativa importa mais que a classificação" },
    {
      tipo: "paragrafo",
      texto:
        '"Não aderente" sem justificativa é confissão sem ação. "Não aderente — falta política de senhas formal; usuários compartilham logins administrativos" é insumo direto pro Plano de Ação. Capriche na justificativa: ela vira a primeira coluna do que o Plano vai resolver.',
    },
    { tipo: "subtitulo", texto: "4. Score baixo não é fracasso — é diagnóstico" },
    {
      tipo: "paragrafo",
      texto:
        "Score 30% honesto vale 10x mais que score 90% inflado. A ANPD não pune órgão por baixa maturidade declarada — pune por descumprimento sem reconhecimento. O órgão que documenta suas lacunas demonstra governança ativa; quem mascara, vira manchete quando algo dá errado.",
    },
    { tipo: "subtitulo", texto: "5. Apoio de outros setores é parte do método" },
    {
      tipo: "paragrafo",
      texto:
        'No app, controles podem ficar marcados como "APOIO PENDENTE" com indicação do setor solicitado (Procuradoria, TI, RH...). É honestidade institucional: nem todo controle o DPO consegue avaliar sozinho. No curso, observe quais grupos pedem apoio — é sinal de maturidade pedagógica, não de fraqueza.',
    },
  ],
  checklist: [
    {
      id: "preparacao-gap-analysis",
      titulo: "1. Preparação para GAP Analysis",
      itens: [
        { id: "revisar-inventario-riscos", texto: "Revise o inventário de dados e relatório de riscos da Fase 3" },
        { id: "definir-metodologia-gap", texto: "Defina a metodologia de análise de lacunas" },
        { id: "preparar-templates-gap", texto: "Prepare templates para documentação de gaps identificados" },
        { id: "estudar-requisitos-lgpd", texto: "Estude detalhadamente os requisitos da LGPD aplicáveis" },
      ],
    },
    {
      id: "gap-bases-legais",
      titulo: "2. GAP: Bases Legais e Consentimento",
      itens: [
        { id: "verificar-bases-legais", texto: "Verifique se todos os tratamentos possuem base legal adequada" },
        { id: "avaliar-consentimentos", texto: "Avalie se os consentimentos são coletados de forma válida (específico, livre, informado)" },
        { id: "verificar-documentacao-bases", texto: "Verifique se as bases legais estão documentadas para cada tratamento" },
        { id: "identificar-tratamentos-sem-base", texto: "Identifique tratamentos sem base legal clara" },
      ],
    },
    {
      id: "gap-transparencia",
      titulo: "3. GAP: Transparência e Direitos dos Titulares",
      itens: [
        { id: "avaliar-politica-privacidade", texto: "Avalie se a política de privacidade é completa e acessível" },
        { id: "verificar-avisos-coleta", texto: "Verifique se há avisos de privacidade em todos os pontos de coleta" },
        { id: "avaliar-processos-direitos", texto: "Avalie se há processos para atender direitos dos titulares (acesso, correção, exclusão)" },
        { id: "verificar-canal-titular", texto: "Verifique se há canal claro para solicitações de titulares" },
        { id: "avaliar-prazo-resposta", texto: "Avalie se há processo para responder solicitações no prazo legal" },
      ],
    },
    {
      id: "gap-seguranca",
      titulo: "4. GAP: Medidas de Segurança",
      itens: [
        { id: "verificar-controles-acesso", texto: "Verifique lacunas nos controles de acesso" },
        { id: "identificar-falta-criptografia", texto: "Identifique dados sensíveis não criptografados" },
        { id: "avaliar-monitoramento", texto: "Avalie lacunas em logs e monitoramento" },
        { id: "verificar-backup", texto: "Verifique adequação de backup e recuperação" },
        { id: "identificar-vulnerabilidades", texto: "Identifique vulnerabilidades de segurança não tratadas" },
      ],
    },
    {
      id: "gap-contratos",
      titulo: "5. GAP: Contratos e Fornecedores",
      itens: [
        { id: "verificar-clausulas-fornecedores", texto: "Verifique se contratos com fornecedores têm cláusulas de proteção de dados" },
        { id: "avaliar-acordos-operadores", texto: "Avalie se há acordos formais de controlador-operador" },
        { id: "verificar-diligencia-fornecedores", texto: "Verifique se há processo de due diligence de fornecedores" },
        { id: "identificar-contratos-inadequados", texto: "Identifique contratos que precisam ser atualizados" },
      ],
    },
    {
      id: "gap-governanca",
      titulo: "6. GAP: Governança e Documentação",
      itens: [
        { id: "verificar-politicas-internas", texto: "Verifique lacunas em políticas internas de proteção de dados" },
        { id: "avaliar-procedimentos", texto: "Avalie se há procedimentos operacionais documentados" },
        { id: "verificar-registro-tratamentos", texto: "Verifique se há registro de atividades de tratamento (ROPA)" },
        { id: "avaliar-gestao-incidentes", texto: "Avalie se há processo de gestão de incidentes" },
        { id: "verificar-privacidade-design", texto: "Verifique se há implementação de privacy by design" },
      ],
    },
    {
      id: "gap-retencao",
      titulo: "7. GAP: Retenção e Descarte",
      itens: [
        { id: "avaliar-politica-retencao", texto: "Avalie se os períodos de retenção estão definidos e documentados" },
        { id: "verificar-processo-descarte", texto: "Verifique se há processo adequado de descarte de dados" },
        { id: "identificar-dados-desnecessarios", texto: "Identifique dados sendo mantidos além do necessário" },
      ],
    },
    {
      id: "gap-treinamento",
      titulo: "8. GAP: Treinamento e Conscientização",
      itens: [
        { id: "verificar-programa-treinamento", texto: "Verifique se há programa de treinamento em LGPD" },
        { id: "avaliar-conscientizacao", texto: "Avalie o nível de conscientização dos servidores" },
        { id: "identificar-necessidades-capacitacao", texto: "Identifique necessidades de capacitação por área" },
      ],
    },
    {
      id: "consolidacao-gaps",
      titulo: "9. Consolidação e Priorização",
      itens: [
        { id: "documentar-todos-gaps", texto: "Documente todas as lacunas identificadas" },
        { id: "classificar-gaps-criticidade", texto: "Classifique os gaps por criticidade (alto, médio, baixo)" },
        { id: "priorizar-gaps", texto: "Priorize os gaps considerando risco e urgência" },
        { id: "estimar-esforco", texto: "Estime esforço e recursos para corrigir cada gap" },
        { id: "elaborar-relatorio-gap", texto: "Elabore relatório consolidado de GAP Analysis" },
        { id: "apresentar-diretoria", texto: "Apresente os resultados para a alta direção" },
      ],
    },
  ],
  pratica: [
    {
      emoji: "⚖️",
      titulo: "Honestidade institucional: o paradoxo do score baixo",
      descricao:
        "A intuição diz: 'quero score alto pra parecer maduro'. A realidade institucional é o oposto: score 30% bem registrado, com justificativas claras, é diagnóstico que vira ação. Score 90% inflado é bomba-relógio — o dia em que a ANPD bater, o castelo de cartas cai.",
      badge: "💡 Dica de ouro do curso",
      destaque: true,
      detalhe:
        'Método prático: pra cada controle, pergunte ao grupo "QUANDO foi a última vez que essa política foi USADA em um caso real?". Se ninguém lembra, é NÃO ADERENTE — não importa se existe um PDF chamado "Política de Senhas v3.docx" no servidor. Documente o motivo em uma linha clara. Esse motivo vira a primeira coluna do Plano de Ação da Fase 5. Marcar tudo ADERENTE pra "não ficar feio" é o equivalente a uma auditoria interna que oculta achados — um dia o auditor externo aparece e tudo vem à tona junto.',
    },
    {
      emoji: "📋",
      titulo: "GAP Analysis (pacote curado pra turma)",
      descricao:
        "No jogo, o pacote tem 10 controles em 5 áreas (Governança, Bases Legais, Direitos, Segurança, Incidentes). Cada grupo classifica como ADERENTE / PARCIAL / NÃO ADERENTE / APOIO PENDENTE, com uma linha de justificativa. Score esperado da turma: 30-50%.",
      badge: "Missão 3 · 10 min",
      href: "/dashboard/gap",
    },
  ],
};

const FASE_5_STUB: ConteudoFase = {
  slug: "fase-5",
  numero: 5,
  titulo: "Fase 5 — Plano de Ação",
  subtitulo: "Consolida o que veio de Riscos e GAP em ações com responsável e prazo",
  missao: "Após M3 (GAP), entre M3 e M4a",
  ebooks: [],
  descricao: [{ tipo: "paragrafo", texto: "Conteúdo em construção — disponível em breve." }],
  comoProc: [],
  checklist: [],
  pratica: [],
};

const FASE_6_STUB: ConteudoFase = {
  slug: "fase-6",
  numero: 6,
  titulo: "Fase 6 — Execução",
  subtitulo: "RIPD, Gestão de Terceiros, Direitos do Titular e Aviso de Privacidade",
  missao: "Antes das Missões M4a (RIPD/Terceiros/DSR) e M4b (Aviso)",
  ebooks: [],
  descricao: [{ tipo: "paragrafo", texto: "Conteúdo em construção — disponível em breve." }],
  comoProc: [],
  checklist: [],
  pratica: [],
};

const FASE_7_STUB: ConteudoFase = {
  slug: "fase-7",
  numero: 7,
  titulo: "Fase 7 — Monitoramento",
  subtitulo: "Resposta a Incidentes + PRI institucional",
  missao: "Antes da Missão M5 (Incidente Surpresa)",
  ebooks: [],
  descricao: [{ tipo: "paragrafo", texto: "Conteúdo em construção — disponível em breve." }],
  comoProc: [],
  checklist: [],
  pratica: [],
};

// ─── EXPORT ───────────────────────────────────────────────────────────────

export const CONTEUDO_FASES: ConteudoFase[] = [
  FASE_3,
  FASE_4,
  FASE_5_STUB,
  FASE_6_STUB,
  FASE_7_STUB,
];

export function getConteudoFase(slug: string): ConteudoFase | undefined {
  return CONTEUDO_FASES.find((f) => f.slug === slug);
}

// Auxiliar pra sidebar saber quais fases já têm conteúdo (não-stub)
export function temConteudo(fase: ConteudoFase): boolean {
  return fase.descricao.length > 1 || fase.checklist.length > 0;
}
