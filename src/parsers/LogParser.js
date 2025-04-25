import BaseParser from "./BaseParser";
import RegexPatterns from "./RegexPatterns";

class LogParser extends BaseParser {
  constructor(type) {
    super();
    this.type = type;
  }

  get id() {
    return this.type;
  }

  getColumns() {
    return this._cachedColumns || [];
  }

  updateColumns(parsedData) {
    if (!this._cachedColumns) {
      this._cachedColumns = [];
    }

    if (!parsedData) return;

    const allKeys = new Set();
    Object.keys(parsedData).forEach((key) => allKeys.add(key));

    let columnsChanged = false;
    const existingIds = new Set(this._cachedColumns.map((col) => col.id));

    Object.keys(parsedData).forEach((key) => {
      if (!existingIds.has(key)) {
        columnsChanged = true;
        this._cachedColumns.push({
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

  parseLines(lines) {
    const linesArray = lines.split("\n").filter((line) => line !== "");
    console.log("linesArray :", linesArray);
    let logsArray = [];
    for (const line of linesArray) {
      try {
        const logLine = line
          .replace(/[\r\n\t]+/g, "")
          .replace(/\s+/g, " ")
          .trim();

        const patterns = RegexPatterns[this.type];

        let match = null;

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

        this.updateColumns(match.groups);

        logsArray.push({
          ...match.groups,
        });
      } catch (e) {
        logsArray.push({
          error: true,
          raw: line,
          message: e.message,
        });
      }
    }
    return logsArray;
  }
}

export default LogParser;
