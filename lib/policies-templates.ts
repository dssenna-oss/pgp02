/**
 * Templates seed das políticas LGPD (Checkpoint 12).
 *
 * Cada template é markdown com placeholders no formato `{{nome}}` que
 * são substituídos no momento da criação a partir dos dados da Company.
 * Templates baseados nos modelos oficiais da metodologia LGPD PRO + o
 * checklist da transcrição (finalidade, bases legais, retenção, etc.).
 *
 * Placeholders suportados:
 *   - {{empresa}}            → companyName
 *   - {{empresa_nome_curto}} → tradeName ou companyName
 *   - {{cnpj}}               → cnpj formatado
 *   - {{endereco}}           → address completo
 *   - {{cidade}}, {{estado}} → city/state
 *   - {{website}}, {{email}}, {{telefone}} → contatos da empresa
 *   - {{dpo_nome}}, {{dpo_email}}, {{dpo_telefone}} → encarregado
 *   - {{data_publicacao}}    → DD/MM/AAAA atual
 *   - {{ano}}                → AAAA atual
 *   - {{representante_legal}} → legalRepresentative
 */

import type { PolicyType } from "@/lib/policies-helpers";

export interface PolicyTemplate {
  type: PolicyType;
  defaultTitle: string;
  /** Resumo curto pra UI ("o que essa política faz"). */
  blurb: string;
  /** Conteúdo markdown com placeholders {{...}}. */
  content: string;
}

// ============================================================
// Helper de substituição de placeholders
// ============================================================

export interface CompanyPlaceholders {
  companyName: string;
  tradeName: string | null;
  cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  dpoName: string | null;
  dpoEmail: string | null;
  dpoPhone: string | null;
  legalRepresentative: string | null;
}

export function applyPlaceholders(
  template: string,
  c: CompanyPlaceholders,
): string {
  const today = new Date();
  const date = today.toLocaleDateString("pt-BR");
  const year = String(today.getFullYear());
  const map: Record<string, string> = {
    "{{empresa}}": c.companyName,
    "{{empresa_nome_curto}}": c.tradeName || c.companyName,
    "{{cnpj}}": c.cnpj || "[CNPJ a preencher]",
    "{{endereco}}": c.address || "[endereço a preencher]",
    "{{cidade}}": c.city || "[cidade]",
    "{{estado}}": c.state || "[estado]",
    "{{email}}": c.email || "[e-mail de contato]",
    "{{telefone}}": c.phone || "[telefone]",
    "{{website}}": c.website || "[website]",
    "{{dpo_nome}}": c.dpoName || "[Nome do Encarregado]",
    "{{dpo_email}}": c.dpoEmail || "[e-mail do Encarregado]",
    "{{dpo_telefone}}": c.dpoPhone || "[telefone do Encarregado]",
    "{{representante_legal}}": c.legalRepresentative || "[Representante Legal]",
    "{{data_publicacao}}": date,
    "{{ano}}": year,
  };
  let out = template;
  for (const [k, v] of Object.entries(map)) {
    out = out.split(k).join(v);
  }
  return out;
}

// ============================================================
// Os 11 templates (Política do PGP é o documento mater)
// ============================================================

const T_POLITICA_PGP: PolicyTemplate = {
  type: "POLITICA_PGP",
  defaultTitle: "Política do Programa de Governança em Privacidade (PGP)",
  blurb:
    "Documento mater que formaliza o Programa de Governança em Privacidade da organização. Declara o programa, escopo, governança, papéis, ciclo de revisão, e referencia os outros instrumentos (Inventário, RIPD, Plano de Ação, GAP, Políticas, Terceiros) como anexos. Base legal: Art. 50 da LGPD + Resolução CD/ANPD nº 2/2022.",
  content: `# Política do Programa de Governança em Privacidade (PGP) — {{empresa}}

**Última atualização:** {{data_publicacao}}

## 1. Apresentação

A **{{empresa}}**, inscrita no CNPJ {{cnpj}}, com sede em {{endereco}}, formaliza por meio deste documento o seu **Programa de Governança em Privacidade (PGP)** — um conjunto contínuo de práticas, processos e instrumentos que assegura o tratamento de dados pessoais em conformidade com a **Lei nº 13.709/2018 (LGPD)**, com a **Resolução CD/ANPD nº 2/2022** (Regulamento de Aplicação da LGPD para agentes de tratamento de pequeno porte, quando aplicável) e com as **boas práticas de governança previstas no Art. 50 da LGPD**.

> O PGP **não é um projeto** com início, meio e fim. É um **programa permanente**, vivo, que evolui junto com a organização, com a tecnologia e com o entendimento jurisprudencial da LGPD pela Autoridade Nacional de Proteção de Dados (ANPD).

## 2. Objetivo

Este documento tem por objetivo:

a) Declarar o compromisso institucional da {{empresa}} com a proteção de dados pessoais e a privacidade dos titulares;
b) Estabelecer o conjunto mínimo de regras, controles, papéis e instrumentos que compõem o PGP;
c) Atribuir responsabilidades dentro da organização;
d) Definir o ciclo de revisão, monitoramento e melhoria contínua do programa;
e) Servir de instrumento mater de governança, ao qual se subordinam as demais políticas, normas, procedimentos e instrumentos de proteção de dados.

## 3. Escopo

Esta Política se aplica a:

- Todos os colaboradores, prestadores de serviço, estagiários e terceiros que tratem dados pessoais em nome da {{empresa}};
- Todos os processos, sistemas, áreas e unidades organizacionais da {{empresa}} que envolvam, direta ou indiretamente, o tratamento de dados pessoais;
- Toda relação contratual, presente ou futura, que envolva o compartilhamento de dados pessoais com terceiros (operadores ou outros controladores).

## 4. Princípios

O PGP da {{empresa}} é regido pelos princípios do **Art. 6º da LGPD**:

| Princípio | Aplicação no PGP |
|---|---|
| Finalidade | Tratamento limitado a finalidades legítimas, específicas e informadas. |
| Adequação | Tratamento compatível com as finalidades informadas ao titular. |
| Necessidade | Limitação ao mínimo necessário para a finalidade pretendida. |
| Livre acesso | Garantia de consulta gratuita e facilitada pelos titulares. |
| Qualidade dos dados | Exatidão, clareza, relevância e atualização. |
| Transparência | Informações claras, precisas e facilmente acessíveis. |
| Segurança | Medidas técnicas e administrativas aptas a proteger os dados. |
| Prevenção | Medidas para prevenir a ocorrência de danos. |
| Não discriminação | Vedação ao tratamento para fins discriminatórios ilícitos ou abusivos. |
| Responsabilização e prestação de contas | Demonstração da adoção de medidas eficazes. |

## 5. Estrutura de Governança

### 5.1. Encarregado pelo Tratamento de Dados Pessoais (DPO)

A {{empresa}} designa formalmente, na pessoa de **{{dpo_nome}}** ({{dpo_email}}, {{dpo_telefone}}), o **Encarregado pelo Tratamento de Dados Pessoais (DPO)**, conforme exigido pelo Art. 41 da LGPD.

Atribuições do DPO:

a) Aceitar reclamações e comunicações dos titulares, prestar esclarecimentos e adotar providências;
b) Receber comunicações da ANPD e adotar providências;
c) Orientar funcionários e contratados sobre práticas a serem tomadas em relação à proteção de dados;
d) Executar as demais atribuições determinadas pelo controlador ou estabelecidas em normas complementares.

### 5.2. Comitê de Privacidade

A {{empresa}} mantém um **Comitê de Privacidade** com representantes das áreas-chave (TI, Jurídico/Compliance, RH, Marketing/Comercial, Segurança da Informação), que se reúne ao menos **trimestralmente** para:

- Revisar incidentes, riscos e ações em curso;
- Aprovar mudanças relevantes nos instrumentos do PGP;
- Definir prioridades do Plano de Ação institucional;
- Avaliar a maturidade do programa e propor melhorias.

### 5.3. Alta Direção

A Alta Direção é responsável por:

- Aprovar formalmente esta Política e suas revisões;
- Garantir os recursos necessários (humanos, financeiros, tecnológicos) para a execução do PGP;
- Demandar e analisar relatórios periódicos de maturidade e conformidade;
- Sancionar o descumprimento das obrigações desta Política.

### 5.4. Colaboradores e Terceiros

Todos os colaboradores e terceiros que tratam dados pessoais em nome da {{empresa}} são responsáveis por:

- Conhecer e cumprir esta Política e os instrumentos a ela vinculados;
- Comunicar imediatamente ao DPO qualquer suspeita de incidente, vazamento ou tratamento irregular;
- Participar dos treinamentos obrigatórios de proteção de dados.

## 6. Instrumentos do Programa (anexos integrantes)

O PGP da {{empresa}} é composto pelos seguintes instrumentos, que **integram esta Política como anexos** e são revisados conforme item 9:

1. **Inventário de Atividades de Tratamento (RoPA)** — registro completo dos processos que envolvem dados pessoais, com finalidade, base legal, dados tratados, titulares, retenção, compartilhamento e medidas de segurança.
2. **Análise de Riscos de Privacidade** — avaliação de riscos por processo (matriz Probabilidade × Impacto), com plano de mitigação e ciclo de vida (identificado / em mitigação / aceito / eliminado).
3. **GAP Analysis (Diagnóstico Macro)** — diagnóstico macro de adequação à LGPD em 119 controles distribuídos em 28 domínios, com aderência (não aderente / parcial / aderente) e ponto de melhoria.
4. **Diagnóstico de Privacidade** — score executivo consolidado (0–100) calculado a partir de GAP, Riscos, Bases Legais e Inventário, com recomendações priorizadas.
5. **Plano de Ação Institucional** — lista oficial das ações de adequação, com responsável formal, prazo, prioridade e origem (manual / GAP / Riscos / Bases Legais / Operadores).
6. **Políticas LGPD** — conjunto de políticas e avisos institucionais (Aviso de Privacidade externo, Política Interna, Norma, Termos de Uso, Cookies, Terceiros, Retenção, Treinamento, Transferência Internacional, Avaliação de Terceiros).
7. **Relatórios de Impacto à Proteção de Dados (RIPD)** — documento formal exigido para tratamentos de alto risco, em 8 seções estruturadas conforme Guia ANPD, com fluxo de aprovação Contribuidor → DPO.
8. **Gestão de Terceiros** — cadastro de operadores, controladores e co-controladores; contratos com cláusulas LGPD obrigatórias (privacidade + notificação de incidente); régua de risco do contrato (6 critérios ANPD); avaliações periódicas Cyber + LGPD.
9. **Programa de Treinamento** — capacitação inicial e periódica de toda a organização em proteção de dados.
10. **Procedimento de Atendimento aos Titulares** — canal único, prazo legal, registros de solicitações de acesso, retificação, eliminação, portabilidade e revogação de consentimento (Art. 18 da LGPD).
11. **Procedimento de Resposta a Incidentes** — fluxo de detecção, contenção, comunicação à ANPD em até 72 horas (quando aplicável), notificação aos titulares e registro pós-incidente.

## 7. Ciclo PDCA aplicado ao PGP

O programa segue o ciclo **Plan-Do-Check-Act** de melhoria contínua:

- **Plan (Planejar)** — revisão anual do Plano de Ação, do GAP e do Diagnóstico de Privacidade. Definição de prioridades pelo Comitê.
- **Do (Executar)** — execução das ações pelo DPO + Comitê + áreas responsáveis, com registro de evidências em cada instrumento.
- **Check (Verificar)** — monitoramento contínuo (Painel de Maturidade do PGP) e auditorias periódicas. Revisão dos riscos, controles e métricas.
- **Act (Agir)** — ajuste das políticas, instrumentos e controles a partir das lições aprendidas, incidentes e mudanças regulatórias.

## 8. Métricas e Indicadores

A maturidade do PGP é medida por meio do **Painel de Maturidade do PGP** (tela executiva do sistema), que consolida:

- **Score de maturidade (0–100)** com pesos: Diagnóstico (40%) · Plano em dia (20%) · Políticas publicadas (15%) · RIPDs aprovados (15%) · Terceiros adequados (10%);
- Status de cada uma das 7 Fases do programa (Preliminar, Formação das Equipes, Diagnóstico Inicial, Mapeamento e Análise de Riscos, GAP Analysis, Plano de Ação, Execução, Monitoramento);
- Pendências críticas (riscos abertos, ações atrasadas, contratos pendentes de adequação).

O Painel é apresentado **trimestralmente à Alta Direção** e exportado em PDF para os relatórios formais de governança.

## 9. Revisão da Política e dos Instrumentos

Esta Política e seus instrumentos integrantes são revisados:

- **Anualmente**, em ciclo regular do PGP;
- **Sempre que** houver mudança regulatória relevante (nova resolução da ANPD, alteração da LGPD, decisão judicial estruturante);
- **Sempre que** houver incidente de segurança que demande revisão de controles;
- **Sempre que** houver mudança organizacional relevante (fusão, aquisição, novo serviço, mudança de modelo de negócio).

A última revisão e a data da próxima revisão programada são registradas no campo de versionamento desta Política.

## 10. Penalidades

O descumprimento desta Política sujeita o infrator às penalidades previstas no Regimento Interno da {{empresa}}, sem prejuízo das sanções administrativas, civis e penais cabíveis, conforme:

- **LGPD** (Lei 13.709/2018) — Art. 52 (sanções aplicáveis pela ANPD);
- **CLT** e instrumentos de regulação trabalhista — para empregados;
- **Contratos vigentes** — para terceiros, prestadores e fornecedores.

## 11. Disposições Finais

a) Esta Política entra em vigor na data de sua publicação e revoga eventuais disposições em contrário;
b) Casos omissos serão resolvidos pelo Encarregado em conjunto com o Comitê de Privacidade, com aprovação da Alta Direção quando necessário;
c) Esta Política é divulgada interna e externamente nos canais oficiais da {{empresa}}, e está sempre disponível para consulta no portal institucional.

---

**Aprovado em {{data_publicacao}}**

**{{representante_legal}}** — Representante Legal da {{empresa}}

**{{dpo_nome}}** — Encarregado pelo Tratamento de Dados Pessoais (DPO)

---

*Documento institucional do Programa de Governança em Privacidade — versão {{data_publicacao}}*
`,
};

