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

const FASE_5: ConteudoFase = {
  slug: "fase-5",
  numero: 5,
  titulo: "Fase 5 — Plano de Ação e Adequação",
  subtitulo: "Elaboração e implementação de medidas corretivas e preventivas",
  missao: "Entre as Missões M3 (GAP) e M4a (RIPD/Terceiros/DSR)",
  ebooks: [
    {
      titulo: "Plano de Ação e Priorização de Atividades",
      descricao:
        "E-book específico desta fase. Como transformar riscos e gaps identificados em ações concretas com responsáveis, prazos e indicadores — priorização que vira execução, base do princípio de accountability da LGPD.",
      url: "https://heyzine.com/flip-book/bbbf7c0121.html",
    },
  ],
  descricao: [
    {
      tipo: "paragrafo",
      texto:
        "Com base nos riscos e lacunas identificadas nas Fases 3 e 4, esta etapa consiste em criar um plano de ação detalhado para corrigir as não conformidades e implementar as melhorias necessárias para adequação à LGPD.",
    },
    { tipo: "subtitulo", texto: "Elementos do Plano de Ação" },
    {
      tipo: "lista",
      itens: [
        "Priorização: organize as ações por criticidade e urgência",
        "Responsáveis: defina quem será responsável por cada ação",
        "Prazos: estabeleça cronograma realista para implementação",
        "Recursos: identifique os recursos necessários (financeiros, humanos, tecnológicos)",
        "Indicadores: defina como medir o sucesso de cada ação",
      ],
    },
    { tipo: "subtitulo", texto: "Ações Típicas" },
    {
      tipo: "lista",
      itens: [
        "Criação/atualização de Políticas de Privacidade",
        "Adequação de contratos e termos de uso",
        "Implementação de medidas de segurança técnicas",
        "Treinamento de servidores e colaboradores",
        "Adequação de processos de coleta e consentimento",
        "Criação de procedimentos para atendimento aos direitos dos titulares",
        "Implementação de gestão de incidentes",
      ],
    },
    {
      tipo: "callout",
      callout: {
        tom: "sucesso",
        titulo: "Dica de accountability",
        texto:
          "Mantenha registro detalhado de todas as ações implementadas. Esta documentação será importante para demonstrar conformidade e o princípio da accountability (prestação de contas) exigido pela LGPD.",
      },
    },
  ],
  comoProc: [
    {
      tipo: "paragrafo",
      texto:
        "O Plano de Ação é o coração do PGP — onde o diagnóstico vira ação concreta. É também onde a maioria dos órgãos públicos tropeça: faz um Plano belíssimo, apresenta pro Comitê com powerpoint elegante, e depois ele vira PDF de gaveta. Pra essa fase no curso, algumas orientações:",
    },
    { tipo: "subtitulo", texto: "1. Plano é matéria-prima, não enfeite" },
    {
      tipo: "paragrafo",
      texto:
        "O Plano não é entregue PRA ser bonito — é entregue PRA ser executado. Cada ação deve ter responsável NOMEADO (não 'a área de TI'), prazo CONCRETO (não 'a definir') e indicador MEDÍVEL (não 'melhorar a segurança'). Se não cabe em uma linha do estilo 'Joana cria a política X até 15/abr e a medida é X% de servidores treinados', a ação está mal formulada.",
    },
    { tipo: "subtitulo", texto: "2. Importação automática do que já existe" },
    {
      tipo: "paragrafo",
      texto:
        "No app, o botão 'Auto-importar do PGP' puxa de um clique: cada controle NÃO ADERENTE do GAP vira uma ação no Plano, e cada risco com plano de mitigação vira outra. Você não digita ação a partir do zero — você EDITA o que o app gerou da Fase 4. Isso resolve a dor 'não sei por onde começar'.",
    },
    {
      tipo: "callout",
      callout: {
        tom: "info",
        titulo: "Fontes que alimentam o Plano",
        texto:
          "GAP Não Aderente / Parcial / Ação Planejada · Riscos com mitigação · Diagnóstico de Privacidade · Pendências do Inventário. Tudo entra como uma linha editável.",
      },
    },
    { tipo: "subtitulo", texto: "3. Priorização honesta: 4 critérios, sem furada" },
    {
      tipo: "paragrafo",
      texto:
        "Pra ordenar o Plano, use SEMPRE os mesmos 4 critérios: (a) risco ao titular se nada for feito, (b) prazo legal exigido pela LGPD, (c) esforço de execução, (d) dependências entre ações (uma destrava outra?). 'Vontade política do gestor' não entra — porque muda com a próxima eleição.",
    },
    { tipo: "subtitulo", texto: "4. Acompanhamento mata o Plano de Gaveta" },
    {
      tipo: "paragrafo",
      texto:
        "Plano de Ação sem reunião quinzenal de acompanhamento vira PDF de gaveta em ~60 dias. Comprove: agende reuniões CURTAS (15 min) com os responsáveis quinzenalmente, projete o status do app no telão, e cobre evidência (não 'tá em andamento' — print, ata, link).",
    },
    { tipo: "subtitulo", texto: "5. Conexão com a Fase 6 é direta" },
    {
      tipo: "paragrafo",
      texto:
        "As ações do Plano não viram conformidade por si — viram quando EXECUTADAS na Fase 6 (Políticas, RIPD, Terceiros, Aviso de Privacidade). O Plano é o contrato; a Fase 6 é a entrega. Se o Plano marca 'criar Aviso de Privacidade até X' e na Fase 6 o Aviso fica em rascunho 6 meses, é o Plano que está falhando — não a Fase 6.",
    },
  ],
  checklist: [
    {
      id: "elaboracao-plano",
      titulo: "1. Elaboração do Plano de Ação",
      itens: [
        { id: "listar-gaps-riscos", texto: "Liste todos os gaps e riscos identificados nas Fases 3 e 4" },
        { id: "priorizar-acoes", texto: "Priorize as ações por criticidade, urgência e impacto" },
        { id: "definir-responsaveis", texto: "Defina responsáveis específicos para cada ação (nome, não área)" },
        { id: "estabelecer-prazos", texto: "Estabeleça prazos realistas para cada ação" },
        { id: "estimar-recursos", texto: "Estime recursos necessários (financeiros, humanos, tecnológicos)" },
        { id: "definir-indicadores", texto: "Defina indicadores para medir o sucesso de cada ação" },
      ],
    },
    {
      id: "adequacao-politicas",
      titulo: "2. Adequação de Políticas e Documentos",
      itens: [
        { id: "criar-politica-privacidade", texto: "Crie ou atualize a Política de Privacidade pública" },
        { id: "criar-politica-interna", texto: "Crie Política Interna de Proteção de Dados" },
        { id: "atualizar-termos-uso", texto: "Atualize Termos de Uso e Consentimento" },
        { id: "criar-avisos-privacidade", texto: "Crie avisos de privacidade específicos para cada finalidade" },
        { id: "revisar-contratos", texto: "Revise e atualize contratos com fornecedores e parceiros (Art. 39)" },
      ],
    },
    {
      id: "adequacao-processos",
      titulo: "3. Adequação de Processos",
      itens: [
        { id: "implementar-coleta-consentimento", texto: "Implemente processos adequados de coleta de consentimento" },
        { id: "criar-processo-direitos", texto: "Crie processo para atendimento aos direitos dos titulares (Arts. 18 e 19)" },
        { id: "implementar-gestao-incidentes", texto: "Implemente processo de gestão de incidentes de segurança" },
        { id: "definir-retencao-dados", texto: "Defina e implemente políticas de retenção e descarte de dados" },
        { id: "adequar-coleta-dados", texto: "Adeque formulários e processos de coleta de dados (minimização)" },
      ],
    },
    {
      id: "medidas-seguranca",
      titulo: "4. Implementação de Medidas de Segurança",
      itens: [
        { id: "implementar-controles-acesso", texto: "Implemente controles de acesso baseados em função e necessidade" },
        { id: "implementar-criptografia", texto: "Implemente criptografia para dados sensíveis (em trânsito e em repouso)" },
        { id: "configurar-logs-auditoria", texto: "Configure logs e trilhas de auditoria" },
        { id: "implementar-backup", texto: "Implemente e teste procedimentos de backup e recuperação" },
        { id: "atualizar-seguranca-sistemas", texto: "Atualize medidas de segurança em sistemas e aplicações" },
        { id: "implementar-anonimizacao", texto: "Implemente técnicas de anonimização/pseudonimização quando aplicável" },
      ],
    },
    {
      id: "adequacao-tecnologica",
      titulo: "5. Adequação Tecnológica",
      itens: [
        { id: "atualizar-sistemas", texto: "Atualize sistemas para suportar requisitos de privacidade" },
        { id: "implementar-ferramentas-gestao", texto: "Implemente ferramentas de gestão de privacidade (se aplicável)" },
        { id: "ajustar-formularios-web", texto: "Ajuste formulários web para conformidade (consentimento, minimização)" },
        { id: "implementar-portal-titular", texto: "Implemente portal ou canal para solicitações de titulares" },
      ],
    },
    {
      id: "acompanhamento-plano",
      titulo: "6. Acompanhamento do Plano de Ação",
      itens: [
        { id: "criar-cronograma-detalhado", texto: "Crie cronograma detalhado de implementação" },
        { id: "agendar-reunioes-acompanhamento", texto: "Agende reuniões periódicas de acompanhamento (quinzenais)" },
        { id: "documentar-implementacoes", texto: "Documente todas as implementações e evidências de conformidade" },
        { id: "monitorar-indicadores", texto: "Monitore indicadores de progresso estabelecidos" },
        { id: "reportar-diretoria", texto: "Reporte progresso regularmente para a alta direção e Comitê" },
      ],
    },
  ],
  pratica: [
    {
      emoji: "📂",
      titulo: "Como NÃO virar mais um Plano de Gaveta",
      descricao:
        "O Plano de Ação é o documento que mais vira PDF esquecido em pasta compartilhada. A diferença entre Plano vivo e Plano morto não é a qualidade da escrita inicial — é o ritual de acompanhamento que vem DEPOIS. Sem reunião quinzenal de status, nem o melhor Plano sobrevive 60 dias.",
      badge: "💡 Dica de ouro do curso",
      destaque: true,
      detalhe:
        'Método prático: na hora da assinatura do Plano pelo Comitê, agende JÁ na agenda as próximas 6 reuniões quinzenais de status, com convite enviado aos responsáveis (nome, não área). Cada reunião dura 15 minutos: cada responsável diz o status de cada ação atribuída + traz EVIDÊNCIA (print, ata, link, documento). Sem evidência, status fica como "Não iniciado" — não importa o que ele falar. Em 3 meses, ou o Plano avançou de verdade, ou você sabe exatamente onde está parado e por quê. Bônus: projete o status real do app no telão da reunião — visual aberto neutraliza "estou trabalhando nisso" sem ação. No app de curso, o Plano lista cada ação com origem (Risco/GAP/Diagnóstico), responsável, prazo e evidência anexada.',
    },
    {
      emoji: "🎯",
      titulo: "Plano de Ação",
      descricao:
        "No app, o Plano consolida automaticamente as pendências de Riscos (mitigação) e GAP (Não Aderente, Parcial, Ação Planejada) em uma única tabela com responsável, prazo, status e evidência. O botão 'Auto-importar do PGP' faz o trabalho braçal — você só edita e prioriza.",
      badge: "Entre M3 e M4a",
      href: "/dashboard/plano-acao",
    },
  ],
};

