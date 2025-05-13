import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

// Types
export type Language = 'fr' | 'en';

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

// Langues supportées
export const SUPPORTED_LANGUAGES: SupportedLanguages = {
  fr: "Français",
  en: "English",
  // Vous pouvez ajouter d'autres langues ici au besoin
};

// Contexte des langues
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Détecter la langue du système
const detectSystemLanguage = (): Language => {
  const navigatorLanguage = navigator.language;
  const baseLanguage = navigatorLanguage.split("-")[0].toLowerCase();

  // Vérifier si la langue du système est supportée, sinon utiliser l'anglais par défaut
  return (Object.keys(SUPPORTED_LANGUAGES).includes(baseLanguage) 
    ? baseLanguage 
    : "en") as Language;
};

// Provider du contexte de langue
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(detectSystemLanguage());

  // Mettre à jour la langue lorsque la langue du navigateur change
  useEffect(() => {
    const systemLanguage = detectSystemLanguage();
    setLanguage(systemLanguage);

    // On pourrait ajouter ici un écouteur pour détecter les changements de langue du navigateur
    // Mais ce n'est pas standard et nécessiterait une solution spécifique à Electron
  }, []);

  // Valeur du contexte à fournir
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

// Hook pour utiliser le contexte de langue
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