const T_AVISO_EXTERNO: PolicyTemplate = {
  type: "AVISO_PRIVACIDADE_EXTERNO",
  defaultTitle: "Aviso de Privacidade",
  blurb:
    "Documento público que esclarece e informa aos titulares como a organização trata seus dados pessoais — operações de coleta, uso, armazenamento, compartilhamento e eliminação. Modelo institucional alinhado ao Aviso de Privacidade da ANPD (12 seções). Indicado para o portal oficial. Use 'Atualizar do Inventário' (Bloco B — em construção) para popular a tabela de tratamento automaticamente a partir dos processos cadastrados.",
  content: `# Aviso de Privacidade — {{empresa}}

**Última atualização:** {{data_publicacao}}

> Este Aviso de Privacidade tem a finalidade de esclarecer e informar aos titulares que acessam o sítio eletrônico da **{{empresa}}** como seus dados pessoais são tratados, especialmente no que se refere às operações de coleta, uso, armazenamento, compartilhamento e eliminação. Modelo institucional alinhado às orientações da Autoridade Nacional de Proteção de Dados (ANPD).

---

## Sumário

1. Sobre este Aviso de Privacidade
2. Quais tipos de dados pessoais utilizamos?
3. Por que e como tratamos seus dados pessoais?
4. Por que e como tratamos cookies em nosso sítio institucional?
5. Como obtemos seus dados pessoais?
6. Como armazenamos seus dados pessoais?
7. Com quem podemos compartilhar seus dados pessoais?
8. Como ocorre a eliminação de seus dados pessoais?
9. Como protegemos seus dados pessoais?
10. Seus direitos de titular de dados pessoais
11. Detalhes de contato com a {{empresa_nome_curto}}
12. Detalhes de contato do Encarregado pelo tratamento de dados pessoais

---

## 1. Sobre este Aviso de Privacidade

**1.1.** Este Aviso de Privacidade do sítio eletrônico da {{empresa}} tem o objetivo de informar, de maneira objetiva e transparente, a você, titular de dados, como a {{empresa}} trata seus dados pessoais.

**1.2.** A {{empresa}} é \`[descrever natureza jurídica: autarquia / fundação / órgão municipal / empresa de economia mista / etc.]\`, com sede em {{endereco}}, inscrita no CNPJ {{cnpj}}. Executamos nossas atividades de acordo com as atribuições previstas em \`[citar lei/decreto/lei orgânica/estatuto que define as competências]\` e em conformidade com a **Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD)**.

[Voltar ao Sumário](#sumário)

---

## 2. Quais tipos de dados pessoais utilizamos?

**2.1.** Para o desempenho de nossas atividades, podemos tratar as seguintes **categorias de dados pessoais**:

{{categorias_dados}}

> *Atenção: o conteúdo acima é gerado automaticamente a partir do Inventário de Dados da organização (Bloco B — em construção). Enquanto o aggregator não está ativo, edite manualmente as categorias. Modelo institucional sugerido pela ANPD:*
>
> - **Cadastrais e de identificação**: nome, qualificação pessoal, endereço e informações identificadoras perante o cadastro de órgãos públicos, como o número de Cadastro de Pessoas Físicas (CPF).
> - **Relacionados a comunicações eletrônicas**: correio eletrônico (e-mail), endereço IP e informações sobre páginas acessadas.
> - **Informações sobre interação de titular** com agentes de tratamento, quando fornecidas no conteúdo de petições dirigidas à {{empresa_nome_curto}}.
> - **Informações sobre denúncias**, como dados pessoais do denunciante.
> - **Informações sobre encarregado ou representante legal** de agente de tratamento.

[Voltar ao Sumário](#sumário)

---

## 3. Por que e como tratamos seus dados pessoais?

**3.1.** Podemos tratar seus dados pessoais para o cumprimento das competências institucionais da {{empresa}}. Na tabela a seguir são apresentadas as principais atividades de tratamento de dados pessoais de acordo com as principais finalidades, titulares afetados, hipóteses legais e categorias de dados pessoais tratados.

{{matriz_tratamento}}

> *Atenção: a tabela acima é gerada automaticamente a partir do Inventário de Dados da organização ao clicar em "Atualizar do Inventário" (Bloco B — em construção). Enquanto o aggregator não está ativo, complete manualmente. Modelo de tabela:*
>
> | Finalidades | Titulares afetados | Hipóteses legais | Categorias de dados pessoais |
> |---|---|---|---|
> | Atender solicitações, requerimentos e consultas | Cidadãos e usuários do serviço | Obrigação legal (Art. 7º, II) | Cadastrais e de identificação · Comunicações eletrônicas |
> | Cumprimento de atribuições da Ouvidoria (Lei 13.460/2017 e Decreto 9.492/2018) | Qualquer pessoa que apresente requerimento | Obrigação legal | Cadastrais · Comunicações · Interação · Denúncias |
> | Realizar processos seletivos e gestão de pessoas | Candidatos e servidores | Obrigação legal | Cadastrais · Comunicações |
> | Atuar em processos administrativos e judiciais | Qualquer pessoa interessada | Obrigação legal ou exercício regular de direitos | Cadastrais · Comunicações · Interação · Denúncias |
> | Dar publicidade a documentos institucionais (transparência ativa — LAI) | Agentes públicos e demais titulares envolvidos | Obrigação legal | Cadastrais · Comunicações |

**3.2.** O tratamento de dados pessoais para o cumprimento das atribuições institucionais da {{empresa}} está amparado nas hipóteses legais mencionadas na tabela acima.

**3.3.** Ademais, podemos tratar seus dados pessoais para cumprimento de outras obrigações legais — por exemplo, para atender aos seus direitos de titular previstos na LGPD, para cumprir ordens judiciais ou para atender a requerimentos de outras autoridades públicas, conforme previsto em lei.

**3.4.** Por fim, outra finalidade é o gerenciamento de nosso sítio eletrônico, que envolve o uso de cookies, conforme exposto na **Seção 4**.

[Voltar ao Sumário](#sumário)

---

## 4. Por que e como tratamos cookies em nosso sítio institucional?

**4.1.** Para melhorar a sua experiência no sítio eletrônico da {{empresa}} e prover serviços, utilizamos *cookies*. \`[Adapte conforme infraestrutura: "A {{empresa_nome_curto}}, como demais órgãos da Administração Pública Federal, utiliza-se dos serviços do portal Gov.br…" OU "A {{empresa_nome_curto}} utiliza ferramentas próprias de análise…"]\`

**4.2.** Utilizamos *cookies* **estritamente necessários**, com base na hipótese legal do legítimo interesse, que não podem ser desativados em nossos sistemas. Esses *cookies* permitem funcionalidades essenciais para o fornecimento dos serviços, tais como segurança, verificação de identidade e gestão de rede.

**4.3.** Utilizamos também *cookies* de **desempenho** e de **terceiros** que são opcionais e dependem do consentimento do titular. Os de desempenho visam à melhoria do sítio eletrônico por meio da coleta de dados anonimizados sobre navegação. Os de terceiros suportam serviços como compartilhamento em redes sociais ou exibição de vídeos incorporados.

**4.4.** As configurações podem ser realizadas no banner de cookies ou modificadas, a qualquer tempo, no ícone de configurações de cookies do sítio. Para detalhes completos sobre os *cookies* utilizados, consulte nossa **Política de Cookies**.

[Voltar ao Sumário](#sumário)

---

## 5. Como obtemos seus dados pessoais?

**5.1.** Obtemos seus dados pessoais por meio do nosso sítio eletrônico ou por outras formas de contato e interação com o público. Seus dados podem ser obtidos quando você mesmo nos fornece — por exemplo, ao apresentar um requerimento, denúncia, petição ou ao enviar documentos, informações e comunicações.

**5.2.** Também podemos obter seus dados pessoais por meios indiretos, como em notificações recebidas pela {{empresa_nome_curto}} nas quais a pessoa notificante se refere a você, ou por meio de bases públicas autorizadas em lei.

[Voltar ao Sumário](#sumário)

---

## 6. Como armazenamos seus dados pessoais?

**6.1.** Armazenamos seus dados pessoais de forma segura, em \`[descrever infraestrutura: "infraestrutura tecnológica da Administração Pública Federal" / "data center próprio com certificação X" / "provedor de nuvem com nível adequado de proteção"]\`, conforme padrões de segurança aplicáveis à hipótese e de maneira que favoreça os meios para o exercício dos seus direitos previstos na LGPD.

[Voltar ao Sumário](#sumário)

---

## 7. Com quem podemos compartilhar seus dados pessoais?

**7.1.** Podemos compartilhar seus dados pessoais com organizações públicas ou privadas, respeitando as disposições da LGPD, em especial o **princípio da necessidade**, e sempre de forma compatível com a(s) finalidade(s) para a(s) qual(is) foram coletados, conforme indicado na **Seção 3**. Também podemos compartilhar ou divulgar dados pessoais quando necessário para atender ao princípio da publicidade administrativa, nos termos da **Lei nº 12.527/2011 (Lei de Acesso à Informação — LAI)**.

**7.2.** Considerando que a {{empresa}} pode utilizar sistemas informáticos geridos por outros órgãos ou empresas, é importante esclarecer que seus dados pessoais podem ser compartilhados com esses agentes de tratamento.

**7.3.** A seguir, apresentamos as principais categorias de organizações com as quais podemos compartilhar os seus dados pessoais:

{{tipos_compartilhamento}}

> *Atenção: o conteúdo acima é gerado automaticamente a partir do registro de Operadores/Terceiros (Bloco B — em construção). Enquanto o aggregator não está ativo, edite manualmente. Categorias institucionais sugeridas:*
>
> - Organizações responsáveis pelo tratamento dos dados pessoais (agentes de tratamento), no caso de petições e requerimentos de titulares;
> - Organizações públicas parceiras na prestação de serviços ou execução de políticas;
> - Organizações contratadas pela {{empresa_nome_curto}} para a prestação de serviços (provedores de tecnologia, prestadores de serviços administrativos);
> - Órgãos da estrutura administrativa de apoio (\`[ex.: Secretaria de Administração / Ministério apoiador]\`);
> - Órgãos de controle externo, tais como Tribunal de Contas, Controladoria, Ministério Público;
> - Órgãos do Poder Judiciário, no exercício da função jurisdicional;
> - Qualquer pessoa que apresente um pedido de acesso à informação à {{empresa_nome_curto}}, observado o disposto na LAI.

**7.4.** Ao compartilharmos seus dados pessoais com operadores de dados, exigiremos que sejam tratados de acordo com nossas instruções, o que inclui o armazenamento seguro, retenção apenas pelo período instruído e o não compartilhamento subsequente com outras organizações sem nossa prévia e expressa autorização.

[Voltar ao Sumário](#sumário)

---

## 8. Como ocorre a eliminação de seus dados pessoais?

**8.1.** Seus dados pessoais serão eliminados quando tiverem cumprido a(s) finalidade(s) para a(s) qual(is) foram coletados, observadas as **tabelas de temporalidade** aplicáveis e as regras de término de tratamento, eliminação e hipóteses de conservação de dados, nos termos dos **arts. 15 e 16 da LGPD**.

[Voltar ao Sumário](#sumário)

---

## 9. Como protegemos seus dados pessoais?

**9.1.** Seus dados pessoais tratados pela {{empresa}} são protegidos de acordo com as normas e diretrizes de segurança da informação expedidas pelos órgãos competentes e de acordo com as disposições da LGPD.

**9.2.** Adotamos medidas técnicas e administrativas apropriadas, incluindo:

- Criptografia em trânsito (HTTPS/TLS);
- Controle de acesso baseado em função e princípio do mínimo privilégio;
- Logs e monitoramento de acessos;
- Capacitação contínua das equipes em proteção de dados pessoais;
- Política de resposta a incidentes de segurança.

**9.3.** Considerando que a {{empresa}} pode utilizar sistemas informáticos geridos por outros órgãos ou empresas, recomendamos a consulta às páginas institucionais desses órgãos para informações complementares sobre suas políticas de segurança da informação e avisos de privacidade (ver **Seção 7**).

[Voltar ao Sumário](#sumário)

---

## 10. Seus direitos de titular de dados pessoais

**10.1.** Seus principais direitos enquanto titular de dados pessoais, previstos no **art. 18 da LGPD**, são:

- Confirmação da existência de tratamento;
- Acesso aos dados;
- Correção de dados incompletos, inexatos ou desatualizados;
- Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD;
- Eliminação dos dados tratados com consentimento, autorizada a sua conservação nos casos descritos na LGPD;
- Obtenção de informações sobre as entidades públicas ou privadas com as quais a {{empresa_nome_curto}} tenha compartilhado seus dados;
- Possibilidade de não fornecer o consentimento, bem como de ser informado sobre as consequências, em caso de negativa, quando a operação se basear no consentimento;
- Revogação do consentimento, quando aplicável;
- Solicitação de revisão de decisões tomadas unicamente com base em tratamento automatizado de dados pessoais.

**10.2.** Caso deseje exercer seus direitos, utilize \`[descrever o canal: "a Plataforma Fala.BR" / "o e-mail do Encarregado" / "o formulário disponível em <link>"]\`. O exercício de seus direitos é **gratuito** e a {{empresa_nome_curto}} avaliará a possibilidade do imediato atendimento; caso não seja possível, você será informado dos motivos ou dos prazos necessários.

[Voltar ao Sumário](#sumário)

---

## 11. Detalhes de contato com a {{empresa_nome_curto}}

**11.1.** Você pode nos contatar pelos seguintes canais:

- **E-mail institucional:** {{email}}
- **Telefone:** {{telefone}}
- **Sítio eletrônico:** {{website}}
- **Endereço:** {{endereco}}

[Voltar ao Sumário](#sumário)

---

## 12. Detalhes de contato do Encarregado pelo tratamento de dados pessoais

**12.1.** Nosso **Encarregado pelo Tratamento de Dados Pessoais** poderá ser contatado pelos seguintes canais:

- **Nome:** {{dpo_nome}}
- **E-mail:** {{dpo_email}}
- **Telefone:** {{dpo_telefone}}
- **Endereço (correspondência):** {{endereco}} — marque no envelope "Para o Encarregado de Dados".

[Voltar ao Sumário](#sumário)

---

**{{empresa}}** — CNPJ {{cnpj}}
**Versão deste Aviso:** {{data_publicacao}}

> Este Aviso pode ser atualizado a qualquer momento para refletir mudanças nas atividades de tratamento de dados pessoais, na legislação aplicável ou nas orientações da ANPD. Em caso de alterações relevantes em finalidades, forma ou duração do tratamento, ou no uso compartilhado de dados, os titulares serão informados pelos canais habituais.
>
> *Modelo institucional baseado nas orientações da Autoridade Nacional de Proteção de Dados (ANPD), conforme estrutura do Aviso de Privacidade publicado em https://www.gov.br/anpd/pt-br/acesso-a-informacao/aviso-de-privacidade. Os marcadores entre colchetes \`[...]\` devem ser substituídos pelos termos da própria organização.*
`,
};

