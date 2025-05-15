import BaseParser, { Column, LogEntry } from "./BaseParser";

/**
 * Parser implementation for JSON formatted logs
 * Handles parsing of JSON log entries and dynamically updates columns
 * based on the fields found in the logs.
 */
class JSONParser extends BaseParser {
  private _cachedColumns?: Column[];

  /**
   * Returns the unique identifier for this parser
   */
  get id(): string {
    return "json";
  }

  /**
   * Returns the current set of column definitions
   * @returns Array of column definitions based on parsed JSON fields
   */
  getColumns(): Column[] {
    return this._cachedColumns || [];
  }

  /**
   * Updates the column definitions based on parsed JSON data
   * When new fields are discovered in the JSON, they are added as columns
   *
   * @param parsedData - Object containing parsed JSON data
   * @returns Updated array of column definitions
   */
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

  /**
   * Parses a string containing one or more JSON log entries
   * Each line is expected to be a valid JSON object
   *
   * @param lines - String containing JSON log entries (one per line)
   * @returns Array of parsed log entries
   */
  parseLines(lines: string): LogEntry[] {
    const linesArray = lines.split(/\r\n|\n/);
    let logsArray: LogEntry[] = [];

    for (const line of linesArray) {
      try {
        if (line.trim() === "") continue;

        const data = JSON.parse(line);
        this.updateColumns(data);

        if (!data.id) {
          data.id = `json-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        }

        data.raw = line;

        logsArray.push(data);
      } catch (e) {
        logsArray.push({
          id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          raw: line,
          message: "Invalid JSON format",
          error: true,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return logsArray;
  }
}

export default JSONParser;
