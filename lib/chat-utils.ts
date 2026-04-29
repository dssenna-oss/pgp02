// Utilitários para o chatbot

// Padrões de dados sensíveis para anonimização
const SENSITIVE_PATTERNS = [
  // CPF
  { pattern: /\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}\b/g, replacement: "[CPF OCULTADO]" },
  // CNPJ
  { pattern: /\b\d{2}[.\s]?\d{3}[.\s]?\d{3}[/\s]?\d{4}[-\s]?\d{2}\b/g, replacement: "[CNPJ OCULTADO]" },
  // Email
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: "[EMAIL OCULTADO]" },
  // Telefone BR
  { pattern: /\(?\b\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}\b/g, replacement: "[TELEFONE OCULTADO]" },
  // Cartão de crédito
  { pattern: /\b\d{4}[\s.-]?\d{4}[\s.-]?\d{4}[\s.-]?\d{4}\b/g, replacement: "[CARTÃO OCULTADO]" },
  // RG (padrão comum)
  { pattern: /\b\d{2}[.\s]?\d{3}[.\s]?\d{3}[-\s]?[A-Za-z0-9]\b/g, replacement: "[RG OCULTADO]" },
  // CEP
  { pattern: /\b\d{5}[-\s]?\d{3}\b/g, replacement: "[CEP OCULTADO]" },
  // Data de nascimento (formato comum)
  { pattern: /\b(0[1-9]|[12][0-9]|3[01])[\/.-](0[1-9]|1[012])[\/.-](19|20)\d{2}\b/g, replacement: "[DATA OCULTADA]" },
];

// Anonimizar dados sensíveis no texto
export function anonymizeText(text: string): { text: string; foundSensitive: boolean } {
  let result = text;
  let foundSensitive = false;

  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    if (pattern.test(result)) {
      foundSensitive = true;
      result = result.replace(pattern, replacement);
    }
  }

  return { text: result, foundSensitive };
}

// Detectar sentimento da mensagem
const SENTIMENT_KEYWORDS = {
  positive: [
    "obrigado", "obrigada", "muito bom", "excelente", "perfeito", "ótimo", "ótima",
    "maravilhoso", "incrível", "adorei", "amei", "parabéns", "legal", "bacana",
    "ajudou muito", "entendi", "claro", "clareza", "útil", "funciona", "resolvido"
  ],
  negative: [
    "ruim", "péssimo", "horrível", "terrível", "lixo", "inútil", "não funciona",
    "porcaria", "droga", "merda", "raiva", "ódio", "detesto", "decepcionado"
  ],
  frustrated: [
    "não entendi", "não entendo", "confuso", "confusa", "frustrado", "frustrada",
    "impossível", "difícil demais", "complicado", "não consigo", "desisto",
    "cansado", "cansada", "irritado", "irritada", "já tentei", "de novo"
  ],
  confused: [
    "como assim", "não sei", "perdido", "perdida", "o que", "hein", "?",
    "não faço ideia", "bom mas", "então", "tipo", "como funciona", "explica"
  ]
};

export function detectSentiment(text: string): { sentiment: string; score: number } {
  const normalizedText = text.toLowerCase();
  
  const scores = {
    positive: 0,
    negative: 0,
    frustrated: 0,
    confused: 0,
    neutral: 0.3 // Base score para neutral
  };

  // Contar keywords de cada sentimento
  for (const [sentiment, keywords] of Object.entries(SENTIMENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        scores[sentiment as keyof typeof scores] += 0.25;
      }
    }
  }

  // Encontrar sentimento dominante
  let maxSentiment = "neutral";
  let maxScore = scores.neutral;

  for (const [sentiment, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxSentiment = sentiment;
    }
  }

  // Normalizar score para 0-1
  const normalizedScore = Math.min(1, maxScore);

  return { sentiment: maxSentiment, score: normalizedScore };
}

// Formatar resposta do chatbot para exibição
export function formatChatResponse(text: string): string {
  // Converter markdown básico para HTML
  let formatted = text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Line breaks
    .replace(/\n/g, "<br>")
    // Bullet points
    .replace(/^[-•] (.+)$/gm, "<li>$1</li>")
    // Numbered lists
    .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>");

  return formatted;
}

// Verificar se mensagem é uma saudação
export function isGreeting(text: string): boolean {
  const greetings = [
    "oi", "olá", "ola", "e aí", "e ai", "eae", "hey", "hi", "hello",
    "bom dia", "boa tarde", "boa noite", "tudo bem", "como vai"
  ];
  const normalized = text.toLowerCase().trim();
  return greetings.some(g => normalized.startsWith(g) || normalized === g);
}

// Verificar se mensagem é uma despedida
export function isFarewell(text: string): boolean {
  const farewells = [
    "tchau", "adeus", "até mais", "até logo", "bye", "valeu", "flw",
    "obrigado por tudo", "era isso", "só isso", "é isso"
  ];
  const normalized = text.toLowerCase().trim();
  return farewells.some(f => normalized.includes(f));
}