const T_PRIVACIDADE_INTERNA: PolicyTemplate = {
  type: "POLITICA_PRIVACIDADE_INTERNO",
  defaultTitle: "Política Interna de Proteção de Dados Pessoais",
  blurb:
    "Política institucional formal seguindo o modelo da Resolução CD/ANPD nº 20/2024. Estabelece princípios, diretrizes e regras para o tratamento de dados pessoais aplicáveis a todos os servidores, colaboradores e terceiros vinculados à organização. Estrutura em 7 capítulos com responsabilidades nominais (órgão máximo, autoridade executiva, Encarregado, Equipe, Chefias, Colaboradores).",
  content: `# Política Interna de Proteção de Dados Pessoais — {{empresa}}

**Última atualização:** {{data_publicacao}}

> Documento institucional aprovado pelo \`[órgão máximo de direção]\` (Conselho Diretor, Câmara, Diretoria, Comitê Executivo, conforme aplicável). Aplica-se a todos os servidores, colaboradores e terceiros que possuam algum vínculo com a {{empresa}}. Modelo alinhado à **Resolução CD/ANPD nº 20, de 3 de outubro de 2024**.

---

## CAPÍTULO I — DISPOSIÇÕES GERAIS

**Art. 1º** Esta Política Interna de Proteção de Dados Pessoais estabelece princípios, diretrizes e regras para as operações de tratamento de dados pessoais realizadas no âmbito da **{{empresa}}**, inscrita no CNPJ {{cnpj}}, com sede em {{endereco}}.

**Art. 2º** As disposições desta Política aplicam-se a todos os servidores, colaboradores e terceiros que possuam algum vínculo com a {{empresa}}.

**Art. 3º** A Política Interna de Proteção de Dados Pessoais alinha-se às estratégias institucionais da {{empresa}} e articula-se com os demais procedimentos internos que versam sobre proteção de dados pessoais e privacidade.

**Art. 4º** São objetivos desta Política:

I — assegurar e reforçar o cumprimento da legislação de proteção de dados pessoais e da sua respectiva regulamentação nos processos internos da {{empresa}};

II — promover a transparência, responsabilização e prestação de contas em relação ao tratamento de dados pessoais realizado pela {{empresa}}; e

III — incentivar a adoção de boas práticas de proteção de dados pessoais na {{empresa}}.

---

## CAPÍTULO II — PRINCÍPIOS E DIRETRIZES

**Art. 5º** As atividades de tratamento de dados pessoais realizadas pela {{empresa}} devem observar os fundamentos e princípios gerais de proteção de dados previstos nos **arts. 2º e 6º da Lei nº 13.709/2018 (LGPD)**, bem como as seguintes diretrizes:

I — observância do disposto na Lei nº 13.709/2018, nesta Política e nos regulamentos expedidos pela ANPD;

II — adoção de medidas que visem a assegurar a privacidade desde a concepção e por padrão (*privacy by design and by default*);

III — diligência contínua ao longo de todo o ciclo de tratamento do dado pessoal;

IV — boa-fé e ética no tratamento dos dados pessoais;

V — adoção de hipótese legal adequada para o devido tratamento de dados pessoais;

VI — adoção de medidas de segurança técnicas e administrativas apropriadas; e

VII — manutenção do registro das operações de tratamento de dados pessoais.

---

## CAPÍTULO III — TRATAMENTO DE DADOS PESSOAIS

**Art. 6º** O tratamento de dados pessoais pela {{empresa}} será realizado para o atendimento de sua finalidade institucional, com observância das atribuições legais e contratuais aplicáveis.

§ 1º A {{empresa}} poderá tratar dados pessoais de acordo com as hipóteses legais previstas nos **arts. 7º e 11 da Lei nº 13.709/2018**.

§ 2º As informações sobre o tratamento de dados pessoais realizado pela {{empresa}}, com destaque para as finalidades, hipóteses legais para o tratamento, procedimentos e práticas adotadas para a execução das atividades, constam do **Aviso de Privacidade** da {{empresa}}.

§ 3º A {{empresa}} tratará apenas os dados pessoais necessários para atender às finalidades específicas do tratamento, observado o princípio da necessidade.

**Art. 7º** Os dados pessoais serão armazenados de forma segura, conforme padrões de segurança aplicáveis à hipótese, e de maneira que favoreça os meios para o exercício dos direitos do titular previstos na LGPD.

Parágrafo único. Os dados pessoais serão eliminados quando finalizado o tratamento, com base em uma das hipóteses descritas no **art. 15 da LGPD**, ressalvadas as situações previstas no art. 16 da referida lei.

**Art. 8º** O uso compartilhado de dados pessoais pela {{empresa}} atenderá a finalidades específicas legítimas, respeitados os princípios de proteção de dados pessoais elencados no art. 6º e o disposto nos arts. 26, § 1º e 27 da LGPD.

**Art. 9º** Nos casos em que a {{empresa}} realizar transferência internacional de dados, serão adotadas medidas para garantir que a operação de tratamento seja realizada em conformidade com a LGPD e com o **Regulamento de Transferência Internacional de Dados (Resolução CD/ANPD nº 19/2024)**.

**Art. 10.** O acesso aos dados pessoais ficará restrito às pessoas autorizadas e que necessitem realizar o tratamento desses dados para o desempenho de suas atividades na {{empresa}}.

Parágrafo único. O direito de acesso à informação pública, que porventura contenha dado pessoal, deverá ser compatibilizado com o direito à privacidade e à proteção de dados pessoais, nos termos da **Lei nº 12.527/2011 (LAI)**.

**Art. 11.** Os contratos, convênios ou instrumentos congêneres firmados pela {{empresa}} deverão conter cláusulas específicas de proteção de dados pessoais, as quais estabelecerão os deveres e obrigações dos agentes de tratamento envolvidos na operação de tratamento, respeitados os princípios, os direitos dos titulares e o regime de proteção de dados previstos na LGPD.

**Art. 12.** A {{empresa}} adotará medidas de segurança, técnicas e administrativas adequadas para proteger os dados pessoais contra acessos não autorizados e situações acidentais ou ilícitas que venham a causar a destruição, perda, alteração, ou qualquer forma de tratamento inadequado ou ilícito.

**Art. 13.** A {{empresa}} elaborará **Relatório de Impacto à Proteção de Dados Pessoais (RIPD)** nos casos em que as operações de tratamento possam gerar alto risco à garantia dos princípios gerais de proteção de dados pessoais, às liberdades civis e aos direitos fundamentais dos titulares.

§ 1º Para a tomada de decisão mencionada no caput, deverão ser utilizados os parâmetros previstos nos documentos publicados pela ANPD.

§ 2º O Relatório de Impacto à Proteção de Dados Pessoais (RIPD) deverá:

I — ser elaborado pela unidade organizacional responsável pelo tratamento de dados que gera riscos ao titular, com apoio e orientação da Equipe do Encarregado da {{empresa}}; e

II — sugerir ou fornecer ações corretivas necessárias para evitar ou mitigar esses riscos.

---

## CAPÍTULO IV — DIREITOS DOS TITULARES

**Art. 14.** A {{empresa}} adotará medidas para assegurar o exercício dos direitos dos titulares previstos na **Lei nº 13.709/2018** e em eventuais normas complementares.

**Art. 15.** Os direitos dos titulares poderão ser exercidos mediante requerimento expresso do titular, ou de seu representante legalmente constituído, dirigido ao **Encarregado pelo Tratamento de Dados Pessoais**.

§ 1º A solicitação não gerará custos para o titular, e deverá ser atendida nos prazos e nos termos previstos em legislação específica.

§ 2º As solicitações relacionadas aos direitos dos titulares que porventura sejam recebidas por outro canal deverão ser encaminhadas ao Encarregado para adoção das providências cabíveis.

---

## CAPÍTULO V — RESPONSABILIDADES

**Art. 16.** Os deveres de cuidado, atenção e uso adequado de dados pessoais se estendem a todos os destinatários desta Política no desenvolvimento de suas atividades.

**Art. 17.** Para o efetivo cumprimento desta Política, ficam instituídas as responsabilidades:

I — do **\`[órgão máximo de direção]\`** (Conselho Diretor, Diretoria, Câmara, Comitê, conforme aplicável);

II — da **\`[autoridade executiva]\`** (Diretor-Presidente, Prefeito, Reitor, Diretor-Geral, conforme aplicável);

III — do **Encarregado** pelo Tratamento de Dados Pessoais ({{dpo_nome}});

IV — da **Equipe do Encarregado**;

V — das **Chefias imediatas**; e

VI — dos **Colaboradores** (servidores, terceirizados, estagiários e demais vinculados).

§ 1º O **\`[órgão máximo de direção]\`**, órgão máximo de direção da {{empresa}}, deliberará sobre as diretrizes estratégicas da governança de privacidade e proteção de dados pessoais.

§ 2º A **\`[autoridade executiva]\`** da {{empresa}} será responsável por:

I — designar o Encarregado;

II — designar a Equipe do Encarregado; e

III — garantir os recursos necessários para implementação da governança em proteção de dados pessoais.

§ 3º O **Encarregado** da {{empresa}} será responsável por:

I — elaborar e submeter à aprovação do \`[órgão máximo]\` o **Programa de Governança em Privacidade**;

II — coordenar as ações de adequação das atividades da {{empresa}} à Lei nº 13.709/2018 e aos regulamentos emitidos pela ANPD;

III — prestar assistência e orientação na elaboração, definição e implementação de medidas de proteção de dados pessoais, conforme as hipóteses previstas no Regulamento da ANPD sobre a atuação do encarregado (Resolução CD/ANPD nº 18/2024);

IV — aceitar reclamações e comunicações dos titulares, prestar esclarecimentos e adotar as providências cabíveis;

V — orientar os colaboradores e contratados da {{empresa}} sobre as práticas a serem adotadas em relação à proteção de dados pessoais;

VI — monitorar o cumprimento desta Política;

VII — avaliar e propor a atualização desta Política; e

VIII — executar as demais atribuições determinadas pela {{empresa}}.

§ 4º A **Equipe do Encarregado** o apoiará no exercício de suas funções.

§ 5º São responsabilidades das **Chefias imediatas**:

I — conscientizar os colaboradores sob sua supervisão em relação às boas práticas de privacidade, proteção de dados pessoais e segurança da informação, inclusive quanto às diretrizes desta Política;

II — garantir que todos os colaboradores de sua equipe compreendam e sigam os documentos orientadores aplicáveis à {{empresa}};

III — incorporar aos processos de trabalho de sua unidade boas práticas inerentes à privacidade, proteção de dados pessoais e segurança da informação;

IV — garantir a proteção de dados pessoais sob sua custódia, nos termos da LGPD, recorrendo ao Encarregado quando necessário;

V — manter o Encarregado atualizado acerca das operações de tratamento de dados pessoais que realize;

VI — informar ao Encarregado caso sejam encontradas inconsistências em registros que cheguem ao seu conhecimento; e

VII — comunicar ao Encarregado qualquer incidente de segurança que possa acarretar risco ou dano relevante aos titulares sobre o qual venha a tomar conhecimento, seja suspeito ou confirmado.

§ 6º São responsabilidades dos **Colaboradores** (servidores, colaboradores e terceiros):

I — estar ciente desta Política e segui-la, bem como as demais regulamentações em vigor relacionadas à privacidade, proteção de dados e segurança da informação;

II — assumir atitude proativa e engajada no que diz respeito à privacidade, à proteção de dados pessoais e à segurança da informação;

III — comunicar à chefia imediata qualquer incidente de segurança que possa acarretar risco ou dano relevante aos titulares sobre o qual venha a tomar conhecimento, seja suspeito ou confirmado;

IV — preservar a integridade e guardar sigilo dos dados pessoais tratados para o exercício de suas atividades na {{empresa}}, quando incidente hipótese legal de restrição de acesso;

V — não disponibilizar nem dar acesso aos dados pessoais mantidos pela {{empresa}} em hipóteses não previstas em lei ou para pessoas não autorizadas; e

VI — cumprir as normas, recomendações e orientações relativas à segurança da informação, à privacidade e à proteção de dados.

---

## CAPÍTULO VI — CONSCIENTIZAÇÃO E CAPACITAÇÃO

**Art. 18.** Como forma de garantir a disseminação do conhecimento, o Encarregado e sua Equipe poderão:

I — sugerir e apoiar campanhas de conscientização de modo a aprimorar a cultura da proteção de dados pessoais e da privacidade; e

II — orientar o corpo funcional sobre práticas de conformidade de proteção de dados pessoais e de privacidade que devem ser implementadas por todos os integrantes da instituição.

**Art. 19.** As atividades de capacitação serão promovidas pela **\`[unidade responsável por capacitação]\`** (Coordenação-Geral de Administração, Departamento de RH, Escola de Governo, conforme aplicável), em articulação com o Encarregado.

---

## CAPÍTULO VII — PENALIDADES

**Art. 20.** As violações a esta Política são passíveis de aplicação das **penalidades administrativas cabíveis**.

§ 1º No caso de terceiros contratados ou prestadores de serviço, serão aplicadas as penalidades previstas nos respectivos contratos, convênios ou instrumentos congêneres.

§ 2º No caso de violações que impliquem atividades ilegais, ou que possam incorrer em risco ou dano relevante aos titulares de dados pessoais, ou em danos à {{empresa}}, o infrator será responsabilizado pelos prejuízos causados, na forma da legislação pertinente.

---

## DISPOSIÇÕES FINAIS

Esta Política entra em vigor na data de sua aprovação por **\`[órgão máximo de direção]\`** e será revisada periodicamente, ou sempre que houver alteração nas operações de tratamento de dados pessoais, mudança regulatória ou determinação da Autoridade Nacional de Proteção de Dados.

---

**{{empresa}}** — CNPJ {{cnpj}}
**Encarregado pelo Tratamento de Dados Pessoais:** {{dpo_nome}} ({{dpo_email}})
**Sede:** {{endereco}}
**Versão:** {{data_publicacao}}

> Modelo institucional baseado na Resolução CD/ANPD nº 20, de 3 de outubro de 2024 (DOU 07/10/2024). Substitua os marcadores entre colchetes \`[...]\` pelos termos corretos da sua organização (ex.: "Conselho Diretor", "Câmara Municipal", "Diretoria Colegiada", "Prefeito Municipal", "Reitor", etc.).
`,
};

