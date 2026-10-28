// backend/src/routes/areaRoutes.js
const express = require('express');
const router = express.Router();
const {
    obtenerAreas,
    obtenerAreaPorId,
    crearArea,
    actualizarArea
} = require('../controllers/areaController');
const { verificarToken, verificarSuperAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas públicas (para usuarios autenticados)
router.get('/', obtenerAreas);
router.get('/:id', obtenerAreaPorId);

// Rutas solo para superadmin
router.post('/', verificarSuperAdmin, crearArea);
router.put('/:id', verificarSuperAdmin, actualizarArea);

module.exports = router;