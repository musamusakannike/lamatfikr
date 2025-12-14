"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, translations } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (section: string, key: string) => string;
  dir: "rtl" | "ltr";
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "lamatfikr-language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
    if (savedLanguage && (savedLanguage === "ar" || savedLanguage === "en")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      document.documentElement.lang = language;
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
      
      // Update font class on body
      document.body.classList.remove("font-arabic", "font-english");
      document.body.classList.add(language === "ar" ? "font-arabic" : "font-english");
    }
  }, [language, mounted]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (section: string, key: string): string => {
    try {
      const sectionData = translations[section as keyof typeof translations];
      if (sectionData && typeof sectionData === "object") {
        const keyData = sectionData[key as keyof typeof sectionData];
        if (keyData && typeof keyData === "object" && language in keyData) {
          return (keyData as Record<Language, string>)[language];
        }
      }
      return key;
    } catch {
      return key;
    }
  };

  const dir = language === "ar" ? "rtl" : "ltr";
  const isRTL = language === "ar";

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <LanguageContext.Provider
        value={{
          language: "ar",
          setLanguage,
          t,
          dir: "rtl",
          isRTL: true,
        }}
      >
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
