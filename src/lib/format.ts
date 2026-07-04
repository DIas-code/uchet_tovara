// Единое форматирование чисел и денег.
// Валюта — тенге (₸). Символ добавляем вручную: рендерится стабильно
// в любом окружении. Позже валюту можно вынести в настройки бутика.
const number = new Intl.NumberFormat("ru-RU");

export function formatMoney(value: number | string): string {
  return `${number.format(Number(value))} ₸`;
}

export function formatNumber(value: number | string): string {
  return number.format(Number(value));
}
