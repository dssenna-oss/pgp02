/**
 * Templates seed de cláusulas contratuais LGPD para Gestão de
 * Terceiros (Checkpoint 14 / G3).
 *
 * Inspirado nos modelos da Denise (consultoria PGP) — 5 templates
 * cobrindo as combinações típicas:
 *
 *   - ROBUSTA          → Operador + risco ALTO (cláusula completa)
 *   - SIMPLES          → Operador + risco MEDIO/BAIXO (cláusula enxuta)
 *   - CC               → Controlador × Controlador (co-controladoria)
 *   - CLIENTE_OPERADOR → Quando a empresa é o Operador (espelho)
 *   - MINUTA           → Cláusula curta padrão pra contratos simples
 *
 * Placeholders padrão (resolvidos por `lib/operadores-clausulas.ts`):
 *
 *   {{contratante.razaoSocial}} {{contratante.cnpj}} {{contratante.endereco}}
 *   {{contratado.razaoSocial}} {{contratado.cnpj}} {{contratado.endereco}}
 *   {{contrato.nome}} {{contrato.dataAssinatura}} {{contrato.dataAtual}}
 *   {{dpo.nome}} {{dpo.email}} {{dpo.telefone}}
 *
 * Quem é "contratante" e quem é "contratado" depende do tipo:
 *   - ROBUSTA/SIMPLES/CC/MINUTA: contratante = Company, contratado = Operator
 *   - CLIENTE_OPERADOR:          contratante = Operator (terceiro),
 *                                contratado = Company (que atua como
 *                                operadora)
 */

import type { RecommendedClause } from "@/lib/operadores-helpers";

export interface ClauseTemplate {
  type: RecommendedClause;
  defaultTitle: string;
  blurb: string;
  /** Markdown do template com placeholders {{...}}. */
  content: string;
}

// ============================================================
// 1. ROBUSTA — Controlador × Operador (alto risco)
// ============================================================

