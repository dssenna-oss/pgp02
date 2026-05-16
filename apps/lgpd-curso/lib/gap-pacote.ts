// 10 controles do GAP — pacote curado para o curso.
// Cobrem 5 áreas, 2 controles cada.

export type Controle = {
  id: number;
  texto: string;
  area: "Governança" | "Bases Legais" | "Direitos do Titular" | "Segurança" | "Incidentes";
  hint?: string;
};

export const GAP_PACOTE: Controle[] = [
  { id: 1,  area: "Governança",          texto: "Política de Privacidade publicada e divulgada?", hint: "Pode ser interna (corpo funcional) e externa (cidadão)." },
  { id: 2,  area: "Governança",          texto: "Encarregado designado por ato formal?", hint: "Portaria, ato, decreto — formal, publicado." },
  { id: 3,  area: "Bases Legais",        texto: "Base legal documentada por processo de tratamento?", hint: "Art. 7º (comuns) e Art. 11 (sensíveis) da LGPD." },
  { id: 4,  area: "Bases Legais",        texto: "Inventário de tratamentos atualizado nos últimos 12 meses?", hint: "Inclui novos sistemas, fluxos, terceirizações?" },
  { id: 5,  area: "Direitos do Titular", texto: "Canal pra exercer direitos do titular disponível e divulgado?", hint: "E-mail, formulário, telefone — claro e acessível." },
  { id: 6,  area: "Direitos do Titular", texto: "Prazo de resposta de 15 dias úteis monitorado?", hint: "Existe registro de solicitações + monitoramento do prazo?" },
  { id: 7,  area: "Segurança",           texto: "Controle de acesso por usuário/perfil implementado?", hint: "Cada um vê só o que precisa pra função." },
  { id: 8,  area: "Segurança",           texto: "Política de senhas + MFA para sistemas críticos?", hint: "Senha forte + 2 fatores nos sistemas que tratam dados sensíveis." },
  { id: 9,  area: "Incidentes",          texto: "Plano de resposta a incidente formalizado e testado?", hint: "Documento + simulado nos últimos 12 meses." },
  { id: 10, area: "Incidentes",          texto: "Equipe treinada em LGPD nos últimos 12 meses?", hint: "Treinamento formal, com registro de presença." },
];
