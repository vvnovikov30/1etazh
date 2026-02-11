/**
 * Детерминированный shuffle с seed
 * Используется для рандомизации каруселей с сохранением порядка в рамках сессии
 */

/**
 * Простой генератор псевдослучайных чисел с seed
 */
function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

/**
 * Перемешивает массив детерминированно на основе seed
 */
export function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  const random = seededRandom(seed);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Получает или создаёт seed из sessionStorage
 */
export function getOrCreateSeed(storageKey: string = "carouselSeed"): number {
  if (typeof window === "undefined") {
    return Math.floor(Math.random() * 1000000);
  }

  const stored = sessionStorage.getItem(storageKey);
  if (stored) {
    return parseInt(stored, 10);
  }

  const seed = Math.floor(Math.random() * 1000000);
  sessionStorage.setItem(storageKey, seed.toString());
  return seed;
}