const T_NORMA_PRIVACIDADE: PolicyTemplate = {
  type: "NORMA_PRIVACIDADE",
  defaultTitle: "Norma de Privacidade e Proteção de Dados",
  blurb: "Diretrizes para colaboradores sobre COMO devem manusear dados pessoais no exercício das atividades. Documento interno de governança — descumprimento pode gerar advertência ou demissão por justa causa.",
  content: `# Norma de Privacidade e Proteção de Dados — {{empresa}}

**Última atualização:** {{data_publicacao}}

## 1. Escopo

Esta Norma estabelece **diretrizes obrigatórias** para todos os colaboradores da {{empresa}} (funcionários, estagiários, prestadores) sobre como tratar dados pessoais durante o exercício de suas atividades.

> O descumprimento pode acarretar **advertência, suspensão ou demissão por justa causa**, conforme a gravidade.

## 2. Definições

- **Dado pessoal:** informação relacionada a pessoa natural identificada ou identificável (nome, CPF, e-mail, telefone, IP, etc.).
- **Dado pessoal sensível:** origem racial/étnica, convicção religiosa, opinião política, filiação sindical, dado de saúde, vida sexual, dado genético/biométrico.
- **Tratamento:** qualquer operação com dados pessoais (coleta, uso, armazenamento, compartilhamento, descarte).
- **Titular:** pessoa natural a quem se referem os dados.
- **Encarregado (DPO):** {{dpo_nome}} — canal entre empresa, titulares e ANPD.

## 3. Princípios obrigatórios

Todo colaborador deve, ao tratar dados pessoais, observar:

1. **Finalidade** — só usar dados para o propósito específico declarado.
2. **Adequação** — compatibilidade entre uso e finalidade.
3. **Necessidade** — limitar ao mínimo necessário.
4. **Livre acesso** — facilitar consulta dos titulares aos próprios dados.
5. **Qualidade** — manter dados exatos, claros e atualizados.
6. **Transparência** — informar claramente sobre o tratamento.
7. **Segurança** — adotar medidas técnicas e administrativas.
8. **Prevenção** — evitar danos por tratamento inadequado.
9. **Não-discriminação** — não tratar dados para fins discriminatórios.
10. **Responsabilização** — demonstrar conformidade.

## 4. Diretrizes operacionais

### 4.1. Coleta
- **Só colete o necessário** para a finalidade autorizada.
- **Verifique a base legal** antes de coletar (consentimento, execução de contrato, obrigação legal, legítimo interesse, etc.).
- **Informe o titular** sobre finalidade, prazo e direitos.

### 4.2. Uso interno
- Acesse dados pessoais apenas se sua função exigir.
- **Não divulgue** informações de colegas ou clientes em conversas, redes sociais, e-mails pessoais.
- **Bloqueie sua tela** ao se ausentar.
- Use senhas fortes e exclusivas.
- **Nunca compartilhe credenciais** de acesso.

### 4.3. Armazenamento
- Use **somente** os sistemas homologados pela empresa.
- **Proibido** usar pen-drives, e-mails pessoais ou serviços de nuvem não autorizados (Google Drive pessoal, Dropbox pessoal, etc.) para guardar dados de clientes/colaboradores.
- Documentos em papel ficam em armários trancados.

### 4.4. Compartilhamento
- Só compartilhe com terceiros após aprovação do DPO **e** mediante contrato com cláusulas LGPD.
- **Nunca envie dados pessoais por canais inseguros** (WhatsApp pessoal, e-mail particular).
- Use **planilhas/documentos sem dados pessoais** em apresentações públicas.

### 4.5. Descarte
- Descarte físico: trituradora.
- Descarte digital: solicite ao TI a deleção segura.
- **Nunca jogue documentos com dados na lixeira comum.**

### 4.6. Incidentes
- Suspeita de vazamento, acesso indevido, perda ou roubo de dados? **Comunique IMEDIATAMENTE** o DPO ({{dpo_email}}).
- Não tente "consertar" sozinho. O DPO conduz a investigação.

## 5. Treinamento

Todos os colaboradores fazem treinamento inicial e reciclagem anual. Participação é obrigatória.

## 6. Auditoria

A empresa pode auditar acessos, e-mails corporativos e sistemas para verificar conformidade — conforme regras do regulamento interno.

## 7. Atualizações

Esta Norma é revisada periodicamente. Mudanças são divulgadas pela intranet e e-mail corporativo.

---

**Aprovado em {{data_publicacao}}** — {{representante_legal}}
`,
};

