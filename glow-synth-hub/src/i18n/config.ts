import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import ru from './locales/ru.json';
import zh from './locales/zh.json';
import hy from './locales/hy.json'; // Armenian
import az from './locales/az.json'; // Azerbaijani
import tr from './locales/tr.json'; // Turkish
import fr from './locales/fr.json'; // French
import es from './locales/es.json'; // Spanish

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  zh: { translation: zh },
  hy: { translation: hy },
  az: { translation: az },
  tr: { translation: tr },
  fr: { translation: fr },
  es: { translation: es },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
