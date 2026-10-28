// backend/src/routes/comentarioRoutes.js
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const {
    obtenerComentarios,
    crearComentario,
    eliminarComentario
} = require('../controllers/comentarioController');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Obtener comentarios de una tarea
router.get('/tareas/:id/comentarios', obtenerComentarios);

// Crear comentario en una tarea
router.post('/tareas/:id/comentarios', crearComentario);

// Eliminar comentario
router.delete('/comentarios/:id', eliminarComentario);

module.exports = router;