const T_TERMOS_USO: PolicyTemplate = {
  type: "TERMOS_USO",
  defaultTitle: "Termo de Uso",
  blurb:
    "Termo institucional que define o funcionamento da plataforma, as regras aplicáveis, as responsabilidades dos usuários e da administração, e a autoridade competente para reclamações. Modelo alinhado ao Termo de Uso do Portal da Transparência (CGU). Indicado para portais oficiais de órgãos públicos e empresas estatais.",
  content: `# Termo de Uso — {{empresa}}

**Última atualização:** {{data_publicacao}}

> Este Termo de Uso regula o uso do sítio eletrônico/plataforma da **{{empresa}}** (CNPJ {{cnpj}}), localizada em {{endereco}}. Modelo institucional alinhado ao Termo de Uso do Portal da Transparência (CGU/Governo Federal).

---

## Sumário

1. Quais informações estão presentes neste documento?
2. Aceitação do Termo
3. Descrição do serviço
4. Quais são as obrigações dos usuários que utilizam o serviço?
5. Quais as responsabilidades da administração com os dados pessoais?

---

## 1. Quais informações estão presentes neste documento?

Neste Termo de Uso, o usuário do sítio eletrônico/plataforma da {{empresa}} encontrará informações sobre:

- O funcionamento da plataforma e as regras aplicáveis a ela;
- O conjunto de regras relacionadas à ferramenta;
- As responsabilidades do usuário do *site*;
- As responsabilidades da \`[administração / instituição / empresa]\` ao fornecer o serviço;
- Informações para contato, caso necessário atualização de informações ou esclarecimento de dúvidas;
- Autoridade responsável por eventuais reclamações caso questões deste Termo de Uso tenham sido violadas.

> Informações sobre o tratamento de dados pessoais (finalidades, dados coletados, compartilhamento, segurança, direitos do titular) constam do **Aviso de Privacidade** da {{empresa}}, documento complementar a este Termo. Informações sobre uso de cookies constam da **Política de Cookies**.

[Voltar ao Sumário](#sumário)

---

## 2. Aceitação do Termo

Ao utilizar os serviços, o usuário confirma que leu e compreendeu os Termos e Políticas aplicáveis ao sítio eletrônico/plataforma da {{empresa}} e concorda com eles.

São aplicáveis os seguintes diplomas legais e normativos:

- **Lei nº 12.527, de 18 de novembro de 2011** — Regula o acesso a informações previsto no inciso XXXIII do art. 5º, no inciso II do § 3º do art. 37 e no § 2º do art. 216 da Constituição Federal (Lei de Acesso à Informação — LAI);
- **Lei nº 12.965, de 23 de abril de 2014** — Marco Civil da Internet — Estabelece princípios, garantias, direitos e deveres para o uso da Internet no Brasil;
- **Lei nº 13.460, de 26 de junho de 2017** — Dispõe sobre participação, proteção e defesa dos direitos do usuário dos serviços públicos da administração pública;
- **Lei nº 13.709, de 14 de agosto de 2018** — Lei Geral de Proteção de Dados Pessoais (LGPD) — dispõe sobre o tratamento de dados pessoais, com o objetivo de proteger os direitos fundamentais de liberdade e de privacidade;
- **Decreto nº 9.637, de 26 de dezembro de 2018** — Institui a Política Nacional de Segurança da Informação;
- **Decreto nº 10.332, de 28 de abril de 2020** — Institui a Estratégia de Governo Digital;
- \`[Acrescentar: leis orgânicas, estatutos e atos normativos próprios da {{empresa_nome_curto}}]\`.

[Voltar ao Sumário](#sumário)

---

## 3. Descrição do serviço

\`[Descrever brevemente o serviço, sua finalidade, fontes de dados, regularidade de atualização e formas de acesso. Exemplo:]\`

> O sítio eletrônico/plataforma da {{empresa}} é \`[de acesso livre / restrito mediante cadastro / etc.]\`, no qual o cidadão/usuário pode \`[descrever o que ele encontra: informações, serviços, consultas, formulários…]\`. \`[Descrever desde quando existe, quais recursos oferece e como se consolidou como instrumento institucional.]\`
>
> Os dados divulgados no sítio são provenientes de \`[descrever fontes: sistemas estruturadores, bases de dados próprias, integrações com outros órgãos…]\`. A periodicidade de envio dos dados depende do assunto tratado, assim como a periodicidade de atualização das informações no sítio.
>
> Uma vez carregadas, as informações são disponibilizadas para conhecimento do usuário de diversas formas, como: \`[painéis, consultas detalhadas, gráficos, dados abertos, formulários, etc.]\`.
>
> O acesso \`[requer / não requer]\` cadastro de usuário ou senha, sendo permitido a qualquer pessoa \`[navegar pelas páginas de forma livre / acessar mediante autenticação na plataforma Gov.br ou similar]\`, bem como visualizar e utilizar os dados disponíveis da forma que melhor lhe convier.

[Voltar ao Sumário](#sumário)

---

## 4. Quais são as obrigações dos usuários que utilizam o serviço?

O usuário é responsável pela reparação de todos e quaisquer danos, diretos ou indiretos (inclusive decorrentes do desrespeito de quaisquer direitos de outros usuários, de terceiros, inclusive direitos de propriedade intelectual, de segredo e de personalidade) que sejam causados à \`[administração / {{empresa}}]\`, a qualquer outro Usuário, ou, ainda, a qualquer terceiro, inclusive no ato do descumprimento do estabelecido neste Termo de Uso ou de qualquer ato praticado a partir de seu acesso ao serviço.

A {{empresa}} **não poderá ser responsabilizada** pelos seguintes fatos:

a) Equipamento infectado ou invadido por atacantes;
b) Equipamento danificado no momento do consumo de serviços;
c) Proteção do computador do usuário;
d) Proteção das informações baseadas nos computadores dos usuários;
e) Abuso de uso dos computadores dos usuários;
f) Monitoração ilegal do computador dos usuários;
g) Vulnerabilidades ou instabilidades existentes nos sistemas dos usuários;
h) Perímetro inseguro.

**Em nenhuma hipótese**, a {{empresa}} será responsável pela instalação no equipamento do usuário ou de terceiros de códigos maliciosos (vírus, *trojans*, *malware*, *worm*, *bot*, *backdoor*, *spyware*, *rootkit*, ou de quaisquer outros que venham a ser criados), em decorrência da navegação na Internet pelo usuário.

[Voltar ao Sumário](#sumário)

---

## 5. Quais as responsabilidades da administração com os dados pessoais?

A {{empresa}} se compromete em cumprir todas as legislações relativas ao uso correto dos dados pessoais do cidadão/usuário, de forma a preservar a privacidade dos dados utilizados no serviço, bem como a garantir todos os direitos e garantias legais dos usuários.

A {{empresa}} também se obriga a promover, independentemente de solicitações, a divulgação em local de fácil acesso, no âmbito de suas competências, de informações de interesse coletivo ou geral produzidas ou custodiadas, em conformidade com a Lei de Acesso à Informação (LAI).

É de responsabilidade da {{empresa}} implementar controles de segurança para proteção dos dados pessoais dos usuários.

A {{empresa}} poderá, quanto às ordens judiciais de pedido das informações, compartilhar informações necessárias para investigações ou tomar medidas relacionadas a atividades ilegais, suspeitas de fraude ou ameaças potenciais contra pessoas, bens ou sistemas que sustentam o serviço, ou de outra forma necessária para cumprir com nossas obrigações legais. Caso ocorra, a {{empresa}} **notificará os usuários afetados**, salvo quando o processo estiver em segredo de justiça.

[Voltar ao Sumário](#sumário)

---

## Alterações deste Termo de Uso

A presente versão deste Termo de Uso foi atualizada pela última vez em **{{data_publicacao}}**.

A {{empresa}} se reserva o direito de modificar, a qualquer momento, as presentes normas — especialmente para adaptá-las às melhorias do sítio eletrônico, seja pela disponibilização de novas funcionalidades, seja pela retirada ou modificação daquelas já existentes.

Nos casos em que as alterações relacionarem-se à finalidade, forma e duração do tratamento, mudança do(s) controlador(es) ou uso compartilhado dos dados, o titular de dados será informado a respeito, sendo-lhe permitido revogar seu consentimento, caso discorde do teor das alterações (hipótese aplicável quando a base legal for o consentimento — art. 7º, I, da LGPD).

---

## Autoridade competente para reclamações e canal de contato

Em caso de dúvidas sobre este Termo de Uso ou de eventuais reclamações relativas ao seu cumprimento, o usuário poderá entrar em contato com a {{empresa}} pelos seguintes canais:

- **E-mail institucional:** {{email}}
- **Telefone:** {{telefone}}
- **Endereço:** {{endereco}}
- **Sítio eletrônico:** {{website}}
- **Encarregado pelo Tratamento de Dados Pessoais:** {{dpo_nome}} ({{dpo_email}})
- \`[Ouvidoria / SIC: indicar canal específico, se houver]\`

---

## Foro

Estes Termos são regidos pelas leis brasileiras. \`[Para órgãos públicos federais: "Fica eleito o foro da Justiça Federal da Seção Judiciária de Brasília/DF para dirimir controvérsias decorrentes deste Termo." | Para municipais/estaduais: "Foro da comarca de {{cidade}}/{{estado}}, com renúncia a qualquer outro, por mais privilegiado que seja."]\`

---

**{{empresa}}** — CNPJ {{cnpj}}
**Versão deste Termo:** {{data_publicacao}}

> Modelo institucional baseado no Termo de Uso do Portal da Transparência (CGU — https://portaldatransparencia.gov.br/termos-de-uso). Substitua os marcadores entre colchetes \`[...]\` pelos termos da própria organização. Documentos complementares: **Aviso de Privacidade** (tratamento de dados pessoais) e **Política de Cookies** (cookies próprios e de terceiros).
`,
};

