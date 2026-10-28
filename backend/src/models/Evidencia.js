// backend/src/models/Evidencia.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evidencia = sequelize.define('Evidencia', {
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
    nombre_archivo: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    ruta_archivo: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    tipo_archivo: {
        type: DataTypes.STRING(50)
    },
    tamaño: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'evidencias',
    timestamps: true,
    createdAt: 'fecha_subida',
    updatedAt: false
});

module.exports = Evidencia;