const T_ROBUSTA: ClauseTemplate = {
  type: "ROBUSTA",
  defaultTitle: "Aditamento de Tratamento de Dados Pessoais — Controlador × Operador (Robusta)",
  blurb:
    "Recomendada para operadores com risco ALTO. Cláusula completa com transferência internacional detalhada, cooperação com titulares, resposta a incidentes em ≤1 dia, responsabilidade com multa contratual.",
  content: `# ADITAMENTO DE TRATAMENTO DE DADOS PESSOAIS

**Cláusula Controlador × Operador — Compartilhamento de Dados Pessoais**

O presente Aditamento de Tratamento de Dados Pessoais ("**Aditamento**") é celebrado por:

**{{contratante.razaoSocial}}**, cadastrada no CNPJ sob o nº **{{contratante.cnpj}}**, com endereço comercial em {{contratante.endereco}}, aqui representada na forma de seus atos societários ("**CONTRATANTE**"); e, de outro lado,

**{{contratado.razaoSocial}}**, cadastrada no CNPJ sob o nº **{{contratado.cnpj}}**, com endereço comercial em {{contratado.endereco}}, aqui representada na forma de seus atos societários ("**CONTRATADO**").

Sendo que a CONTRATANTE e o CONTRATADO são conjuntamente denominadas "**Partes**", ou "Parte" quando consideradas isolada e indistintamente.

## CONSIDERANDO QUE

A CONTRATANTE e o CONTRATADO celebraram em **{{contrato.dataAssinatura}}** o **{{contrato.nome}}** (doravante, o "**Contrato**"), sob o qual haverá o Tratamento, pelo CONTRATADO, de Dados Pessoais controlados pela CONTRATANTE, de acordo com as instruções fornecidas por esta;

As Partes concordaram em celebrar o presente Aditamento, com o propósito de complementar o Contrato, a fim de reger os termos e condições aplicáveis para o Tratamento de Dados Pessoais.

## OBJETO

O presente Aditamento tem por objeto incluir no Contrato as disposições sobre proteção de Dados Pessoais a que as Partes estarão sujeitas conforme a Lei nº 13.709/2018 ("**LGPD**"), na forma do Anexo de Proteção de Dados Pessoais, parte integrante e indissociável deste instrumento.

## 1. DEFINIÇÕES

Para fins deste Aditamento, considerar-se-ão as seguintes definições:

- **ANPD**: Autoridade Nacional de Proteção de Dados — órgão responsável pela fiscalização da LGPD.
- **Controlador(a)**: a quem competem as decisões referentes ao Tratamento de Dados Pessoais.
- **Dados Pessoais**: qualquer informação relacionada a pessoa natural identificada ou identificável.
- **Dados Pessoais Sensíveis**: dado sobre origem racial ou étnica, convicção religiosa, opinião política, filiação sindical, saúde, vida sexual, dado genético ou biométrico.
- **Encarregado**: pessoa indicada pelo Controlador e Operador como canal de comunicação com Titulares e a ANPD.
- **Incidente**: qualquer acesso, aquisição, uso, modificação, divulgação, perda, destruição ou dano acidental, ilegal ou não autorizado envolvendo Dados Pessoais.
- **Operador(a)**: parte que trata Dados Pessoais conforme as instruções do Controlador.
- **Titular(es)**: pessoa natural a quem se referem os Dados Pessoais.
- **Tratamento**: qualquer operação realizada com Dados Pessoais.

## 2. DADOS PESSOAIS TRATADOS E FINALIDADES

2.1. As Partes declaram que toda e qualquer atividade de Tratamento deve atender às finalidades do Contrato e ser realizada em conformidade com a legislação aplicável, sobretudo a LGPD.

2.2. O CONTRATADO realizará as atividades de Tratamento estritamente de acordo com as orientações da CONTRATANTE.

2.3. A duração do Tratamento respeitará o objeto contratual e a legislação aplicável.

## 3. DECLARAÇÕES E GARANTIAS

3.1. **A CONTRATANTE declara e garante** que:

- Todo o Tratamento dos Dados Pessoais, desde a coleta até o compartilhamento com o CONTRATADO, foi realizado de acordo com a LGPD;
- Estabelecerá os critérios para que o CONTRATADO tenha acesso somente aos Dados Pessoais necessários ao Tratamento contratado.

3.2. **O CONTRATADO declara e garante** que:

- Realizará o Tratamento conforme indicado pela CONTRATANTE, exclusivamente para a operacionalização das relações contratuais;
- Manterá registro de todas as operações de Tratamento;
- Seguirá as instruções da CONTRATANTE durante o Tratamento, sob risco de assumir as devidas responsabilidades caso aja em desacordo;
- Notificará a CONTRATANTE por escrito caso discorde de alguma instrução, justificando os motivos;
- Prestará assistência à CONTRATANTE sempre que a ANPD, autoridade governamental ou Titular requeira informações sobre o Tratamento;
- Implementará medidas técnicas e administrativas necessárias para proteger os Dados Pessoais contra destruição, perda, alteração, comunicação ou acesso não autorizado;
- Fornecerá evidências de que possui recursos suficientes para cumprir suas responsabilidades, podendo apresentar apólice de seguro com tal cobertura.

## 4. TRANSFERÊNCIA INTERNACIONAL DE DADOS PESSOAIS

4.1. O CONTRATADO poderá, mediante autorização prévia e por escrito da CONTRATANTE, disponibilizar ou transferir os Dados Pessoais para outras jurisdições, exclusivamente quando previsto no objeto do Contrato.

4.2. Na hipótese de transferência internacional:

- O CONTRATADO tomará as medidas necessárias para assegurar que a transferência esteja em conformidade com a LGPD e regras vinculantes da ANPD;
- Caso o país de destino não possua nível adequado de proteção, o CONTRATADO estabelecerá com a CONTRATANTE qual mecanismo será utilizado (cláusulas contratuais padrão, certificação, etc.);
- O CONTRATADO assumirá toda a responsabilidade pela transferência.

## 5. SUBCONTRATAÇÃO

5.1. Na hipótese de compartilhamento ou transferência de Dados Pessoais a Terceiros (subcontratados), o CONTRATADO deverá garantir que tais terceiros se obriguem, por escrito, a garantir os mesmos níveis e padrões de proteção estabelecidos neste Aditamento e na LGPD.

5.2. O CONTRATADO responsabiliza-se por todas as ações e omissões realizadas pelos terceiros subcontratados, eximindo a CONTRATANTE de qualquer responsabilidade.

## 6. MEDIDAS DE SEGURANÇA E CONFIDENCIALIDADE

O CONTRATADO compromete-se a:

- Restringir o acesso aos Dados Pessoais a pessoas habilitadas, sob dever de confidencialidade;
- Garantir a integridade das informações sem retificar, apagar ou restringir o Tratamento por iniciativa própria;
- Adotar medidas técnicas e organizacionais que garantam inviolabilidade, confidencialidade, disponibilidade e integridade, tais como:
  - Mecanismos de autenticação dupla;
  - Anonimização, pseudonimização e encriptação;
  - Recursos para restauração rápida em caso de Incidente;
  - Verificação contínua das medidas implementadas;
- Manter inventário detalhado dos acessos aos Dados Pessoais;
- Registrar atividades de compartilhamento e transferência internacional.

## 7. COOPERAÇÃO COM TITULARES E AUTORIDADES

7.1. Caberá à CONTRATANTE atender as requisições de exercício de direitos por parte dos Titulares ou solicitações da ANPD.

7.2. Caberá ao CONTRATADO, sempre que solicitado pela CONTRATANTE, auxiliar no atendimento das requisições, tais como pedidos de acesso, correção, anonimização, bloqueio, eliminação ou portabilidade.

7.3. Quaisquer informações solicitadas pela CONTRATANTE deverão ser atendidas pelo CONTRATADO de forma imediata ou no prazo máximo de **2 (dois) dias corridos**.

7.4. O CONTRATADO notificará a CONTRATANTE imediatamente sobre:

- Qualquer pedido legalmente vinculativo de divulgação por Autoridade Pública;
- Qualquer Incidente envolvendo os Dados Pessoais;
- Qualquer solicitação recebida diretamente dos Titulares ou da ANPD.

## 8. RESPOSTA A INCIDENTES

8.1. Na ocorrência de qualquer Incidente, o CONTRATADO deverá:

- **Notificar a CONTRATANTE imediatamente**, com tolerância máxima de **1 (um) dia corrido**, contendo no mínimo:
  - Data e hora do Incidente;
  - Data e hora da ciência pelo CONTRATADO;
  - Tipos de Dados Pessoais afetados;
  - Número de Titulares afetados;
  - Dados de contato do Encarregado do CONTRATADO;
  - Descrição das possíveis consequências;
  - Medidas adotadas para mitigação.

8.2. Após a notificação, o CONTRATADO providenciará — sob orientação da CONTRATANTE — a notificação dos Titulares afetados e da ANPD, e adotará plano de ação para evitar recorrência.

8.3. Para Incidentes causados por culpa exclusiva do CONTRATADO, este será responsável pelas sanções aplicadas. Caso a CONTRATANTE seja responsabilizada, exercerá direito de regresso.

## 9. RESPONSABILIDADE

9.1. O CONTRATADO defenderá e manterá a CONTRATANTE integralmente isenta de quaisquer responsabilidades ou reivindicações dos Titulares baseadas em irregularidade ou Tratamento em desacordo com as instruções da CONTRATANTE.

9.2. Caso o CONTRATADO não garanta o Tratamento adequado às finalidades deste Contrato e à LGPD, ou comprometa a segurança das informações, estará sujeito a multa não compensatória por descumprimento contratual, sem prejuízo de perdas e danos.

## 10. TÉRMINO DO TRATAMENTO

10.1. Após a expiração ou rescisão do Contrato, o CONTRATADO eliminará ou devolverá à CONTRATANTE os Dados Pessoais — incluindo eventuais cópias — conforme instruções e prazo informados pela CONTRATANTE.

10.2. Hipóteses de manutenção dos Dados Pessoais em decorrência de obrigação legal e/ou regulatória são ressalvadas; nesse caso, o CONTRATADO passará a ser Controlador para tal finalidade.

## 11. DISPOSIÇÕES GERAIS

11.1. Este Aditamento é parte integrante e indissociável do Contrato.

11.2. Em caso de conflito entre os termos deste Aditamento e o Contrato, prevalecem os deste Aditamento no que se refere ao Tratamento de Dados Pessoais.

11.3. Notificações relativas ao Tratamento de Dados Pessoais devem ser enviadas para:

**Para a CONTRATANTE:**
- Encarregado (DPO): {{dpo.nome}}
- E-mail: {{dpo.email}}
- Telefone: {{dpo.telefone}}

11.4. As Partes reconhecem como válidas as assinaturas eletrônicas, nos termos da Medida Provisória nº 2.200-2/2001.

## 12. SOLUÇÃO DE DISPUTAS

Aplicam-se a este Aditamento as disposições de solução de disputas previstas no Contrato.

---

E, por estarem justas e contratadas, as Partes assinam o presente Instrumento.

**Local e data:** _________________, {{contrato.dataAtual}}.

**CONTRATANTE:** _____________________________

**CONTRATADO:** _____________________________

**Testemunhas:** _____________________________ / _____________________________
`,
};

