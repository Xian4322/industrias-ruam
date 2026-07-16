// ──────────────────────────────────────────────
// Industrias RUAM – Authentication Routes
// ──────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'ruam_secret_key_2026_chinchao_mto';

// POST /login – Public endpoint
router.post('/login', (req, res) => {
  try {
    const db = require('../config/database');
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Se requieren usuario y contraseña.' });
    }

    const user = db.prepare(
      'SELECT id, username, password_hash, role, display_name, daily_wage, is_active FROM users WHERE username = ?'
    ).get(username);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Cuenta desactivada. Contacte al administrador.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      display_name: user.display_name
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    const { password_hash, ...safeUser } = user;

    return res.status(200).json({ token, user: safeUser });
  } catch (error) {
    console.error('Error en POST /login:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /me – Protected endpoint
router.get('/me', authMiddleware, (req, res) => {
  try {
    const db = require('../config/database');
    const user = db.prepare(
      'SELECT id, username, role, display_name, daily_wage, is_active, created_at FROM users WHERE id = ?'
    ).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Error en GET /me:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
