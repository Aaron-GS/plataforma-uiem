// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { login, obtenerPerfil } = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

// Rutas públicas
router.post('/login', login);

// Rutas protegidas
router.get('/perfil', verificarToken, obtenerPerfil);

module.exports = router;