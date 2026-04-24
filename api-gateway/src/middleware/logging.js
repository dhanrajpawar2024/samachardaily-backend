const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

/**
 * Morgan format for detailed request logging
 */
const morganFormat =
  '[:date[iso]] :method :url HTTP/:http-version :status :response-time[3]ms Content-Length::res[content-length]';

/**
 * Middleware: Add request ID to all requests
 */
const requestIdMiddleware = (req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * Middleware: Log requests with Morgan
 */
const requestLogger = morgan(morganFormat, {
  skip: (req) => req.path === '/health',
});

/**
 * Middleware: Log slow requests (>500ms)
 */
const slowRequestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 500) {
      console.warn(`[${req.requestId}] SLOW_REQUEST: ${req.method} ${req.path} took ${duration}ms`);
    }
  });

  next();
};

module.exports = {
  requestIdMiddleware,
  requestLogger,
  slowRequestLogger,
};
