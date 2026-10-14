import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as ExpoLocalization from 'expo-localization';
import en from './en.json';
import hi from './hi.json';
import bn from './bn.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  bn: { translation: bn },
};

const getDeviceLocale = () => {
  const locales = ExpoLocalization.getLocales();
  const locale = locales[0]?.languageCode ?? 'en';
  if (['en', 'hi', 'bn'].includes(locale)) return locale;
  return 'en';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLocale(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;
