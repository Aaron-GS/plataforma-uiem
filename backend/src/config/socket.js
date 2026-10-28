// backend/src/config/socket.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

let io;

const initSocket = (server) => {
    io = socketIO(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Middleware de autenticación
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Token no proporcionado'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const usuario = await Usuario.findByPk(decoded.id);
            
            if (!usuario || !usuario.activo) {
                return next(new Error('Usuario no válido'));
            }

            socket.usuario = usuario;
            socket.usuarioId = usuario.id;
            socket.areaId = usuario.area_id;
            socket.rol = usuario.rol;
            
            next();
        } catch (error) {
            next(new Error('Autenticación fallida'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ Usuario conectado: ${socket.usuario.email}`);
        
        socket.join(`user_${socket.usuarioId}`);
        socket.join(`area_${socket.areaId}`);
        
        if (socket.rol === 'superadmin') {
            socket.join('superadmin_room');
        }

        socket.on('disconnect', () => {
            console.log(`❌ Usuario desconectado: ${socket.usuario.email}`);
        });
    });

    return io;
};

const enviarNotificacion = (usuarioId, tipo, mensaje, tareaId = null, datos = null) => {
    if (!io) return;
    
    io.to(`user_${usuarioId}`).emit('nueva_notificacion', {
        tipo,
        mensaje,
        tarea_id: tareaId,
        fecha: new Date(),
        leida: false,
        datos
    });
};

const notificarSuperAdmins = (evento, data) => {
    if (!io) return;
    io.to('superadmin_room').emit(evento, data);
};

module.exports = {
    initSocket,
    io,
    enviarNotificacion,
    notificarSuperAdmins
};