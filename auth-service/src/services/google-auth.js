const { OAuth2Client } = require('google-auth-library');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/postgres');
const { set: redisSet } = require('../db/redis');
const { generateAccessToken, generateRefreshToken } = require('../middleware/jwt');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID Token
 * @param {string} idToken - Google ID token from client
 * @returns {Object} Decoded token with user info
 */
const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    throw new Error(`Google token verification failed: ${error.message}`);
  }
};

/**
 * Handle Google OAuth login
 * Creates or updates user in database
 * @param {Object} googlePayload - Decoded Google token
 * @returns {Object} { user, accessToken, refreshToken }
 */
const handleGoogleLogin = async (googlePayload) => {
  const { sub: providerId, email, name, picture } = googlePayload;

  // Check if user exists
  let user = await query(
    'SELECT id, email, name, avatar_url FROM users WHERE provider = $1 AND provider_id = $2',
    ['google', providerId]
  ).then(r => r.rows[0]);

  if (!user) {
    // Create new user
    const userId = uuidv4();
    const result = await query(
      `INSERT INTO users (id, email, name, avatar_url, provider, provider_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, email, name, avatar_url, created_at`,
      [userId, email, name, picture, 'google', providerId]
    );
    user = result.rows[0];
    console.log(`[Auth] New user created: ${email}`);
  } else {
    // Update last login & avatar
    await query(
      'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
      [picture, user.id]
    );
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token in Redis (for revocation/logout)
  await redisSet(
    `refresh_token:${user.id}:${refreshToken}`,
    JSON.stringify({ email: user.email, issuedAt: new Date().toISOString() }),
    7 * 24 * 60 * 60 // 7 days
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
    },
    accessToken,
    refreshToken,
  };
};

module.exports = {
  verifyGoogleToken,
  handleGoogleLogin,
};
