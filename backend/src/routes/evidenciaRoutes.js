// backend/src/routes/evidenciaRoutes.js
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const upload = require('../config/upload');
const {
    subirEvidencia,
    obtenerEvidencias,
    descargarEvidencia,
    eliminarEvidencia
} = require('../controllers/evidenciaController');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Subir evidencia a una tarea
router.post('/tareas/:id/evidencias', upload.single('archivo'), subirEvidencia);

// Obtener evidencias de una tarea
router.get('/tareas/:id/evidencias', obtenerEvidencias);

// Descargar evidencia específica
router.get('/evidencias/:id/descargar', descargarEvidencia);

// Eliminar evidencia
router.delete('/evidencias/:id', eliminarEvidencia);

module.exports = router;