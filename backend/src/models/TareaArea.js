// backend/src/models/TareaArea.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TareaArea = sequelize.define('TareaArea', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tarea_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    area_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    asignada_a: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'en_proceso', 'por_validar', 'completada', 'rechazada'),
        defaultValue: 'pendiente'
    },
    fecha_limite: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'tareas_areas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = TareaArea;