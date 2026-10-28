// backend/src/controllers/comentarioController.js
const { Comentario, Tarea, Usuario, HistorialTarea, Notificacion } = require('../models');
const { enviarNotificacion } = require('../config/socket');

// =============================================
// OBTENER COMENTARIOS (con verificación de permisos)
// =============================================
exports.obtenerComentarios = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;

        const tarea = await Tarea.findByPk(id);
        if (!tarea) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        // =============================================
        // VERIFICAR PERMISOS PARA VER COMENTARIOS
        // =============================================
        let tienePermiso = false;

        if (usuario.rol === 'superadmin') {
            tienePermiso = true;
        } else if (usuario.rol === 'admin_area') {
            tienePermiso = 
                tarea.creada_por === usuario.id ||
                tarea.area_destino_id === usuario.area_id;
        } else {
            tienePermiso = tarea.area_destino_id === usuario.area_id;
        }

        if (!tienePermiso) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver estos comentarios'
            });
        }

    
        const comentarios = await Comentario.findAll({
            where: { tarea_id: id },
            include: [{ 
                model: Usuario, 
                as: 'usuario',
                attributes: ['id', 'nombre', 'apellidos', 'email']
            }],
            order: [['fecha', 'ASC']]
        });

        res.json({
            success: true,
            data: comentarios
        });

    } catch (error) {
        console.error('Error al obtener comentarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener comentarios',
            error: error.message
        });
    }
};

// =============================================
// CREAR COMENTARIO (con verificación de permisos)
// =============================================
exports.crearComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const { contenido } = req.body;
        const usuario = req.usuario;

        if (!contenido || !contenido.trim()) {
            return res.status(400).json({
                success: false,
                message: 'El contenido del comentario es requerido'
            });
        }

        const tarea = await Tarea.findByPk(id);
        if (!tarea) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        // =============================================
        // VERIFICAR PERMISOS PARA COMENTAR
        // =============================================
        let tienePermiso = false;

        if (usuario.rol === 'superadmin') {
            tienePermiso = true;
        } else if (usuario.rol === 'admin_area') {
            tienePermiso = 
                tarea.creada_por === usuario.id ||
                tarea.area_destino_id === usuario.area_id;
        } else {
            tienePermiso = tarea.area_destino_id === usuario.area_id;
        }

        if (!tienePermiso) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para comentar en esta tarea'
            });
        }

        const comentario = await Comentario.create({
            tarea_id: id,
            usuario_id: usuario.id,
            contenido: contenido.trim()
        });

        await HistorialTarea.create({
            tarea_id: id,
            usuario_id: usuario.id,
            accion: 'comentada',
            descripcion: `Comentario: ${contenido.trim().substring(0, 50)}...`
        });

        // 🔔 NOTIFICACIÓN: Al creador de la tarea
        if (tarea.creada_por !== usuario.id) {
            await Notificacion.create({
                usuario_id: tarea.creada_por,
                tarea_id: id,
                tipo: 'comentario',
                mensaje: `💬 Nuevo comentario en la tarea "${tarea.titulo}"`
            });
            
            enviarNotificacion(
                tarea.creada_por,
                'comentario',
                `💬 Nuevo comentario en la tarea "${tarea.titulo}"`,
                id
            );
        }

        // 🔔 NOTIFICACIÓN: Al asignado (si es diferente)
        if (tarea.asignada_a && tarea.asignada_a !== usuario.id && tarea.asignada_a !== tarea.creada_por) {
            await Notificacion.create({
                usuario_id: tarea.asignada_a,
                tarea_id: id,
                tipo: 'comentario',
                mensaje: `💬 Nuevo comentario en la tarea "${tarea.titulo}"`
            });
            
            enviarNotificacion(
                tarea.asignada_a,
                'comentario',
                `💬 Nuevo comentario en la tarea "${tarea.titulo}"`,
                id
            );
        }

        const comentarioCompleto = await Comentario.findByPk(comentario.id, {
            include: [{ 
                model: Usuario, 
                as: 'usuario',
                attributes: ['id', 'nombre', 'apellidos', 'email']
            }]
        });

        res.status(201).json({
            success: true,
            data: comentarioCompleto,
            message: 'Comentario agregado exitosamente'
        });

    } catch (error) {
        console.error('Error al crear comentario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear comentario',
            error: error.message
        });
    }
};

// =============================================
// ELIMINAR COMENTARIO (solo superadmin o autor)
// =============================================
exports.eliminarComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;

        const comentario = await Comentario.findByPk(id);
        if (!comentario) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado'
            });
        }

        // Solo superadmin o quien creó el comentario
        const tienePermiso = 
            usuario.rol === 'superadmin' ||
            comentario.usuario_id === usuario.id;

        if (!tienePermiso) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar este comentario'
            });
        }

        await comentario.destroy();

        res.json({
            success: true,
            message: 'Comentario eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar comentario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar comentario',
            error: error.message
        });
    }
};