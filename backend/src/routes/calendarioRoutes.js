const express = require('express');
const router = express.Router();
const { obtenerEventos, crearEvento, eliminarEvento } = require('../controllers/calendarioController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);

router.get('/eventos', obtenerEventos);
router.post('/eventos', crearEvento);
router.delete('/eventos/:id', eliminarEvento);

module.exports = router;