// backend/src/controllers/calendarioController.js
const { Tarea, Area, EventoPersonal } = require('../models');
const { Op } = require('sequelize');

exports.obtenerEventos = async (req, res) => {
    try {
        const usuario = req.usuario;

        // 1. Obtener tareas asignadas a su área (RECTORÍA)
        const tareas = await Tarea.findAll({
            where: {
                area_destino_id: usuario.area_id,
                fecha_limite: { [Op.not]: null }
            },
            include: [{ model: Area, as: 'area_destino', attributes: ['nombre'] }]
        });

        // 2. Obtener sus eventos personales
        const eventosPersonales = await EventoPersonal.findAll({
            where: { usuario_id: usuario.id }
        });

        // Formatear Tareas
        const eventosTareas = tareas.map(t => {
            let color = t.prioridad === 'alta' ? '#f44336' : (t.prioridad === 'media' ? '#ff9800' : '#1a5c40');
            if (t.estado === 'completada') color = '#4caf50';

            return {
                id: `tarea-${t.id}`,
                title: `📋 ${t.titulo}`,
                start: t.fecha_limite,
                backgroundColor: color,
                borderColor: color,
                extendedProps: { 
                    tipo: 'tarea', 
                    tareaId: t.id 
                }
            };
        });

        // Formatear Eventos Personales
        const eventosPersonalesFormateados = eventosPersonales.map(e => ({
            id: `evento-${e.id}`,
            title: `📅 ${e.titulo}`,
            start: e.fecha_inicio,
            end: e.fecha_fin,
            allDay: e.todo_el_dia,
            backgroundColor: '#2196F3',
            borderColor: '#2196F3',
            extendedProps: { 
                tipo: 'personal', 
                eventoId: e.id,
                descripcion: e.descripcion // ✅ Se envía la descripción al frontend
            }
        }));

        res.json({
            success: true,
            data: [...eventosTareas, ...eventosPersonalesFormateados]
        });
    } catch (error) {
        console.error('Error al cargar calendario:', error);
        res.status(500).json({ success: false, message: 'Error al cargar calendario' });
    }
};

exports.crearEvento = async (req, res) => {
    try {
        const { titulo, descripcion, fecha_inicio, fecha_fin, todo_el_dia } = req.body;
        
        const nuevoEvento = await EventoPersonal.create({
            usuario_id: req.usuario.id,
            titulo,
            descripcion,
            fecha_inicio,
            fecha_fin,
            todo_el_dia
        });

        res.status(201).json({ success: true, data: nuevoEvento, message: 'Evento agendado' });
    } catch (error) {
        console.error('Error al crear evento:', error);
        res.status(500).json({ success: false, message: 'Error al crear evento', error: error.message });
    }
};

exports.eliminarEvento = async (req, res) => {
    try {
        const { id } = req.params;
        const evento = await EventoPersonal.findOne({ 
            where: { id, usuario_id: req.usuario.id } 
        });
        
        if (!evento) {
            return res.status(404).json({ success: false, message: 'Evento no encontrado' });
        }
        
        await evento.destroy();
        res.json({ success: true, message: 'Evento eliminado' });
    } catch (error) {
        console.error('Error al eliminar evento:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar evento' });
    }
};