// backend/src/routes/reporteRoutes.js
const express = require('express');
const router = express.Router();
const { verificarToken, verificarSuperAdmin } = require('../middleware/auth');
const { exportarExcel, exportarPDF } = require('../controllers/reporteController');

router.use(verificarToken);

router.get('/excel', verificarSuperAdmin, exportarExcel);
router.get('/pdf', verificarSuperAdmin, exportarPDF);

module.exports = router;