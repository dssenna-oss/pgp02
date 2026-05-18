// Auto-preenchimento do Aviso de Privacidade.
//
// Pega os dados que o grupo já produziu nas missões anteriores (Inventário,
// RIPD, Terceiros, DSR, Encarregado) e monta o markdown das 12 seções
// substituindo os placeholders [entre colchetes] por informação real.
//
// Pegadinha pedagógica: revela se o grupo PUBLICOU o Aviso sem ter feito
// o trabalho de base — vai aparecer "Nenhum processo aprovado", "Sem
// operadores cadastrados", etc.

type CompanyData = {
  name: string;
  cnpj: string | null;
  orgao: string | null;
  cidade: string | null;
  dpoName: string | null;
  dpoEmail: string | null;
  dpoTelefone: string | null;
  dpoEndereco: string | null;
  dpoSubstitutoNome: string | null;
  dpoSubstitutoEmail: string | null;
  dpoSubstitutoTelefone: string | null;
};

type ProcessoAprovado = {
  nome: string;
  setor: string | null;
  finalidade: string | null;
  baseLegal: string | null;
  tiposDados: string | null;
  dadosSensiveis: boolean | null;
  retencao: string | null;
  compartilhamento: string | null;
  medidasSeguranca: string | null;
};

type OperadorBasico = {
  nome: string;
  servico: string | null;
  riscoFatoresMarcados: string[];
  tipoOperacao: string | null;
  nivelRisco: string | null;
};

type DsrInfo = {
  total: number;
};

export type DadosParaAviso = {
  company: CompanyData;
  processos: ProcessoAprovado[];
  operadores: OperadorBasico[];
  dsr: DsrInfo;
};

function safe(s: string | null | undefined, fallback = "—"): string {
  if (!s || !String(s).trim()) return fallback;
  return String(s).trim();
}

function listOrEmpty(items: string[], emptyMsg: string): string {
  if (items.length === 0) return emptyMsg;
  return items.map((i) => `- ${i}`).join("\n");
}

