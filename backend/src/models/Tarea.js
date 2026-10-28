// backend/src/models/Tarea.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tarea = sequelize.define('Tarea', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    titulo: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'en_proceso', 'por_validar', 'completada', 'rechazada'),
        defaultValue: 'pendiente'
    },
    prioridad: {
        type: DataTypes.ENUM('baja', 'media', 'alta'),
        defaultValue: 'media'
    },
    fecha_limite: {
        type: DataTypes.DATE
    },
    fecha_completada: {
        type: DataTypes.DATE
    },
    creada_por: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    asignada_a: {
        type: DataTypes.INTEGER
    },
    area_destino_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tarea_padre_id: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'tareas',
    timestamps: true,
    createdAt: 'creada_en',
    updatedAt: 'actualizada_en'
});

module.exports = Tarea;