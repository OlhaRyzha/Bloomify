import en from './en/translation.json';
import pl from './pl/translation.json';
import uk from './uk/translation.json';

export type Locale = 'uk' | 'en' | 'pl';
export type TranslationDictionary = Record<string, unknown>;

export const supportedLocales: Locale[] = ['uk', 'en', 'pl'];
export const defaultLocale: Locale = 'uk';

export const localeLabels: Record<Locale, string> = {
  uk: 'Українська',
  en: 'English',
  pl: 'Polski',
};

export const localeShortLabels: Record<Locale, string> = {
  uk: 'UKR',
  en: 'ENG',
  pl: 'POL',
};

export const translations: Record<Locale, TranslationDictionary> = {
  uk: uk as TranslationDictionary,
  en: en as TranslationDictionary,
  pl: pl as TranslationDictionary,
};
