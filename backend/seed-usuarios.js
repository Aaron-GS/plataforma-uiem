// backend/seed-usuarios.js
const bcrypt = require('bcryptjs');
const { sequelize, Usuario } = require('./src/models');

const usuariosData = [
    // =============================================
    // SUPERADMINS (SOLO 2)
    // =============================================
    { nombre: 'Antolín', apellidos: 'Celote Preciado', email: 'antolin.celote@uiem.edu.mx', area_id: 1, rol: 'superadmin' },
    { nombre: 'Josué', apellidos: 'Segura de Jesús', email: 'josue.segura@uiem.edu.mx', area_id: 3, rol: 'superadmin' },

    // =============================================
    // ADMINISTRADORES DE ÁREA
    // =============================================
    { nombre: 'Miguel', apellidos: 'Maldonado Marín', email: 'miguel.maldonado@uiem.edu.mx', area_id: 18, rol: 'admin_area' },
    { nombre: 'David', apellidos: 'Gómez Sánchez', email: 'david.gomez@uiem.edu.mx', area_id: 10, rol: 'admin_area' },

    // =============================================
    // ENCARGADOS
    // =============================================
    { nombre: 'Miguel', apellidos: 'Maldonado Marín', email: 'miguel.maldonado.abogado@uiem.edu.mx', area_id: 2, rol: 'encargado' },
    { nombre: 'Oscar', apellidos: 'Martínez Solís', email: 'oscar.martinez@uiem.edu.mx', area_id: 16, rol: 'encargado' },
    { nombre: 'Héctor', apellidos: 'Segundo López', email: 'hector.segundo@uiem.edu.mx', area_id: 19, rol: 'encargado' },

    // =============================================
    // GESTORES
    // =============================================
    { nombre: 'Eracleo', apellidos: 'de la Cruz Legorreta', email: 'eracleo.cruz@uiem.edu.mx', area_id: 4, rol: 'gestor' },
    { nombre: 'Jhonny', apellidos: 'Ruiz Blas', email: 'jhonny.ruiz@uiem.edu.mx', area_id: 5, rol: 'gestor' },
    { nombre: 'Laura', apellidos: 'Rodríguez Sánchez', email: 'laura.rodriguez@uiem.edu.mx', area_id: 6, rol: 'gestor' },
    { nombre: 'Minerva', apellidos: 'Cruz González', email: 'minerva.cruz@uiem.edu.mx', area_id: 8, rol: 'gestor' },
    { nombre: 'Rosamaría', apellidos: 'Almazan Miranda', email: 'rosamaria.almazan@uiem.edu.mx', area_id: 17, rol: 'gestor' },
    { nombre: 'Ezequiel', apellidos: 'Contreras Gónzalez', email: 'ezequiel.contreras@uiem.edu.mx', area_id: 9, rol: 'gestor' },
    { nombre: 'Erick Ariel', apellidos: 'Valdez', email: 'erick.valdez@uiem.edu.mx', area_id: 14, rol: 'gestor' },
    { nombre: 'Dulce María', apellidos: 'Ávila Najera', email: 'dulce.avila@uiem.edu.mx', area_id: 13, rol: 'gestor' },
    { nombre: 'Oscar', apellidos: 'Martínez Solís', email: 'oscar.martinez.salud@uiem.edu.mx', area_id: 11, rol: 'gestor' },
    { nombre: 'Jonás', apellidos: 'Álvarez LopézTello', email: 'jonas.alvarez@uiem.edu.mx', area_id: 12, rol: 'gestor' },
    { nombre: 'Wiliams', apellidos: 'Segura Álvarez', email: 'wiliams.segura@uiem.edu.mx', area_id: 15, rol: 'gestor' },
    { nombre: 'Marisol', apellidos: 'Garduño Sánchez', email: 'marisol.garduno@uiem.edu.mx', area_id: 20, rol: 'gestor' },
    { nombre: 'Gabriela', apellidos: 'Granados Cruz', email: 'gabriela.granados@uiem.edu.mx', area_id: 20, rol: 'gestor' },
    { nombre: 'Daniel J.', apellidos: 'Vallejo Garduño', email: 'daniel.vallejo@uiem.edu.mx', area_id: 21, rol: 'gestor' },
    { nombre: 'Anthony', apellidos: 'Pérez Balcazar', email: 'anthony.perez@uiem.edu.mx', area_id: 22, rol: 'gestor' },
    { nombre: 'Roberto', apellidos: 'Enríquez Becerril', email: 'roberto.enriquez@uiem.edu.mx', area_id: 23, rol: 'gestor' },
    { nombre: 'Eleazar', apellidos: 'Valle Pineda', email: 'eleazar.valle@uiem.edu.mx', area_id: 24, rol: 'gestor' }
];

async function seedUsuarios() {
    try {
        console.log('\n🔌 Conectando a la base de datos...');
        await sequelize.authenticate();
        console.log('✅ Conexión establecida\n');

        console.log('🔐 Generando hash de contraseña...');
        const passwordHash = await bcrypt.hash('uiem2026', 10);
        console.log('✅ Hash generado\n');

        console.log('📋 Insertando usuarios...\n');

        let creados = 0;
        let existentes = 0;
        let errores = 0;

        for (const userData of usuariosData) {
            try {
                const existe = await Usuario.findOne({ 
                    where: { email: userData.email } 
                });
                
                if (!existe) {
                    await Usuario.create({
                        ...userData,
                        password_hash: passwordHash,
                        activo: true
                    });
                    console.log(`✅ ${userData.rol.padEnd(12)} | ${userData.email}`);
                    creados++;
                } else {
                    console.log(`⚠️  Ya existe | ${userData.email}`);
                    existentes++;
                }
            } catch (err) {
                console.error(`❌ Error con ${userData.email}:`, err.message);
                errores++;
            }
        }

        console.log('\n========================================');
        console.log('📊 RESUMEN');
        console.log('========================================');
        console.log(`   ✅ Creados:     ${creados}`);
        console.log(`   ⚠️  Existentes: ${existentes}`);
        console.log(`   ❌ Errores:     ${errores}`);
        console.log(`   📋 Total:       ${usuariosData.length}`);
        console.log('========================================\n');
        
        console.log('🔑 CONTRASEÑA PARA TODOS: uiem2026\n');
        
        console.log('👑 SUPERADMINS:');
        console.log('   antolin.celote@uiem.edu.mx   (RECTORÍA)');
        console.log('   josue.segura@uiem.edu.mx     (ADMINISTRACIÓN Y FINANZAS)\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error general:', error);
        process.exit(1);
    }
}

seedUsuarios();