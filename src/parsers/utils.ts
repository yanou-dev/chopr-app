import RegexPatterns from "./RegexPatterns";

interface LogTypeResult {
  success: boolean;
  error: string | null;
  type: string;
}

export const identifyLogType = (logInput: string): LogTypeResult => {
  try {
    // Limiter la taille de l'entrée pour éviter les problèmes de performance
    // Prendre seulement les 5 premières lignes si plusieurs lignes sont fournies
    const lines = logInput.split(/\r?\n/).slice(0, 5);

    // Tester chaque ligne individuellement jusqu'à ce qu'on trouve une correspondance
    for (const line of lines) {
      const cleanLogLine = line.trim();

      // Ignorer les lignes vides
      if (!cleanLogLine) continue;

      // Limiter la taille de chaque ligne à 1000 caractères pour éviter les problèmes de performance
      const truncatedLine =
        cleanLogLine.length > 1000
          ? cleanLogLine.substring(0, 1000)
          : cleanLogLine;

      for (const [type, patterns] of Object.entries(RegexPatterns)) {
        for (const pattern of patterns) {
          try {
            if (pattern.test(truncatedLine)) {
              return {
                success: true,
                error: null,
                type,
              };
            }
          } catch (e) {
            // Ignorer les erreurs d'expression régulière et continuer
            console.error(`Regex error for pattern in type ${type}:`, e);
          }
        }
      }
    }

    return {
      success: false,
      error: "Unknown log format",
      type: "unknown",
    };
  } catch (error) {
    console.error("Error in identifyLogType:", error);
    return {
      success: false,
      error: "Error processing log format",
      type: "unknown",
    };
  }
};
