// backend/src/controllers/tareaController.js
const { Tarea, Usuario, Area, TareaArea, HistorialTarea, Notificacion } = require('../models');
const { Op } = require('sequelize');
const { enviarNotificacion, notificarSuperAdmins } = require('../config/socket');

// =============================================
// CREAR TAREA (MULTI-ÁREA)
// =============================================
exports.crearTarea = async (req, res) => {
    try {
        const {
            titulo, descripcion, prioridad, fecha_limite,
            area_destino_id, areas_asignadas, areas_ids, asignada_a, tarea_padre_id
        } = req.body;

        const usuario_id = req.usuario.id;

        if (!titulo || !titulo.trim()) {
            return res.status(400).json({ success: false, message: 'El título es obligatorio' });
        }

        // Determinar las áreas (soporta múltiples modos)
        let areasFinales = [];
        
        if (areas_asignadas && Array.isArray(areas_asignadas) && areas_asignadas.length > 0) {
            areasFinales = areas_asignadas.map(a => ({
                area_id: parseInt(a.area_id),
                asignada_a: a.asignada_a ? parseInt(a.asignada_a) : null,
                fecha_limite: a.fecha_limite || fecha_limite || null
            }));
        } else if (areas_ids && Array.isArray(areas_ids) && areas_ids.length > 0) {
            areasFinales = areas_ids.map(id => ({
                area_id: parseInt(id),
                asignada_a: asignada_a ? parseInt(asignada_a) : null,
                fecha_limite: fecha_limite || null
            }));
        } else if (area_destino_id) {
            areasFinales = [{
                area_id: parseInt(area_destino_id),
                asignada_a: asignada_a ? parseInt(asignada_a) : null,
                fecha_limite: fecha_limite || null
            }];
        } else {
            return res.status(400).json({ success: false, message: 'Debes seleccionar al menos un área destino' });
        }

        const areasIds = areasFinales.map(a => a.area_id);
        const areasExistentes = await Area.findAll({ where: { id: { [Op.in]: areasIds } } });

        if (areasExistentes.length !== areasIds.length) {
            return res.status(400).json({ success: false, message: 'Una o más áreas no existen' });
        }

        // 1. Crear tarea principal
        const nuevaTarea = await Tarea.create({
            titulo: titulo.trim(),
            descripcion: descripcion || null,
            prioridad: prioridad || 'media',
            fecha_limite: fecha_limite || null,
            area_destino_id: areasFinales[0].area_id,
            asignada_a: asignada_a ? parseInt(asignada_a) : null,
            tarea_padre_id: tarea_padre_id ? parseInt(tarea_padre_id) : null,
            creada_por: usuario_id,
            estado: 'pendiente'
        });

        // 2. Crear registros en tareas_areas
        for (const area of areasFinales) {
            await TareaArea.create({
                tarea_id: nuevaTarea.id,
                area_id: area.area_id,
                asignada_a: area.asignada_a,
                estado: 'pendiente',
                fecha_limite: area.fecha_limite
            });
        }

        // 3. Historial
        await HistorialTarea.create({
            tarea_id: nuevaTarea.id,
            usuario_id: usuario_id,
            accion: 'creada',
            descripcion: `Tarea "${titulo}" creada para ${areasFinales.length} área(s)`
        });

        // 4. Notificaciones
        const usuariosNotificados = new Set();
        for (const area of areasFinales) {
            if (area.asignada_a && !usuariosNotificados.has(area.asignada_a)) {
                usuariosNotificados.add(area.asignada_a);
                await Notificacion.create({
                    usuario_id: area.asignada_a,
                    tarea_id: nuevaTarea.id,
                    tipo: 'asignacion',
                    mensaje: `📋 Se te ha asignado la tarea: "${titulo}"`
                });
                enviarNotificacion(area.asignada_a, 'asignacion', `📋 Se te ha asignado la tarea: "${titulo}"`, nuevaTarea.id);
            }
        }

        const tareaCompleta = await Tarea.findByPk(nuevaTarea.id, {
            include: [
                { model: Usuario, as: 'creador', attributes: ['id', 'nombre', 'apellidos', 'email'] },
                { model: Usuario, as: 'asignado', attributes: ['id', 'nombre', 'apellidos', 'email'] },
                { 
                    model: TareaArea, as: 'areas_asignadas',
                    include: [
                        { model: Area, as: 'area', attributes: ['id', 'nombre', 'categoria'] },
                        { model: Usuario, as: 'asignado', attributes: ['id', 'nombre', 'apellidos'] }
                    ]
                }
            ]
        });

        res.status(201).json({
            success: true,
            data: tareaCompleta,
            message: `Tarea creada y asignada a ${areasFinales.length} área(s)`
        });

    } catch (error) {
        console.error('Error al crear tarea:', error);
        res.status(500).json({ success: false, message: 'Error al crear la tarea', error: error.message });
    }
};

