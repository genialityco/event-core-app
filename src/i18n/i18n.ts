import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import es from './locales/es';
import en from './locales/en';

const LANGUAGE_KEY = '@app_language';

export const SUPPORTED_LANGUAGES = {
  es: 'Español',
  en: 'English',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Orden de prioridad:
 * 1. Idioma guardado explícitamente por el usuario (AsyncStorage)
 * 2. Idioma del dispositivo si está soportado
 * 3. 'en' como fallback final
 */
const detectLanguage = async (): Promise<SupportedLanguage> => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && saved in SUPPORTED_LANGUAGES) {
      return saved as SupportedLanguage;
    }
  } catch {}

  const deviceLang = getLocales()[0]?.languageCode ?? 'en';
  return deviceLang in SUPPORTED_LANGUAGES
    ? (deviceLang as SupportedLanguage)
    : 'en';
};

/** Cambia el idioma y lo persiste en AsyncStorage */
export const changeLanguage = async (lang: SupportedLanguage) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
};

export const initI18n = async () => {
  const lng = await detectLanguage();

  await i18n.use(initReactI18next).init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
};

export default i18n;