const FASE_6: ConteudoFase = {
  slug: "fase-6",
  numero: 6,
  titulo: "Fase 6 — Execução",
  subtitulo:
    "Implementação de documentação, políticas, medidas de segurança e treinamentos",
  missao: "Antes das Missões M4a (RIPD/Terceiros/DSR) e M4b (Aviso)",
  ebooks: [
    {
      titulo: "Relatório de Impacto à Proteção de Dados (RIPD)",
      descricao:
        "E-book específico desta fase. Como elaborar o RIPD nas 8 seções do modelo ANPD — pré-requisito do Aviso de Privacidade (Art. 38 LGPD).",
      url: "https://heyzine.com/flip-book/a694923f33.html",
    },
    {
      titulo: "Gestão de Contratos e Fornecedores",
      descricao:
        "E-book específico desta fase. Avaliação de operadores que tratam dados por conta do órgão (due diligence) e cláusulas LGPD obrigatórias nos contratos (Art. 39 LGPD).",
      url: "https://heyzine.com/flip-book/6c398039ff.html",
    },
    {
      titulo: "Canais de Atendimento a Titulares de Dados Pessoais",
      descricao:
        "E-book específico desta fase. Como estruturar o canal pra o cidadão exercer os 9 direitos do Art. 18 LGPD dentro do prazo legal de 15 dias úteis.",
      url: "https://heyzine.com/flip-book/1576d27a9d.html",
    },
    {
      titulo: "Termo de Uso, Política/Aviso de Privacidade",
      descricao:
        "E-book específico desta fase. Documentos públicos que comunicam ao cidadão a forma de tratamento de dados — Termo de Uso (regras de uso do serviço) + Política/Aviso de Privacidade (12 seções ANPD).",
      url: "https://heyzine.com/flip-book/d376d06f3e.html",
    },
    {
      titulo: "Política de Cookies no Setor Público",
      descricao:
        "E-book específico desta fase. Guia da ANPD pra elaboração de políticas e banners de cookies em websites e aplicações do serviço público — extensão web do Aviso de Privacidade.",
      url: "https://heyzine.com/flip-book/0a10d977b3.html",
    },
    {
      titulo: "Política de Retenção de Dados",
      descricao:
        "E-book específico desta fase. Definição de prazos de retenção e descarte de dados pessoais — política interna estrutural que define quanto tempo cada dado é guardado e como é descartado.",
      url: "https://heyzine.com/flip-book/23f36d6b72.html",
    },
    {
      titulo: "Política de Segurança da Informação (PSI)",
      descricao:
        "E-book específico desta fase. Documento transversal que define princípios, controles e responsabilidades de proteção da informação — alicerce das medidas de segurança técnicas e organizacionais.",
      url: "https://heyzine.com/flip-book/7c96fc6631.html",
    },
    {
      titulo: "LIA — Avaliação de Legítimo Interesse",
      descricao:
        "E-book específico desta fase. Como elaborar a LIA exigida pelo Art. 10 §3º LGPD pra qualquer tratamento que use legítimo interesse (Art. 7º IX) como base — 3 etapas (Finalidade · Necessidade · Balanceamento) com workflow de aprovação.",
      url: "https://heyzine.com/flip-book/60ec74d696.html",
    },
  ],
  descricao: [
    {
      tipo: "paragrafo",
      texto:
        "A Fase 6 marca o momento de colocar em prática tudo o que foi planejado nas fases anteriores. É onde a adequação à LGPD sai do papel e se torna realidade operacional na Instituição.",
    },
    { tipo: "subtitulo", texto: "Principais Objetivos" },
    {
      tipo: "lista",
      itens: [
        "Implementar Políticas e Documentação — políticas de privacidade externas e internas, POPs, contratos adequados e avisos de privacidade conforme planejado",
        "Executar Medidas de Segurança — controles técnicos e organizacionais identificados na análise de riscos: criptografia, controles de acesso, logs de auditoria, backups",
        "Adequar Processos Operacionais — coleta de dados, gestão de consentimentos, atendimento aos direitos dos titulares e resposta a incidentes",
        "Realizar Treinamentos e Conscientização — programa pra todos os servidores (geral e específico por área)",
        "Registrar Evidências de Compliance — documentar implementações e arquivar evidências do princípio da accountability",
      ],
    },
    {
      tipo: "callout",
      callout: {
        tom: "aviso",
        titulo: "Ponto de atenção",
        texto:
          "Esta fase exige coordenação entre múltiplas áreas da Instituição. O DPO deve atuar como facilitador, garantindo que todas as ações do Plano de Ação sejam executadas dentro dos prazos estabelecidos e com a qualidade necessária.",
      },
    },
    {
      tipo: "callout",
      callout: {
        tom: "sucesso",
        titulo: "Resultado esperado",
        texto:
          "Ao final desta fase, a Instituição deve ter todas as políticas, procedimentos e medidas de segurança operacionais, com equipes treinadas e conscientes de suas responsabilidades na proteção de dados pessoais.",
      },
    },
  ],
  comoProc: [
    {
      tipo: "paragrafo",
      texto:
        "A Fase 6 é a maior do PGP em volume de entrega — onde RIPD, Aviso, Terceiros, DSR, Políticas e Capacitação acontecem em paralelo. Aqui o DPO deixa de ser apenas ESCRITOR e vira REGENTE: o trabalho dele é fazer áreas convergirem. Algumas orientações práticas:",
    },
    { tipo: "subtitulo", texto: "1. A ORDEM importa: RIPD → Terceiros → DSR → Aviso" },
    {
      tipo: "paragrafo",
      texto:
        "O Aviso de Privacidade é uma SÍNTESE pública — depende do RIPD (Seção 3 do Aviso puxa dele), da lista de Terceiros (Seção 7 puxa dela) e do canal DSR (Seção 11 puxa dele). Grupos que pulam direto pro Aviso produzem documento vago, cheio de promessa vazia. No app, o quadro \"Pré-requisitos da Missão 4a\" no topo da tela de Aviso mostra exatamente o que falta antes de publicar.",
    },
    {
      tipo: "callout",
      callout: {
        tom: "info",
        titulo: "Sequência canônica",
        texto:
          "RIPD do processo crítico → 1-2 Operadores com cláusulas LGPD → Canal DSR estruturado → Aviso de Privacidade (12 seções ANPD)",
      },
    },
    { tipo: "subtitulo", texto: "2. Conteúdo NÃO se inventa — vem das fases anteriores" },
    {
      tipo: "paragrafo",
      texto:
        "Cada documento da Fase 6 tem fonte de dados em uma fase anterior: o RIPD bebe do Inventário (Fase 3) e da Análise de Riscos (Fase 3); o Aviso bebe do RIPD; as Políticas bebem do Plano de Ação (Fase 5). No app, o botão 'Auto-preencher do PGP' faz isso automaticamente — você revisa em vez de digitar do zero.",
    },
    { tipo: "subtitulo", texto: "3. Política de Privacidade externa vs. Política Interna" },
    {
      tipo: "paragrafo",
      texto:
        "São DOIS documentos com públicos diferentes. A externa (no site) é pro CIDADÃO — linguagem simples, 12 seções ANPD, fala dos direitos dele. A interna é pros SERVIDORES — fala das responsabilidades do dia a dia, do que fazer ao detectar um incidente, das regras de acesso e descarte. Não confundir.",
    },
    { tipo: "subtitulo", texto: "4. Terceiros que tratam dados: a maior dor invisível" },
    {
      tipo: "paragrafo",
      texto:
        "Quase todo órgão tem dezenas de operadores (empresa de tecnologia, lab terceirizado, empresa de RH, escritório de advocacia, gráfica, transportadora...) que tratam dados pessoais por conta da Instituição. Cada um precisa de DPA (Data Processing Agreement) com cláusulas específicas (Art. 39 LGPD). Sem isso, em caso de incidente, a responsabilização pode vir 100% pra Instituição.",
    },
    { tipo: "subtitulo", texto: "5. Direitos do Titular: 15 dias úteis é prazo curto" },
    {
      tipo: "paragrafo",
      texto:
        "Quando um cidadão pede 'me mostra todos os dados que vocês têm sobre mim' (Art. 18 II), você tem 15 dias úteis pra responder. Sem canal estruturado (formulário + fluxo interno + responsável + monitoramento de prazo), o prazo estoura no primeiro pedido sério. O canal DSR do app já vem com fluxo padrão — vocês só precisam definir QUEM responde e EM QUANTO TEMPO internamente.",
    },
    { tipo: "subtitulo", texto: "6. Treinamento: separar 'sensibilização' de 'capacitação'" },
    {
      tipo: "paragrafo",
      texto:
        "Sensibilização (1-2h) é pra TODO servidor — entender o que é dado pessoal, por que importa, o que fazer se descobrir um vazamento. Capacitação (4-8h) é pra QUEM TRATA dados todo dia — RH, atendimento, ouvidoria, TI. São treinamentos DIFERENTES, com públicos diferentes. Misturar os dois afoga o detalhe e não satisfaz nenhum dos públicos.",
    },
  ],
  checklist: [
    {
      id: "politicas-externas",
      titulo: "1. Políticas Externas (Para Titulares)",
      itens: [
        { id: "elaborar-politica-privacidade", texto: "Elabore Política de Privacidade completa e transparente" },
        { id: "criar-avisos-coleta", texto: "Crie avisos de privacidade específicos para cada ponto de coleta" },
        { id: "elaborar-termos-consentimento", texto: "Elabore termos de consentimento claros e específicos" },
        { id: "publicar-politicas", texto: "Publique as políticas no site e canais de comunicação" },
      ],
    },
    {
      id: "politicas-internas",
      titulo: "2. Políticas Internas (Para Servidores)",
      itens: [
        { id: "criar-politica-interna-dados", texto: "Crie Política Interna de Proteção de Dados" },
        { id: "elaborar-politica-seguranca", texto: "Elabore Política de Segurança da Informação" },
        { id: "criar-politica-uso-aceitavel", texto: "Crie Política de Uso Aceitável de Recursos de TI" },
        { id: "criar-codigo-conduta", texto: "Crie Código de Conduta sobre privacidade e proteção de dados" },
      ],
    },
    {
      id: "procedimentos-operacionais",
      titulo: "3. Procedimentos Operacionais Padrão (POPs)",
      itens: [
        { id: "pop-direitos-titulares", texto: "Crie POP para atendimento aos direitos dos titulares" },
        { id: "pop-gestao-incidentes", texto: "Crie POP para gestão de incidentes de segurança" },
        { id: "pop-gestao-consentimento", texto: "Crie POP para gestão de consentimentos" },
        { id: "pop-retencao-descarte", texto: "Crie POP para retenção e descarte de dados" },
      ],
    },
    {
      id: "documentos-contratuais",
      titulo: "4. Documentos Contratuais",
      itens: [
        { id: "clausulas-fornecedores", texto: "Elabore cláusulas de proteção de dados para contratos com fornecedores" },
        { id: "acordo-controlador-operador", texto: "Crie modelo de Acordo de Controlador-Operador (Art. 39)" },
        { id: "termo-confidencialidade", texto: "Elabore Termo de Confidencialidade para servidores" },
      ],
    },
    {
      id: "adequacao-processos",
      titulo: "5. Adequação de Processos",
      itens: [
        { id: "implementar-coleta-consentimento", texto: "Implemente processos adequados de coleta de consentimento" },
        { id: "criar-processo-direitos", texto: "Crie processo para atendimento aos direitos dos titulares" },
        { id: "implementar-gestao-incidentes", texto: "Implemente processo de gestão de incidentes de segurança" },
        { id: "adequar-coleta-dados", texto: "Adeque formulários e processos de coleta de dados (minimização)" },
      ],
    },
    {
      id: "medidas-seguranca",
      titulo: "6. Implementação de Medidas de Segurança",
      itens: [
        { id: "implementar-controles-acesso", texto: "Implemente controles de acesso baseados em função e necessidade" },
        { id: "implementar-criptografia", texto: "Implemente criptografia para dados sensíveis" },
        { id: "configurar-logs-auditoria", texto: "Configure logs e trilhas de auditoria" },
        { id: "implementar-backup", texto: "Implemente e teste procedimentos de backup e recuperação" },
      ],
    },
    {
      id: "planejamento-treinamento",
      titulo: "7. Planejamento do Programa de Treinamento",
      itens: [
        { id: "mapear-publicos", texto: "Mapeie os diferentes públicos-alvo (geral, específico, gestão, DPO)" },
        { id: "definir-conteudos", texto: "Defina conteúdos específicos para cada público" },
        { id: "escolher-metodologias", texto: "Escolha metodologias de treinamento (presencial, online, híbrido)" },
        { id: "estabelecer-cronograma", texto: "Estabeleça cronograma de treinamentos" },
      ],
    },
    {
      id: "treinamento-geral",
      titulo: "8. Treinamento Geral (Todos os Servidores)",
      itens: [
        { id: "fundamentos-lgpd", texto: "Treine sobre fundamentos da LGPD" },
        { id: "conceitos-basicos", texto: "Explique conceitos básicos (dados pessoais, sensíveis, tratamento)" },
        { id: "direitos-titulares", texto: "Ensine sobre direitos dos titulares" },
        { id: "boas-praticas-diarias", texto: "Treine boas práticas de segurança no dia a dia" },
      ],
    },
    {
      id: "treinamento-especifico",
      titulo: "9. Treinamento Específico por Área",
      itens: [
        { id: "treinar-ti", texto: "Treine equipe de TI sobre segurança técnica e gestão de acessos" },
        { id: "treinar-rh", texto: "Treine RH sobre tratamento de dados de servidores e candidatos" },
        { id: "treinar-comunicacao", texto: "Treine Comunicação sobre consentimento e transparência ativa" },
        { id: "treinar-atendimento", texto: "Treine Atendimento ao Cidadão sobre coleta e uso de dados" },
      ],
    },
    {
      id: "conscientizacao-continua",
      titulo: "10. Programa de Conscientização Contínua",
      itens: [
        { id: "criar-campanhas-internas", texto: "Crie campanhas internas de conscientização" },
        { id: "enviar-newsletters", texto: "Envie newsletters periódicas sobre proteção de dados" },
        { id: "realizar-workshops", texto: "Realize workshops temáticos periódicos" },
      ],
    },
    {
      id: "registro-evidencias",
      titulo: "11. Registro e Evidências",
      itens: [
        { id: "registrar-implementacoes", texto: "Registre todas as implementações realizadas" },
        { id: "documentar-treinamentos", texto: "Documente todos os treinamentos realizados (data, participantes, conteúdo)" },
        { id: "arquivar-evidencias", texto: "Arquive evidências de conformidade" },
        { id: "versionar-documentos", texto: "Implemente versionamento de todos os documentos" },
      ],
    },
  ],
  pratica: [
    {
      emoji: "🎼",
      titulo: "O DPO regente: como evitar que cada documento vire um silo",
      descricao:
        "A armadilha clássica da Fase 6: cada documento (Política, RIPD, Aviso, Termo) é tocado por uma área diferente, ninguém conversa, e no fim os documentos se contradizem entre si — o que está no Aviso não bate com o RIPD, o que está nas Políticas não bate com os POPs. O DPO precisa atuar como REGENTE, não como autor solo.",
      badge: "💡 Dica de ouro do curso",
      destaque: true,
      detalhe:
        'Método prático: agende um RITUAL ÚNICO de revisão cruzada antes de publicar qualquer documento da Fase 6. Junte numa sala (presencial ou virtual) por 1 hora: Procuradoria, Comunicação, TI, dono do processo, DPO. Projete o documento + o RIPD + o Inventário no telão. Leia o documento parágrafo a parágrafo perguntando: "Isto bate com o que está no RIPD? E no Inventário? E no Plano de Ação?". Cada divergência vira ajuste antes da publicação. Custo: 1 hora. Economia: 6 meses de retrabalho explicando à ANPD por que a Política diz uma coisa e o Aviso diz outra. No app, o botão "Auto-preencher do PGP" no Aviso já faz parte desse alinhamento automaticamente — mas a revisão humana cruzada é insubstituível.',
    },
    {
      emoji: "🔍",
      titulo: "RIPD",
      descricao:
        "Relatório de Impacto à Proteção de Dados (Art. 38 LGPD). 8 seções do modelo ANPD. No app, pré-rascunhado a partir do Inventário e da Análise de Riscos — você revisa e completa.",
      badge: "Missão 4a",
      href: "/dashboard/ripd",
    },
    {
      emoji: "🏢",
      titulo: "Gestão de Terceiros",
      descricao:
        "Operadores que tratam dados por conta do órgão (Art. 39 LGPD). Avaliação de risco + due diligence + cláusulas LGPD nos contratos. Quase todo órgão tem 10-30 terceiros, e quase nenhum os cataloga.",
      badge: "Missão 4a",
      href: "/dashboard/terceiros",
    },
    {
      emoji: "👤",
      titulo: "Direitos do Titular (DSR)",
      descricao:
        "Canal de exercício dos 9 direitos do Art. 18 LGPD. Prazo legal de 15 dias úteis. Sem canal estruturado (formulário + fluxo + responsável + monitoramento), o prazo estoura no primeiro pedido sério.",
      badge: "Missão 4a",
      href: "/dashboard/dsr",
    },
    {
      emoji: "📄",
      titulo: "Aviso de Privacidade",
      descricao:
        "Síntese pública — 12 seções ANPD. Depende dos 3 pré-requisitos acima (RIPD ✓, Terceiros ✓, DSR ✓). No app, o quadro 'Pré-requisitos da Missão 4a' no topo da tela indica o que ainda falta antes de publicar.",
      badge: "Missão 4b",
      href: "/dashboard/aviso",
    },
    {
      emoji: "⚖️",
      titulo: "LIA — quando Legítimo Interesse vira obrigação",
      descricao:
        "Toda vez que um processo do Inventário usa Art. 7º IX (legítimo interesse) como base legal, o Art. 10 §3º LGPD EXIGE uma LIA (Avaliação de Legítimo Interesse) — 3 etapas estruturadas: Finalidade · Necessidade · Balanceamento. Sem LIA aprovada, o uso da base legal é frágil — a ANPD pode questionar.",
      badge: "💡 Dica de ouro do curso",
      destaque: true,
      detalhe:
        "Regra crítica que poucos sabem: LIA NUNCA serve pra dados sensíveis (saúde, opinião política, dados de crianças). Pra esses, a base legal correta vem do Art. 11 — consentimento específico ou hipótese restrita. O app principal (lgpd-pgp) tem mini-app de LIA completo (criar/editar/aprovar/DOCX). No curso vamos VER 2 modelos prontos na Reflexão Final: um pra Pegadinha #1 do Posto (marketing) — BLOQUEADA porque envolve dados sensíveis; outro pra Pegadinha #4 da Ouvidoria (newsletter) — REPROVADA no Balanceamento porque titular não esperaria razoavelmente. Conexão dramática: na hora do debrief, a LIA mostra que a falha NÃO foi acidente — foi consequência de ter pulado o controle.",
    },
  ],
};