// =============================================
// OBTENER TAREAS (VISIBILIDAD POR ROL)
// =============================================
exports.obtenerTareas = async (req, res) => {
    try {
        const { estado, area_id, prioridad, fecha_inicio, fecha_fin } = req.query;
        const usuario = req.usuario;
        let tareasIds = null;

        if (usuario.rol === 'superadmin') {
            // Ve todo
        } else if (usuario.rol === 'admin_area' || usuario.rol === 'encargado') {
            const tareasCreadas = await Tarea.findAll({ where: { creada_por: usuario.id }, attributes: ['id'], raw: true });
            const tareasArea = await TareaArea.findAll({ where: { area_id: usuario.area_id }, attributes: ['tarea_id'], raw: true });
            const idsCreadas = tareasCreadas.map(t => t.id);
            const idsArea = tareasArea.map(t => t.tarea_id);
            tareasIds = [...new Set([...idsCreadas, ...idsArea])];
        } else {
            const tareasArea = await TareaArea.findAll({ where: { area_id: usuario.area_id }, attributes: ['tarea_id'], raw: true });
            const tareasAsignadas = await Tarea.findAll({ where: { asignada_a: usuario.id }, attributes: ['id'], raw: true });
            const idsArea = tareasArea.map(t => t.tarea_id);
            const idsAsignadas = tareasAsignadas.map(t => t.id);
            tareasIds = [...new Set([...idsArea, ...idsAsignadas])];
        }

        let where = {};
        if (tareasIds !== null) {
            if (tareasIds.length === 0) return res.json({ success: true, count: 0, data: [] });
            where.id = { [Op.in]: tareasIds };
        }

        if (estado) where.estado = estado;
        if (prioridad) where.prioridad = prioridad;

        const tareas = await Tarea.findAll({
            where,
            include: [
                { model: Usuario, as: 'creador', attributes: ['id', 'nombre', 'apellidos', 'email'] },
                { model: Usuario, as: 'asignado', attributes: ['id', 'nombre', 'apellidos', 'email'] },
                { model: Area, as: 'area_destino', attributes: ['id', 'nombre', 'categoria'] },
                { 
                    model: TareaArea, as: 'areas_asignadas',
                    include: [
                        { model: Area, as: 'area', attributes: ['id', 'nombre', 'categoria'] },
                        { model: Usuario, as: 'asignado', attributes: ['id', 'nombre', 'apellidos'] }
                    ]
                }
            ],
            order: [['creada_en', 'DESC']]
        });

        res.json({ success: true, count: tareas.length, data: tareas });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener tareas', error: error.message });
    }
};

// =============================================
// OBTENER TAREA POR ID
// =============================================
exports.obtenerTareaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;

        const tarea = await Tarea.findByPk(id, {
            include: [
                { model: Usuario, as: 'creador', attributes: ['id', 'nombre', 'apellidos', 'email'] },
                { model: Usuario, as: 'asignado', attributes: ['id', 'nombre', 'apellidos', 'email'] },
                { model: Area, as: 'area_destino', attributes: ['id', 'nombre', 'categoria'] },
                { 
                    model: TareaArea, as: 'areas_asignadas',
                    include: [
                        { model: Area, as: 'area', attributes: ['id', 'nombre', 'categoria'] },
                        { model: Usuario, as: 'asignado', attributes: ['id', 'nombre', 'apellidos'] }
                    ]
                }
            ]
        });

        if (!tarea) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });

        let tienePermiso = false;
        if (usuario.rol === 'superadmin') {
            tienePermiso = true;
        } else {
            const estaEnSuArea = await TareaArea.findOne({ where: { tarea_id: id, area_id: usuario.area_id } });
            const esCreador = tarea.creada_por === usuario.id;
            const esAsignado = tarea.asignada_a === usuario.id;
            
            if (usuario.rol === 'admin_area' || usuario.rol === 'encargado') {
                tienePermiso = esCreador || !!estaEnSuArea;
            } else {
                tienePermiso = !!estaEnSuArea || esAsignado;
            }
        }

        if (!tienePermiso) return res.status(403).json({ success: false, message: 'No tienes permiso para ver esta tarea' });

        res.json({ success: true, data: tarea });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener tarea', error: error.message });
    }
};