// ============================================================
// 2. SIMPLES — Controlador × Operador (médio/baixo risco)
// ============================================================

const T_SIMPLES: ClauseTemplate = {
  type: "SIMPLES",
  defaultTitle: "Aditamento de Tratamento de Dados Pessoais — Controlador × Operador (Simples)",
  blurb:
    "Recomendada para operadores com risco MÉDIO ou BAIXO. Cláusula enxuta com obrigações essenciais da LGPD.",
  content: `# ADITAMENTO DE TRATAMENTO DE DADOS PESSOAIS

O presente Aditamento é celebrado por:

**{{contratante.razaoSocial}}**, CNPJ **{{contratante.cnpj}}**, endereço {{contratante.endereco}} ("**CONTRATANTE**"); e

**{{contratado.razaoSocial}}**, CNPJ **{{contratado.cnpj}}**, endereço {{contratado.endereco}} ("**CONTRATADO**").

## CONSIDERANDO QUE

A CONTRATANTE e o CONTRATADO celebraram em **{{contrato.dataAssinatura}}** o **{{contrato.nome}}** (o "**Contrato**"), sob o qual haverá Tratamento, pelo CONTRATADO, de Dados Pessoais controlados pela CONTRATANTE.

## ANEXO DE PROTEÇÃO DE DADOS PESSOAIS

### 1. Tratamento dos Dados Pessoais

O CONTRATADO tratará os Dados Pessoais somente para executar suas obrigações contratuais, ou outras definidas pela CONTRATANTE por escrito. O CONTRATADO não coletará, usará, acessará, manterá, modificará, divulgará, transferirá ou tratará Dados Pessoais sem ciência e autorização da CONTRATANTE.

O CONTRATADO realizará o Tratamento de Dados Pessoais Sensíveis apenas quando estritamente necessário ao cumprimento das disposições contratuais.

### 2. Compartilhamento

O CONTRATADO assegurará que os Dados Pessoais só sejam acessados, compartilhados ou transferidos a terceiros (incluindo subcontratados) que ofereçam, por escrito, a mesma proteção estabelecida neste Anexo. O CONTRATADO notificará por escrito a CONTRATANTE a respeito de qualquer subcontratação, e responderá pelas ações dos terceiros como se fossem suas.

### 3. Programa de Proteção de Dados Pessoais

O CONTRATADO compromete-se a manter programa de proteção de Dados Pessoais eficaz, em linha com o art. 50 da LGPD e parâmetros da ANPD.

### 4. Medidas e Controles de Segurança

O CONTRATADO declara possuir medidas técnicas e organizacionais aptas a proteger os Dados Pessoais, garantindo integridade, disponibilidade e confidencialidade.

### 5. Evidências

Quando solicitado, o CONTRATADO disponibilizará documentação para demonstrar cumprimento das obrigações deste Anexo e da LGPD.

### 6. Atualização dos Dados

O CONTRATADO assegurará que os dados pessoais permaneçam corretos e atualizados, corrigindo ou excluindo informações desatualizadas conforme orientação da CONTRATANTE.

### 7. Transferência Internacional

Caso seja necessária transferência internacional para cumprir o Contrato, o CONTRATADO comunicará a CONTRATANTE por escrito e adotará as medidas de segurança previstas na LGPD.

### 8. Direitos dos Titulares

O CONTRATADO auxiliará a CONTRATANTE no atendimento das requisições dos Titulares (acesso, correção, anonimização, bloqueio, eliminação, portabilidade, etc.) — em prazo razoável, no máximo na metade do prazo legal.

### 9. Resposta a Incidentes

Na ocorrência de Incidente, o CONTRATADO comunicará a CONTRATANTE imediatamente, por escrito, contendo:

- Data e hora do Incidente;
- Tipos de Dados Pessoais afetados;
- Número de Titulares afetados;
- Dados de contato do Encarregado;
- Medidas de mitigação adotadas.

O CONTRATADO responsabiliza-se por sanções decorrentes de Incidentes causados por sua exclusiva conduta.

### 10. Devolução ou Destruição

Sob comando da CONTRATANTE, ou ao fim do Contrato, o CONTRATADO devolverá os Dados Pessoais ou os excluirá em definitivo.

### 11. Cumprimento de Obrigação Legal

Caso o CONTRATADO seja destinatário de ordem judicial ou comunicação oficial demandando os Dados Pessoais, notificará a CONTRATANTE imediatamente.

### 12. Indenizações

O CONTRATADO indenizará e isentará a CONTRATANTE de responsabilidades decorrentes de violação deste Anexo.

### 13. Duração

As obrigações do CONTRATADO perdurarão enquanto este tiver acesso aos Dados Pessoais obtidos em razão da relação contratual, mesmo após expiração ou rescisão do Contrato.

### 14. Compatibilidade

Este Anexo complementa o Contrato. Em caso de conflito, prevalecem os termos deste Anexo no que se refere ao Tratamento de Dados Pessoais.

---

**Local e data:** _________________, {{contrato.dataAtual}}.

**CONTRATANTE:** _____________________________

**CONTRATADO:** _____________________________

**Encarregado (DPO) da CONTRATANTE:** {{dpo.nome}} · {{dpo.email}}
`,
};

