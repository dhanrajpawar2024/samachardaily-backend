const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter: 100 requests per 15 minutes per IP
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  },
});

/**
 * Strict rate limiter for auth endpoints: 5 requests per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user identifier if authenticated, otherwise by IP
    return req.user?.userId || req.ip;
  },
});

/**
 * Search rate limiter: 50 requests per minute
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  message: 'Too many search requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Notification rate limiter: 30 requests per minute
 */
const notificationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many notification requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Feed rate limiter: 60 requests per minute
 */
const feedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many feed requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  authLimiter,
  searchLimiter,
  notificationLimiter,
  feedLimiter,
};
