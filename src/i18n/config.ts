// Поддерживаемые языки. Русский — основной.
// Чтобы добавить язык позже: добавить код сюда и создать messages/<код>.json.
export const locales = ["ru", "kk", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

// Названия языков для переключателя (на самом языке).
export const localeNames: Record<Locale, string> = {
  ru: "Русский",
  kk: "Қазақша",
  en: "English",
};

// Имя cookie, в котором хранится выбранный язык.
export const LOCALE_COOKIE = "locale";

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
