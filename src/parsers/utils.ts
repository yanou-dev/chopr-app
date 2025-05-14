import RegexPatterns from "./RegexPatterns";

interface LogTypeResult {
  success: boolean;
  error: string | null;
  type: string;
}

export const identifyLogType = (logInput: string): LogTypeResult => {
  try {
    const lines = logInput.split(/\r?\n/).slice(0, 5);

    for (const line of lines) {
      const cleanLogLine = line.trim();

      if (!cleanLogLine) continue;

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
