type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogFields {
  [key: string]: unknown;
}

function shouldLog(level: LogLevel): boolean {
  if (process.env.NODE_ENV === 'production') {
    return level !== 'debug';
  }
  return true;
}

function write(level: LogLevel, message: string, fields?: LogFields) {
  if (!shouldLog(level)) return;

  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...sanitize(fields),
  };

  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    // eslint-disable-next-line no-console -- structured logger
    console.log(line);
  }
}

function sanitize(fields?: LogFields): LogFields | undefined {
  if (!fields) return undefined;
  const blocked = new Set(['password', 'token', 'authorization', 'cookie', 'secret']);
  const out: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (blocked.has(key.toLowerCase())) {
      out[key] = '[redacted]';
    } else {
      out[key] = value;
    }
  }
  return out;
}

export const logger = {
  debug: (message: string, fields?: LogFields) => write('debug', message, fields),
  info: (message: string, fields?: LogFields) => write('info', message, fields),
  warn: (message: string, fields?: LogFields) => write('warn', message, fields),
  error: (message: string, fields?: LogFields) => write('error', message, fields),
};
