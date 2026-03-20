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

/** Detecta el idioma guardado o usa el del dispositivo (fallback: 'es') */
const detectLanguage = async (): Promise<SupportedLanguage> => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && saved in SUPPORTED_LANGUAGES) {
      return saved as SupportedLanguage;
    }
  } catch {}

  const deviceLang = getLocales()[0]?.languageCode ?? 'es';
  return deviceLang in SUPPORTED_LANGUAGES
    ? (deviceLang as SupportedLanguage)
    : 'es';
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
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
  });
};

export default i18n;
