export const LANGUAGES = [
  { code: "en", nativeName: "English", translated: true },
  { code: "af", nativeName: "Afrikaans", translated: true },
  { code: "om", nativeName: "Oshiwambo", translated: false },
  { code: "hz", nativeName: "Otjiherero", translated: false },
  { code: "kw", nativeName: "Rukwangali", translated: false },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const LANGUAGE_STORAGE_KEY = "preferredLanguage";

export function isLanguageCode(value: string | null): value is LanguageCode {
  return LANGUAGES.some((language) => language.code === value);
}

export function languageByCode(code: LanguageCode) {
  return LANGUAGES.find((language) => language.code === code) ?? LANGUAGES[0];
}
