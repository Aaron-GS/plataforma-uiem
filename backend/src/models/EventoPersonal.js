const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventoPersonal = sequelize.define('EventoPersonal', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    titulo: { type: DataTypes.STRING(200), allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    fecha_inicio: { type: DataTypes.DATE, allowNull: false },
    fecha_fin: { type: DataTypes.DATE },
    todo_el_dia: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: 'eventos_personales',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = EventoPersonal;