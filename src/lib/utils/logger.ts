const isProd = process.env.NODE_ENV === 'production';

export const logger = {
  debug: (...args: unknown[]) => {
    if (!isProd) console.debug('[DEBUG]', ...args as []);
  },
  info: (...args: unknown[]) => {
    if (!isProd) console.info('[INFO ]', ...args as []);
  },
  warn: (...args: unknown[]) => console.warn('[WARN ]', ...args as []),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args as []),
};

export default logger;


