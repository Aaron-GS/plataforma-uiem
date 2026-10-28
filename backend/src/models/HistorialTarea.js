// backend/src/models/HistorialTarea.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistorialTarea = sequelize.define('HistorialTarea', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tarea_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    accion: {
        type: DataTypes.ENUM(
            'creada', 'asignada', 'cambiado_estado', 'comentada',
            'evidencia_subida', 'reasignada', 'override', 'cerrada'
        ),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    datos_previos: {
        type: DataTypes.JSON
    }
}, {
    tableName: 'historial_tareas',
    timestamps: true,
    createdAt: 'fecha',
    updatedAt: false
});

module.exports = HistorialTarea;