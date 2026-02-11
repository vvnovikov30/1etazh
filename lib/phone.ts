/**
 * Нормализация и валидация российских телефонных номеров
 */

export type PhoneNormalizeResult = {
  digits: string; // только 10 цифр после +7
  formatted: string; // отформатированная строка +7(XXX) XXX-XX-XX
};

/**
 * Извлекает только цифры из строки
 */
function extractDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Нормализует телефонный номер
 * @param input - входная строка (может содержать любые символы)
 * @returns объект с digits (10 цифр) и formatted (отформатированная строка)
 */
export function normalizePhone(input: string): PhoneNormalizeResult {
  const digitsOnly = extractDigits(input);

  // Если начинается с 7 и длина 11, берём последние 10
  let digits10 = digitsOnly;
  if (digitsOnly.startsWith("7") && digitsOnly.length === 11) {
    digits10 = digitsOnly.slice(1);
  } else if (digitsOnly.startsWith("8") && digitsOnly.length === 11) {
    digits10 = digitsOnly.slice(1);
  } else if (digitsOnly.length > 10) {
    // Если больше 10 цифр, берём последние 10
    digits10 = digitsOnly.slice(-10);
  } else {
    digits10 = digitsOnly;
  }

  // Ограничиваем до 10 цифр
  digits10 = digits10.slice(0, 10);

  // Форматируем: +7(XXX) XXX-XX-XX
  let formatted = "+7";
  if (digits10.length > 0) {
    formatted += "(";
    formatted += digits10.slice(0, 3);
    if (digits10.length > 3) {
      formatted += ") ";
      formatted += digits10.slice(3, 6);
      if (digits10.length > 6) {
        formatted += "-";
        formatted += digits10.slice(6, 8);
        if (digits10.length > 8) {
          formatted += "-";
          formatted += digits10.slice(8, 10);
        }
      }
    } else {
      formatted += ")";
    }
  } else {
    formatted += "(";
  }

  return {
    digits: digits10,
    formatted,
  };
}

/**
 * Проверяет, является ли строка валидным российским телефонным номером
 * @param digits10 - строка из 10 цифр (без +7)
 * @returns true если номер валиден
 */
export function isValidRuPhoneDigits(digits10: string): boolean {
  if (!digits10 || digits10.length !== 10) {
    return false;
  }
  // Проверяем, что все символы - цифры
  if (!/^\d{10}$/.test(digits10)) {
    return false;
  }
  // Проверяем, что номер не начинается с 0 (кроме специальных случаев)
  // Для простоты считаем валидным любой 10-значный номер
  return true;
}

/**
 * Форматирует 10 цифр в строку +7(XXX) XXX-XX-XX
 */
export function formatPhoneDigits(digits10: string): string {
  if (!digits10 || digits10.length === 0) {
    return "+7(";
  }
  const normalized = normalizePhone(digits10);
  return normalized.formatted;
}
