import BaseParser, { Column, LogEntry } from "./BaseParser";
import RegexPatterns from "./RegexPatterns";

class LogParser extends BaseParser {
  private type: string;
  private _cachedColumns?: Column[];

  constructor(type: string) {
    super();
    this.type = type;
  }

  get id(): string {
    return this.type;
  }

  getColumns(): Column[] {
    return this._cachedColumns || [];
  }

  updateColumns(parsedData: Record<string, any> | null | undefined): Column[] {
    if (!this._cachedColumns) {
      this._cachedColumns = [];
    }

    if (!parsedData) return this._cachedColumns;

    let columnsChanged = false;
    const existingIds = new Set(this._cachedColumns.map((col) => col.id));

    Object.keys(parsedData).forEach((key) => {
      if (!existingIds.has(key)) {
        columnsChanged = true;
        this._cachedColumns!.push({
          id: key,
          label: key,
          width: "auto",
        });
      }
    });

    if (columnsChanged && typeof this.emit === "function") {
      this.emit("columnsChanged", this._cachedColumns);
    }

    return this._cachedColumns;
  }

  parseLines(lines: string): LogEntry[] {
    const linesArray = lines.split("\n").filter((line) => line !== "");
    let logsArray: LogEntry[] = [];
    for (const line of linesArray) {
      try {
        const logLine = line
          .replace(/[\r\n\t]+/g, "")
          .replace(/\s+/g, " ")
          .trim();

        const patterns = RegexPatterns[this.type];
        
        if (!patterns) {
          throw new Error(`Pas de patterns définis pour le type: ${this.type}`);
        }

        let match: RegExpMatchArray | null = null;

        for (const pattern of patterns) {
          if (logLine !== "") {
            const matched = logLine.match(pattern);
            if (matched) {
              match = matched;
              break;
            }
          }
        }

        if (!match) {
          throw new Error("Format non compatible");
        }

        this.updateColumns(match.groups || {});

        logsArray.push({
          ...match.groups,
        });
      } catch (e) {
        const error = e as Error;
        logsArray.push({
          error: true,
          raw: line,
          message: error.message,
        });
      }
    }
    return logsArray;
  }
}

export default LogParser;
