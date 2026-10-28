// backend/src/controllers/usuarioController.js
const { Usuario, Area } = require('../models');

// =============================================
// OBTENER TODOS LOS USUARIOS (con filtro por área)
// =============================================
exports.obtenerUsuarios = async (req, res) => {
    try {
        const { area_id, activo } = req.query;
        
        let where = {};
        if (area_id) where.area_id = area_id;
        if (activo !== undefined) where.activo = activo === 'true';
        
        const usuarios = await Usuario.findAll({
            where,
            include: [
                { 
                    model: Area, 
                    as: 'area', 
                    attributes: ['id', 'nombre', 'categoria'] 
                }
            ],
            attributes: { exclude: ['password_hash'] },
            order: [['nombre', 'ASC']]
        });

        res.json({
            success: true,
            data: usuarios
        });

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los usuarios',
            error: error.message
        });
    }
};

// =============================================
// OBTENER UN USUARIO POR ID
// =============================================
exports.obtenerUsuarioPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        const usuario = await Usuario.findByPk(id, {
            include: [
                { 
                    model: Area, 
                    as: 'area', 
                    attributes: ['id', 'nombre', 'categoria'] 
                }
            ],
            attributes: { exclude: ['password_hash'] }
        });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: usuario
        });

    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el usuario',
            error: error.message
        });
    }
};

// =============================================
// CREAR USUARIO (solo superadmin)
// =============================================
exports.crearUsuario = async (req, res) => {
    try {
        const { nombre, apellidos, email, password, area_id, rol } = req.body;
        const usuario = req.usuario;

        // Solo superadmin puede crear usuarios
        if (usuario.rol !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para crear usuarios'
            });
        }

        // Verificar si el email ya existe
        const existe = await Usuario.findOne({ where: { email } });
        if (existe) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un usuario con ese email'
            });
        }

        const nuevoUsuario = await Usuario.create({
            nombre,
            apellidos,
            email: email.toLowerCase().trim(),
            password_hash: password, // El hook se encarga de hashearlo
            area_id,
            rol: rol || 'ejecutor',
            activo: true
        });

        // Quitar password_hash de la respuesta
        const usuarioData = nuevoUsuario.toJSON();

        res.status(201).json({
            success: true,
            data: usuarioData,
            message: 'Usuario creado exitosamente'
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el usuario',
            error: error.message
        });
    }
};

// =============================================
// ACTUALIZAR USUARIO (solo superadmin o propio)
// =============================================
exports.actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellidos, email, area_id, rol, activo } = req.body;
        const usuario = req.usuario;

        const usuarioExistente = await Usuario.findByPk(id);
        if (!usuarioExistente) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar permisos: superadmin o el mismo usuario
        if (usuario.rol !== 'superadmin' && usuario.id !== parseInt(id)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para actualizar este usuario'
            });
        }

        // Si no es superadmin, no puede cambiar rol ni area
        if (usuario.rol !== 'superadmin') {
            await usuarioExistente.update({
                nombre: nombre || usuarioExistente.nombre,
                apellidos: apellidos || usuarioExistente.apellidos,
                email: email || usuarioExistente.email
            });
        } else {
            await usuarioExistente.update({
                nombre: nombre || usuarioExistente.nombre,
                apellidos: apellidos || usuarioExistente.apellidos,
                email: email || usuarioExistente.email,
                area_id: area_id || usuarioExistente.area_id,
                rol: rol || usuarioExistente.rol,
                activo: activo !== undefined ? activo : usuarioExistente.activo
            });
        }

        const usuarioData = usuarioExistente.toJSON();

        res.json({
            success: true,
            data: usuarioData,
            message: 'Usuario actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el usuario',
            error: error.message
        });
    }
};

// =============================================
// ELIMINAR USUARIO (solo superadmin)
// =============================================
exports.eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;

        if (usuario.rol !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para eliminar usuarios'
            });
        }

        const usuarioExistente = await Usuario.findByPk(id);
        if (!usuarioExistente) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // No permitir eliminar a sí mismo
        if (usuario.id === parseInt(id)) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propio usuario'
            });
        }

        await usuarioExistente.destroy();

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el usuario',
            error: error.message
        });
    }
};