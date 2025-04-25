class BaseParser {
  constructor() {
    if (this.constructor === BaseParser) {
      throw new Error(
        "La classe abstraite BaseParser ne peut pas être instanciée directement"
      );
    }
    this._eventListeners = {};
  }

  on(eventName, callback) {
    if (!this._eventListeners[eventName]) {
      this._eventListeners[eventName] = [];
    }
    this._eventListeners[eventName].push(callback);
    return this;
  }

  off(eventName, callback) {
    if (this._eventListeners[eventName]) {
      this._eventListeners[eventName] = this._eventListeners[eventName].filter(
        (listener) => listener !== callback
      );
    }
    return this;
  }

  emit(eventName, data) {
    if (this._eventListeners[eventName]) {
      this._eventListeners[eventName].forEach((callback) => callback(data));
    }
    return this;
  }

  get id() {
    throw new Error("La méthode id() doit être implémentée");
  }

  getColumns() {
    throw new Error("La méthode getColumns() doit être implémentée");
  }

  parseLines(lines) {
    throw new Error("La méthode parseLines() doit être implémentée");
  }
}

export default BaseParser;
