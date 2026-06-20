import { StorageManager } from "./storage";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEvent {
  level: LogLevel;
  type: string;
  message: string;
  data?: any;
  timestamp: string;
  span?: string;
  agentId?: string;
  sessionId?: string;
}

/**
 * Scoped Logger instance.
 */
export class ScopedLogger {
  constructor(private span: string) {}

  info(message: string, data?: any) {
    Logger.info(message, data, this.span);
  }

  error(message: string, data?: any) {
    Logger.error(message, data, this.span);
  }

  warn(message: string, data?: any) {
    Logger.warn(message, data, this.span);
  }

  debug(message: string, data?: any) {
    Logger.debug(message, data, this.span);
  }
}

/**
 * Global Logger for AgentTeam Engine.
 */
export class Logger {
  private static level: LogLevel = LogLevel.INFO;

  static setLevel(level: LogLevel | string) {
    if (typeof level === "string") {
      const upper = level.toUpperCase() as keyof typeof LogLevel;
      if (LogLevel[upper] !== undefined) {
        this.level = LogLevel[upper] as unknown as LogLevel;
      }
    } else {
      this.level = level;
    }
  }

  /**
   * Creates a logger for a specific span/scope.
   */
  static scope(name: string): ScopedLogger {
    return new ScopedLogger(name);
  }

  static info(message: string, data?: any, span: string = "global") {
    this.log(LogLevel.INFO, message, data, span);
  }

  static error(message: string, data?: any, span: string = "global") {
    this.log(LogLevel.ERROR, message, data, span);
  }

  static warn(message: string, data?: any, span: string = "global") {
    this.log(LogLevel.WARN, message, data, span);
  }

  static debug(message: string, data?: any, span: string = "global") {
    this.log(LogLevel.DEBUG, message, data, span);
  }

  private static log(
    level: LogLevel,
    message: string,
    data?: any,
    span: string = "global"
  ) {
    if (level < this.level) return;

    const timestamp = new Date().toISOString();
    const levelString = LogLevel[level].padEnd(5);
    
    let line = `[${timestamp}] (${span}) ${levelString} - ${message}`;
    let separateData = data;

    if (data !== undefined) {
      if (typeof data === 'string') {
        line += ` ${data}`;
        separateData = undefined;
      } else if (typeof data === 'object' && data !== null) {
        try {
          const str = JSON.stringify(data);
          if (str.length < 100) {
            line += ` ${str}`;
            separateData = undefined;
          }
        } catch (e) {}
      }
    }

    if (level === LogLevel.ERROR) {
      console.error(line);
      if (separateData) console.error(separateData);
    } else {
      console.log(line);
      if (separateData) console.log(separateData);
    }
  }
}

/**
 * A lightweight logger tied to a specific session.
 * Logs are appended to session.json but also piped to the global Logger.
 */
export class SessionLogger {
  private logs: LogEvent[] = [];

  constructor(
    private storage: StorageManager,
    private agentId: string,
    private sessionId: string
  ) {}

  async log(type: string, message: string, data?: any, level: LogLevel = LogLevel.INFO) {
    const timestamp = new Date().toISOString();
    const event: LogEvent = {
      level,
      type,
      message,
      data,
      timestamp,
      agentId: this.agentId,
      sessionId: this.sessionId,
      span: "agent",
    };

    this.logs.push(event);

    const span = `agent:${this.agentId}`;
    switch (level) {
      case LogLevel.ERROR:
        Logger.error(message, data, span);
        break;
      case LogLevel.WARN:
        Logger.warn(message, data, span);
        break;
      case LogLevel.DEBUG:
        Logger.debug(message, data, span);
        break;
      default:
        Logger.info(message, data, span);
    }
  }

  /**
   * Appends an external event directly (e.g. from Vercel AI SDK).
   */
  appendEvent(event: LogEvent) {
    this.logs.push(event);
  }

  getEvents(): LogEvent[] {
    return this.logs;
  }
}
