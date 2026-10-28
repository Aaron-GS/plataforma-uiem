// backend/src/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { obtenerEstadisticas } = require('../controllers/dashboardController');
const { verificarToken, verificarSuperAdmin } = require('../middleware/auth');

router.use(verificarToken);
router.get('/estadisticas', verificarSuperAdmin, obtenerEstadisticas);

module.exports = router;