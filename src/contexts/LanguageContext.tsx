import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

export type Language = "fr" | "en";

interface SupportedLanguages {
  [key: string]: string;
}

interface LanguageContextType {
  language: Language;
  supportedLanguages: SupportedLanguages;
}

interface LanguageProviderProps {
  children: ReactNode;
}

export const SUPPORTED_LANGUAGES: SupportedLanguages = {
  fr: "Français",
  en: "English",
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const detectSystemLanguage = (): Language => {
  const navigatorLanguage = navigator.language;
  const baseLanguage = navigatorLanguage.split("-")[0].toLowerCase();

  return (
    Object.keys(SUPPORTED_LANGUAGES).includes(baseLanguage)
      ? baseLanguage
      : "en"
  ) as Language;
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>(detectSystemLanguage());

  useEffect(() => {
    const systemLanguage = detectSystemLanguage();
    setLanguage(systemLanguage);
  }, []);

  const contextValue: LanguageContextType = {
    language,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
