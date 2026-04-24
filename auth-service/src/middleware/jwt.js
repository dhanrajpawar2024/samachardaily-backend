const jwt = require('jsonwebtoken');

/**
 * Verify JWT token from Authorization header
 * Usage: app.use(verifyToken)
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      code: 'MISSING_TOKEN',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    }
    req.user = decoded;
    next();
  });
};

/**
 * Optional token verification - doesn't fail if token is missing
 * Usage: app.use(optionalVerifyToken)
 */
const optionalVerifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (!err) {
        req.user = decoded;
      }
    });
  }

  next();
};

/**
 * Generate access token (short-lived)
 */
const generateAccessToken = (userId, email) => {
  return jwt.sign(
    { userId, email, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m' }
  );
};

/**
 * Generate refresh token (long-lived)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d' }
  );
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    return null;
  }
};

module.exports = {
  verifyToken,
  optionalVerifyToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
};
