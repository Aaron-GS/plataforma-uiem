// backend/src/routes/tareaRoutes.js
const express = require('express');
const router = express.Router();

// Importar el controlador completo
const tareaController = require('../controllers/tareaController');

// Importar middlewares
const { verificarToken, verificarAdministrador } = require('../middleware/auth');

// Debug: verificar qué funciones existen
console.log('📋 Funciones del controlador:');
console.log('  - crearTarea:', typeof tareaController.crearTarea);
console.log('  - obtenerTareas:', typeof tareaController.obtenerTareas);
console.log('  - obtenerTareaPorId:', typeof tareaController.obtenerTareaPorId);
console.log('  - actualizarTarea:', typeof tareaController.actualizarTarea);
console.log('  - eliminarTarea:', typeof tareaController.eliminarTarea);
console.log('  - reasignarTarea:', typeof tareaController.reasignarTarea);
console.log('  - actualizarEstadoArea:', typeof tareaController.actualizarEstadoArea);
console.log('  - obtenerProgresoTarea:', typeof tareaController.obtenerProgresoTarea);

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas específicas PRIMERO
router.get('/:id/progreso', tareaController.obtenerProgresoTarea);
router.put('/:tareaId/areas/:areaId', tareaController.actualizarEstadoArea);

// Rutas generales
router.post('/', verificarAdministrador, tareaController.crearTarea);
router.get('/', tareaController.obtenerTareas);
router.get('/:id', tareaController.obtenerTareaPorId);
router.put('/:id', tareaController.actualizarTarea);
router.delete('/:id', tareaController.eliminarTarea);
router.put('/:id/reasignar', tareaController.reasignarTarea);

module.exports = router;