// =============================================
// ACTUALIZAR TAREA (Con notificación de validación)
// =============================================
exports.actualizarTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, prioridad, fecha_limite, descripcion } = req.body;
        const usuario = req.usuario;

        const tarea = await Tarea.findByPk(id);
        if (!tarea) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });

        const datosPrevios = tarea.toJSON();

        if (estado) tarea.estado = estado;
        if (prioridad) tarea.prioridad = prioridad;
        if (fecha_limite) tarea.fecha_limite = fecha_limite;
        if (descripcion) tarea.descripcion = descripcion;

        if (estado === 'completada') tarea.fecha_completada = new Date();
        await tarea.save();

        await HistorialTarea.create({
            tarea_id: tarea.id,
            usuario_id: usuario.id,
            accion: 'cambiado_estado',
            descripcion: `Tarea actualizada a: ${estado}`,
            datos_previos: datosPrevios
        });

        // 🔔 NOTIFICACIÓN: Si un gestor cambia a "por_validar", avisar al creador (Admin)
        if (estado === 'por_validar') {
            await Notificacion.create({
                usuario_id: tarea.creada_por,
                tarea_id: tarea.id,
                tipo: 'cambio_estado',
                mensaje: `✅ La tarea "${tarea.titulo}" ha sido completada por ${usuario.nombre} y requiere tu validación.`
            });
            enviarNotificacion(
                tarea.creada_por,
                'cambio_estado',
                `✅ La tarea "${tarea.titulo}" ha sido completada por ${usuario.nombre} y requiere tu validación.`,
                tarea.id
            );
        }

        res.json({ success: true, data: tarea, message: 'Tarea actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar tarea', error: error.message });
    }
};

// =============================================
// ELIMINAR TAREA
// =============================================
exports.eliminarTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;
        const tarea = await Tarea.findByPk(id);

        if (!tarea) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        if (usuario.rol !== 'superadmin' && tarea.creada_por !== usuario.id) {
            return res.status(403).json({ success: false, message: 'No tienes permiso' });
        }

        await tarea.destroy();
        res.json({ success: true, message: 'Tarea eliminada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar tarea', error: error.message });
    }
};

// =============================================
// REASIGNAR TAREA (SOLO SUPERADMIN)
// =============================================
exports.reasignarTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const { nueva_area_id, nuevo_usuario_id } = req.body;
        const usuario = req.usuario;

        if (usuario.rol !== 'superadmin') return res.status(403).json({ success: false, message: 'Solo RECTORÍA' });

        const tarea = await Tarea.findByPk(id);
        if (!tarea) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });

        if (nueva_area_id) tarea.area_destino_id = nueva_area_id;
        if (nuevo_usuario_id) tarea.asignada_a = nuevo_usuario_id;

        await tarea.save();
        res.json({ success: true, data: tarea, message: 'Tarea reasignada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al reasignar', error: error.message });
    }
};

// =============================================
// ACTUALIZAR ESTADO DE UN ÁREA ESPECÍFICA
// =============================================
exports.actualizarEstadoArea = async (req, res) => {
    try {
        const { tareaId, areaId } = req.params;
        const { estado, asignada_a, fecha_limite } = req.body;
        
        const tareaArea = await TareaArea.findOne({ where: { tarea_id: tareaId, area_id: areaId } });
        if (!tareaArea) return res.status(404).json({ success: false, message: 'No encontrado' });

        if (estado) tareaArea.estado = estado;
        if (asignada_a !== undefined) tareaArea.asignada_a = asignada_a;
        if (fecha_limite !== undefined) tareaArea.fecha_limite = fecha_limite;
        await tareaArea.save();

        res.json({ success: true, data: tareaArea });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error', error: error.message });
    }
};

// =============================================
// OBTENER PROGRESO
// =============================================
exports.obtenerProgresoTarea = async (req, res) => {
    try {
        const areas = await TareaArea.findAll({ where: { tarea_id: req.params.id } });
        const total = areas.length;
        const completadas = areas.filter(a => a.estado === 'completada').length;
        const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
        res.json({ success: true, data: { total, completadas, porcentaje } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error', error: error.message });
    }
};