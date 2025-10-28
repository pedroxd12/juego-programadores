/**
 * Normaliza texto para comparaciones flexibles
 * - Convierte a minúsculas
 * - Elimina acentos y diacríticos
 * - Elimina espacios extras
 * - Elimina puntuación común
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Descompone caracteres con acentos
    .replace(/[\u0300-\u036f]/g, "") // Elimina diacríticos
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()¿?¡!"""'']/g, "") // Elimina puntuación
    .replace(/\s+/g, " ") // Normaliza espacios múltiples a uno solo
    .trim();
}

/**
 * Calcula la similitud entre dos textos usando distancia de Levenshtein
 * Retorna un valor entre 0 y 1, donde 1 es idéntico
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const matrix: number[][] = [];
  
  // Inicializar matriz
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  // Llenar matriz con distancias
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitución
          matrix[i][j - 1] + 1,     // inserción
          matrix[i - 1][j] + 1      // eliminación
        );
      }
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  const distance = matrix[s1.length][s2.length];
  
  return 1 - distance / maxLength;
}

/**
 * Verifica si una respuesta es similar a la esperada
 * @param userAnswer - Respuesta del usuario
 * @param expectedAnswer - Respuesta esperada
 * @param threshold - Umbral de similitud (0-1), por defecto 0.8 (80%)
 */
export function isAnswerValid(
  userAnswer: string,
  expectedAnswer: string,
  threshold: number = 0.8
): boolean {
  const normalized1 = normalizeText(userAnswer);
  const normalized2 = normalizeText(expectedAnswer);
  
  // Coincidencia exacta después de normalización
  if (normalized1 === normalized2) return true;
  
  // Verificar si una respuesta contiene la otra
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return true;
  }
  
  // Usar similitud para casos más complejos
  const similarity = calculateSimilarity(userAnswer, expectedAnswer);
  return similarity >= threshold;
}
