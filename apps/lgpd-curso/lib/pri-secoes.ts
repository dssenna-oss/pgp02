// Documento institucional do Plano de Resposta a Incidentes (PRI) — Frente 3.
// 8 seções (ciclo NIST ajustado à LGPD). Usa a tabela Policy com este slug —
// sem tabela nova.

export const PRI_SLUG = "pri-resposta-incidentes";

export type PriSecao = {
  numero: number;
  titulo: string;
  hint: string;
  alimentadoPor?: string;
};

export const PRI_SECOES: PriSecao[] = [
  { numero: 1, titulo: "Objetivo, escopo e base legal", hint: "Para que serve o plano, o que cobre e a base legal (Arts. 46-48 LGPD + Res. CD/ANPD 15/2024)." },
  { numero: 2, titulo: "Equipe de Resposta a Incidentes", hint: "Composição (ETIR/CSIRT), papéis e contatos.", alimentadoPor: "Equipe PRI" },
  { numero: 3, titulo: "Classificação de severidade", hint: "Régua objetiva BAIXA / MÉDIA / ALTA / CRÍTICA.", alimentadoPor: "Classificação" },
  { numero: 4, titulo: "Detecção e notificação interna", hint: "Como o incidente é detectado e reportado internamente; quem aciona a equipe." },
  { numero: 5, titulo: "Contenção, erradicação e recuperação", hint: "Passos de resposta — isolar, eliminar a causa, restaurar." },
  { numero: 6, titulo: "Comunicação à ANPD e aos titulares", hint: "Prazos (3 dias úteis), conteúdo e canais (Art. 48 LGPD)." },
  { numero: 7, titulo: "Registro e documentação do incidente", hint: "O que registrar e onde — prestação de contas (Art. 6º, X)." },
  { numero: 8, titulo: "Lições aprendidas e melhoria contínua", hint: "Revisão pós-incidente e atualização periódica do plano." },
];

// Rascunho inicial com placeholders [entre colchetes] — o DPO preenche ou usa
// o botão "Auto-preencher". A seção 3 já vem completa (régua fixa).
export function gerarRascunhoPri(): string {
  return `# Plano de Resposta a Incidentes de Segurança com Dados Pessoais (PRI)

## 1. Objetivo, escopo e base legal
Este Plano de Resposta a Incidentes (PRI) estabelece os procedimentos que [identifique o órgão] adota para detectar, conter, comunicar e aprender com incidentes de segurança envolvendo dados pessoais.
Aplica-se a todos os setores, sistemas e colaboradores que tratam dados pessoais sob responsabilidade do órgão.
Fundamento legal: arts. 46 a 48 da LGPD (Lei nº 13.709/2018) e Resolução CD/ANPD nº 15/2024.

## 2. Equipe de Resposta a Incidentes (ETIR/CSIRT)
A condução da resposta a incidentes é responsabilidade da equipe abaixo:
[Liste cada membro: nome, papel e contato 24h. Use o botão Auto-preencher para trazer a equipe já cadastrada no mini-app de Incidentes.]
Encarregado pelo Tratamento de Dados (DPO): [nome, e-mail e telefone].

## 3. Classificação de severidade
Todo incidente é classificado de forma objetiva em uma de quatro severidades:
- **BAIXA** — quase-incidente contido, sem acesso, perda ou exposição efetiva de dados.
- **MÉDIA** — houve incidente, sem fatores agravantes.
- **ALTA** — houve incidente com 1 fator agravante.
- **CRÍTICA** — houve incidente com 2 ou mais fatores agravantes.
Fatores agravantes: dado sensível afetado; titulares vulneráveis (crianças, adolescentes ou idosos); volume considerável de titulares; exposição pública ou irreversível dos dados.

## 4. Detecção e notificação interna
[Descreva como um incidente pode ser detectado — alerta de sistema, denúncia, auditoria de logs — e o canal interno pelo qual qualquer colaborador comunica a suspeita à equipe de resposta.]
Ao tomar ciência de um incidente, a equipe o registra imediatamente e inicia a contagem dos prazos de comunicação.

## 5. Contenção, erradicação e recuperação
Contenção: [medidas imediatas para limitar o dano — isolar o sistema, bloquear acessos, revogar credenciais comprometidas].
Erradicação: [eliminar a causa-raiz — corrigir a vulnerabilidade, remover o acesso indevido].
Recuperação: [restaurar serviços e dados a partir de backup íntegro e confirmar o retorno à normalidade].

## 6. Comunicação à ANPD e aos titulares
Quando o incidente puder acarretar risco ou dano relevante aos titulares, o órgão comunica:
- à ANPD, em até 3 (três) dias úteis contados da ciência do incidente (Resolução CD/ANPD nº 15/2024);
- aos titulares afetados, de forma direta e em linguagem clara (Art. 48, § 1º da LGPD).
[Indique os responsáveis por redigir e enviar cada comunicação e o canal utilizado.]

## 7. Registro e documentação do incidente
Cada incidente é documentado com: descrição, cronologia (datas de ocorrência e de detecção), dados e titulares afetados, severidade classificada, medidas adotadas e comunicações realizadas.
[Indique onde o registro é mantido e por quanto tempo é conservado.]
A documentação completa atende ao princípio da responsabilização e prestação de contas (Art. 6º, X da LGPD).

## 8. Lições aprendidas e melhoria contínua
Após o encerramento de cada incidente, a equipe realiza uma revisão pós-incidente: o que funcionou, o que falhou e quais controles devem ser ajustados.
[Defina a periodicidade de revisão deste plano — recomenda-se ao menos uma vez por ano e após todo incidente relevante.]
`;
}
