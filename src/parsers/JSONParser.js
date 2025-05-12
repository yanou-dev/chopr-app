import BaseParser from "./BaseParser";

class JSONParser extends BaseParser {
  get id() {
    return "json";
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
    const linesArray = lines.split("\n");
    let logsArray = [];
    for (const line of linesArray) {
      try {
        const data = JSON.parse(line);

        this.updateColumns(data);
        logsArray.push(data);
      } catch {}
    }
    return logsArray;
  }
}

export default JSONParser;