// ============================================================
// 3. CC — Controlador × Controlador
// ============================================================

const T_CC: ClauseTemplate = {
  type: "CC",
  defaultTitle: "Aditamento de Tratamento de Dados Pessoais — Controlador × Controlador",
  blurb:
    "Para situações em que ambas as partes são controladoras independentes ou em co-controladoria. Sem assessment técnico aprofundado.",
  content: `# ADITAMENTO DE TRATAMENTO DE DADOS PESSOAIS

**Cláusula Controlador × Controlador — Compartilhamento de Dados Pessoais**

O presente Aditamento é celebrado por:

**{{contratante.razaoSocial}}**, CNPJ **{{contratante.cnpj}}**, endereço {{contratante.endereco}} ("**CONTRATANTE**"); e

**{{contratado.razaoSocial}}**, CNPJ **{{contratado.cnpj}}**, endereço {{contratado.endereco}} ("**CONTRATADO**").

## CONSIDERANDO QUE

As Partes celebraram em **{{contrato.dataAssinatura}}** o **{{contrato.nome}}** (o "**Contrato**"), sob o qual haverá Tratamento de Dados Pessoais controlados por ambas as Partes.

## ANEXO DE PROTEÇÃO DE DADOS PESSOAIS

### 1. Definições

Para fins deste Anexo, aplicam-se as definições da LGPD. Para os fins deste Contrato, as duas Partes serão designadas em conjunto como **Controladores**.

### 2. Dados Pessoais Tratados e Finalidades

Os Controladores declaram que toda atividade de Tratamento atenderá às finalidades do Contrato e à legislação aplicável. Compartilharão Dados Pessoais nos termos da LGPD, respeitando a duração necessária ao objeto contratual.

### 3. Obrigações das Partes

Ao realizar qualquer Tratamento, os Controladores garantem:

- Tratar os Dados Pessoais em conformidade com a LGPD;
- Manter registro dos Dados Pessoais processados;
- Garantir confidencialidade e integridade dos Dados Pessoais compartilhados;
- Adotar medidas técnicas e administrativas de segurança;
- Garantir qualidade e transparência ao Titular;
- Restringir acesso aos Dados Pessoais a pessoas habilitadas;
- Manter inventário detalhado de acessos;
- Registrar atividades de transferência internacional;
- Manter canal de contato para responder a consultas sobre o Tratamento.

### 4. Compartilhamento e Subcontratação

Os Controladores não estão autorizados a transferir e/ou compartilhar com terceiros os Dados Pessoais tratados em razão da relação contratual, salvo se necessário ao cumprimento do objeto do Contrato.

Caso haja necessidade de contratar Operador, o Controlador interessado informará previamente o outro Controlador, sendo responsável por todas as ações e omissões do terceiro.

### 5. Cooperação e Resposta a Incidentes

Sempre que solicitado, o outro Controlador auxiliará no atendimento das requisições de Titulares ou da ANPD em prazo máximo de **2 (dois) dias corridos**.

Na ocorrência de Incidente, os Controladores comunicarão um ao outro **imediatamente** ou — quando não possível — em prazo máximo de **1 (um) dia corrido** desde a ciência, contendo no mínimo:

- Data e hora do Incidente;
- Data e hora da ciência;
- Tipos de Dados Pessoais afetados;
- Titulares afetados;
- Medidas tomadas para reparar o dano e evitar novos Incidentes.

### 6. Responsabilidade

Os Controladores cumprirão suas respectivas obrigações nos limites impostos pela LGPD. Caso uma das Partes não garanta o Tratamento adequado, comprometendo segurança, confidencialidade e integridade, será responsável pelos seus atos e estará sujeita a multa não compensatória por descumprimento.

### 7. Término do Tratamento

Caso um Controlador continue a tratar os Dados Pessoais após o término da relação, será o único responsável por eventual incidente e pelo cumprimento dos direitos dos Titulares, sem envolver o outro Controlador.

### 8. Disposições Gerais

Este Anexo complementa o Contrato. Em caso de conflito, prevalecem os termos deste Anexo. As Partes admitem como válidas as assinaturas eletrônicas, nos termos da MP nº 2.200-2/2001.

---

**Local e data:** _________________, {{contrato.dataAtual}}.

**CONTRATANTE:** _____________________________

**CONTRATADO:** _____________________________

**Encarregado da CONTRATANTE:** {{dpo.nome}} · {{dpo.email}}
`,
};

