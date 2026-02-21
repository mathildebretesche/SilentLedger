"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { en } from "./translations/en";
import { fr } from "./translations/fr";
import { hi } from "./translations/hi";

export type Language = "en" | "fr" | "hi";
export type Translations = typeof en;

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: Translations;
}

const translations: Record<Language, Translations> = { en, fr, hi };
const STORAGE_KEY = "sl_lang";

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    // Detect saved preference or browser language
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    let resolved: Language;
    if (saved === "en" || saved === "fr" || saved === "hi") {
      resolved = saved;
    } else {
      const browser = navigator.language.toLowerCase();
      if (browser.startsWith("fr")) {
        resolved = "fr";
      } else if (browser.startsWith("hi")) {
        resolved = "hi";
      } else {
        resolved = "en";
      }
    }
    setLangState(resolved);
    document.documentElement.lang = resolved;
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
