const jwt = require('jsonwebtoken');

/**
 * Verify JWT token from Authorization header
 * Expects: Authorization: Bearer <token>
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Middleware: Verify JWT token.
 * Sets req.user with decoded token payload.
 */
const jwtMiddleware = (req, res, next) => {
  const method = req.method;
  const path = req.path;
  const originalPath = (req.originalUrl || '').split('?')[0];
  const matchesPath = (prefix) => path.startsWith(prefix) || originalPath.startsWith(prefix);
  const isAdsActiveRead = method === 'GET' && (
    path === '/active' ||
    path.startsWith('/active') ||
    path.includes('/ads/active') ||
    originalPath.includes('/ads/active')
  );

  // Always public.
  if (path === '/health' || originalPath === '/health') return next();
  if (matchesPath('/api/v1/auth')) return next();

  // Public endpoints that can serve guest users.
  const isPublicRead = method === 'GET' && (
    matchesPath('/api/v1/categories') ||
    matchesPath('/api/v1/articles') ||
    matchesPath('/api/v1/ads/active') ||
    path.startsWith('/ads/active') ||
    originalPath.startsWith('/ads/active') ||
    isAdsActiveRead ||
    matchesPath('/api/v1/feed') ||
    matchesPath('/api/v1/search') ||
    matchesPath('/api/v1/recommendations')
  );
  const isPublicArticleView = method === 'POST' && /^\/api\/v1\/articles\/[^/]+\/view$/.test(path);
  const allowGuest = isPublicRead || isPublicArticleView;

  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    if (allowGuest) return next();
    return res.status(401).json({
      success: false,
      error: 'Missing authorization token',
      code: 'MISSING_TOKEN',
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    req.userId = decoded.userId || decoded.sub;
    next();
  } catch (error) {
    if (allowGuest) return next();
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
  }
};

module.exports = {
  jwtMiddleware,
  verifyToken,
};
