// src/context/LanguageContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import strings from "../localization/Localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

type LangContextType = {
  language: string;
  setLanguage: (lang: string) => void;
};

const LangContext = createContext<LangContextType | undefined>(undefined);

export const LangProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLang] = useState<string>(strings.getLanguage() ?? "en");

  // Load saved language on mount
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("appLanguage");
      if (saved) {
        strings.setLanguage(saved);
        setLang(saved);
      }
    })();
  }, []);

  const setLanguage = (lang: string) => {
    strings.setLanguage(lang);
    setLang(lang);
    AsyncStorage.setItem("appLanguage", lang);
  };

  return (
    <LangContext.Provider value={{ language, setLanguage }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error("useLang must be used within a LangProvider");
  }
  return ctx;
};
