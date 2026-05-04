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
// Os 9 templates
// ============================================================

const T_AVISO_EXTERNO: PolicyTemplate = {
  type: "AVISO_PRIVACIDADE_EXTERNO",
  defaultTitle: "Aviso de Privacidade",
  blurb: "Documento público que explica aos titulares (clientes, visitantes do site) como a organização coleta, usa, compartilha e protege dados pessoais. Vai no rodapé do site / app.",
  content: `# Aviso de Privacidade — {{empresa}}

**Última atualização:** {{data_publicacao}}

## 1. Quem somos

A **{{empresa}}**, inscrita no CNPJ {{cnpj}}, com sede em {{endereco}}, leva a sério a privacidade e a proteção dos seus dados pessoais. Este Aviso de Privacidade explica como coletamos, usamos, compartilhamos e protegemos suas informações em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).

## 2. Quais dados coletamos

Coletamos dados pessoais necessários pra operar nossos serviços:

- **Dados de identificação:** nome completo, CPF, RG, data de nascimento.
- **Dados de contato:** e-mail, telefone, endereço.
- **Dados profissionais:** cargo, empresa, área de atuação (quando aplicável).
- **Dados de navegação:** endereço IP, tipo de navegador, páginas acessadas (via cookies — veja nossa Política de Cookies).

> **Você** é responsável por manter seus dados atualizados e verídicos.

## 3. Como coletamos

- **Diretamente de você:** quando preenche formulários, faz cadastro, contrata serviços, entra em contato.
- **Automaticamente:** via cookies e tecnologias similares ao navegar em nosso site.
- **De terceiros:** apenas quando autorizado por você ou previsto em lei.

## 4. Para que finalidade usamos seus dados

Tratamos dados pessoais para:

- Prestar os serviços contratados.
- Cumprir obrigações legais e regulatórias.
- Atender solicitações, dúvidas e suporte.
- Enviar comunicações relevantes (mediante consentimento, quando aplicável).
- Melhorar a experiência no site e nos nossos serviços.
- Prevenir fraudes e proteger direitos.

## 5. Bases legais (Art. 7º e Art. 11 da LGPD)

Cada finalidade tem uma base legal:

- **Consentimento** — para envio de comunicações de marketing.
- **Execução de contrato** — para prestar os serviços que você contratou.
- **Cumprimento de obrigação legal** — para manter registros fiscais, trabalhistas, etc.
- **Legítimo interesse** — para segurança da informação e prevenção a fraudes.

## 6. Com quem compartilhamos

Compartilhamos dados pessoais apenas quando estritamente necessário e com:

- **Prestadores de serviço** que atuam em nosso nome (hospedagem, e-mail, processamento de pagamentos).
- **Autoridades competentes** quando exigido por lei ou ordem judicial.
- **Órgãos reguladores** no escopo de fiscalização.

Todos os terceiros assumem obrigações contratuais de confidencialidade e segurança.

## 7. Transferência internacional

Quando aplicável, transferimos dados internacionalmente apenas para países com nível adequado de proteção ou mediante salvaguardas previstas no Art. 33 da LGPD.

## 8. Por quanto tempo guardamos seus dados

Mantemos os dados pelo tempo necessário pra cumprir as finalidades informadas, observando prazos legais (fiscais, trabalhistas, regulatórios). Após esse período, descartamos com segurança ou anonimizamos.

## 9. Como protegemos seus dados

Adotamos medidas técnicas e organizacionais apropriadas:

- Criptografia em trânsito (HTTPS/TLS).
- Controle de acesso baseado em função (RBAC).
- Logs e monitoramento de acessos.
- Treinamento contínuo de equipe.
- Política de incidentes de segurança.

## 10. Seus direitos como titular (Art. 18 da LGPD)

Você pode, a qualquer momento:

1. **Confirmar** se tratamos seus dados.
2. **Acessar** os dados que temos sobre você.
3. **Corrigir** dados incompletos, inexatos ou desatualizados.
4. **Anonimizar, bloquear ou eliminar** dados desnecessários ou tratados em desconformidade.
5. **Portar** seus dados para outro fornecedor.
6. **Revogar consentimento** a qualquer momento.
7. **Solicitar informação** sobre compartilhamentos.
8. **Opor-se** a tratamentos que considere abusivos.

Para exercer esses direitos, entre em contato com nosso Encarregado (DPO):

- **Nome:** {{dpo_nome}}
- **E-mail:** {{dpo_email}}
- **Telefone:** {{dpo_telefone}}

Respondemos em até **15 dias úteis**.

## 11. Cookies

Usamos cookies para funcionalidade, análise e personalização. Veja detalhes na nossa **Política de Cookies**.

## 12. Alterações neste Aviso

Podemos atualizar este Aviso a qualquer momento. A data da última atualização aparece no topo. Mudanças relevantes serão comunicadas pelos canais habituais.

## 13. Contato

Dúvidas sobre este Aviso ou sobre proteção de dados:

- **{{empresa}}**
- {{endereco}}
- E-mail: {{email}}
- Encarregado (DPO): {{dpo_email}}
`,
};

