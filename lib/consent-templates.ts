/**
 * Catálogo dos 5 templates institucionais de Termo de Consentimento
 * (Checkpoint Consentimento, 2026-05-10).
 *
 * Estilo aprovado: B — Linguagem acessível (não-juridiquês), mas com
 * todos os 8 blocos exigidos pelo Art. 8º LGPD. Mantém robustez sem
 * intimidar o cidadão na hora de aceitar.
 *
 * Placeholders suportados (substituídos por `consent-builder.ts`):
 *   {{empresa}}         — Company.companyName ou tradeName
 *   {{cnpj}}            — Company.cnpj formatado
 *   {{dpoNome}}         — Company.dpoName
 *   {{dpoEmail}}        — Company.dpoEmail
 *   {{dpoTelefone}}     — Company.dpoPhone (opcional)
 *   {{servico}}         — DataInventory.serviceName (1º vinculado)
 *   {{finalidade}}      — DataInventory.purpose (1º vinculado)
 *   {{dados_coletados}} — derivado de DataInventory.personalData
 *   {{retencao}}        — DataInventory.retention
 *   {{compartilhamento}}— DataInventory.sharing
 *
 * Quando o termo não tem processo vinculado ainda, placeholders relativos
 * a Inventory ficam genéricos ("o serviço" / "esta atividade"). O DPO
 * pode editar o markdown livremente depois — `currentContent` é editável.
 */

export type ConsentTemplateType =
  | "GERAL"
  | "SENSIVEIS"
  | "MENOR"
  | "IMAGEM_VOZ"
  | "COMUNICACAO";

export interface ConsentTemplateDef {
  id: ConsentTemplateType;
  /** Nome curto pro card de seleção. */
  label: string;
  /** Frase abaixo do label no picker (1 linha). */
  blurb: string;
  /** Base legal de referência (mostra na UI). */
  legalRef: string;
  /** Markdown completo do termo (com placeholders). */
  content: string;
}

const TPL_GERAL_CONTENT = `# Autorização para usar seus dados — {{servico}}

> **Antes de você marcar "Aceito", leia com calma.** Este documento
> explica o que vamos fazer com os dados que você está nos fornecendo.
> Só consideramos válido o cadastro se você confirmar abaixo.

## Quem somos

A organização **{{empresa}}** é responsável pelos seus dados (o que a
LGPD chama de "controlador"). Nosso CNPJ é {{cnpj}}.

## Quem você procura se tiver dúvidas

Nosso Encarregado de Proteção de Dados é **{{dpoNome}}**. Contato:
{{dpoEmail}}. Ele responde dúvidas e processa pedidos de exclusão,
acesso, correção, etc.

## Pra que vamos usar seus dados

{{finalidade}}

## Que dados estamos coletando

{{dados_coletados}}

## Com quem compartilhamos

{{compartilhamento}}

## Por quanto tempo guardamos

{{retencao}}

## Seus direitos (você pode pedir a qualquer momento)

- Saber **se** estamos tratando seus dados
- **Ver** os dados que temos sobre você
- **Corrigir** o que estiver errado ou desatualizado
- **Apagar** seus dados quando quiser
- Levar seus dados pra **outra empresa** se quiser (portabilidade)
- Saber **com quem** compartilhamos
- **Cancelar** este consentimento e parar tudo

Pra exercer qualquer um, mande e-mail pro Encarregado lá em cima. Sem
custo, sem precisar justificar.

## Como você cancela depois

- Mande um e-mail pro Encarregado pedindo
- Ou venha pessoalmente na nossa Ouvidoria/Atendimento

Em até 30 dias seus dados são apagados.

---

☐ **Eu li, entendi e autorizo** a {{empresa}} a usar meus dados nas
condições acima.

_(Base legal: Art. 7º, I e Art. 8º da Lei nº 13.709/2018 — LGPD.)_
`;

const TPL_SENSIVEIS_CONTENT = `# Autorização para tratar dados sensíveis — {{servico}}

> ⚠ **Atenção:** este termo trata de **dados sensíveis** (saúde,
> biometria, origem racial, religião, opinião política, dados
> genéticos, orientação sexual, filiação sindical). A LGPD exige
> consentimento **específico e em destaque** pra esse tipo de dado
> (Art. 11, I). Leia com calma.

## Quem somos

A organização **{{empresa}}** (CNPJ {{cnpj}}) é responsável pelos seus
dados (controlador).

## Encarregado de Proteção de Dados

**{{dpoNome}}** · {{dpoEmail}}

## Pra que vamos usar esses dados sensíveis

{{finalidade}}

Os dados sensíveis são **estritamente necessários** pra essa
finalidade — não usamos pra mais nada (princípio da minimização do
Art. 6º, III da LGPD).

## Quais dados sensíveis estamos coletando

{{dados_coletados}}

## Com quem compartilhamos

{{compartilhamento}}

## Por quanto tempo guardamos

{{retencao}}

Após o prazo (ou se você revogar), os dados sensíveis são
**eliminados de forma segura**.

## Seus direitos

Você pode, a qualquer momento, pedir:

- Confirmar que estamos tratando
- Ver/baixar uma cópia dos dados
- Corrigir o que estiver errado
- **Eliminar tudo** (revogação total)
- Saber com quem compartilhamos
- Levar pra outra organização

Mande e-mail pro Encarregado: {{dpoEmail}}. Sem custo.

## Cuidados especiais com dado sensível

- Você **não é obrigado** a fornecer esses dados — pode recusar e
  procuramos outra forma de atender você quando possível.
- Se a finalidade do tratamento mudar, **vamos te avisar e pedir
  novo consentimento**.
- A revogação é **imediata** — em até 30 dias seus dados sensíveis
  são apagados.

---

☐ **Eu li, entendi e autorizo, de forma específica e em destaque,**
a {{empresa}} a tratar meus dados pessoais sensíveis nas condições
acima.

_(Base legal: Art. 11, I e Art. 8º da Lei nº 13.709/2018 — LGPD.
Consentimento "específico e em destaque" conforme exigência do Art. 11.)_
`;

