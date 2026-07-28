// =============================================================================
// Kit de Minutas LGPD (Vol. 1 e 2) — versões COMENTADAS, de autoria do
// facilitador (série "Programa de Governança em Privacidade")
// =============================================================================
// Transcrição NA ÍNTEGRA dos PDFs oficiais (Anexo_1/Anexo_2 — Kit de Minutas),
// incluindo as caixas "Nota de redação" (marcadas com 📝) e os campos
// [ENTRE COLCHETES]. Exibidas no mini app /modelos como bloco
// "📝 Versão comentada" dos modelos do Pacote que têm par no Kit.
// Chave do mapa = NÚMERO do modelo no Pacote de Modelos.
//
// Pares: Minuta 1→Modelo 02 (Portaria) · 2→07 (Política) · 3→05 (Aviso) ·
// 6→10 (Consentimento) · 8→06 (PRI) · 9→16 (Riscos) · 10→08 (Operadores).
// Fora (sem par no Pacote): Minuta 4 (Cookies), 5 (Termos de Uso), 7 (PSI).

export type MinutaKit = {
  origem: string; // ex.: "Kit de Minutas — Vol. 1 · Minuta 3"
  titulo: string;
  natureza: string; // a linha de natureza/destinatário da minuta
  md: string; // markdown simples: ##, **, - lista, 📝 notas
};

