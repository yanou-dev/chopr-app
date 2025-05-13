import RegexPatterns from "./RegexPatterns";

interface LogTypeResult {
  success: boolean;
  error: string | null;
  type: string;
}

export const identifyLogType = (logLine: string): LogTypeResult => {
  const cleanLogLine = logLine.trim();

  for (const [type, patterns] of Object.entries(RegexPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(cleanLogLine)) {
        return {
          success: true,
          error: null,
          type,
        };
      }
    }
  }

  return {
    success: false,
    error: "Unknown log format",
    type: "unknown",
  };
};
