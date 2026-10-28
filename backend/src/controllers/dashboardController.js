// backend/src/controllers/dashboardController.js
const { Tarea, TareaArea, Usuario, Area } = require('../models');
const { Op, Sequelize } = require('sequelize');

// =============================================
// OBTENER ESTADÍSTICAS DEL DASHBOARD
// =============================================
exports.obtenerEstadisticas = async (req, res) => {
    try {
        const usuario = req.usuario;

        // Solo superadmin
        if (usuario.rol !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver las estadísticas'
            });
        }

        // ============================================
        // 1. TOTALES GENERALES
        // ============================================
        const totalTareas = await Tarea.count();

        const tareasPorEstado = await Tarea.findAll({
            attributes: [
                'estado',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['estado'],
            raw: true
        });

        const tareasPorPrioridad = await Tarea.findAll({
            attributes: [
                'prioridad',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['prioridad'],
            raw: true
        });

        // ============================================
        // 2. TAREAS VENCIDAS
        // ============================================
        const tareasVencidas = await Tarea.count({
            where: {
                estado: { [Op.notIn]: ['completada', 'rechazada'] },
                fecha_limite: { [Op.lt]: new Date() }
            }
        });

        // ============================================
        // 3. TAREAS POR ÁREA (top 10)
        // ============================================
        const tareasPorArea = await Tarea.findAll({
            attributes: [
                'area_destino_id',
                [Sequelize.fn('COUNT', Sequelize.col('Tarea.id')), 'count']
            ],
            include: [
                { 
                    model: Area, 
                    as: 'area_destino', 
                    attributes: ['nombre'] 
                }
            ],
            group: ['area_destino_id', 'area_destino.id', 'area_destino.nombre'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 10,
            raw: true,
            nest: true
        });

        // ============================================
        // 4. ACTIVIDAD RECIENTE (últimos 7 días)
        // ============================================
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);

        const tareasRecientes = await Tarea.findAll({
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('creada_en')), 'fecha'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            where: {
                creada_en: { [Op.gte]: hace7Dias }
            },
            group: [Sequelize.fn('DATE', Sequelize.col('creada_en'))],
            order: [[Sequelize.fn('DATE', Sequelize.col('creada_en')), 'ASC']],
            raw: true
        });

        // ============================================
        // 5. PROGRESO DE ÁREAS (tareas_areas)
        // ============================================
        const progresoAreas = await TareaArea.findAll({
            attributes: [
                'estado',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['estado'],
            raw: true
        });

        // ============================================
        // 6. USUARIOS MÁS ACTIVOS
        // ============================================
        const usuariosMasActivos = await Tarea.findAll({
            attributes: [
                'asignada_a',
                [Sequelize.fn('COUNT', Sequelize.col('Tarea.id')), 'count']
            ],
            include: [
                { 
                    model: Usuario, 
                    as: 'asignado', 
                    attributes: ['nombre', 'apellidos'] 
                }
            ],
            where: {
                asignada_a: { [Op.not]: null }
            },
            group: ['asignada_a', 'asignado.id', 'asignado.nombre', 'asignado.apellidos'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 5,
            raw: true,
            nest: true
        });

        // ============================================
        // RESPUESTA
        // ============================================
        res.json({
            success: true,
            data: {
                totales: {
                    total_tareas: totalTareas,
                    tareas_vencidas: tareasVencidas
                },
                por_estado: tareasPorEstado,
                por_prioridad: tareasPorPrioridad,
                por_area: tareasPorArea,
                actividad_reciente: tareasRecientes,
                progreso_areas: progresoAreas,
                usuarios_activos: usuariosMasActivos
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las estadísticas',
            error: error.message
        });
    }
};