const jwt = require('jsonwebtoken');

/**
 * Verify JWT token from Authorization header
 * Expects: Authorization: Bearer <token>
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Middleware: Verify JWT token
 * Sets req.user with decoded token payload
 */
const jwtMiddleware = (req, res, next) => {
  const method = req.method;
  const path = req.path;

  // Always public
  if (path === '/health') return next();
  if (path.startsWith('/api/v1/auth')) return next();

  // Public read-only endpoints (GET without token → guest mode)
  const isPublicRead = method === 'GET' && (
    path.startsWith('/api/v1/categories') ||
    path.startsWith('/api/v1/articles') ||
    path.startsWith('/api/v1/feed') ||
    path.startsWith('/api/v1/search') ||
    path.startsWith('/api/v1/recommendations')
  );

  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    if (isPublicRead) return next(); // guest access allowed
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
    if (isPublicRead) return next(); // degraded — serve without user context
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
