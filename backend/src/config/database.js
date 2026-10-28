// backend/src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'plataforma_uiem',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: console.log,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Probar conexión
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a MySQL establecida correctamente.');
        console.log(`📦 Base de datos: ${process.env.DB_NAME}`);
    } catch (error) {
        console.error('❌ Error al conectar con MySQL:', error);
        console.error('   Verifica que MySQL esté corriendo y los datos de conexión');
        process.exit(1);
    }
};

testConnection();

module.exports = sequelize;