// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

// =============================================
// VERIFICAR TOKEN JWT
// =============================================
const verificarToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No se proporcionó token de autenticación'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const usuario = await Usuario.findByPk(decoded.id, {
            attributes: { exclude: ['password_hash'] }
        });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (!usuario.activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario desactivado'
            });
        }

        req.usuario = usuario;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }
        console.error('Error en autenticación:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar autenticación'
        });
    }
};

// =============================================
// VERIFICAR SUPERADMIN (RECTORÍA, ADMÓN Y FINANZAS)
// =============================================
const verificarSuperAdmin = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado'
        });
    }

    if (req.usuario.rol !== 'superadmin') {
        return res.status(403).json({
            success: false,
            message: 'Se requieren permisos de superadministrador'
        });
    }

    next();
};

// =============================================
// VERIFICAR ADMINISTRADOR (puede crear/asignar tareas)
// =============================================
const verificarAdministrador = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado'
        });
    }

    const rolesPermitidos = ['superadmin', 'admin_area', 'encargado'];
    
    if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
            success: false,
            message: 'Solo los administradores pueden crear y asignar tareas'
        });
    }

    next();
};

// =============================================
// EXPORTAR MIDDLEWARES
// =============================================
module.exports = {
    verificarToken,
    verificarSuperAdmin,
    verificarAdministrador
};