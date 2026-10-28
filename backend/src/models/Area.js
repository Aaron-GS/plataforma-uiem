// backend/src/models/Area.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Area = sequelize.define('Area', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    categoria: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'General'
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'areas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Area;