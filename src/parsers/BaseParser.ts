/**
 * Type definition for event listener functions
 */
type EventListener = (data: any) => void;

/**
 * Interface for storing event listeners by event name
 */
interface EventListeners {
  [eventName: string]: EventListener[];
}

/**
 * Abstract base class for all log parsers
 * Provides common functionality for event handling and defines the interface
 * that all concrete parser implementations must follow.
 */
abstract class BaseParser {
  protected _eventListeners: EventListeners;

  constructor() {
    if (this.constructor === BaseParser) {
      throw new Error(
        "Abstract class BaseParser cannot be instantiated directly"
      );
    }
    this._eventListeners = {};
  }

  /**
   * Register an event listener for the specified event
   * @param eventName - Name of the event to listen for
   * @param callback - Function to call when the event is emitted
   * @returns this - For method chaining
   */
  on(eventName: string, callback: EventListener): this {
    if (!this._eventListeners[eventName]) {
      this._eventListeners[eventName] = [];
    }
    this._eventListeners[eventName].push(callback);
    return this;
  }

  /**
   * Remove an event listener for the specified event
   * @param eventName - Name of the event
   * @param callback - Function to remove from listeners
   * @returns this - For method chaining
   */
  off(eventName: string, callback: EventListener): this {
    if (this._eventListeners[eventName]) {
      this._eventListeners[eventName] = this._eventListeners[eventName].filter(
        (listener) => listener !== callback
      );
    }
    return this;
  }

  /**
   * Emit an event with data to all registered listeners
   * @param eventName - Name of the event to emit
   * @param data - Data to pass to the listeners
   * @returns this - For method chaining
   */
  emit(eventName: string, data: any): this {
    if (this._eventListeners[eventName]) {
      this._eventListeners[eventName].forEach((callback) => callback(data));
    }
    return this;
  }

  /**
   * Get the unique identifier for this parser
   */
  abstract get id(): string;

  /**
   * Get the column definitions for logs parsed by this parser
   * @returns Array of column definitions
   */
  abstract getColumns(): Column[];

  /**
   * Parse log lines into structured log entries
   * @param lines - String containing one or more log lines
   * @returns Array of parsed log entries
   */
  abstract parseLines(lines: string): LogEntry[];
}

/**
 * Column definition for displaying log data in a table
 */
export interface Column {
  id: string;
  label: string;
  width: number | string;
}

/**
 * Structured log entry with standard and custom fields
 */
export interface LogEntry {
  id?: string;
  level?: string;
  message?: string;
  timestamp?: string;
  rawTimestamp?: string;
  rawLog?: string;
  error?: boolean;
  raw?: string;
  [key: string]: any;
}

export default BaseParser;
