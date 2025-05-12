import { useLanguage } from "../contexts/LanguageContext";
import translations from "./translations";

// Hook pour accéder aux traductions
export const useTranslation = () => {
  const { language } = useLanguage();

  // Fonction de traduction
  const t = (key, params = {}) => {
    // Récupérer les traductions pour la langue actuelle ou l'anglais par défaut
    const currentTranslations = translations[language] || translations.en;

    // Récupérer la traduction ou la clé si non trouvée
    let translation = currentTranslations[key] || key;

    // Remplacer les paramètres dans la traduction
    if (params && Object.keys(params).length > 0) {
      Object.keys(params).forEach((param) => {
        translation = translation.replace(`{${param}}`, params[param]);
      });
    }

    return translation;
  };

  return { t, language };
};