const TPL_MENOR_CONTENT = `# Autorização para uso de dados de criança ou adolescente — {{servico}}

> Este termo é assinado pelos **pais ou responsável legal** pelo menor,
> conforme exige o Art. 14 da Lei nº 13.709/2018 (LGPD).

## Identificação

**Nome da criança/adolescente:** _________________________
**Data de nascimento:** ___/___/______
**Nome do responsável legal:** _________________________
**Grau de parentesco:** ☐ Mãe ☐ Pai ☐ Outro: _______
**CPF do responsável:** _________________________

## Quem somos

**{{empresa}}** (CNPJ {{cnpj}}) é responsável pelos dados.
Encarregado: **{{dpoNome}}** · {{dpoEmail}}.

## Pra que vamos usar os dados da criança/adolescente

{{finalidade}}

Os dados serão usados **no melhor interesse** da criança ou
adolescente, conforme Art. 14 §1º da LGPD.

## Quais dados vamos coletar

{{dados_coletados}}

## Com quem compartilhamos

{{compartilhamento}}

## Por quanto tempo guardamos

{{retencao}}

## Seus direitos como responsável (Art. 18 LGPD)

A qualquer momento você pode pedir:

- Confirmar o tratamento
- Ver os dados que temos
- Corrigir o que estiver errado
- **Apagar tudo**
- Levar os dados pra outra organização
- Cancelar este consentimento

Basta mandar e-mail pro Encarregado: {{dpoEmail}}. Em até 30 dias
os dados são apagados.

## Importante

- A criança/adolescente **tem direito** a receber informações claras
  sobre como seus dados são usados, em linguagem que ela compreenda
  (Art. 14 §6º).
- Se o adolescente tiver entre 12 e 17 anos, é boa prática que ele
  também leia e co-assine, embora a decisão jurídica seja do
  responsável.

---

**Co-assinatura do adolescente (opcional, recomendado pra 12+):**
☐ Eu li junto com meu(s) responsável(is) e estou de acordo.

---

☐ **Eu, responsável legal pelo menor identificado acima, li, entendi
e autorizo** a {{empresa}} a tratar os dados pessoais dele(a) nas
condições deste termo.

_(Base legal: Art. 14 §1º e Art. 8º da Lei nº 13.709/2018 — LGPD.)_
`;

const TPL_IMAGEM_VOZ_CONTENT = `# Autorização para uso de imagem e voz — {{servico}}

> Este termo trata do uso da sua **imagem (foto, vídeo)** e/ou
> **voz (áudio)** pela {{empresa}}.

## Quem somos

**{{empresa}}** (CNPJ {{cnpj}}). Encarregado: **{{dpoNome}}** ·
{{dpoEmail}}.

## O que vamos capturar

Marque o que se aplica:

- ☐ Foto
- ☐ Vídeo (sem áudio)
- ☐ Vídeo com áudio
- ☐ Apenas áudio

## Onde a imagem/voz vai aparecer

A imagem/voz **poderá** ser divulgada nos seguintes veículos da
{{empresa}}:

- Site institucional
- Redes sociais oficiais
- Material impresso (folder, cartaz, relatório)
- TV/rádio institucional (se aplicável)
- Apresentações internas (capacitações, reuniões)

**NÃO** será usada para fins comerciais ou repassada a terceiros sem
sua autorização expressa.

## Pra que

{{finalidade}}

## Por quanto tempo

Marque uma opção:

- ☐ Por tempo indeterminado (até eu pedir pra remover)
- ☐ Por ____ ano(s)
- ☐ Apenas durante o evento/atividade

## Edição

A {{empresa}} pode fazer ajustes técnicos (corte, brilho, legenda)
sem alterar o sentido. **Não** vai fazer montagem, filtro distorcivo
ou edição que mude o significado original.

## Seus direitos

Você pode, a qualquer momento, pedir:

- Saber **onde** sua imagem/voz está publicada
- Pedir a **remoção** dos veículos digitais
- Cancelar este consentimento

Mande e-mail pro Encarregado: {{dpoEmail}}.

A remoção de material **digital** acontece em até 30 dias. Material
impresso **já distribuído** não pode ser recolhido, mas não fazemos
nova tiragem com sua imagem.

---

☐ **Eu li, entendi e autorizo** a {{empresa}} a usar minha imagem
e/ou voz conforme as condições acima.

_(Base legal: Art. 7º, I e Art. 8º da Lei nº 13.709/2018 — LGPD; e
Arts. 11 a 21 do Código Civil — direitos da personalidade.)_
`;

