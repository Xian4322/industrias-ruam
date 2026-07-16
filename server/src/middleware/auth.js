// ──────────────────────────────────────────────
// Industrias RUAM – JWT Authentication Middleware
// ──────────────────────────────────────────────
const jwt  = require('jsonwebtoken');
const path = require('path');

// Load environment variables from the project root .env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'ruam_secret_key_2026_chinchao_mto';

/**
 * Express middleware that validates a JWT Bearer token.
 *
 * - Extracts the token from the `Authorization: Bearer <token>` header.
 * - Verifies the token and attaches the decoded payload to `req.user`.
 * - Returns 401 with a specific message for:
 *     • Missing token
 *     • Expired token
 *     • Invalid / malformed token
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  // ── Missing token ──────────────────────────
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. Token no proporcionado.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // ── Expired token ──────────────────────────
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Por favor, inicie sesión nuevamente.',
      });
    }

    // ── Invalid / malformed token ──────────────
    return res.status(401).json({
      success: false,
      message: 'Token inválido. Autenticación fallida.',
    });
  }
}

module.exports = authMiddleware;
