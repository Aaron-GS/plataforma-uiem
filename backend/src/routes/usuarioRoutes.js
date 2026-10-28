// backend/src/routes/usuarioRoutes.js
const express = require('express');
const router = express.Router();
const {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
} = require('../controllers/usuarioController');
const { verificarToken, verificarSuperAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas públicas (para usuarios autenticados)
router.get('/', obtenerUsuarios);
router.get('/:id', obtenerUsuarioPorId);

// Rutas solo para superadmin
router.post('/', verificarSuperAdmin, crearUsuario);
router.put('/:id', verificarSuperAdmin, actualizarUsuario);
router.delete('/:id', verificarSuperAdmin, eliminarUsuario);

module.exports = router;