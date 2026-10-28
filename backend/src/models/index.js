// backend/src/models/index.js
const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Area = require('./Area');
const Tarea = require('./Tarea');
const TareaArea = require('./TareaArea');  // ← AGREGAR
const Evidencia = require('./Evidencia');
const HistorialTarea = require('./HistorialTarea');
const Notificacion = require('./Notificacion');
const Comentario = require('./Comentario');
const EventoPersonal = require('./EventoPersonal');

// =============================================
// RELACIONES EXISTENTES
// =============================================
Usuario.belongsTo(Area, { foreignKey: 'area_id', as: 'area' });
Area.hasMany(Usuario, { foreignKey: 'area_id', as: 'usuarios' });

Tarea.belongsTo(Usuario, { foreignKey: 'creada_por', as: 'creador' });
Usuario.hasMany(Tarea, { foreignKey: 'creada_por', as: 'tareas_creadas' });

Tarea.belongsTo(Usuario, { foreignKey: 'asignada_a', as: 'asignado' });
Usuario.hasMany(Tarea, { foreignKey: 'asignada_a', as: 'tareas_asignadas' });

Tarea.belongsTo(Area, { foreignKey: 'area_destino_id', as: 'area_destino' });
Area.hasMany(Tarea, { foreignKey: 'area_destino_id', as: 'tareas' });

Tarea.belongsTo(Tarea, { foreignKey: 'tarea_padre_id', as: 'padre' });
Tarea.hasMany(Tarea, { foreignKey: 'tarea_padre_id', as: 'sub_tareas' });

EventoPersonal.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(EventoPersonal, { foreignKey: 'usuario_id', as: 'eventos' });
// =============================================
// NUEVAS RELACIONES: TAREA ↔ ÁREA (muchos a muchos)
// =============================================
Tarea.hasMany(TareaArea, { foreignKey: 'tarea_id', as: 'areas_asignadas' });
TareaArea.belongsTo(Tarea, { foreignKey: 'tarea_id', as: 'tarea' });

Area.hasMany(TareaArea, { foreignKey: 'area_id', as: 'tareas_asignadas' });
TareaArea.belongsTo(Area, { foreignKey: 'area_id', as: 'area' });

Usuario.hasMany(TareaArea, { foreignKey: 'asignada_a', as: 'tareas_area_asignadas' });
TareaArea.belongsTo(Usuario, { foreignKey: 'asignada_a', as: 'asignado' });

// Relaciones existentes de evidencia, historial, notificación, comentario
Evidencia.belongsTo(Tarea, { foreignKey: 'tarea_id', as: 'tarea' });
Tarea.hasMany(Evidencia, { foreignKey: 'tarea_id', as: 'evidencias' });
Evidencia.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'subido_por' });
Usuario.hasMany(Evidencia, { foreignKey: 'usuario_id', as: 'evidencias' });

HistorialTarea.belongsTo(Tarea, { foreignKey: 'tarea_id', as: 'tarea' });
Tarea.hasMany(HistorialTarea, { foreignKey: 'tarea_id', as: 'historial' });
HistorialTarea.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(HistorialTarea, { foreignKey: 'usuario_id', as: 'historial' });

Notificacion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Notificacion, { foreignKey: 'usuario_id', as: 'notificaciones' });
Notificacion.belongsTo(Tarea, { foreignKey: 'tarea_id', as: 'tarea' });
Tarea.hasMany(Notificacion, { foreignKey: 'tarea_id', as: 'notificaciones' });

Comentario.belongsTo(Tarea, { foreignKey: 'tarea_id', as: 'tarea' });
Tarea.hasMany(Comentario, { foreignKey: 'tarea_id', as: 'comentarios' });
Comentario.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Comentario, { foreignKey: 'usuario_id', as: 'comentarios' });

module.exports = {
    sequelize,
    Usuario,
    Area,
    Tarea,
    TareaArea,  // ← EXPORTAR
    Evidencia,
    HistorialTarea,
    Notificacion,
    Comentario,
    EventoPersonal
};