export const MINUTAS_KIT: Record<number, MinutaKit> = {
  // ───────────────────────────────────────────────────────────────────────────
  // Modelo 02 — Portaria do Comitê ← MINUTA 1 (Portaria de Regulamentação)
  // ───────────────────────────────────────────────────────────────────────────
  2: {
    origem: "Kit de Minutas — Vol. 1 · Minuta 1",
    titulo: "Portaria de Regulamentação da LGPD",
    natureza: "Ato instituinte do Programa de Governança em Privacidade — voltado ao público interno",
    md: `📝 **Nota de redação:** A Portaria cria a estrutura mínima e atribui responsabilidades. É breve e dispositiva. Não descreve tratamentos de dados ao cidadão — isso é função do Aviso de Privacidade.

[BRASÃO / IDENTIFICAÇÃO DO ÓRGÃO]
[NOME DO ÓRGÃO OU ENTIDADE PÚBLICA]
**PORTARIA Nº [NÚMERO], DE [DIA] DE [MÊS] DE [ANO].**

_Institui o Programa de Governança em Privacidade e Proteção de Dados Pessoais no âmbito de [NOME DO ÓRGÃO], cria o Comitê Gestor de Proteção de Dados, designa o Encarregado pelo Tratamento de Dados Pessoais e dá outras providências._

O(A) [CARGO DA AUTORIDADE MÁXIMA] de [NOME DO ÓRGÃO], no uso das atribuições que lhe confere [INDICAR NORMA DE COMPETÊNCIA — lei, regimento ou estatuto], e tendo em vista o disposto na Lei nº 13.709, de 14 de agosto de 2018 (Lei Geral de Proteção de Dados Pessoais — LGPD) e na Resolução CD/ANPD nº 20, de 2024,
CONSIDERANDO o dever do Poder Público de tratar dados pessoais com observância dos princípios e bases legais da LGPD;
CONSIDERANDO a necessidade de instituir governança em privacidade, com responsabilidades definidas e prestação de contas (arts. 50 e 23 da LGPD);
CONSIDERANDO a obrigação de indicar Encarregado pelo Tratamento de Dados Pessoais (art. 41 da LGPD);
**RESOLVE:**

## Capítulo I — Do objeto e das definições
**Art. 1º** Fica instituído o Programa de Governança em Privacidade e Proteção de Dados Pessoais (PGP) no âmbito de [NOME DO ÓRGÃO], com o objetivo de assegurar a conformidade do tratamento de dados pessoais à LGPD e a tutela dos direitos dos titulares.
**Art. 2º** Para os fins desta Portaria, aplicam-se as definições do art. 5º da LGPD, em especial as de dado pessoal, dado pessoal sensível, titular, controlador, operador, tratamento e Encarregado.

## Capítulo II — Do Comitê Gestor de Proteção de Dados
**Art. 3º** Fica criado o Comitê Gestor de Proteção de Dados, de caráter [deliberativo/consultivo], composto por representantes das seguintes unidades:
- I – [UNIDADE / ÁREA — ex.: Gabinete], que o coordenará;
- II – [UNIDADE DE TECNOLOGIA DA INFORMAÇÃO];
- III – [UNIDADE JURÍDICA];
- IV – [UNIDADE DE GESTÃO DE PESSOAS];
- V – [OUTRAS UNIDADES PERTINENTES].
Parágrafo único. Os membros serão designados em ato próprio, com indicação de titulares e suplentes.
**Art. 4º** Compete ao Comitê Gestor:
- I – propor diretrizes e a Política Interna de Privacidade da instituição;
- II – aprovar o plano de adequação e acompanhar sua execução;
- III – deliberar sobre o inventário de dados (ROPA) e os Relatórios de Impacto à Proteção de Dados (RIPD);
- IV – supervisionar a resposta a incidentes de segurança, observado o art. 48 da LGPD;
- V – promover a cultura de proteção de dados e a capacitação.

## Capítulo III — Do Encarregado (DPO)
**Art. 5º** Fica designado(a) como Encarregado(a) pelo Tratamento de Dados Pessoais o(a) servidor(a) [NOME], matrícula [Nº], lotado(a) em [UNIDADE], e, como suplente, [NOME], matrícula [Nº].
**Art. 6º** São atribuições do Encarregado, nos termos do art. 41, §2º, da LGPD e da Resolução CD/ANPD nº 18, de 2024:
- I – aceitar reclamações e comunicações dos titulares, prestar esclarecimentos e adotar providências;
- II – receber comunicações da Autoridade Nacional de Proteção de Dados (ANPD) e adotar providências;
- III – orientar servidores e contratados sobre práticas de proteção de dados;
- IV – executar as demais atribuições determinadas pelo controlador ou em normas complementares.
Parágrafo único. A identidade e as informações de contato do Encarregado serão divulgadas publicamente, de forma clara e objetiva, no sítio eletrônico da instituição, por meio do Aviso de Privacidade.

## Capítulo IV — Dos instrumentos, prazos e responsabilidades
**Art. 7º** Integram o PGP, entre outros, os seguintes instrumentos, a serem elaborados e mantidos atualizados:
- I – a Política Interna de Privacidade e Proteção de Dados Pessoais;
- II – o Aviso de Privacidade, voltado aos titulares, em linguagem clara e acessível;
- III – o inventário de dados pessoais e o registro das operações de tratamento (ROPA);
- IV – a Política de Segurança da Informação e o Plano de Resposta a Incidentes;
- V – a metodologia de gestão de riscos e os Relatórios de Impacto (RIPD);
- VI – a política de contratação e gestão de operadores.
**Art. 8º** As entregas observarão o seguinte cronograma, a contar da publicação desta Portaria:
- I – inventário de dados e ROPA: até [Nº] dias;
- II – Política Interna e Aviso de Privacidade: até [Nº] dias;
- III – Plano de Resposta a Incidentes: até [Nº] dias.
**Art. 9º** As unidades administrativas são responsáveis por mapear seus tratamentos, apoiar o Encarregado e cumprir as diretrizes do PGP, sob coordenação do Comitê Gestor.
**Art. 10.** A instituição promoverá capacitação periódica de servidores e colaboradores em proteção de dados pessoais.

## Capítulo V — Das disposições finais
**Art. 11.** Os casos omissos serão resolvidos pelo Comitê Gestor, ouvido o Encarregado.
**Art. 12.** Esta Portaria entra em vigor na data de sua publicação.

[LOCAL], [DIA] DE [MÊS] DE [ANO].
__________________________________________
[NOME DA AUTORIDADE MÁXIMA]
[CARGO]`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Modelo 07 — Política do PGP ← MINUTA 2 (Política Interna de Privacidade)
  // ───────────────────────────────────────────────────────────────────────────
  7: {
    origem: "Kit de Minutas — Vol. 1 · Minuta 2",
    titulo: "Política Interna de Privacidade e Proteção de Dados Pessoais",
    natureza: "Ato normativo estruturante — voltado ao público interno (servidores, colaboradores e terceiros)",
    md: `📝 **Nota de redação:** Documento de uso interno. Estabelece princípios, regras e deveres para quem trata dados em nome da instituição. NÃO é o documento que informa o cidadão — sempre que precisar comunicar finalidades e práticas ao titular, remeta ao Aviso de Privacidade.

[NOME DO ÓRGÃO OU ENTIDADE PÚBLICA]
**POLÍTICA INTERNA DE PRIVACIDADE E PROTEÇÃO DE DADOS PESSOAIS**
Aprovada por [INSTÂNCIA COMPETENTE] em [DATA] · Versão [Nº]

## Capítulo I — Disposições gerais
**Art. 1º** Esta Política estabelece princípios, diretrizes e regras para o tratamento de dados pessoais por [NOME DO ÓRGÃO], em conformidade com a LGPD e com as Resoluções da ANPD aplicáveis.
**Art. 2º** Esta Política aplica-se a todos os membros, servidores, estagiários, colaboradores e terceiros que tratem dados pessoais em nome da instituição.
**Art. 3º** Aplicam-se as definições do art. 5º da LGPD.

## Capítulo II — Dos princípios
**Art. 4º** O tratamento de dados pessoais observará os princípios do art. 6º da LGPD, em especial:
- I – finalidade, adequação e necessidade (minimização);
- II – livre acesso e qualidade dos dados;
- III – transparência;
- IV – segurança e prevenção;
- V – não discriminação;
- VI – responsabilização e prestação de contas.

## Capítulo III — Do tratamento de dados pessoais
**Art. 5º** Todo tratamento deve apoiar-se em uma das bases legais dos arts. 7º ou 11 da LGPD, com finalidade específica, legítima e informada ao titular.
**Art. 6º** No setor público, o tratamento dará preferência às bases de cumprimento de obrigação legal, execução de políticas públicas e exercício regular de competências, sendo o consentimento reservado às hipóteses cabíveis.
**Art. 7º** Os tratamentos serão registrados em inventário e ROPA atualizados, e os de alto risco serão precedidos de Relatório de Impacto à Proteção de Dados (RIPD), nos termos do art. 38 da LGPD.

📝 **Nota de redação:** Mantenha a coerência: as finalidades e bases legais aqui declaradas como princípio devem corresponder exatamente às descritas, em linguagem simples, no Aviso de Privacidade, e às registradas no ROPA.

## Capítulo IV — Dos direitos dos titulares
**Art. 8º** A instituição assegura ao titular o exercício dos direitos previstos no art. 18 da LGPD, entre eles confirmação, acesso, correção, anonimização, portabilidade, eliminação e informação sobre compartilhamentos.
**Art. 9º** Os pedidos serão recebidos pelo canal do Encarregado e respondidos nos prazos legais, observados os procedimentos divulgados no Aviso de Privacidade.

## Capítulo V — Da segurança e da resposta a incidentes
**Art. 10.** As medidas de segurança técnicas e administrativas observarão o art. 46 da LGPD e a Política de Segurança da Informação da instituição.
**Art. 11.** Os incidentes de segurança serão tratados conforme o Plano de Resposta a Incidentes, observada a comunicação à ANPD e aos titulares em até 3 (três) dias úteis, nos termos do art. 48 da LGPD e da Resolução CD/ANPD nº 15, de 2024.

## Capítulo VI — Dos operadores e terceiros
**Art. 12.** A contratação de operadores observará a política específica, exigindo cláusulas de proteção de dados, segurança, sigilo, atendimento a titulares e notificação de incidentes (arts. 39, 42 e 44 da LGPD).

## Capítulo VII — Das responsabilidades
**Art. 13.** Compete ao Comitê Gestor zelar pela aplicação desta Política; ao Encarregado, orientar e fiscalizar; aos gestores de unidade, garantir o cumprimento; e a todos os agentes, observar as regras no exercício de suas funções.

## Capítulo VIII — Da capacitação
**Art. 14.** A instituição promoverá capacitação contínua, sendo dever dos agentes participar das ações de formação em proteção de dados.

## Capítulo IX — Das penalidades
**Art. 15.** O descumprimento desta Política sujeita o agente às sanções administrativas cabíveis, observados o contraditório e a ampla defesa, sem prejuízo das responsabilidades civil e penal.

## Capítulo X — Disposições finais
**Art. 16.** Esta Política será revisada periodicamente, ao menos a cada [Nº] meses, ou sempre que houver alteração normativa relevante.
**Art. 17.** Esta Política entra em vigor na data de sua publicação.`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Modelo 05 — Aviso de Privacidade ← MINUTA 3
  // ───────────────────────────────────────────────────────────────────────────
  5: {
    origem: "Kit de Minutas — Vol. 1 · Minuta 3",
    titulo: "Aviso de Privacidade",
    natureza: "Instrumento de transparência ativa — voltado ao cidadão (titular de dados)",
    md: `📝 **Nota de redação:** Diferentemente das duas anteriores, este texto fala com o cidadão. Use linguagem simples, em segunda pessoa ("você"), evitando jargão jurídico. Publique-o em link permanente no rodapé do portal. Regra de ouro contra privacy washing: só afirme aqui o que a instituição consegue comprovar com documento, log ou auditoria.

**AVISO DE PRIVACIDADE — [NOME DO ÓRGÃO]**
Última atualização: [DATA] · Versão [Nº]

## EM RESUMO (leia primeiro)
- Somos o [NOME DO ÓRGÃO] e tratamos seus dados pessoais para prestar nossos serviços públicos.
- Você tem direito de acessar, corrigir e saber com quem compartilhamos seus dados.
- Dúvidas ou pedidos? Fale com nosso Encarregado: [E-MAIL DO ENCARREGADO].
Abaixo, explicamos tudo em detalhe, em linguagem simples.

## 1. Quem somos
O controlador dos seus dados é o [NOME DO ÓRGÃO], inscrito no CNPJ [Nº], com sede em [ENDEREÇO]. Somos responsáveis por decidir como e por que seus dados pessoais são tratados quando você usa nossos serviços.

## 2. O que é este Aviso
Este Aviso explica, de forma transparente, quais dados pessoais coletamos, por que os usamos, com quem os compartilhamos, por quanto tempo os guardamos e quais são os seus direitos — conforme exige o art. 9º da LGPD.

## 3. Quais dados coletamos
A depender do serviço utilizado, podemos tratar:
- **Dados de identificação:** [ex.: nome, CPF, data de nascimento];
- **Dados de contato:** [ex.: e-mail, telefone, endereço];
- **Dados do atendimento/serviço:** [ex.: número de protocolo, histórico de solicitações];
- **Dados de navegação:** [ex.: cookies e registros de acesso — ver seção 10].

📝 **Nota de redação:** Liste apenas os dados que a instituição realmente coleta, conforme o inventário/ROPA. Se tratar dados sensíveis (art. 11) — como saúde —, informe-os de forma destacada e indique a base legal específica.

## 4. Para que usamos seus dados
Usamos seus dados apenas para finalidades específicas e legítimas, como [ex.: processar sua solicitação, prestar o serviço público requerido, cumprir obrigações legais e comunicar o andamento do seu pedido]. Não usamos seus dados para finalidades incompatíveis com essas.

## 5. Com qual base legal
Tratamos seus dados com fundamento nas hipóteses da LGPD aplicáveis ao Poder Público, especialmente [ex.: cumprimento de obrigação legal (art. 7º, II), execução de políticas públicas (art. 7º, III) e exercício regular de competências (art. 23)]. Quando a base for o consentimento, você poderá retirá-lo a qualquer momento.

## 6. Com quem compartilhamos
Podemos compartilhar seus dados, quando necessário e nos limites da lei, com [ex.: outros órgãos públicos, no exercício de suas competências] e com operadores contratados que tratam dados em nosso nome (como serviços de tecnologia e hospedagem), sempre sob contrato e instruções de proteção de dados. **Não vendemos seus dados pessoais.**

📝 **Nota de redação:** Só afirme "não compartilhamos com terceiros" se isso for verdadeiro. Havendo operadores, descreva as categorias de compartilhamento (art. 9º, V) — omitir os operadores é um sinal clássico de privacy washing.

## 7. Transferência internacional
[Se aplicável:] Alguns dados podem ser tratados em servidores localizados fora do Brasil por nossos operadores, sempre com garantias adequadas, nos termos dos arts. 33 a 36 da LGPD. [Se não aplicável, informe que não há transferência internacional.]

## 8. Por quanto tempo guardamos
Guardamos seus dados pelo tempo necessário para cumprir as finalidades informadas e as obrigações legais de guarda [ex.: prazos da tabela de temporalidade documental]. Encerrado esse período, os dados são eliminados ou anonimizados com segurança.

## 9. Como protegemos seus dados
Adotamos medidas de segurança técnicas e administrativas para proteger seus dados contra acessos não autorizados e situações de perda ou alteração, conforme nossa Política de Segurança da Informação. Em caso de incidente que possa gerar risco relevante, comunicamos a ANPD e os titulares afetados nos prazos legais.

📝 **Nota de redação:** Evite promessas absolutas como "100% seguro" ou "proteção total". Descreva o que de fato existe e é auditável.

## 10. Cookies
Nosso portal utiliza cookies e tecnologias semelhantes. Você pode gerenciar suas preferências a qualquer momento no painel de cookies. Para detalhes, consulte nossa [Política de Cookies — INSERIR LINK].

## 11. Decisões automatizadas
[Se aplicável:] Alguns processos podem envolver decisões automatizadas. Você tem direito a solicitar a revisão dessas decisões, nos termos do art. 20 da LGPD. [Se não houver, informe que não realizamos decisões automatizadas que afetem o titular.]

## 12. Seus direitos
A LGPD garante a você, entre outros, o direito de:
- confirmar se tratamos seus dados e acessá-los;
- corrigir dados incompletos, inexatos ou desatualizados;
- solicitar anonimização, bloqueio ou eliminação, quando cabível;
- obter informação sobre com quem compartilhamos seus dados;
- revogar o consentimento, quando essa for a base do tratamento.

## 13. Como exercer seus direitos
Para exercer qualquer desses direitos, fale com nosso Encarregado pelos canais abaixo. Responderemos no prazo previsto em lei.
**FALE COM O ENCARREGADO (DPO)**
- Nome: [NOME DO ENCARREGADO]
- E-mail: [E-MAIL]
- Telefone: [TELEFONE]
- Endereço: [ENDEREÇO PARA ATENDIMENTO]

## 14. Atualizações deste Aviso
Podemos atualizar este Aviso para refletir mudanças em nossos serviços ou na legislação. A data da última atualização e a versão constam no topo. Recomendamos a consulta periódica.`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Modelo 10 — Termo de Consentimento ← MINUTA 6
  // ───────────────────────────────────────────────────────────────────────────
  10: {
    origem: "Kit de Minutas — Vol. 2 · Minuta 6",
    titulo: "Termo de Consentimento",
    natureza: "Instrumento externo específico — usado apenas quando a base legal é o consentimento (um por finalidade)",
    md: `📝 **Nota de redação:** Use somente quando o consentimento for a base legal adequada — no setor público é exceção. Deve ser granular (um Termo por finalidade), livre, informado e revogável. Consentimento genérico ou em bloco é vedado.

**TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS PESSOAIS**
Finalidade: [DESCREVER A FINALIDADE ESPECÍFICA]

**Controlador:** [NOME DO ÓRGÃO], CNPJ [Nº], com sede em [ENDEREÇO]. Contato do Encarregado: [E-MAIL].
**Finalidade do tratamento:** seus dados serão tratados exclusivamente para [DESCREVER A FINALIDADE], não sendo usados para finalidades incompatíveis.
**Dados tratados:** [LISTAR OS DADOS ESPECÍFICOS — ex.: nome, e-mail, telefone].
**Base legal:** consentimento do titular, nos termos do art. 7º, I [ou art. 11, I, se dado sensível] da LGPD.
**Prazo de tratamento:** os dados serão tratados por [PRAZO/EVENTO] e, depois, eliminados ou anonimizados.
**Compartilhamento:** [Se houver, indicar com quem e por quê; caso contrário, declarar que não há compartilhamento para esta finalidade.]
**Revogação e direitos:** você pode revogar este consentimento a qualquer momento pelo canal [INDICAR], sem afetar a licitude do tratamento anterior à revogação, e exercer os direitos do art. 18 da LGPD.
**Consequências de não consentir:** [DESCREVER o que ocorre caso o titular não consinta — ex.: impossibilidade de participar da ação específica, sem prejuízo do acesso aos serviços essenciais].

## DECLARAÇÃO DE ACEITE
▢ Li e concordo com o tratamento dos meus dados pessoais para a finalidade acima descrita.
Nome: [NOME DO TITULAR] · CPF: [Nº]
Data: [DATA] · Assinatura / registro eletrônico de aceite: [__________]`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Modelo 06 — Documento do PRI ← MINUTA 8 (Plano de Resposta a Incidentes)
  // ───────────────────────────────────────────────────────────────────────────
  6: {
    origem: "Kit de Minutas — Vol. 2 · Minuta 8",
    titulo: "Plano de Resposta a Incidentes de Segurança",
    natureza: "Documento operacional interno — define o passo a passo quando algo dá errado",
    md: `📝 **Nota de redação:** Documento procedimental (não normativo): assume que a PSI e a Política Interna existem. O prazo de comunicação à ANPD e aos titulares é de até 3 dias úteis e os registros devem ser guardados por, no mínimo, 5 anos (Resolução CD/ANPD nº 15/2024). Referência técnica: ABNT NBR ISO/IEC 27035.

[NOME DO ÓRGÃO] — **PLANO DE RESPOSTA A INCIDENTES DE SEGURANÇA**
Versão [Nº] · Aprovado em [DATA]

## 1. Objetivo
Estabelecer procedimento tempestivo, coordenado e auditável de resposta a incidentes de segurança que possam afetar informações e dados pessoais.

## 2. Definições e severidade
Considera-se incidente qualquer evento que comprometa a confidencialidade, integridade ou disponibilidade da informação. Os incidentes serão classificados em níveis de severidade [ex.: baixa, média, alta e crítica], conforme impacto e abrangência.

## 3. Equipe e papéis
A resposta é conduzida pela equipe de resposta a incidentes (CSIRT/[ÁREA]), com participação do Encarregado, do Comitê Gestor, da alta direção e da área de comunicação, com responsabilidades definidas para cada fase.

## 4. Fases da resposta
- **Preparação** — manter recursos, contatos e treinamentos prontos.
- **Identificação** — detectar, registrar e classificar o incidente.
- **Contenção** — limitar a propagação e o impacto.
- **Erradicação** — remover a causa e as vulnerabilidades exploradas.
- **Recuperação** — restabelecer os serviços com segurança.
- **Lições aprendidas** — registrar causas e melhorias.

## 5. Comunicação à ANPD e aos titulares
Quando o incidente puder acarretar risco ou dano relevante, a comunicação à ANPD e aos titulares afetados será feita em até 3 (três) dias úteis, contados do conhecimento de que o incidente afetou dados pessoais, com o conteúdo mínimo exigido. Os registros do incidente serão mantidos por, no mínimo, 5 (cinco) anos (art. 48 da LGPD; Resolução CD/ANPD nº 15/2024).

## 6. Registro, evidências e revisão
Todas as ações e evidências serão registradas com preservação da cadeia de custódia. O Plano será testado e revisado periodicamente, ao menos a cada [Nº] meses.`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Modelo 16 — Ficha de Risco P×I ← MINUTA 9 (Política de Gestão de Riscos)
  // ───────────────────────────────────────────────────────────────────────────
  16: {
    origem: "Kit de Minutas — Vol. 2 · Minuta 9",
    titulo: "Política de Gestão de Riscos de Segurança e Privacidade",
    natureza: "Ato normativo interno — a metodologia que sustenta decisões e o RIPD",
    md: `📝 **Nota de redação:** É o que permite operacionalizar o privacy by design declarado na Política Interna e subsidiar o Relatório de Impacto (RIPD, art. 38). Referências: ABNT NBR ISO 31000 e ISO/IEC 27005; em órgãos federais, normas do TCU e da CGU.

[NOME DO ÓRGÃO] — **POLÍTICA DE GESTÃO DE RISCOS DE SEGURANÇA E PRIVACIDADE**
Aprovada por [INSTÂNCIA] em [DATA] · Versão [Nº]

## Capítulo I — Objeto e escopo
**Art. 1º** Esta Política define a metodologia de gestão de riscos relacionados à segurança da informação e à proteção de dados pessoais de [NOME DO ÓRGÃO].

## Capítulo II — Metodologia
**Art. 2º** O processo de gestão de riscos compreende as etapas de identificação, análise, avaliação, tratamento, monitoramento e comunicação.
**Art. 3º** A avaliação utilizará matriz de probabilidade × impacto, com escala de severidade [ex.: baixo, médio, alto, crítico] e definição do apetite ao risco da instituição.

## Capítulo III — Tratamento e integração
**Art. 4º** O tratamento poderá mitigar, transferir, evitar ou aceitar o risco, de forma justificada e documentada.
**Art. 5º** Os resultados subsidiarão os Relatórios de Impacto à Proteção de Dados (RIPD) e a priorização de ações do Programa, integrando-se à matriz corporativa de riscos.

## Capítulo IV — Responsabilidades e revisão
**Art. 6º** As responsabilidades de cada instância serão definidas em normas complementares, sob coordenação de [ÁREA]. Esta Política observa as referências ABNT NBR ISO 31000 e ISO/IEC 27005 e será revisada a cada [Nº] meses.`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Modelo 08 — Cláusulas LGPD ← MINUTA 10 (Política de Operadores)
  // ───────────────────────────────────────────────────────────────────────────
  8: {
    origem: "Kit de Minutas — Vol. 2 · Minuta 10",
    titulo: "Política de Contratação e Gestão de Operadores",
    natureza: "Ato normativo interno que estende a governança a quem trata dados em nome da instituição",
    md: `📝 **Nota de redação:** Fecha o perímetro de responsabilidade. As categorias de compartilhamento com operadores devem aparecer também no Aviso de Privacidade (art. 9º, V). Base: arts. 5º, VII; 39; 42 e 44 da LGPD.

[NOME DO ÓRGÃO] — **POLÍTICA DE CONTRATAÇÃO E GESTÃO DE OPERADORES**
Aprovada por [INSTÂNCIA] em [DATA] · Versão [Nº]

## Capítulo I — Objeto e escopo
**Art. 1º** Esta Política disciplina a contratação e a gestão de operadores — terceiros que tratam dados pessoais em nome de [NOME DO ÓRGÃO] (art. 5º, VII da LGPD).

## Capítulo II — Avaliação prévia (due diligence)
**Art. 2º** Antes da contratação, o operador será avaliado quanto à maturidade em segurança e proteção de dados, mediante [questionário/régua de avaliação], proporcionalmente ao risco do tratamento.

## Capítulo III — Cláusulas obrigatórias
**Art. 3º** Os contratos conterão, no mínimo, cláusulas que obriguem o operador a:
- I – tratar os dados somente conforme instruções documentadas do controlador;
- II – adotar medidas de segurança compatíveis com o art. 46 da LGPD;
- III – manter sigilo e capacitar seus colaboradores;
- IV – contratar suboperadores apenas com autorização prévia;
- V – apoiar o atendimento aos titulares e às requisições da ANPD;
- VI – notificar incidentes ao controlador em [PRAZO] horas;
- VII – devolver ou eliminar os dados ao término do contrato.

## Capítulo IV — Contratos anteriores, monitoramento e saída
**Art. 4º** Os contratos firmados antes da vigência da LGPD serão adequados por termo aditivo.
**Art. 5º** Os operadores serão monitorados de forma contínua (auditorias, relatórios e evidências), e cada relação preverá plano de saída e portabilidade dos dados.
**Art. 6º** As responsabilidades de gestão serão definidas em normas complementares. Esta Política será revisada a cada [Nº] meses e entra em vigor na data de sua publicação.`,
  },
};