// ============================================================
// 4. CLIENTE_OPERADOR — Quando a Empresa é o Operador (espelho)
// ============================================================

const T_CLIENTE_OPERADOR: ClauseTemplate = {
  type: "CLIENTE_OPERADOR",
  defaultTitle: "Aditamento de Tratamento de Dados Pessoais — Operador (Cliente) × Controlador",
  blurb:
    "Use quando a sua empresa atua como OPERADORA do terceiro (recebe instruções dele). Espelho da cláusula Controlador × Operador.",
  content: `# ADITAMENTO DE TRATAMENTO DE DADOS PESSOAIS

**Cláusula Operador (CLIENTE) × Controlador — Compartilhamento de Dados Pessoais**

> *Este documento se aplica nas situações em que a CONTRATADA atua como Operadora de Dados Pessoais, recebendo orientações da CONTRATANTE.*

O presente Aditamento é celebrado por:

**{{contratante.razaoSocial}}**, CNPJ **{{contratante.cnpj}}**, endereço {{contratante.endereco}} ("**CONTRATANTE**"); e

**{{contratado.razaoSocial}}**, CNPJ **{{contratado.cnpj}}**, endereço {{contratado.endereco}} ("**CONTRATADA**").

## ANEXO DE PROTEÇÃO DE DADOS PESSOAIS

### 1. Tratamento dos Dados Pessoais

A CONTRATADA tratará os Dados Pessoais somente para executar suas obrigações contratuais ou outras definidas pela CONTRATANTE por escrito. A CONTRATADA não coletará, usará, acessará, manterá, modificará, divulgará, transferirá ou tratará Dados Pessoais sem ciência e autorização da CONTRATANTE.

A CONTRATANTE garante que os Dados Pessoais foram e serão tratados de forma lícita, com base legal apropriada nos termos da LGPD.

### 2. Compartilhamento

A CONTRATADA assegurará que os Dados Pessoais só sejam acessados, compartilhados ou transferidos para terceiros (incluindo subcontratados) que ofereçam, por escrito, a mesma proteção estabelecida neste Aditamento.

### 3. Programa de Proteção de Dados Pessoais

A CONTRATADA mantém programa de proteção de Dados Pessoais eficaz, em conformidade com o art. 50 e seguintes da LGPD.

### 4. Medidas e Controles de Segurança

A CONTRATADA declara possuir medidas técnicas e organizacionais aptas a proteger os Dados Pessoais. A CONTRATADA compromete-se a:

- Restringir acesso aos Dados Pessoais a pessoas habilitadas, sob dever de confidencialidade;
- Garantir integridade das informações compartilhadas, sem retificar, apagar ou restringir o Tratamento por iniciativa própria;
- Adotar autenticação dupla, anonimização, pseudonimização e encriptação;
- Implementar recursos de restauração rápida em caso de Incidente;
- Atender solicitações da CONTRATANTE.

### 5. Evidências

A CONTRATADA disponibilizará, quando solicitado e em prazo razoável, toda documentação necessária para demonstrar cumprimento das obrigações.

### 6. Atualização

A CONTRATADA assegurará que os Dados Pessoais permaneçam atualizados, corrigindo ou excluindo informações desatualizadas conforme orientação da CONTRATANTE.

### 7. Transferência Internacional

Caso seja necessária a transferência internacional para o cumprimento do Contrato, a CONTRATADA adotará as medidas de segurança da LGPD e seguirá orientações da ANPD.

### 8. Direitos dos Titulares

A CONTRATANTE será responsável pelo atendimento das solicitações dos Titulares. A CONTRATADA auxiliará — em prazo razoável, na metade do prazo legal — providenciando: confirmação do Tratamento, acesso, correção, anonimização, bloqueio ou eliminação, portabilidade, informações sobre compartilhamento, consequências da revogação do consentimento, e fatores que levaram a decisão automatizada.

### 9. Resposta a Incidentes

Na ocorrência de Incidente, a CONTRATADA comunicará a CONTRATANTE em prazo razoável (no máximo metade do prazo legal para comunicação à ANPD ou aos Titulares), contendo:

- Data e hora do Incidente;
- Tipos de Dados Pessoais afetados;
- Volumetria;
- Dados de contato do Encarregado;
- Possíveis consequências.

### 10. Devolução ou Destruição

A CONTRATADA, sob instruções da CONTRATANTE ou ao término do Contrato, devolverá ou excluirá em definitivo os Dados Pessoais. Em caso de dificuldade de exclusão imediata em backups, a CONTRATADA garante que os dados serão colocados imediatamente fora de uso e excluídos no próximo ciclo de eliminação.

### 11. Cumprimento de Obrigação Legal

Caso a CONTRATADA receba ordem judicial ou comunicação oficial determinando divulgação de Dados Pessoais, notificará a CONTRATANTE para adoção, em tempo hábil, de medidas legais.

---

**Local e data:** _________________, {{contrato.dataAtual}}.

**CONTRATANTE:** _____________________________

**CONTRATADA:** _____________________________

**Encarregado(a) da CONTRATADA:** {{dpo.nome}} · {{dpo.email}}
`,
};