const TPL_COMUNICACAO_CONTENT = `# Autorização para receber comunicações da {{empresa}}

> Este termo é **separado** do cadastro principal do serviço. Você
> pode usar o serviço sem aceitar receber comunicações.

## Quem somos

**{{empresa}}** (CNPJ {{cnpj}}). Encarregado: **{{dpoNome}}** ·
{{dpoEmail}}.

## O que você está autorizando (escolha o que quer receber)

Marque uma ou mais caixinhas — cada uma é um consentimento separado.
Você pode aceitar uma e recusar a outra. Pode também cancelar uma
sem afetar a(s) outra(s).

- ☐ **Newsletter mensal** — novidades, eventos, mudanças no serviço
- ☐ **Pesquisas de satisfação** — questionários ocasionais pra
  melhorar nosso atendimento
- ☐ **Notificações sobre novos serviços** — quando lançamos algo
  relevante pra você

## Por quais canais

- ☐ E-mail
- ☐ SMS / WhatsApp
- ☐ Notificação no app

## Que dados usamos

Só seu nome (pra personalizar) e o canal escolhido (e-mail ou
telefone). Sem cruzar com dado sensível ou comportamental.

## Por quanto tempo

Enquanto você quiser. Se ficarmos **2 anos sem você abrir** nenhuma
comunicação nossa, paramos de mandar e apagamos seus dados de
contato.

## Como cancelar

3 caminhos:

1. Clica em **"Descadastrar"** no rodapé de qualquer e-mail nosso
2. Responde **"SAIR"** a uma mensagem SMS/WhatsApp
3. Manda e-mail pro Encarregado: {{dpoEmail}}

Em até 7 dias paramos de enviar e em até 30 dias apagamos seus
dados.

## Seus direitos

Os mesmos que a LGPD garante pra qualquer tratamento (acesso,
correção, eliminação, portabilidade, revogação). Use o e-mail do
Encarregado acima.

---

☐ **Eu li, entendi e autorizo** a {{empresa}} a me enviar as
comunicações que marquei acima.

_(Base legal: Art. 7º, I e Art. 8º da Lei nº 13.709/2018 — LGPD.
Consentimento granular: cada caixinha é um consentimento próprio
que pode ser cancelado individualmente.)_
`;

export const CONSENT_TEMPLATES: readonly ConsentTemplateDef[] = [
  {
    id: "GERAL",
    label: "Termo Geral",
    blurb:
      "Coleta de dados comuns (nome, CPF, e-mail, telefone). Cenário mais usado — cadastros voluntários, mailing, formulários simples.",
    legalRef: "Art. 7º I + Art. 8º",
    content: TPL_GERAL_CONTENT,
  },
  {
    id: "SENSIVEIS",
    label: "Termo de Dados Sensíveis",
    blurb:
      "Tratamento de saúde, biometria, origem racial, religião, opinião política, orientação sexual. LGPD exige termo separado e em destaque.",
    legalRef: "Art. 11 I + Art. 8º",
    content: TPL_SENSIVEIS_CONTENT,
  },
  {
    id: "MENOR",
    label: "Termo de Consentimento de Menor",
    blurb:
      "Coleta dados de criança (até 12) ou adolescente (12-18). Assinado pelos pais ou responsável legal. Inclui co-assinatura opcional do adolescente.",
    legalRef: "Art. 14 §1º + Art. 8º",
    content: TPL_MENOR_CONTENT,
  },
  {
    id: "IMAGEM_VOZ",
    label: "Termo de Uso de Imagem e Voz",
    blurb:
      "Foto, vídeo ou áudio capturado pra divulgação em site, redes sociais, material impresso ou capacitação. Cobre LGPD + direitos da personalidade do Código Civil.",
    legalRef: "Art. 7º I + Art. 8º + CC Arts. 11-21",
    content: TPL_IMAGEM_VOZ_CONTENT,
  },
  {
    id: "COMUNICACAO",
    label: "Termo de Comunicação Institucional (opt-in granular)",
    blurb:
      "Newsletter, pesquisa de satisfação, notificações sobre novos serviços. Cada caixinha é um consentimento separado — titular escolhe e cancela individualmente.",
    legalRef: "Art. 7º I + Art. 8º",
    content: TPL_COMUNICACAO_CONTENT,
  },
] as const;

export const CONSENT_TEMPLATE_BY_ID = Object.fromEntries(
  CONSENT_TEMPLATES.map((t) => [t.id, t] as const),
) as Record<ConsentTemplateType, ConsentTemplateDef>;

export function isValidTemplateType(s: string): s is ConsentTemplateType {
  return s in CONSENT_TEMPLATE_BY_ID;
}