export function gerarAvisoAutoPreenchido(dados: DadosParaAviso): string {
  const { company, processos, operadores, dsr } = dados;
  const hoje = new Date().toLocaleDateString("pt-BR");

  // === Seção 1: Quem somos ===
  const sec1 =
    `## 1. Quem somos\n\n` +
    `**${safe(company.name, "Controlador")}**, ` +
    `${company.cnpj ? `inscrito(a) no CNPJ sob o nº ${company.cnpj}` : "[CNPJ a confirmar]"}` +
    `${company.cidade ? `, com sede no município de ${company.cidade}` : ""}.\n\n` +
    `Atuamos como **Controlador** dos dados pessoais tratados no contexto dos nossos serviços, ` +
    `nos termos do art. 5º, VI da Lei nº 13.709/2018 (LGPD).`;

  // === Seção 2: Encarregado ===
  const encarregadoCadastrado = company.dpoName || company.dpoEmail;
  const sec2 =
    `## 2. Encarregado pelo tratamento de dados (DPO)\n\n` +
    (encarregadoCadastrado
      ? `**Encarregado titular:**\n` +
        `- Nome: ${safe(company.dpoName)}\n` +
        `- E-mail: ${safe(company.dpoEmail)}\n` +
        `- Telefone: ${safe(company.dpoTelefone)}\n` +
        `- Endereço para contato: ${safe(company.dpoEndereco)}\n\n` +
        (company.dpoSubstitutoNome
          ? `**Encarregado substituto:**\n` +
            `- Nome: ${safe(company.dpoSubstitutoNome)}\n` +
            `- E-mail: ${safe(company.dpoSubstitutoEmail)}\n` +
            `- Telefone: ${safe(company.dpoSubstitutoTelefone)}\n`
          : `_Encarregado substituto ainda não designado._\n`)
      : `⚠️ **ATENÇÃO — Encarregado ainda não cadastrado.** Vá em Fase 1 → Encarregado pra preencher os dados do DPO.`);

  // === Seção 3: Quais dados tratamos e por quê ===
  let sec3 = `## 3. Quais dados tratamos e por quê\n\n`;
  if (processos.length === 0) {
    sec3 +=
      `⚠️ **Nenhum processo aprovado no Inventário.** ` +
      `Volte à Fase 3 (Inventário) e aprove ao menos 1 processo antes de publicar este Aviso.`;
  } else {
    sec3 += `Nossas atividades de tratamento de dados pessoais são:\n\n`;
    for (const p of processos) {
      sec3 += `### ${p.nome}\n`;
      if (p.setor) sec3 += `**Setor responsável:** ${p.setor}\n\n`;
      if (p.finalidade) sec3 += `**Finalidade:** ${p.finalidade}\n\n`;
      if (p.tiposDados) {
        // tiposDados pode vir como JSON ou texto livre
        sec3 += `**Dados tratados:** ${p.tiposDados}${p.dadosSensiveis ? " *(inclui dados pessoais sensíveis — art. 5º, II LGPD)*" : ""}\n\n`;
      }
    }
  }

  // === Seção 4: Base legal ===
  let sec4 = `## 4. Base legal do tratamento\n\n`;
  if (processos.length === 0) {
    sec4 += `_Será detalhado quando houver processos aprovados no Inventário._`;
  } else {
    sec4 += `Para cada atividade, aplicamos as seguintes hipóteses legais (art. 7º e art. 11 LGPD):\n\n`;
    for (const p of processos) {
      sec4 += `- **${p.nome}:** ${safe(p.baseLegal, "_base legal a definir no Inventário_")}\n`;
    }
  }

  // === Seção 5: Retenção ===
  let sec5 = `## 5. Por quanto tempo guardamos seus dados\n\n`;
  if (processos.length === 0) {
    sec5 += `_Será detalhado quando houver processos aprovados no Inventário._`;
  } else {
    sec5 += `Prazos de retenção definidos para cada atividade:\n\n`;
    for (const p of processos) {
      sec5 += `- **${p.nome}:** ${safe(p.retencao, "_prazo a definir no Inventário_")}\n`;
    }
  }

  // === Seção 6: Como protegemos ===
  let sec6 = `## 6. Como protegemos seus dados\n\n`;
  sec6 +=
    `Adotamos medidas técnicas e administrativas aptas a proteger os dados pessoais contra acessos ` +
    `não autorizados e situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ` +
    `ou difusão (art. 46 LGPD), incluindo:\n\n`;
  const medidasUnicas = Array.from(new Set(processos.map((p) => p.medidasSeguranca).filter(Boolean) as string[]));
  if (medidasUnicas.length > 0) {
    sec6 += medidasUnicas.map((m) => `- ${m}`).join("\n");
  } else {
    sec6 +=
      `- Controles de acesso por perfil de usuário (princípio da necessidade);\n` +
      `- Backup periódico dos sistemas;\n` +
      `- Auditoria e registro (log) das operações;\n` +
      `- Treinamento contínuo dos servidores em proteção de dados.`;
  }

  // === Seção 7: Compartilhamento ===
  let sec7 = `## 7. Com quem compartilhamos\n\n`;
  if (operadores.length === 0) {
    sec7 +=
      `⚠️ **Nenhum operador cadastrado.** ` +
      `Se há terceiros tratando dados em nosso nome, cadastre-os em Fase 6 → Gestão de Terceiros ` +
      `antes de publicar este Aviso (art. 39 LGPD).`;
  } else {
    sec7 += `Compartilhamos dados pessoais com os seguintes operadores e parceiros:\n\n`;
    const compartilhamentos = processos
      .map((p) => p.compartilhamento)
      .filter(Boolean) as string[];
    if (compartilhamentos.length > 0) {
      sec7 += `**Compartilhamentos declarados no Inventário:**\n\n`;
      sec7 += Array.from(new Set(compartilhamentos)).map((c) => `- ${c}`).join("\n");
      sec7 += `\n\n`;
    }
    sec7 += `**Operadores contratados (art. 39 LGPD):**\n\n`;
    sec7 += operadores
      .map((o) => `- **${o.nome}** — ${safe(o.servico, "serviço a detalhar")}`)
      .join("\n");
  }

  // === Seção 8: Transferência internacional ===
  let sec8 = `## 8. Transferência internacional\n\n`;
  // Detecta se algum operador tem dados sensíveis ou tecnologias emergentes
  // (proxy pra alta probabilidade de transferência fora do BR — ex: SaaS em cloud global)
  // Por enquanto, marca como "não há" como default seguro
  sec8 +=
    `Atualmente, não realizamos transferência internacional de dados pessoais. ` +
    `Caso, no futuro, alguma operação envolva transferência para fora do Brasil, ` +
    `observaremos as hipóteses do art. 33 LGPD (cláusulas-padrão, decisão de adequação da ANPD, ` +
    `normas corporativas globais, selos/certificações) e comunicaremos os titulares previamente.`;

  // === Seção 9: Cookies ===
  let sec9 = `## 9. Cookies e tecnologias de rastreamento\n\n`;
  sec9 +=
    `Este Aviso aborda os tratamentos administrativos e operacionais. Cookies utilizados em ` +
    `nossos portais web são detalhados na **Política de Cookies** específica, disponível no site institucional. ` +
    `Você pode gerenciar suas preferências de cookies a qualquer momento pelo banner exibido em sua primeira visita.`;

  // === Seção 10: Decisões automatizadas ===
  let sec10 = `## 10. Decisões automatizadas (art. 20 LGPD)\n\n`;
  const operadoresAutomatizados = operadores.filter((o) =>
    o.riscoFatoresMarcados?.includes("ESPECIFICO_DECISOES_AUTOMATIZADAS"),
  );
  if (operadoresAutomatizados.length > 0) {
    sec10 += `Algumas de nossas operações envolvem decisões tomadas com base em tratamento automatizado:\n\n`;
    sec10 += operadoresAutomatizados
      .map((o) => `- **${o.nome}** — ${safe(o.servico)}`)
      .join("\n");
    sec10 += `\n\n` +
      `Você tem o direito de solicitar **revisão dessas decisões por uma pessoa natural** (art. 20 LGPD). ` +
      `Para isso, utilize os canais informados na seção 11.`;
  } else {
    sec10 +=
      `Não realizamos atualmente decisões tomadas unicamente com base em tratamento automatizado ` +
      `de dados pessoais que afetem os interesses dos titulares. Caso isso mude, este Aviso será atualizado ` +
      `e o direito de revisão (art. 20 LGPD) será garantido.`;
  }

  // === Seção 11: Direitos do titular ===
  let sec11 = `## 11. Como exercer seus direitos\n\n`;
  sec11 +=
    `Você, titular de dados pessoais, tem os seguintes direitos garantidos pelo art. 18 LGPD:\n\n` +
    `- Confirmação da existência de tratamento\n` +
    `- Acesso aos dados\n` +
    `- Correção de dados incompletos, inexatos ou desatualizados\n` +
    `- Anonimização, bloqueio ou eliminação de dados\n` +
    `- Portabilidade dos dados\n` +
    `- Eliminação dos dados tratados com base no consentimento\n` +
    `- Informação sobre compartilhamentos\n` +
    `- Revogação do consentimento\n\n` +
    `**Para exercer seus direitos, entre em contato:**\n\n` +
    (encarregadoCadastrado
      ? `- E-mail do Encarregado: **${safe(company.dpoEmail)}**\n` +
        (company.dpoTelefone ? `- Telefone: **${safe(company.dpoTelefone)}**\n` : ``)
      : `⚠️ **Canal de contato do Encarregado ainda não definido.** Cadastre na Fase 1.\n`) +
    `\nO prazo de resposta é de até **15 dias úteis** (art. 19, II LGPD).` +
    (dsr.total > 0 ? `` : `\n\n⚠️ **Atenção:** o canal de DSR ainda não foi estruturado. Cadastre ao menos 1 fluxo em Fase 6 → Direitos do Titular.`);

  // === Seção 12: Atualizações ===
  const sec12 =
    `## 12. Atualizações deste Aviso\n\n` +
    `Este Aviso de Privacidade pode ser revisado a qualquer momento para refletir mudanças em ` +
    `nossos processos de tratamento ou na legislação aplicável. **Versão atual:** ${hoje}. ` +
    `Recomendamos a consulta periódica.`;

  // Junta tudo
  return [
    `# Aviso de Privacidade — ${safe(company.name, "Controlador")}`,
    sec1, sec2, sec3, sec4, sec5, sec6, sec7, sec8, sec9, sec10, sec11, sec12,
  ].join("\n\n");
}

// === Validação anti-placeholder ===
// Detecta padrões `[texto]` (placeholders do rascunho inicial) no markdown.
// Ignora links markdown `[texto](url)` que são válidos.
export function detectarPlaceholders(md: string): string[] {
  if (!md) return [];
  const matches = md.matchAll(/\[([^\]]+?)\](?!\()/g);
  return Array.from(matches).map((m) => m[1]).filter((t) => {
    // ignora coisas que parecem entidades válidas tipo "Art. 7º"
    const trimmed = t.trim();
    // Considera placeholder se tem 3+ palavras OU contém palavras-chave do template
    if (trimmed.split(/\s+/).length >= 3) return true;
    if (/Identifique|Inserir|Preencher|sob qual|Dados|Lista de|Quando|Nome,/i.test(trimmed)) return true;
    return false;
  });
}
