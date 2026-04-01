export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Public logger API (avoids private class members in exported types). */
export interface ILogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  child(context: Record<string, unknown>): ILogger;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  tenantId?: string;
  agentId?: string;
}

class Logger implements ILogger {
  private readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private format(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { service: this.serviceName, ...context },
    };
  }

  private output(entry: LogEntry): void {
    const line = JSON.stringify(entry);
    if (entry.level === 'error' || entry.level === 'warn') {
      console.error(line);
    } else {
      console.log(line);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.LOG_LEVEL === 'debug') {
      this.output(this.format('debug', message, context));
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.output(this.format('info', message, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.output(this.format('warn', message, context));
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.output(this.format('error', message, context));
  }

  child(context: Record<string, unknown>): ILogger {
    const child = new Logger(this.serviceName);
    const originalFormat = child.format.bind(child);
    child['format'] = (level: LogLevel, message: string, ctx?: Record<string, unknown>) =>
      originalFormat(level, message, { ...context, ...ctx });
    return child;
  }
}

export function createLogger(serviceName: string): ILogger {
  return new Logger(serviceName);
}
