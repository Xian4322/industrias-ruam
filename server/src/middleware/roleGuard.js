// ──────────────────────────────────────────────
// Industrias RUAM – Role Guard Middleware
// ──────────────────────────────────────────────

/**
 * Factory function that returns an Express middleware.
 *
 * The middleware checks whether the authenticated user's role
 * (stored in `req.user.role` by the auth middleware) is included
 * in the list of `allowedRoles`.
 *
 * @param {string[]} allowedRoles – Array of role names that are
 *   permitted to access the route (e.g. ['admin', 'gerente']).
 * @returns {Function} Express middleware.
 *
 * Usage:
 *   router.get('/admin-only', authMiddleware, roleGuard(['admin']), handler);
 */
function roleGuard(allowedRoles) {
  return function (req, res, next) {
    // If auth middleware didn't attach a user, reject immediately.
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. No se pudo determinar el rol del usuario.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}.`,
      });
    }

    next();
  };
}

module.exports = roleGuard;
