/**
 * Structured logger for the scraper service
 */

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LEVELS[LOG_LEVEL] ?? 1;

const ts = () => new Date().toISOString();

const log = (level, msg, meta) => {
  if (LEVELS[level] < currentLevel) return;
  const line = meta
    ? `[${ts()}] [${level.toUpperCase()}] ${msg} ${JSON.stringify(meta)}`
    : `[${ts()}] [${level.toUpperCase()}] ${msg}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
};

module.exports = {
  debug: (msg, meta) => log('debug', msg, meta),
  info:  (msg, meta) => log('info',  msg, meta),
  warn:  (msg, meta) => log('warn',  msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};

