import type { ServerConfig } from './config';

export type LogEvent = {
  event: string;
  requestId?: string;
  route?: string;
  status?: number;
  durationMs?: number;
  errorCode?: string;
};

export type Logger = {
  info(event: LogEvent): void;
  error(event: LogEvent): void;
};

export function createLogger(
  config: ServerConfig,
  sink: (line: string) => void = console.log,
): Logger {
  const write = (level: 'info' | 'error', event: LogEvent) => {
    if (config.environment === 'production') sink(JSON.stringify(event));
    else sink(`[${level}] ${event.event}${event.route ? ` ${event.route}` : ''}`);
  };
  return {
    info: (event) => write('info', event),
    error: (event) => write('error', event),
  };
}