const T_COOKIES: PolicyTemplate = {
  type: "POLITICA_COOKIES",
  defaultTitle: "Política de Cookies",
  blurb:
    "Detalha quais cookies o sítio coleta, finalidade, duração e base legal — separados em essenciais, analíticos, de terceiros e de redes sociais. Inclui tutoriais de configuração nos principais navegadores. Modelo institucional alinhado à Política de Cookies do Portal da Transparência (CGU). Segue o Guia Orientativo da ANPD sobre Cookies e Proteção de Dados Pessoais (2022).",
  content: `# Política de Cookies — {{empresa}}

**Última atualização:** {{data_publicacao}}

> A **{{empresa}}** utiliza *cookies* próprios (primários) para registrar as configurações e preferências de navegação dos usuários e gerar relatórios estatísticos \`[via Google Analytics ou ferramenta similar]\`, e também *cookies* de terceiros para complementar essas estatísticas.
>
> Os dados \`[do Google Analytics e de terceiros]\` são anonimizados antes de serem usados para análises e processamento de desempenho da web. Modelo institucional alinhado à Política de Cookies do Portal da Transparência (CGU/Governo Federal).

---

## Sumário

1. Cookies essenciais
2. Cookies analíticos
3. Cookies de terceiros
4. Cookies utilizados para redes sociais
5. Configuração de Cookies no navegador

---

## 1. Cookies essenciais

São utilizados *cookies* **estritamente necessários**, com base na hipótese legal do **legítimo interesse** (Art. 7º, IX da LGPD), que **não podem ser desativados** em nossos sistemas. Esses *cookies* permitem funcionalidades essenciais para o fornecimento dos serviços, tais como segurança, verificação de identidade, gestão de rede, e registro de preferências básicas de exibição.

| Nome | Finalidade | Duração |
|---|---|---|
| \`lgpd_cookie_status\` | Registrar o aceite do banner de cookies da página inicial | 1 ano |
| \`contraste\` | Registrar o contraste da tela escolhido pelo usuário (acessibilidade) | Durante uso do portal |
| \`I18N_LANGUAGE\` | Registrar o idioma em que o site deve ser exibido | Durante uso do portal |
| \`browserupdateorg\` | Notificar o usuário quando ele usa um navegador antigo ou incompatível | 1 semana |
| \`[session_id ou nome do cookie de sessão]\` | Manter a sessão de navegação autenticada | Sessão |

> *Atenção: edite a tabela acima conforme os cookies essenciais reais utilizados pela {{empresa_nome_curto}}. Se o sítio é hospedado em Gov.br ou plataforma similar, a maioria desses cookies já vem por padrão.*

[Voltar ao Sumário](#sumário)

---

## 2. Cookies analíticos

Utilizamos *cookies* de **desempenho** que são opcionais e vêm desabilitados por padrão. Os *cookies* opcionais dependem do **consentimento** do usuário (Art. 7º, I da LGPD) para a sua utilização. Os *cookies* de desempenho visam à melhoria do sítio eletrônico por meio da coleta de dados anonimizados sobre navegação e do uso dos recursos disponibilizados.

\`[Caso utilize Google Analytics, mantenha a tabela abaixo. Caso use outra ferramenta — Matomo, Plausible, etc. — substitua pelos cookies correspondentes.]\`

| Nome | Finalidade | Duração |
|---|---|---|
| \`_ga\` | Registrar um número individual de ID com o propósito de gerar dados estatísticos de visitas ao sítio (usuário único, número de visitas, origens de tráfego, início/fim de sessão) | 2 anos |
| \`_ga_[ID]\` | Registrar um ID único que gera dados estatísticos sobre as visitas no portal (substitua [ID] pelo identificador da propriedade GA4) | 2 anos |
| \`_gid\` | Registrar um ID único que gera dados estatísticos sobre as visitas no portal | 1 dia |
| \`_gat_gtag_UA_[ID]\` | Gerenciar a taxa de requisições ao portal | 1 dia |
| \`_gaexp\` | Determinar a inclusão de um usuário em um experimento e a validade dos experimentos | 3 meses |

Mais informações sobre o Consentimento do Google Analytics: https://policies.google.com/technologies/partner-sites?hl=pt-BR

[Voltar ao Sumário](#sumário)

---

## 3. Cookies de terceiros

A {{empresa}} \`[utiliza / pode utilizar]\` recursos fornecidos por terceiros que permitem:

- Melhorar campanhas de informação institucional;
- Oferecer conteúdo interativo;
- Melhorar a usabilidade e facilitar o compartilhamento de conteúdo nas redes sociais;
- Assistir a vídeos e apresentações animadas diretamente na plataforma.

Esses terceiros coletarão e usarão dados de navegação também para seus próprios fins. O usuário pode desativá-los direto no site do provedor.

\`[Adapte os cookies de terceiros conforme os recursos efetivamente utilizados no seu sítio. Exemplos comuns:]\`

**Domínios típicos:** Google, YouTube, Doubleclick.net, Facebook (caso aplicável)

| Nome | Finalidade | Duração |
|---|---|---|
| \`VISITOR_INFO1_LIVE\` | Permite que o YouTube conte as visualizações de vídeos do YouTube incorporados no portal | 9 meses |
| \`DSID\` | Permite analisar dados coletados pela Doubleclick.net (comportamento, interesses específicos, dados demográficos sobre idade, sexo biológico e localização geral) | 2 semanas |

Links institucionais para informações detalhadas:

- Informativo oficial dos *cookies* de terceiros da Google: https://business.safety.google/adscookies/
- Política da Google: https://policies.google.com/technologies/partner-sites?hl=pt-BR

[Voltar ao Sumário](#sumário)

---

## 4. Cookies utilizados para redes sociais

A {{empresa}} \`[incorpora / pode incorporar]\` vídeos e outros arquivos de mídias provenientes de redes sociais como **Facebook**, **YouTube** e **Google**. O usuário pode pesquisar mais informações sobre os *cookies* utilizados por essas redes sociais e sobre como os dados pessoais são tratados por elas. A seguir, links para as Políticas de Privacidade de cada rede social:

- **Facebook:** https://www.facebook.com/policies/cookies
- **YouTube:** https://policies.google.com/privacy?hl=pt-BR&gl=pt
- **Google:** https://policies.google.com/technologies/cookies?hl=pt
- \`[Adicionar outras redes sociais utilizadas: Instagram, LinkedIn, X/Twitter, etc.]\`

[Voltar ao Sumário](#sumário)

---

## 5. Configuração de Cookies no navegador

O usuário pode alterar as permissões a qualquer momento, **bloquear** ou **recusar** os *cookies*, com exceção dos estritamente necessários. Todavia, a revogação do consentimento de determinados *cookies* pode prejudicar o correto funcionamento de alguns recursos do sítio.

Para gerenciar os *cookies*, uma das alternativas é configurar diretamente no navegador. Tutoriais oficiais:

- **Internet Explorer:** https://support.microsoft.com/pt-br/help/17442/windows-internet-explorer-delete-manage-cookies
- **Mozilla Firefox:** https://support.mozilla.org/pt-BR/kb/gerencie-configuracoes-de-armazenamento-local-de-s
- **Safari:** https://support.apple.com/pt-br/guide/safari/sfri11471/mac
- **Google Chrome:** https://support.google.com/chrome/answer/95647?co=GENIE.Platform%3DDesktop&oco=1&hl=pt-BR
- **Microsoft Edge:** https://support.microsoft.com/pt-br/help/4027947/microsoft-edge-delete-cookies
- **Opera:** https://help.opera.com/en/latest/web-preferences/#cookies

> **Atenção:** desabilitar *cookies* essenciais pode comprometer a sua experiência e prejudicar o funcionamento do sítio eletrônico.

[Voltar ao Sumário](#sumário)

---

## Bases legais (LGPD)

- **Cookies essenciais:** legítimo interesse (Art. 7º, IX da LGPD) — não exigem consentimento.
- **Cookies analíticos, de terceiros e de redes sociais:** consentimento (Art. 7º, I da LGPD) — exigem aceitação ativa do usuário no banner de cookies.

Conforme orientações do **Guia Orientativo da ANPD sobre Cookies e Proteção de Dados Pessoais (2022)** e da **Política Nacional de Segurança da Informação (Decreto nº 9.637/2018)**.

---

## Direitos do titular

Para exercer direitos sobre dados coletados via *cookies* (Art. 18 da LGPD), entre em contato com o **Encarregado pelo Tratamento de Dados Pessoais**:

- **Nome:** {{dpo_nome}}
- **E-mail:** {{dpo_email}}
- **Telefone:** {{dpo_telefone}}

---

## Atualizações desta Política

Atualizamos esta Política sempre que mudarmos a forma de uso de *cookies* — seja pela inclusão de novas ferramentas, retirada de funcionalidades ou alteração nos provedores terceiros. A versão vigente está sempre disponível no rodapé do sítio.

---

**{{empresa}}** — CNPJ {{cnpj}}
**Versão desta Política:** {{data_publicacao}}

> Modelo institucional baseado na Política de Cookies do Portal da Transparência (CGU — https://portaldatransparencia.gov.br/termos-de-uso) e no Guia Orientativo da ANPD sobre Cookies (2022). Substitua os marcadores entre colchetes \`[...]\` e os exemplos de cookies pelos efetivamente utilizados no sítio da {{empresa_nome_curto}}. Use ferramentas como o **Cookie Inspector** do navegador ou serviços online (cookieserve.com, builtwith.com) para identificar todos os cookies em uso. Documentos complementares: **Termo de Uso** e **Aviso de Privacidade**.
`,
};

const T_TERCEIROS: PolicyTemplate = {
  type: "POLITICA_TERCEIROS",
  defaultTitle: "Política de Privacidade e Segurança em Terceiros",
  blurb: "Define como a empresa avalia, contrata e monitora terceiros que tratam dados pessoais em seu nome (operadores). Inclui due diligence, cláusulas contratuais e auditorias.",
  content: `# Política de Privacidade e Segurança em Terceiros — {{empresa}}

**Última atualização:** {{data_publicacao}}

## 1. Objetivo

Estabelecer critérios para **contratação, gestão e monitoramento** de terceiros (fornecedores, parceiros, prestadores de serviço) que tratam dados pessoais em nome da {{empresa}}, garantindo conformidade com a LGPD.

## 2. Aplicação

Aplica-se a todo terceiro que:

- Processe dados pessoais por conta da {{empresa}} (operador).
- Tenha acesso a dados pessoais de clientes, colaboradores ou parceiros da {{empresa}}.
- Hospede sistemas, e-mails ou backups com dados pessoais.

## 3. Avaliação prévia (due diligence)

Antes de contratar, avaliamos o terceiro com checklist mínimo:

- [ ] Possui Política de Privacidade publicada?
- [ ] Tem Encarregado (DPO) designado?
- [ ] Tem certificações de segurança (ISO 27001, SOC 2)?
- [ ] Localização dos servidores (transferência internacional?)
- [ ] Histórico de incidentes nos últimos 24 meses?
- [ ] Subcontratação — usa subprocessadores? Quais?
- [ ] Aplica criptografia em trânsito e em repouso?
- [ ] Possui plano de resposta a incidentes?

Resultado da avaliação fica documentado no Inventário de Terceiros.

## 4. Cláusulas contratuais obrigatórias

Todo contrato com terceiro que trata dados pessoais deve conter:

1. **Definição de papéis** — controlador / operador / suboperador.
2. **Finalidade específica** do tratamento — sem desvio.
3. **Sigilo e confidencialidade** dos dados.
4. **Medidas técnicas e administrativas** mínimas de segurança.
5. **Notificação imediata** em caso de incidente (em até 24h).
6. **Restrição a subcontratação** sem autorização prévia.
7. **Auditoria** — direito de a {{empresa}} auditar.
8. **Devolução ou eliminação** de dados ao final do contrato.
9. **Cooperação** em pedidos de titulares.
10. **Transferência internacional** apenas com salvaguardas (Art. 33 LGPD).
11. **Responsabilidade solidária** por descumprimentos.

## 5. Inventário de terceiros

Mantemos inventário atualizado com:

- Nome e contato do terceiro.
- Tipo de serviço prestado.
- Categorias de dados tratados.
- Finalidade do tratamento.
- Localização dos dados (BR ou exterior).
- Existência de subprocessadores.
- Resultado da última avaliação de risco.
- Data da última auditoria.

## 6. Monitoramento contínuo

- **Auditorias periódicas** (anuais para terceiros críticos).
- Revisão de cláusulas contratuais a cada renovação.
- Acompanhamento de notícias de incidentes do mercado.
- Reavaliação imediata em caso de incidente envolvendo o terceiro.

## 7. Encerramento da relação

Ao final do contrato:

- Terceiro **devolve ou elimina** os dados (com declaração de eliminação).
- A {{empresa}} confirma a eliminação.
- Atualizamos o Inventário de Terceiros.

## 8. Responsabilidades

- **DPO ({{dpo_nome}}):** define critérios, aprova contratações, conduz auditorias.
- **Áreas demandantes:** preencher checklist de due diligence; comunicar incidentes ao DPO.
- **Jurídico:** validar cláusulas contratuais.
- **TI/Segurança:** validar aspectos técnicos.

---

**Versão {{data_publicacao}}** — Aprovado por {{representante_legal}}
`,
};

