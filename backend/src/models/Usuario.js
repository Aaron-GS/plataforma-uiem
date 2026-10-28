// backend/src/models/Usuario.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    apellidos: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    area_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rol: {
        type: DataTypes.ENUM('superadmin', 'admin_area', 'gestor', 'ejecutor', 'invitado'),
        allowNull: false,
        defaultValue: 'ejecutor'
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    ultimo_acceso: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    hooks: {
        beforeCreate: async (usuario) => {
            if (usuario.password_hash) {
                const salt = await bcrypt.genSalt(10);
                usuario.password_hash = await bcrypt.hash(usuario.password_hash, salt);
            }
        },
        beforeUpdate: async (usuario) => {
            if (usuario.changed('password_hash')) {
                const salt = await bcrypt.genSalt(10);
                usuario.password_hash = await bcrypt.hash(usuario.password_hash, salt);
            }
        }
    }
});

// Método para comparar contraseñas
Usuario.prototype.validarPassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
};

// Método para obtener datos públicos (sin password)
Usuario.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
};

module.exports = Usuario;