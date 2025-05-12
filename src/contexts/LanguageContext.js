import React, { createContext, useState, useContext, useEffect } from "react";

// Langues supportées
export const SUPPORTED_LANGUAGES = {
  fr: "Français",
  en: "English",
  // Vous pouvez ajouter d'autres langues ici au besoin
};

// Contexte des langues
const LanguageContext = createContext();

// Détecter la langue du système
const detectSystemLanguage = () => {
  const navigatorLanguage = navigator.language || navigator.userLanguage;
  const baseLanguage = navigatorLanguage.split("-")[0].toLowerCase();

  // Vérifier si la langue du système est supportée, sinon utiliser l'anglais par défaut
  return SUPPORTED_LANGUAGES[baseLanguage] ? baseLanguage : "en";
};

// Provider du contexte de langue
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(detectSystemLanguage());

  // Mettre à jour la langue lorsque la langue du navigateur change
  useEffect(() => {
    const systemLanguage = detectSystemLanguage();
    setLanguage(systemLanguage);

    // On pourrait ajouter ici un écouteur pour détecter les changements de langue du navigateur
    // Mais ce n'est pas standard et nécessiterait une solution spécifique à Electron
  }, []);

  // Valeur du contexte à fournir
  const contextValue = {
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
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
