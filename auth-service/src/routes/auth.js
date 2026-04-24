const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/jwt');
const { verifyGoogleToken, handleGoogleLogin } = require('../services/google-auth');
const { generateAccessToken, verifyRefreshToken } = require('../middleware/jwt');
const { get: redisGet, del: redisDel } = require('../db/redis');
const { query } = require('../db/postgres');

const router = express.Router();

/**
 * POST /api/v1/auth/google
 * Google OAuth login endpoint
 * Body: { idToken: "google-id-token" }
 */
router.post('/google', [
  body('idToken').notEmpty().withMessage('idToken is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { idToken } = req.body;
    
    // Verify Google token
    const googlePayload = await verifyGoogleToken(idToken);
    
    // Handle login (create/update user)
    const { user, accessToken, refreshToken } = await handleGoogleLogin(googlePayload);

    res.status(200).json({
      success: true,
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 15 * 60, // 15 minutes in seconds
        },
      },
    });
  } catch (error) {
    console.error('[Auth] Google login error:', error);
    res.status(401).json({
      error: error.message || 'Google authentication failed',
      code: 'GOOGLE_AUTH_FAILED',
    });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 * Body: { refreshToken: "refresh-token" }
 */
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('refreshToken is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    // Check if token exists in Redis (not revoked)
    const tokenData = await redisGet(`refresh_token:${decoded.userId}:${refreshToken}`);
    if (!tokenData) {
      return res.status(401).json({
        error: 'Refresh token has been revoked',
        code: 'TOKEN_REVOKED',
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(decoded.userId, tokenData.email);

    res.status(200).json({
      success: true,
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken,
          expiresIn: 15 * 60,
        },
        accessToken: newAccessToken,
        refreshToken,
        expiresIn: 15 * 60,
      },
    });
  } catch (error) {
    console.error('[Auth] Refresh token error:', error);
    res.status(401).json({
      error: 'Token refresh failed',
      code: 'REFRESH_FAILED',
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout by revoking refresh token
 * Requires: Authorization: Bearer <accessToken>
 */
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const refreshToken = req.body.refreshToken;

    if (refreshToken) {
      await redisDel(`refresh_token:${userId}:${refreshToken}`);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_FAILED',
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user info
 * Requires: Authorization: Bearer <accessToken>
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await query(
      `SELECT id, email, phone, name, avatar_url, preferred_languages, created_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [req.user.userId]
    ).then(result => result.rows[0]);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('[Auth] Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user info',
      code: 'GET_USER_FAILED',
    });
  }
});

module.exports = router;
