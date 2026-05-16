// 12 seções do Aviso de Privacidade (template ANPD).

export type AvisoSecao = {
  numero: number;
  titulo: string;
  hint: string;
  alimentadoPor?: "RIPD" | "TERCEIROS" | "DSR";
};

export const AVISO_SECOES: AvisoSecao[] = [
  { numero: 1,  titulo: "Quem somos",                                      hint: "Identificação do controlador — TCEES, CNPJ, sede." },
  { numero: 2,  titulo: "Encarregado pelo tratamento de dados (DPO)",      hint: "Nome, e-mail e telefone do Encarregado e do substituto." },
  { numero: 3,  titulo: "Quais dados tratamos e por quê",                  hint: "Síntese dos processos do Inventário + RIPD.", alimentadoPor: "RIPD" },
  { numero: 4,  titulo: "Base legal do tratamento",                        hint: "Art. 7º (comuns) e Art. 11 (sensíveis) — fundamentadas." },
  { numero: 5,  titulo: "Por quanto tempo guardamos seus dados",           hint: "Prazo de retenção declarado no Inventário." },
  { numero: 6,  titulo: "Como protegemos seus dados",                      hint: "Medidas técnicas e administrativas (art. 46 LGPD)." },
  { numero: 7,  titulo: "Com quem compartilhamos",                         hint: "Lista de operadores e órgãos parceiros.", alimentadoPor: "TERCEIROS" },
  { numero: 8,  titulo: "Transferência internacional",                     hint: "Há? Sob qual hipótese do art. 33 da LGPD?" },
  { numero: 9,  titulo: "Cookies e tecnologias de rastreamento",           hint: "O que coletamos via cookies no portal. Link pra Política de Cookies." },
  { numero: 10, titulo: "Decisões automatizadas",                          hint: "Há decisão automatizada (art. 20 LGPD)? Como o titular pode contestar?" },
  { numero: 11, titulo: "Como exercer seus direitos",                      hint: "Canal funcional do titular (e-mail, formulário, telefone).", alimentadoPor: "DSR" },
  { numero: 12, titulo: "Atualizações deste Aviso",                        hint: "Data da última revisão e onde acompanhar mudanças." },
];
