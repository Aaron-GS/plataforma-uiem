// backend/src/controllers/evidenciaController.js
const { Evidencia, Tarea, Usuario, HistorialTarea } = require('../models');
const path = require('path');
const fs = require('fs');

// Subir evidencia
// En tu backend/src/controllers/evidenciaController.js
exports.subirEvidencia = async (req, res) => {
    try {
        const { id } = req.params; // ID de la tarea
        const usuario = req.usuario;

        console.log('📥 Recibiendo archivo para tarea:', id);

        if (!req.file) {
            console.error('❌ Error: req.file es nulo. El archivo no llegó.');
            return res.status(400).json({
                success: false,
                message: 'No se recibió ningún archivo'
            });
        }

        // Verificar que la tarea existe
        const tarea = await Tarea.findByPk(id);
        if (!tarea) {
            return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        }

        // Guardar en base de datos
        const evidencia = await Evidencia.create({
            tarea_id: id,
            usuario_id: usuario.id,
            nombre_archivo: req.file.originalname,
            ruta_archivo: req.file.path,
            tipo_archivo: req.file.mimetype,
            tamaño: req.file.size
        });

        console.log('✅ Archivo guardado en BD:', evidencia.nombre_archivo);

        // Registrar en historial
        await HistorialTarea.create({
            tarea_id: id,
            usuario_id: usuario.id,
            accion: 'evidencia_subida',
            descripcion: `Se subió evidencia: ${req.file.originalname}`
        });

        res.status(201).json({
            success: true,
            data: evidencia,
            message: 'Evidencia subida exitosamente'
        });

    } catch (error) {
        console.error('❌ Error en subirEvidencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al subir la evidencia',
            error: error.message
        });
    }
};

// Obtener evidencias de una tarea
exports.obtenerEvidencias = async (req, res) => {
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

        const tienePermiso = 
            usuario.rol === 'superadmin' ||
            tarea.creada_por === usuario.id ||
            tarea.asignada_a === usuario.id ||
            tarea.area_destino_id === usuario.area_id;

        if (!tienePermiso) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver estas evidencias'
            });
        }

        const evidencias = await Evidencia.findAll({
            where: { tarea_id: id },
            include: [{ 
                model: Usuario, 
                as: 'subido_por',
                attributes: ['nombre', 'apellidos', 'email']
            }],
            order: [['fecha_subida', 'DESC']]
        });

        res.json({
            success: true,
            data: evidencias
        });

    } catch (error) {
        console.error('Error al obtener evidencias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener evidencias',
            error: error.message
        });
    }
};

// Descargar evidencia
exports.descargarEvidencia = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;

        const evidencia = await Evidencia.findByPk(id, {
            include: ['tarea']
        });

        if (!evidencia) {
            return res.status(404).json({
                success: false,
                message: 'Evidencia no encontrada'
            });
        }

        const tarea = evidencia.tarea;
        const tienePermiso = 
            usuario.rol === 'superadmin' ||
            tarea.creada_por === usuario.id ||
            tarea.asignada_a === usuario.id ||
            tarea.area_destino_id === usuario.area_id;

        if (!tienePermiso) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para descargar esta evidencia'
            });
        }

        if (!fs.existsSync(evidencia.ruta_archivo)) {
            return res.status(404).json({
                success: false,
                message: 'El archivo no se encuentra en el servidor'
            });
        }

        res.download(evidencia.ruta_archivo, evidencia.nombre_archivo);

    } catch (error) {
        console.error('Error al descargar evidencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al descargar la evidencia',
            error: error.message
        });
    }
};

// Eliminar evidencia
exports.eliminarEvidencia = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;

        const evidencia = await Evidencia.findByPk(id, {
            include: ['tarea']
        });

        if (!evidencia) {
            return res.status(404).json({
                success: false,
                message: 'Evidencia no encontrada'
            });
        }

        const tienePermiso = 
            usuario.rol === 'superadmin' ||
            evidencia.usuario_id === usuario.id;

        if (!tienePermiso) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar esta evidencia'
            });
        }

        if (fs.existsSync(evidencia.ruta_archivo)) {
            fs.unlinkSync(evidencia.ruta_archivo);
        }

        await evidencia.destroy();

        await HistorialTarea.create({
            tarea_id: evidencia.tarea_id,
            usuario_id: usuario.id,
            accion: 'evidencia_eliminada',
            descripcion: `Se eliminó evidencia: ${evidencia.nombre_archivo}`
        });

        res.json({
            success: true,
            message: 'Evidencia eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar evidencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la evidencia',
            error: error.message
        });
    }
};