const T_RETENCAO: PolicyTemplate = {
  type: "POLITICA_RETENCAO",
  defaultTitle: "Política de Retenção e Descarte de Dados",
  blurb: "Define por quanto tempo cada categoria de dado é retida e como é descartada com segurança. Documento operacional crítico — base para responder a pedidos de eliminação dos titulares.",
  content: `# Política de Retenção e Descarte de Dados — {{empresa}}

**Última atualização:** {{data_publicacao}}

## 1. Objetivo

Definir prazos de retenção e procedimentos de descarte seguro para dados pessoais tratados pela {{empresa}}, em conformidade com a LGPD (Art. 15 e Art. 16) e legislação correlata.

## 2. Princípio da necessidade

Dados pessoais devem ser mantidos **apenas pelo tempo necessário** para cumprir a finalidade declarada. Findos os prazos, devem ser eliminados ou anonimizados — exceto nas hipóteses do Art. 16 da LGPD.

## 3. Hipóteses de manutenção pós-finalidade (Art. 16 LGPD)

Dados podem ser mantidos para:

1. Cumprimento de obrigação legal ou regulatória.
2. Estudo por órgão de pesquisa (anonimizados).
3. Transferência a terceiro com observância da LGPD.
4. Uso exclusivo do controlador, vedado o acesso por terceiro, e desde que anonimizados.

## 4. Tabela de prazos de retenção

> Esta tabela é a referência. Cada área deve seguir os prazos correspondentes às atividades sob sua responsabilidade.

| Categoria de dado | Finalidade | Prazo de retenção | Base legal/normativa |
|---|---|---|---|
| Dados de funcionários (folha, FGTS) | Trabalhista | 30 anos após desligamento | CLT, Lei 8.036/90 |
| Documentos fiscais | Tributária | 5 anos | CTN Art. 173 |
| Notas fiscais eletrônicas | Tributária | 5 anos | LC 116/2003 |
| Currículos não contratados | Recrutamento | 1 a 2 anos (com consentimento) | Necessidade |
| Cadastro de clientes (CDC) | Defesa do consumidor | 5 anos após última transação | CDC Art. 27 |
| Histórico de compras | Operacional | 5 anos | Necessidade + CDC |
| E-mails corporativos | Auditoria | 5 anos | Operacional |
| Logs de acesso (sistemas) | Segurança | 6 meses a 1 ano | Marco Civil + Segurança |
| Logs de IP de visitantes (Marco Civil) | Legal | 6 meses | Lei 12.965/14 Art. 13 |
| Imagens de CFTV | Segurança | 30 a 90 dias | Necessidade |
| Dados de cookies | Conforme cookie | Ver Política de Cookies | Cookie-específico |
| Comunicações de marketing | Marketing | Até revogação do consentimento | Consentimento |
| Dados de saúde (ASO, atestados) | Saúde ocupacional | 20 anos após desligamento | NR-7 |
| Backups | Continuidade | 90 dias rolling | Operacional |

## 5. Procedimento de descarte

### 5.1. Descarte físico (papel)
- **Trituradora corta cruzado** (mínimo nível P-4).
- Não jogar documentos com dados na lixeira comum.
- Documentos confidenciais: contratar serviço de descarte certificado.

### 5.2. Descarte digital
- Solicitar ao TI a **deleção segura** (não basta mover para lixeira/recycle bin).
- Em servidores: **wipe** com múltiplas passagens (DoD 5220.22-M ou similar).
- Mídias removíveis (HDs, pen-drives): destruição física ou degaussing.
- Dados em cloud: solicitar deleção certificada ao provedor.

### 5.3. Anonimização (alternativa)
Quando dados ainda têm valor estatístico, podem ser **anonimizados irreversivelmente** em vez de deletados — conforme Art. 12 da LGPD.

## 6. Pedidos de eliminação por titulares

Quando um titular solicita eliminação (Art. 18, VI da LGPD):

1. DPO recebe a solicitação.
2. Verifica se há base legal para retenção (Art. 16).
3. Se sim: informa o titular e mantém os dados pelo prazo legal.
4. Se não: procede com a eliminação e confirma ao titular em até 15 dias úteis.

## 7. Auditoria

A cada **12 meses** o DPO realiza auditoria de retenção:

- Verifica conformidade dos prazos.
- Identifica dados retidos sem base legal — encaminha para descarte.
- Atualiza esta política se houver mudança regulatória.

## 8. Responsabilidades

- **DPO ({{dpo_nome}}):** mantém esta política, conduz auditorias.
- **Áreas:** seguem os prazos da tabela; comunicam ao DPO ao identificar dados além do prazo.
- **TI:** executa descartes seguros mediante solicitação documentada.
- **Jurídico:** valida prazos legais e atualizações regulatórias.

---

**Versão {{data_publicacao}}** — Aprovado por {{representante_legal}}
`,
};

const T_TREINAMENTO: PolicyTemplate = {
  type: "POLITICA_TREINAMENTO",
  defaultTitle: "Política de Treinamento em Privacidade",
  blurb: "Define o programa de treinamento contínuo em LGPD para colaboradores: público-alvo, conteúdo, periodicidade, métricas. Não obrigatória pela LGPD, mas recomendada para empresas de médio/grande porte.",
  content: `# Política de Treinamento em Privacidade — {{empresa}}

**Última atualização:** {{data_publicacao}}

## 1. Objetivo

Estabelecer o programa de **conscientização e capacitação** de colaboradores em proteção de dados pessoais e LGPD, criando uma cultura de privacidade.

## 2. Público-alvo

Todos os colaboradores da {{empresa}}, com **conteúdo diferenciado** por papel:

| Público | Conteúdo |
|---|---|
| Todos | Princípios LGPD, direitos dos titulares, Norma de Privacidade interna, como reportar incidentes |
| Áreas que tratam dados (RH, Comercial, Atendimento, TI) | Práticas específicas: coleta consentida, bases legais, retenção, compartilhamento seguro |
| Liderança | Governança, responsabilização, riscos para o negócio |
| TI/Segurança | Aspectos técnicos: criptografia, controle de acesso, logs, gestão de incidentes |
| DPO e equipe de Privacidade | Aprofundamento jurídico, ANPD, casos práticos, revisão de RIPDs |

## 3. Modalidades

- **Treinamento de integração** (admissão): obrigatório para todo novo colaborador, presencial ou online, com avaliação de conhecimento.
- **Reciclagem anual** (todos): módulo curto (60-90 min) revisitando princípios + atualizações regulatórias.
- **Treinamentos especializados** (sob demanda): para equipes envolvidas em projetos críticos (ex: novo CRM, novo site, transferência internacional).
- **Comunicação contínua**: newsletter mensal de privacidade, alertas pontuais sobre incidentes do mercado, dicas no portal interno.

## 4. Conteúdo mínimo (treinamento básico)

1. **O que é dado pessoal** e dado sensível
2. **Princípios da LGPD** (transparência, finalidade, necessidade, segurança)
3. **Bases legais** (Art. 7º e Art. 11)
4. **Direitos dos titulares** (Art. 18)
5. **Norma de Privacidade da {{empresa}}** — diretrizes obrigatórias
6. **Segurança da informação** — senhas, phishing, dispositivos
7. **Como reportar incidentes** ao DPO
8. **Consequências do descumprimento** (advertência, demissão por justa causa, multas ANPD)

## 5. Periodicidade

- **Integração:** até 30 dias após admissão.
- **Reciclagem geral:** anual (mês de janeiro/fevereiro).
- **Reciclagem por incidente:** após qualquer incidente relevante na empresa, equipe envolvida faz treinamento corretivo.
- **Mudança de função:** ao migrar para área que trata mais dados, recebe treinamento específico.

## 6. Avaliação e métricas

- **Cobertura:** % de colaboradores treinados (meta: 100%).
- **Aproveitamento:** nota mínima 70% no quiz.
- **Participação em comunicações:** taxa de abertura da newsletter.
- **Qualidade:** % de incidentes causados por erro humano (meta decrescente).

Métricas reportadas trimestralmente à liderança.

## 7. Registro

Cada treinamento gera evidência documental:

- Lista de presença / certificado.
- Conteúdo apresentado.
- Resultado da avaliação.
- Mantido pelo prazo de **5 anos**.

Esses registros são cruciais para demonstrar conformidade em fiscalizações da ANPD.

## 8. Responsabilidades

- **DPO ({{dpo_nome}}):** define conteúdo, conduz ou aprova treinamentos.
- **RH:** organiza calendário, controla cobertura, mantém registros.
- **Lideranças:** garantem participação dos liderados.
- **Colaborador:** dever de participar; descumprimento sujeito a medidas disciplinares.

---

**Versão {{data_publicacao}}** — Aprovado por {{representante_legal}}
`,
};

const T_TRANSFERENCIA: PolicyTemplate = {
  type: "POLITICA_TRANSFERENCIA",
  defaultTitle: "Política de Transferência Internacional de Dados",
  blurb: "Define regras para transferência internacional de dados pessoais conforme Art. 33-36 da LGPD. Necessária para empresas que usam cloud no exterior, têm matriz/filiais fora do Brasil, ou compartilham dados com parceiros internacionais.",
  content: `# Política de Transferência Internacional de Dados — {{empresa}}

**Última atualização:** {{data_publicacao}}

## 1. Objetivo

Estabelecer critérios para **transferência internacional** de dados pessoais pela {{empresa}}, garantindo conformidade com os Arts. 33-36 da LGPD.

## 2. O que é transferência internacional

Toda operação que envolva o **acesso, coleta, hospedagem ou processamento** de dados pessoais por entidade localizada **fora do território brasileiro** — independente do meio (cloud, e-mail, transferência manual).

## 3. Hipóteses permitidas (Art. 33 da LGPD)

A {{empresa}} só transfere dados internacionalmente quando:

1. **Países adequados** — destinação para país ou organismo internacional reconhecido pela ANPD com nível adequado de proteção.
2. **Salvaguardas adequadas** — uso de cláusulas contratuais padrão, normas corporativas globais, selos, certificados ou códigos de conduta aprovados pela ANPD.
3. **Cooperação jurídica internacional** — reconhecida pelo Direito Brasileiro.
4. **Proteção da vida** — transferência necessária para proteger vida ou incolumidade física do titular ou terceiro.
5. **Autorização expressa da ANPD**.
6. **Compromisso assumido em acordo internacional**.
7. **Execução de política pública**.
8. **Consentimento específico e em destaque do titular** — informando expressamente o caráter internacional.
9. **Cumprimento de obrigação legal**.
10. **Execução de contrato** com o titular.

## 4. Procedimento prévio

Antes de iniciar uma transferência internacional, a área demandante deve:

1. **Notificar o DPO** com no mínimo 30 dias de antecedência.
2. **Identificar a hipótese** legal aplicável (item 3).
3. **Mapear os dados** envolvidos (categorias, volume, sensibilidade).
4. **Avaliar o destinatário** (país, salvaguardas, certificações).
5. **Documentar a base legal** no Inventário de Tratamento.

O DPO emite parecer favorável ou solicita ajustes/salvaguardas adicionais.

## 5. Cláusulas contratuais padrão

Sempre que possível, contratos com fornecedores internacionais devem conter cláusulas baseadas no modelo da ANPD (quando publicado) ou em modelos internacionais reconhecidos (ex: Standard Contractual Clauses da União Europeia).

Cláusulas mínimas:

- **Localização** dos servidores e do processamento.
- **Finalidade** específica do tratamento.
- **Não compartilhamento** com terceiros sem autorização.
- **Direitos do titular** — facilitação para exercício.
- **Notificação de incidentes** em até 24h.
- **Auditoria** pelo controlador.
- **Devolução/eliminação** de dados ao final.

## 6. Casos típicos

### 6.1. Cloud computing
Quando contratamos cloud (AWS, GCP, Azure) com servidores no exterior:
- Verificar disponibilidade de **região brasileira** (preferir).
- Se não houver, usar região com salvaguardas (ex: AWS São Paulo + acordos GDPR).
- Documentar no contrato a região utilizada.

### 6.2. SaaS estrangeiro
Ferramentas como Slack, Notion, Zoom — se tratam dados pessoais:
- Verificar se têm **DPA (Data Processing Agreement)**.
- Verificar política de privacidade do provedor.
- Avaliar com DPO antes de contratar.

### 6.3. Matriz/filial no exterior
Para empresas com presença internacional, podem usar **Normas Corporativas Globais (BCRs)** após aprovação da ANPD.

## 7. Inventário de transferências

Mantemos registro atualizado com:

- Destino (país, organização).
- Categorias de dados transferidos.
- Finalidade.
- Hipótese legal.
- Salvaguardas adotadas.
- Volume estimado.
- Data de início e renovação.

## 8. Responsabilidades

- **DPO ({{dpo_nome}}):** avalia e aprova transferências, mantém inventário.
- **Áreas:** notificam o DPO antes de iniciar transferência.
- **Jurídico:** redige cláusulas contratuais.
- **TI:** valida aspectos técnicos (criptografia em trânsito, controle de acesso).

---

**Versão {{data_publicacao}}** — Aprovado por {{representante_legal}}
`,
};

