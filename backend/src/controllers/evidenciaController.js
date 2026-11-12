// backend/src/controllers/evidenciaController.js
const { Evidencia, Tarea, Usuario, HistorialTarea } = require('../models');
const path = require('path');
const fs = require('fs');

// Subir evidencia
exports.subirEvidencia = async (req, res) => {
    try {
        const { id } = req.params;
        const { area_id } = req.body; // ✅ Recibimos el área
        const usuario = req.usuario;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se recibió archivo' });
        }

        const tarea = await Tarea.findByPk(id);
        if (!tarea) {
            return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        }

        const evidencia = await Evidencia.create({
            tarea_id: id,
            usuario_id: usuario.id,
            area_id: area_id ? parseInt(area_id) : null, // ✅ Guardamos el ID del área
            nombre_archivo: req.file.originalname,
            ruta_archivo: req.file.path,
            tipo_archivo: req.file.mimetype,
            tamaño: req.file.size
        });

        await HistorialTarea.create({
            tarea_id: id,
            usuario_id: usuario.id,
            accion: 'evidencia_subida',
            descripcion: `Se subió evidencia para el área`
        });

        res.status(201).json({ success: true, data: evidencia, message: 'Evidencia subida' });
    } catch (error) {
        console.error('Error al subir evidencia:', error);
        res.status(500).json({ success: false, message: 'Error al subir evidencia', error: error.message });
    }
};

// Obtener evidencias de una tarea
exports.obtenerEvidencias = async (req, res) => {
    try {
        const { id } = req.params;
        
        const evidencias = await Evidencia.findAll({
            where: { tarea_id: id },
            include: [{ model: Usuario, as: 'subido_por', attributes: ['nombre', 'apellidos'] }],
            order: [['fecha_subida', 'DESC']]
        });

        res.json({ success: true, data: evidencias });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener evidencias', error: error.message });
    }
};

// Descargar evidencia
exports.descargarEvidencia = async (req, res) => {
    try {
        const { id } = req.params;
        const evidencia = await Evidencia.findByPk(id);

        if (!evidencia || !fs.existsSync(evidencia.ruta_archivo)) {
            return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
        }

        res.download(evidencia.ruta_archivo, evidencia.nombre_archivo);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al descargar', error: error.message });
    }
};

// Eliminar evidencia
exports.eliminarEvidencia = async (req, res) => {
    try {
        const { id } = req.params;
        const evidencia = await Evidencia.findByPk(id);

        if (!evidencia) {
            return res.status(404).json({ success: false, message: 'Evidencia no encontrada' });
        }

        if (fs.existsSync(evidencia.ruta_archivo)) {
            fs.unlinkSync(evidencia.ruta_archivo);
        }

        await evidencia.destroy();
        res.json({ success: true, message: 'Evidencia eliminada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar', error: error.message });
    }
};