const FASE_7: ConteudoFase = {
  slug: "fase-7",
  numero: 7,
  titulo: "Fase 7 — Monitoramento Contínuo e Melhoria",
  subtitulo:
    "Acompanhamento contínuo, auditorias e evolução do programa de governança",
  missao: "Antes da Missão M5 (Incidente Surpresa)",
  ebooks: [
    {
      titulo: "Programa de Governança em Privacidade",
      descricao:
        "E-book específico desta fase. O PGP como cultura institucional contínua — não projeto pontual. Conexão entre o monitoramento da F7 e o ciclo completo do programa de governança.",
      url: "https://heyzine.com/flip-book/bbbf7c0121.html",
    },
    {
      titulo: "Resolução ANPD Nº 15 — Comunicação de Incidentes de Segurança",
      descricao:
        "E-book específico desta fase. Resolução CD/ANPD nº 15/2024 detalhada — regras objetivas pra comunicação de incidentes de segurança da informação à Autoridade Nacional.",
      url: "https://heyzine.com/flip-book/ab58c1976b.html",
    },
    {
      titulo: "Guia Prático: Quando e Como Comunicar um Incidente à ANPD",
      descricao:
        "E-book específico desta fase. Guia prático complementar à Res. 15/2024 — fluxo passo a passo, prazos, modelo de comunicação e exemplos de casos reais.",
      url: "https://heyzine.com/flip-book/9df0dd8581.html",
    },
  ],
  descricao: [
    {
      tipo: "paragrafo",
      texto:
        "A conformidade com a LGPD não é um projeto com início, meio e fim, mas um processo contínuo. Esta última fase estabelece os mecanismos de monitoramento, auditoria e melhoria contínua do programa de governança de dados.",
    },
    { tipo: "subtitulo", texto: "Atividades de Monitoramento" },
    {
      tipo: "lista",
      itens: [
        "Auditorias Periódicas: internas e/ou externas para verificar conformidade",
        "Indicadores de Performance (KPIs): métricas para medir eficácia do programa",
        "Revisão de Políticas: atualização periódica da documentação",
        "Gestão de Incidentes: acompanhamento e análise de eventos de segurança",
        "Avaliação de Fornecedores: verificação contínua de operadores",
        "Atualização Legislativa: acompanhamento de mudanças na legislação",
      ],
    },
    { tipo: "subtitulo", texto: "Indicadores Sugeridos" },
    {
      tipo: "lista",
      itens: [
        "Tempo médio de resposta a solicitações de titulares (meta: < 15 dias úteis)",
        "Número de incidentes de segurança reportados (e prazo de comunicação à ANPD)",
        "Percentual de servidores treinados em LGPD",
        "Índice de conformidade em auditorias",
        "Tempo médio para correção de não conformidades",
        "Número de RIPDs realizados",
      ],
    },
    { tipo: "subtitulo", texto: "Melhoria Contínua" },
    {
      tipo: "paragrafo",
      texto:
        "Com base nos indicadores e auditorias, identifique oportunidades de melhoria:",
    },
    {
      tipo: "lista",
      itens: [
        "Ajuste de processos que não estão funcionando",
        "Implementação de novas tecnologias de proteção",
        "Reforço de treinamentos em áreas problemáticas",
        "Atualização de políticas conforme evolução da Instituição",
        "Incorporação de melhores práticas do mercado",
      ],
    },
    {
      tipo: "callout",
      callout: {
        tom: "info",
        titulo: "🔄 Ciclo PDCA",
        texto:
          "Utilize o ciclo Plan-Do-Check-Act (Planejar-Executar-Verificar-Agir) como metodologia para melhoria contínua. A adequação à LGPD é uma jornada, não um destino.",
      },
    },
    {
      tipo: "callout",
      callout: {
        tom: "sucesso",
        titulo: "Parabéns!",
        texto:
          "Ao chegar nesta fase, a Instituição terá um programa robusto de governança de dados. Mantenha o compromisso com a proteção de dados e a conformidade contínua — PGP é programa, não projeto.",
      },
    },
  ],
  comoProc: [
    {
      tipo: "paragrafo",
      texto:
        "A Fase 7 é a que separa órgãos públicos QUE TÊM um PGP dos que TÊM UM PDF chamado PGP guardado em pasta. O programa só EXISTE enquanto está em movimento. Algumas orientações pra esta fase, especialmente conectadas com a Missão 5 do curso (Incidente Surpresa):",
    },
    { tipo: "subtitulo", texto: "1. Incidentes vão acontecer — a pergunta é se você está pronto" },
    {
      tipo: "paragrafo",
      texto:
        "Toda Instituição vai ter incidente. Pendrive perdido. Email enviado pra lista errada. Servidor demitido que levou backup. Não é POSSÍVEL prevenir 100%. A diferença entre o órgão que vira manchete e o que resolve nas próximas 72h não é a ausência de incidente — é o PREPARO. Quem tem PRI testado, equipe ETIR definida, matriz RACI clara, descobre o incidente em 1h e comunica em 24h. Quem não tem, descobre pela imprensa.",
    },
    {
      tipo: "callout",
      callout: {
        tom: "aviso",
        titulo: "Res. CD/ANPD nº 15/2024 — o prazo de pesadelo",
        texto:
          "A ANPD orienta comunicação \"em prazo razoável\", interpretada como 3 dias úteis pra incidentes de alta severidade. Sem PRI testado, é praticamente impossível cumprir.",
      },
    },
    { tipo: "subtitulo", texto: "2. Severidade objetiva (não a 'gut feeling' do DPO)" },
    {
      tipo: "paragrafo",
      texto:
        "A Res. 15/2024 define uma régua objetiva pra severidade: BAIXA (sem acesso indevido), MÉDIA (1 agravante), ALTA (2 agravantes), CRÍTICA (3+ agravantes). Agravantes incluem: dados sensíveis, dados de crianças/idosos, alto volume, dados financeiros. O app aplica essa régua automaticamente. Não chuta severidade — calcula.",
    },
    { tipo: "subtitulo", texto: "3. Métricas que matam: 5 KPIs essenciais" },
    {
      tipo: "paragrafo",
      texto:
        "Não invente 30 KPIs que ninguém vai medir. Comece com 5 que importam: (1) tempo médio de resposta DSR vs. prazo legal de 15 dias úteis, (2) número de incidentes/trimestre vs. trimestre anterior, (3) % de servidores treinados em 12 meses, (4) índice de conformidade em auditoria interna anual, (5) RIPDs realizados vs. processos críticos que exigem. Se esses 5 estão saudáveis, o resto vem.",
    },
    { tipo: "subtitulo", texto: "4. Acompanhamento legislativo é parte do método" },
    {
      tipo: "paragrafo",
      texto:
        "A ANPD publica guias, resoluções e orientações regularmente — desde 2022 já saíram 15+ instrumentos relevantes. Ignorar isso é estar a 1 ano de atraso por padrão. Crie um RITUAL: 1 hora por mês, o DPO + 1 servidor (Procuradoria?) abrem o site da ANPD, leem o que foi publicado, decidem o que precisa virar ação no Plano. Custo: 12h/ano. Economia: não virar manchete por descumprimento de regra que existe há 6 meses.",
    },
    { tipo: "subtitulo", texto: "5. Auditoria interna anual é não-negociável" },
    {
      tipo: "paragrafo",
      texto:
        "Programa sem auditoria interna anual vira ficção em 12 meses. Não precisa ser auditoria externa cara — pode ser uma colega da Controladoria ou Auditoria Interna, com checklist baseado no GAP. Roda em 2-3 dias. Resultado: relatório com não-conformidades + plano de correção. Esse documento É a evidência viva do princípio de accountability (Art. 6º X LGPD).",
    },
    { tipo: "subtitulo", texto: "6. PGP é programa contínuo, não projeto pontual" },
    {
      tipo: "paragrafo",
      texto:
        'A frase que define a Fase 7: "PROGRAMA, não projeto". Projeto tem fim. Programa não. A cada ciclo (anual), você revisa o que mudou, refaz o que precisa, melhora o que descobriu. É como manter um prédio — nunca acaba, sempre há manutenção, mas se você parar de fazer manutenção, o prédio desaba aos poucos. Não dramatize — apenas mantenha o ritmo.',
    },
  ],
  checklist: [
    {
      id: "estrutura-monitoramento",
      titulo: "1. Estruturação do Monitoramento",
      itens: [
        { id: "definir-indicadores-chave", texto: "Defina indicadores-chave de performance (KPIs) de privacidade" },
        { id: "estabelecer-metas", texto: "Estabeleça metas para cada indicador" },
        { id: "criar-dashboard", texto: "Crie dashboard de monitoramento de conformidade" },
        { id: "definir-periodicidade-medicao", texto: "Defina periodicidade de medição (mensal, trimestral)" },
        { id: "designar-responsaveis-kpis", texto: "Designe responsáveis por cada KPI" },
      ],
    },
    {
      id: "implementacao-kpis",
      titulo: "2. Implementação de KPIs",
      itens: [
        { id: "monitorar-tempo-resposta", texto: "Monitore tempo médio de resposta a solicitações de titulares (meta: < 15 dias úteis)" },
        { id: "monitorar-incidentes", texto: "Monitore número e severidade de incidentes de segurança" },
        { id: "acompanhar-treinamentos", texto: "Acompanhe percentual de servidores treinados" },
        { id: "medir-conformidade-processos", texto: "Meça índice de conformidade dos processos" },
        { id: "controlar-solicitacoes-titulares", texto: "Controle volume de solicitações de titulares por tipo" },
        { id: "avaliar-fornecedores", texto: "Avalie conformidade de fornecedores/operadores" },
      ],
    },
    {
      id: "auditorias-periodicas",
      titulo: "3. Auditorias Periódicas",
      itens: [
        { id: "agendar-auditorias-internas", texto: "Agende auditorias internas (no mínimo anuais)" },
        { id: "definir-escopo-auditoria", texto: "Defina escopo de cada auditoria" },
        { id: "preparar-checklist-auditoria", texto: "Prepare checklist de auditoria baseado no GAP" },
        { id: "realizar-auditoria", texto: "Realize auditorias conforme cronograma" },
        { id: "documentar-achados", texto: "Documente todos os achados e não conformidades" },
        { id: "plano-acao-auditoria", texto: "Crie plano de ação para correção de não conformidades" },
        { id: "considerar-auditoria-externa", texto: "Considere auditorias externas/certificações (ISO 27001, etc.)" },
      ],
    },
    {
      id: "gestao-incidentes-continua",
      titulo: "4. Gestão Contínua de Incidentes",
      itens: [
        { id: "manter-registro-incidentes", texto: "Mantenha registro atualizado de todos os incidentes" },
        { id: "analisar-causas-raiz", texto: "Analise causas raiz dos incidentes" },
        { id: "implementar-acoes-preventivas", texto: "Implemente ações preventivas para evitar recorrência" },
        { id: "testar-plano-resposta", texto: "Teste periodicamente o plano de resposta a incidentes (PRI)" },
        { id: "atualizar-procedimentos", texto: "Atualize procedimentos com base em lições aprendidas" },
      ],
    },
    {
      id: "revisao-documentacao",
      titulo: "5. Revisão e Atualização de Documentação",
      itens: [
        { id: "revisar-politicas-anualmente", texto: "Revise todas as políticas pelo menos anualmente" },
        { id: "atualizar-inventario-dados", texto: "Atualize o inventário de dados regularmente" },
        { id: "revisar-contratos-fornecedores", texto: "Revise contratos com fornecedores periodicamente" },
        { id: "atualizar-avisos-privacidade", texto: "Atualize avisos de privacidade quando houver mudanças" },
        { id: "versionar-mudancas", texto: "Versione e documente todas as mudanças" },
      ],
    },
    {
      id: "atualizacao-legislativa",
      titulo: "6. Acompanhamento Legislativo e Regulatório",
      itens: [
        { id: "acompanhar-anpd", texto: "Acompanhe publicações da ANPD (guias, resoluções)" },
        { id: "monitorar-jurisprudencia", texto: "Monitore jurisprudência e decisões judiciais" },
        { id: "participar-eventos", texto: "Participe de eventos e fóruns sobre privacidade" },
        { id: "atualizar-praticas", texto: "Atualize práticas conforme novas orientações" },
        { id: "comunicar-mudancas", texto: "Comunique mudanças relevantes para a Instituição" },
      ],
    },
    {
      id: "avaliacao-fornecedores-continua",
      titulo: "7. Avaliação Contínua de Fornecedores",
      itens: [
        { id: "reavaliar-fornecedores", texto: "Reavalie fornecedores/operadores periodicamente" },
        { id: "auditar-operadores-criticos", texto: "Audite operadores críticos" },
        { id: "verificar-incidentes-fornecedores", texto: "Verifique se fornecedores tiveram incidentes de segurança" },
        { id: "atualizar-contratos-fornecedores", texto: "Atualize contratos quando necessário" },
      ],
    },
    {
      id: "melhoria-continua",
      titulo: "8. Ciclo de Melhoria Contínua",
      itens: [
        { id: "reunioes-periodicas-governanca", texto: "Realize reuniões periódicas do Comitê de Governança" },
        { id: "analisar-indicadores", texto: "Analise indicadores e identifique oportunidades de melhoria" },
        { id: "priorizar-melhorias", texto: "Priorize e implemente melhorias identificadas" },
        { id: "incorporar-melhores-praticas", texto: "Incorpore melhores práticas do mercado" },
        { id: "avaliar-novas-tecnologias", texto: "Avalie e implemente novas tecnologias de proteção" },
        { id: "documentar-evolucao", texto: "Documente a evolução do programa de governança" },
      ],
    },
    {
      id: "relatorios-prestacao-contas",
      titulo: "9. Relatórios e Prestação de Contas",
      itens: [
        { id: "preparar-relatorios-periodicos", texto: "Prepare relatórios periódicos para a alta direção" },
        { id: "documentar-accountability", texto: "Documente evidências de accountability (prestação de contas)" },
        { id: "reportar-metricas", texto: "Reporte métricas e evolução do programa" },
        { id: "apresentar-resultados-anuais", texto: "Apresente resultados anuais para stakeholders e ANPD se solicitado" },
      ],
    },
  ],
  pratica: [
    {
      emoji: "🔄",
      titulo: "PGP é programa contínuo: como NÃO virar peça de exposição",
      descricao:
        "A armadilha clássica da Fase 7: o órgão termina as Fases 1-6, faz a foto da equipe com o documento na mão, posta no portal, e o PGP morre ali. Em 12 meses, ninguém mais lembra que existe — até o dia do incidente. O programa SÓ EXISTE enquanto está em movimento. A diferença entre PGP vivo e PGP de exposição não é a qualidade da entrega inicial, é o RITMO que vem depois.",
      badge: "💡 Dica de ouro do curso",
      destaque: true,
      detalhe:
        'Método prático: estabeleça desde o dia 1 da Fase 7 uma agenda anual recorrente, com responsáveis nomeados e prazos cravados. Janeiro: revisão anual do Inventário (com Donos). Março: auditoria interna (Controladoria/Auditoria com checklist GAP). Maio: revisão das Políticas (DPO + Procuradoria). Julho: 1 simulação de incidente (PRI testado de verdade — pessoa A reporta, equipe ETIR é acionada, cronômetro). Setembro: revisão dos contratos com Terceiros críticos. Novembro: relatório anual ao Comitê + alta direção. A cada mês, o DPO reserva 1 hora pra ler ANPD + atualizar Plano de Ação. Custo: ~80h/ano (1 servidor 0,5 dia/mês). Resultado: no dia do incidente real, a Instituição responde em 24h e não vira manchete. No app de curso, o Painel do Facilitador mostra a timeline das 7 missões — esse é o protótipo da operação da Fase 7 institucional.',
    },
    {
      emoji: "🚨",
      titulo: "Incidentes",
      descricao:
        "Resposta a incidentes — registrar, classificar severidade pela régua objetiva da Res. 15/2024, comunicar à ANPD (3 dias úteis pra alta severidade) e aos titulares afetados (Art. 48 §1º LGPD).",
      badge: "Missão 5 · 25 min",
      href: "/dashboard/incidentes",
    },
    {
      emoji: "📋",
      titulo: "Documento do PRI",
      descricao:
        "Plano de Resposta a Incidentes institucional — 8 seções (ciclo NIST + LGPD), Equipe ETIR/CSIRT, Matriz RACI. Documento que SOBREVIVE rotações de servidor e mantém o método em movimento.",
      badge: "Fase 7",
      href: "/dashboard/pri",
    },
  ],
};

// ─── EXPORT ───────────────────────────────────────────────────────────────

export const CONTEUDO_FASES: ConteudoFase[] = [
  FASE_3,
  FASE_4,
  FASE_5,
  FASE_6,
  FASE_7,
];

export function getConteudoFase(slug: string): ConteudoFase | undefined {
  return CONTEUDO_FASES.find((f) => f.slug === slug);
}

// Auxiliar pra sidebar saber quais fases já têm conteúdo (não-stub)
export function temConteudo(fase: ConteudoFase): boolean {
  return fase.descricao.length > 1 || fase.checklist.length > 0;
}
