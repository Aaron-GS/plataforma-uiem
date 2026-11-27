// backend/src/routes/calendarioRoutes.js
const express = require('express');
const router = express.Router();
const { 
    obtenerEventos, 
    crearEvento, 
    actualizarEvento, // ✅ Importamos
    eliminarEvento 
} = require('../controllers/calendarioController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);

router.get('/eventos', obtenerEventos);
router.post('/eventos', crearEvento);
router.put('/eventos/:id', actualizarEvento); // ✅ Nueva ruta
router.delete('/eventos/:id', eliminarEvento);

module.exports = router;