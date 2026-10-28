// backend/src/controllers/authController.js
const { Usuario } = require('../models');
const jwt = require('jsonwebtoken');

// Generar token JWT
const generarToken = (usuario) => {
    return jwt.sign(
        {
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol,
            area_id: usuario.area_id
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        const usuario = await Usuario.findOne({
            where: {
                email: email.toLowerCase().trim(),
                activo: true
            },
            include: ['area']
        });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        const passwordValido = await usuario.validarPassword(password);
        if (!passwordValido) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        await usuario.update({ ultimo_acceso: new Date() });

        const token = generarToken(usuario);
        const usuarioData = usuario.toJSON();

        res.json({
            success: true,
            data: {
                token,
                usuario: usuarioData
            },
            message: 'Login exitoso'
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

// Obtener perfil
exports.obtenerPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.usuario.id, {
            include: ['area']
        });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: usuario.toJSON()
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil',
            error: error.message
        });
    }
};