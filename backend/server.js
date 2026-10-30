// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);

// =============================================
// CONFIGURACIÓN DE MIDDLEWARES
// =============================================
// ✅ Permitir conexiones desde local y desde la IP del servidor
const corsOptions = {
    origin: [
        'http://localhost:5173',       // Para pruebas locales
        'http://172.16.100.30:8080'    // Para producción en el servidor
    ],
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (evidencias)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =============================================
// IMPORTAR RUTAS
// =============================================
const authRoutes = require('./src/routes/authRoutes');
const areaRoutes = require('./src/routes/areaRoutes');
const tareaRoutes = require('./src/routes/tareaRoutes');
const evidenciaRoutes = require('./src/routes/evidenciaRoutes');
const comentarioRoutes = require('./src/routes/comentarioRoutes');
const reporteRoutes = require('./src/routes/reporteRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const calendarioRoutes = require('./src/routes/calendarioRoutes');

// =============================================
// USAR RUTAS
// =============================================
app.use('/api/auth', authRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/tareas', tareaRoutes);
app.use('/api', evidenciaRoutes);
app.use('/api', comentarioRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/calendario', calendarioRoutes);


// =============================================
// RUTA DE PRUEBA
// =============================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API PLATAFORMA UIEM funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// =============================================
// INICIALIZAR SOCKET.IO
// =============================================
const { initSocket } = require('./src/config/socket');
const io = initSocket(server);
module.exports.io = io;

// =============================================
// MANEJO DE ERRORES GLOBAL
// =============================================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// =============================================
// INICIAR SERVIDOR
// =============================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor PLATAFORMA UIEM corriendo en http://localhost:${PORT}`);
    console.log(`📡 API disponible en http://localhost:${PORT}/api`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔌 WebSocket habilitado para notificaciones en tiempo real`);
});