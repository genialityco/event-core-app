export { default as i18n, initI18n, changeLanguage, SUPPORTED_LANGUAGES } from './i18n';
export type { SupportedLanguage } from './i18n';

// Re-exporta useTranslation para que los módulos no importen directo de react-i18next
export { useTranslation } from 'react-i18next';