const T_PRIVACIDADE_INTERNA: PolicyTemplate = {
  type: "POLITICA_PRIVACIDADE_INTERNO",
  defaultTitle: "Política de Privacidade Interna",
  blurb: "Declaração para colaboradores (funcionários, estagiários, prestadores) sobre como a empresa coleta, usa e protege os dados pessoais DELES.",
  content: `# Política de Privacidade Interna — {{empresa}}

**Última atualização:** {{data_publicacao}}

> Este documento se destina a colaboradores (funcionários CLT, estagiários, jovens aprendizes, prestadores de serviço, diretores) e explica **como a {{empresa}} trata os dados pessoais que vocês fornecem ou que são gerados durante a relação com a empresa**.

## 1. Dados que tratamos sobre você

- **Identificação:** nome, CPF, RG, CTPS, PIS/PASEP, data de nascimento, foto.
- **Contato:** endereço, e-mail pessoal e corporativo, telefone.
- **Profissionais:** cargo, departamento, salário, benefícios, histórico de cargos.
- **Bancários:** conta para depósito de salário.
- **Saúde** (dados sensíveis): exames admissionais/periódicos, atestados, ASO, restrições.
- **Acessos:** crachá, biometria (se aplicável), logs de sistemas, e-mails corporativos.

## 2. Para que usamos esses dados

- Cumprir obrigações trabalhistas, previdenciárias e fiscais.
- Pagamento de salário, benefícios e reembolsos.
- Gestão de jornada, férias, ausências.
- Saúde ocupacional e segurança do trabalho.
- Avaliações de desempenho e desenvolvimento.
- Controle de acesso a sistemas e instalações.
- Comunicação interna.

## 3. Bases legais

- **Execução de contrato de trabalho** — Art. 7º, V da LGPD.
- **Cumprimento de obrigação legal** — CLT, FGTS, INSS, eSocial.
- **Tutela da saúde** — Art. 11, II, "f" da LGPD (dados de saúde).
- **Legítimo interesse** — segurança patrimonial, prevenção a fraudes.

## 4. Compartilhamento

Compartilhamos seus dados apenas com:

- **Órgãos públicos** (Receita, INSS, Ministério do Trabalho, ANPD).
- **Bancos e operadoras** de benefícios (vale-refeição, plano de saúde).
- **Prestadores de serviço** sob contrato (folha, ponto, treinamento).
- **Sucessores** em caso de fusão/aquisição (com salvaguardas).

## 5. Retenção

- **Durante o vínculo:** todos os dados.
- **Após o desligamento:** mantemos pelos prazos legais (FGTS 30 anos, INSS 10 anos, fiscais 5 anos).
- **Findos os prazos:** descartamos com segurança ou anonimizamos.

## 6. Seus direitos

Você tem todos os direitos previstos no Art. 18 da LGPD (acesso, correção, eliminação quando aplicável, portabilidade, etc.). Para exercê-los:

- **Encarregado (DPO):** {{dpo_nome}}
- **E-mail:** {{dpo_email}}

## 7. Comunicação de mudanças

Atualizações desta Política são comunicadas pelos canais internos (e-mail corporativo, intranet, mural).

---

**Versão {{data_publicacao}}** — Em caso de dúvidas, fale com seu RH ou com o DPO.
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
  defaultTitle: "Termos e Condições de Uso",
  blurb: "Contrato de adesão entre a empresa e o usuário do site/aplicativo — define direitos, deveres, limitações de uso, propriedade intelectual e link para o Aviso de Privacidade.",
  content: `# Termos e Condições de Uso — {{empresa}}

**Última atualização:** {{data_publicacao}}

Bem-vindo(a)! Estes Termos regulam o uso do site/aplicativo da **{{empresa}}** (CNPJ {{cnpj}}). Ao acessar nossos serviços, você concorda integralmente com estas condições.

## 1. Definições

- **Plataforma:** site, app ou qualquer canal digital da {{empresa}}.
- **Usuário:** quem acessa ou utiliza a Plataforma.
- **Conteúdo:** textos, imagens, vídeos, documentos disponíveis na Plataforma.

## 2. Aceitação

O uso da Plataforma implica aceitação plena destes Termos e do nosso Aviso de Privacidade. Se não concorda, **não utilize**.

## 3. Cadastro e conta

- O cadastro é gratuito (quando aplicável) e exige informações verídicas.
- Você é responsável pela confidencialidade de senha e atividades feitas na sua conta.
- Comunique imediatamente qualquer acesso não autorizado.

## 4. Uso permitido

Você concorda em **NÃO**:

- Utilizar a Plataforma para fins ilegais, fraudulentos ou contrários à moral.
- Reproduzir, copiar, vender ou distribuir conteúdos sem autorização.
- Utilizar logomarca, identidade visual ou marcas da {{empresa}} sem autorização escrita.
- Fazer engenharia reversa, decompilar ou tentar extrair código-fonte.
- Inserir conteúdos ofensivos, discriminatórios ou que violem direitos de terceiros.
- Usar bots, scrapers ou automações que sobrecarreguem a Plataforma.

## 5. Propriedade intelectual

Todo o conteúdo da Plataforma (textos, imagens, vídeos, código, design, marcas) pertence à {{empresa}} ou é licenciado. Uso não autorizado caracteriza violação a direitos de propriedade intelectual.

## 6. Privacidade

O tratamento de dados pessoais pela {{empresa}} segue nosso **Aviso de Privacidade**, que faz parte integrante destes Termos. Leia em [link para o Aviso de Privacidade].

## 7. Disponibilidade

Buscamos manter a Plataforma disponível 24/7, mas podemos suspender por manutenção, atualizações ou força maior. Não nos responsabilizamos por indisponibilidades temporárias.

## 8. Limitação de responsabilidade

A {{empresa}} não se responsabiliza por:

- Conteúdo gerado por terceiros na Plataforma.
- Danos decorrentes do uso indevido pelo Usuário.
- Falhas de conexão ou de dispositivos do Usuário.
- Vírus, malware ou ataques cibernéticos não causados por nossa falha.

## 9. Modificações

Podemos atualizar estes Termos a qualquer momento. A versão vigente está sempre disponível na Plataforma. Uso continuado após mudanças = aceitação tácita.

## 10. Cancelamento

Podemos suspender ou encerrar a conta de qualquer Usuário que descumpra estes Termos, sem aviso prévio.

## 11. Lei aplicável e foro

Estes Termos são regidos pelas leis brasileiras. Foro da comarca de {{cidade}}/{{estado}} para dirimir controvérsias.

## 12. Contato

- **{{empresa}}**
- {{endereco}}
- E-mail: {{email}}
- Telefone: {{telefone}}

---

**Versão {{data_publicacao}}**
`,
};

const T_COOKIES: PolicyTemplate = {
  type: "POLITICA_COOKIES",
  defaultTitle: "Política de Cookies",
  blurb: "Detalha quais cookies o site coleta, com que finalidade, base legal de cada categoria e como o titular pode gerenciar suas preferências (consent banner). Segue o Guia da ANPD.",
  content: `# Política de Cookies — {{empresa}}

**Última atualização:** {{data_publicacao}}

Esta política explica o que são cookies, como a **{{empresa}}** os utiliza no site {{website}} e como você pode gerenciar suas preferências.

## 1. O que são cookies

Cookies são pequenos arquivos de texto armazenados no seu navegador quando você visita um site. Servem para reconhecer o dispositivo, lembrar preferências, melhorar performance e personalizar conteúdo.

## 2. Categorias de cookies que utilizamos

### 2.1. Cookies estritamente necessários
Indispensáveis para o funcionamento do site (ex: manter você logado, lembrar itens no carrinho). **Não exigem consentimento** — base legal: legítimo interesse.

### 2.2. Cookies de desempenho/análise
Coletam informações sobre como você usa o site (páginas visitadas, tempo gasto) — anonimizadas. Ajudam a melhorar a experiência. **Exigem consentimento.**

### 2.3. Cookies de funcionalidade
Lembram preferências (idioma, região, fonte). **Exigem consentimento.**

### 2.4. Cookies de publicidade/marketing
Usados para exibir anúncios relevantes ao seu interesse. **Exigem consentimento.**

## 3. Cookies de terceiros

Alguns recursos do nosso site (vídeos do YouTube, mapas, botões de redes sociais) instalam cookies de terceiros. Esses cookies são governados pelas políticas dos respectivos provedores.

## 4. Tabela de cookies utilizados

> Esta tabela deve ser atualizada conforme o desenvolvedor configure novos cookies. Faça uma varredura regular usando ferramentas como [cookieserve.com](https://www.cookieserve.com) ou similar.

| Nome | Provedor | Categoria | Duração | Finalidade |
|------|----------|-----------|---------|------------|
| \`session_id\` | {{website}} | Necessário | Sessão | Manter sessão de navegação |
| \`_ga\` | Google Analytics | Análise | 2 anos | Identificar visitantes únicos |
| \`_gid\` | Google Analytics | Análise | 24 horas | Distinguir usuários |
| (preencher) | (preencher) | (preencher) | (preencher) | (preencher) |

## 5. Como gerenciar suas preferências

### 5.1. Banner de cookies do site
Na sua primeira visita aparece um banner para você **aceitar** ou **rejeitar** cookies não essenciais. Pode mudar a escolha a qualquer momento clicando em "Configurações de cookies" no rodapé.

### 5.2. Configurações do navegador
Você pode bloquear ou apagar cookies no seu navegador:

- [Google Chrome](https://support.google.com/chrome/answer/95647)
- [Mozilla Firefox](https://support.mozilla.org/pt-BR/kb/limpe-cookies-e-dados-de-sites-no-firefox)
- [Safari](https://support.apple.com/pt-br/guide/safari/sfri11471/mac)
- [Microsoft Edge](https://support.microsoft.com/pt-br/microsoft-edge)

> **Atenção:** desabilitar cookies necessários pode quebrar funcionalidades do site.

## 6. Bases legais (LGPD)

- **Cookies necessários:** legítimo interesse (Art. 7º, IX da LGPD).
- **Cookies não necessários (análise, funcionalidade, marketing):** consentimento (Art. 7º, I da LGPD).

Conforme **Guia Orientativo da ANPD sobre Cookies e Proteção de Dados Pessoais (2022)**.

## 7. Seus direitos

Para exercer direitos sobre dados coletados via cookies, contate nosso DPO:

- **Nome:** {{dpo_nome}}
- **E-mail:** {{dpo_email}}

## 8. Atualizações

Atualizamos esta política sempre que mudarmos a forma de uso de cookies. Reveja periodicamente.

---

**Versão {{data_publicacao}}** — {{empresa}}
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
  T_AVISO_EXTERNO,
  T_PRIVACIDADE_INTERNA,
  T_NORMA_PRIVACIDADE,
  T_TERMOS_USO,
  T_COOKIES,
  T_TERCEIROS,
  T_RETENCAO,
  T_TREINAMENTO,
  T_TRANSFERENCIA,
  T_OUTRA,
];

export function getTemplate(type: PolicyType): PolicyTemplate {
  return POLICY_TEMPLATES.find((t) => t.type === type) ?? T_OUTRA;
}
