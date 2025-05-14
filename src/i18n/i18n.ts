import { useLanguage } from "../contexts/LanguageContext";
import translations from "./translations";

interface TranslationParams {
  [key: string]: string | number;
}

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = (key: string, params: TranslationParams = {}): string => {
    const currentTranslations = translations[language] || translations.en;

    let translation = currentTranslations[key] || key;

    if (params && Object.keys(params).length > 0) {
      Object.keys(params).forEach((param) => {
        translation = translation.replace(`{${param}}`, String(params[param]));
      });
    }

    return translation;
  };

  return { t, language };
};