const T_AVALIACAO_TERCEIROS: PolicyTemplate = {
  type: "POLITICA_AVALIACAO_TERCEIROS",
  defaultTitle: "Política de Gestão de Risco de Segurança e Privacidade na Contratação de Terceiros",
  blurb:
    "Diretrizes para avaliação e gestão de risco de fornecedores, prestadores de serviço e parceiros que tratam dados pessoais. Define papéis (DPO, TI/Segurança, Jurídico) e o fluxo de avaliação.",
  content: `# Política de Gestão de Risco de Segurança e Privacidade na Contratação de Terceiros — {{empresa}}

**Última atualização:** {{data_publicacao}}

## 1. Objetivo

Estabelecer diretrizes claras para evitar violação de leis, regulações ou obrigações contratuais e manter os requisitos de segurança e privacidade na contratação de terceiros, fornecedores e prestadores de serviço da {{empresa}}.

## 2. Escopo

Aplica-se a todos os contratos com terceiros, fornecedores e prestadores de serviço da {{empresa}}, especialmente quando envolverem o compartilhamento ou tratamento de Dados Pessoais ou informações confidenciais.

## 3. Definições

- **Anonimização:** utilização de meios técnicos pelos quais um Dado Pessoal perde a possibilidade de associação a um indivíduo.
- **ANPD:** Autoridade Nacional de Proteção de Dados — órgão responsável pela fiscalização da LGPD.
- **Controlador:** pessoa natural ou jurídica a quem competem as decisões referentes ao Tratamento de Dados Pessoais.
- **Operador:** pessoa natural ou jurídica que realiza o Tratamento de Dados Pessoais em nome do Controlador.
- **Dados Pessoais:** qualquer informação relacionada a pessoa natural identificada ou identificável.
- **Dados Pessoais Sensíveis:** dados sobre origem racial ou étnica, convicção religiosa, opinião política, filiação sindical, saúde, vida sexual, dado genético ou biométrico.
- **Encarregado (DPO):** pessoa indicada como canal de comunicação entre Controlador, Titulares e a ANPD.
- **Incidente:** qualquer violação de segurança que cause destruição, perda, alteração, divulgação ou acesso não autorizado a Dados Pessoais.
- **LGPD:** Lei Geral de Proteção de Dados — Lei nº 13.709/2018.
- **Subcontratado:** pessoa contratada pelo Operador pra colaborar no Tratamento dos Dados decorrentes do contrato com o Controlador.
- **Titular:** pessoa física a quem se referem os Dados Pessoais.

## 4. Papéis e Responsabilidades

### 4.1. Encarregado (DPO) — {{dpo_nome}}
- Atuar como canal de comunicação entre Controlador, Titulares e ANPD.
- Revisar informações fornecidas pelos prestadores de serviços antes da contratação, sob a ótica de privacidade e proteção de dados.
- Aprovar a avaliação de risco de Privacidade e Segurança da Informação para contratos que envolvam Dados Pessoais.
- Recomendar ou desaconselhar contratações com risco alto.

### 4.2. TI / Segurança da Informação
- Garantir que controles de segurança e níveis de entrega incluídos em acordos com prestadores de serviço sejam implementados.
- Revisar informações dos prestadores antes da contratação sob a ótica de Segurança da Informação.

### 4.3. Jurídico
- Revisar informações fornecidas pelos prestadores antes da contratação, sob a ótica de contratos e cláusulas necessárias.
- Manter inventário dos prestadores de serviço que envolvam troca de Dados Pessoais ou armazenamento de informações confidenciais.

## 5. Diretrizes

### 5.1. Termo de Confidencialidade
Todos os prestadores de serviço devem assinar um Termo de Confidencialidade demonstrando ciência e concordância com as diretrizes de Segurança da Informação da {{empresa}}.

### 5.2. Categorias de prestadores e análise de riscos
Os prestadores de serviço que se enquadrem nas categorias abaixo devem ser submetidos à avaliação de riscos:

- Prestadores que tratam Dados Pessoais em nome da {{empresa}};
- Prestadores que armazenam ou processam informações confidenciais;
- Prestadores que terão acesso aos sistemas internos da {{empresa}}.

O responsável pela contratação deve enviar o **Formulário de Avaliação de Riscos de Privacidade e Proteção de Dados Pessoais** ao prestador. O formulário preenchido será analisado por:

- **TI/Segurança** — avalia a seção de Segurança da Informação;
- **Encarregado (DPO)** — avalia a seção de Privacidade e o papel do prestador (Operador ou Controlador), verificando riscos de violação da LGPD.

### 5.3. Contratos com troca de Dados Pessoais (Controlador/Operador)
Sempre que a relação contratual envolver troca de Dados Pessoais, a avaliação de riscos deve ser aprovada pelo DPO. É recomendável que contratos sejam firmados apenas com prestadores que demonstrem:

- Capacidade de proteger os Dados Pessoais;
- Capacidade de atender esta Política;
- Conformidade com a LGPD e legislações aplicáveis.

A {{empresa}} obterá garantias específicas via contrato, incluindo:

- Tratamento dos Dados conforme instruções da {{empresa}};
- Acesso aos Dados restrito a pessoas autorizadas sob Termo de Confidencialidade;
- Atendimento a esta Política de Segurança da Informação;
- Apoio à {{empresa}} no cumprimento de obrigações da LGPD e na resposta a solicitações de Titulares e da ANPD;
- Notificação tempestiva de incidentes;
- Descarte ou devolução dos Dados Pessoais ao fim do contrato;
- Disponibilização de informação para demonstrar conformidade e contribuir em auditorias.

### 5.4. Contratos com armazenamento de dados confidenciais
Antes da contratação, a {{empresa}} verificará se a organização possui política de segurança da informação que abranja:

- Barreiras de proteção física (controle de acesso por crachá ou biometria);
- Controle de acesso de visitantes ao escritório e a datacenters;
- Sistema de monitoramento (câmeras, equipes de segurança);
- Análise das imagens do sistema de monitoramento;
- Proteção contra danos, destruição e interrupção em salas de armazenamento.

Caso a TI/Segurança identifique riscos durante a análise, a contratação será discutida com o DPO e, após parecer, levada à Diretoria responsável.

### 5.5. Inventário de contratos
O Jurídico mantém um inventário de prestadores de serviço que envolvem troca de Dados Pessoais e armazenamento de informações confidenciais, com:

- Razão social, CNPJ, objeto do serviço;
- Posição na relação (Controlador / Operador);
- Vigência e prazo de revisão do contrato;
- Risco do contrato (Alto/Médio/Baixo) conforme critérios da ANPD;
- Cláusulas LGPD presentes (privacidade, incidentes, subcontratação, transferência internacional);
- Status da avaliação de risco do terceiro.

### 5.6. Acordo de transferência de Dados Pessoais
Quando o contrato envolver transferência de Dados Pessoais, devem ser observados:

- Procedimentos de notificação de transmissão, envio e recebimento;
- Política de criptografia ponto-a-ponto durante a transmissão;
- Registros de log durante todo o ciclo de vida da operação para garantir rastreabilidade.

### 5.7. Revisão de contratos
A {{empresa}} pode solicitar revisão de contratos em virtude de mudanças nos serviços, novas aplicações, atualizações de políticas, novos controles, ou Incidentes de segurança. O terceiro deve garantir as mudanças estabelecidas, podendo essas mudanças desencadear nova avaliação de risco.

## 6. Procedimento de Contratação

1. **Identificação:** o responsável pela contratação encaminha ao DPO o contrato proposto, indicando se há tratamento de Dados Pessoais ou acesso a informações confidenciais.
2. **Classificação:** o DPO avalia se o terceiro será **Operador** ou **Controlador** e classifica o risco do contrato.
3. **Avaliação:** caso necessário, é enviado o Formulário de Avaliação de Terceiros pra preenchimento pelo prestador.
4. **Análise:** TI/Segurança e DPO analisam as respostas; o Jurídico revisa as cláusulas contratuais.
5. **Decisão:** o DPO emite recomendação (favorável, com ressalvas, ou desfavorável). Para risco alto, parecer é submetido à Diretoria.
6. **Formalização:** as cláusulas LGPD adequadas são incluídas no contrato (cláusula robusta, simples, controlador/controlador, ou minuta padrão).
7. **Monitoramento:** o contrato é incluído no inventário; a vigência e a próxima revisão são acompanhadas pelo DPO.

## 7. Penalidades

O descumprimento desta Política poderá ensejar advertências, suspensão ou rescisão do contrato com o terceiro, sem prejuízo das responsabilidades civis e administrativas previstas em lei.

## 8. Atualização

Esta Política é revisada anualmente ou quando houver alteração relevante na legislação ou no negócio. Mudanças são comunicadas pelos canais oficiais da {{empresa}}.

---

**Versão {{data_publicacao}}** — Aprovado por {{representante_legal}}
`,
};

const T_OUTRA: PolicyTemplate = {
  type: "OUTRA",
  defaultTitle: "Outra Política",
  blurb: "Template em branco pra criar uma política não listada nas categorias acima (ex: política de redes sociais, política de BYOD, etc.).",
  content: `# [Título da Política] — {{empresa}}

**Última atualização:** {{data_publicacao}}

## 1. Objetivo

[Descreva o objetivo desta política — o que ela regula, qual problema resolve.]

## 2. Escopo

[Quem se aplica? Quais áreas, processos ou sistemas?]

## 3. Definições

- **[Termo 1]:** [definição]
- **[Termo 2]:** [definição]

## 4. Diretrizes

### 4.1. [Tópico 1]
[Conteúdo]

### 4.2. [Tópico 2]
[Conteúdo]

## 5. Responsabilidades

- **DPO ({{dpo_nome}}):** [responsabilidades]
- **[Outra área]:** [responsabilidades]

## 6. Penalidades

[Consequências do descumprimento]

## 7. Atualização

Esta política é revisada [periodicidade]. Mudanças são comunicadas por [canal].

---

**Versão {{data_publicacao}}** — Aprovado por {{representante_legal}}
`,
};

// ============================================================
// Catálogo público
// ============================================================

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  T_POLITICA_PGP,
  T_AVISO_EXTERNO,
  T_PRIVACIDADE_INTERNA,
  T_NORMA_PRIVACIDADE,
  T_TERMOS_USO,
  T_COOKIES,
  T_TERCEIROS,
  T_RETENCAO,
  T_TREINAMENTO,
  T_TRANSFERENCIA,
  T_AVALIACAO_TERCEIROS,
  T_OUTRA,
];

export function getTemplate(type: PolicyType): PolicyTemplate {
  return POLICY_TEMPLATES.find((t) => t.type === type) ?? T_OUTRA;
}
