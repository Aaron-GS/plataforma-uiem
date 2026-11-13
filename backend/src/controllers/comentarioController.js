// backend/src/controllers/comentarioController.js
const { Comentario, Tarea, Usuario, HistorialTarea, Notificacion } = require('../models');
const { enviarNotificacion } = require('../config/socket');

// Obtener comentarios (ahora filtra por área si se envía el parámetro)
exports.obtenerComentarios = async (req, res) => {
    try {
        const { id } = req.params;
        const { area_id } = req.query; // ✅ Recibimos el área por query
        const usuario = req.usuario;

        let where = { tarea_id: id };
        if (area_id) {
            where.area_id = area_id;
        }

        const comentarios = await Comentario.findAll({
            where,
            include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellidos', 'email'] }],
            order: [['fecha', 'ASC']]
        });

        res.json({ success: true, data: comentarios });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener comentarios', error: error.message });
    }
};

// Crear comentario
exports.crearComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const { contenido, area_id } = req.body; // ✅ Recibimos el área
        const usuario = req.usuario;

        if (!contenido || !contenido.trim()) {
            return res.status(400).json({ success: false, message: 'El contenido es requerido' });
        }

        const tarea = await Tarea.findByPk(id);
        if (!tarea) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });

        const comentario = await Comentario.create({
            tarea_id: id,
            usuario_id: usuario.id,
            area_id: area_id ? parseInt(area_id) : null,
            contenido: contenido.trim()
        });

        await HistorialTarea.create({
            tarea_id: id,
            usuario_id: usuario.id,
            accion: 'comentada',
            descripcion: `Comentario en el área ${area_id || 'general'}: ${contenido.substring(0, 30)}...`
        });

        const comentarioCompleto = await Comentario.findByPk(comentario.id, {
            include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellidos', 'email'] }]
        });

        res.status(201).json({ success: true, data: comentarioCompleto, message: 'Comentario agregado' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear comentario', error: error.message });
    }
};

// Eliminar comentario
exports.eliminarComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;
        const comentario = await Comentario.findByPk(id);

        if (!comentario) return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
        if (usuario.rol !== 'superadmin' && comentario.usuario_id !== usuario.id) {
            return res.status(403).json({ success: false, message: 'No tienes permiso' });
        }

        await comentario.destroy();
        res.json({ success: true, message: 'Comentario eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar comentario', error: error.message });
    }
};