// ============================================================
// 5. MINUTA — Cláusula curta padrão
// ============================================================

const T_MINUTA: ClauseTemplate = {
  type: "MINUTA",
  defaultTitle: "Minuta de Cláusula Padrão — Proteção de Dados Pessoais",
  blurb:
    "Cláusula curta para inclusão em contratos quando o tratamento é mínimo ou indireto. Inclui apenas obrigações essenciais.",
  content: `# CLÁUSULA DE PROTEÇÃO DE DADOS PESSOAIS

**Inclusão sugerida em contrato celebrado entre {{contratante.razaoSocial}} (CONTRATANTE) e {{contratado.razaoSocial}} (CONTRATADO):**

## CLÁUSULA — Proteção de Dados Pessoais e Confidencialidade

1. **Conformidade com a LGPD.** As Partes comprometem-se a tratar quaisquer Dados Pessoais (conforme definido na Lei nº 13.709/2018 — LGPD) coletados, recebidos ou compartilhados em razão deste Contrato em estrita observância à LGPD e às demais legislações aplicáveis.

2. **Finalidade limitada.** Os Dados Pessoais tratados pelas Partes serão utilizados somente para os fins previstos neste Contrato. Nenhuma das Partes poderá tratar os Dados Pessoais para finalidades diversas sem autorização expressa da outra.

3. **Confidencialidade.** As Partes obrigam-se a manter os Dados Pessoais em estrita confidencialidade, restringindo o acesso a colaboradores e subcontratados que tenham necessidade legítima e que estejam sujeitos a dever de confidencialidade.

4. **Medidas de segurança.** As Partes adotarão medidas técnicas e administrativas razoáveis para proteger os Dados Pessoais contra acessos não autorizados, perda, alteração ou divulgação indevida.

5. **Notificação de incidentes.** Na ocorrência de qualquer incidente envolvendo os Dados Pessoais, a Parte ciente notificará a outra **imediatamente**, fornecendo as informações disponíveis para que sejam adotadas as medidas cabíveis.

6. **Direitos dos titulares.** As Partes cooperarão para o atendimento dos direitos dos titulares previstos na LGPD (acesso, correção, eliminação, portabilidade, etc.).

7. **Término.** Encerrada a relação contratual, os Dados Pessoais serão devolvidos ou eliminados, conforme instrução da Parte de origem, ressalvadas as hipóteses de manutenção por obrigação legal ou regulatória.

---

**Local e data:** _________________, {{contrato.dataAtual}}.

**CONTRATANTE:** _____________________________

**CONTRATADO:** _____________________________
`,
};

// ============================================================
// Catálogo
// ============================================================

export const CLAUSE_TEMPLATES: ReadonlyArray<ClauseTemplate> = [
  T_ROBUSTA,
  T_SIMPLES,
  T_CC,
  T_CLIENTE_OPERADOR,
  T_MINUTA,
];

const TEMPLATES_BY_TYPE = new Map<RecommendedClause, ClauseTemplate>(
  CLAUSE_TEMPLATES.map((t) => [t.type, t])
);

export function getClauseTemplate(
  type: RecommendedClause
): ClauseTemplate | null {
  return TEMPLATES_BY_TYPE.get(type) ?? null;
}
