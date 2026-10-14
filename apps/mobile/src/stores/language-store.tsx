import React, { createContext, useContext, useCallback, useState } from 'react';
import i18n from '@/src/i18n';
import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '@/src/constants/config';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (lang: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'en',
  changeLanguage: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const changeLanguage = useCallback(async (lang: string) => {
    await i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    await SecureStore.setItemAsync(CONFIG.LOCALE_KEY, lang).catch(() => {});
  }, []);

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
