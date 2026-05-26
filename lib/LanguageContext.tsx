"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { t, Lang, Translations } from "./i18n";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: Translations;
}

const LangContext = createContext<LangContextValue>({
  lang: "zh",
  setLang: () => {},
  tr: t.zh,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("zh");
  return (
    <LangContext.Provider value={{ lang, setLang, tr: t[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
