// backend/src/controllers/areaController.js
const { Area } = require('../models');

// Obtener todas las áreas
exports.obtenerAreas = async (req, res) => {
    try {
        const areas = await Area.findAll({
            where: { activo: true },
            order: [['nombre', 'ASC']]
        });

        res.json({
            success: true,
            data: areas
        });
    } catch (error) {
        console.error('Error al obtener áreas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las áreas',
            error: error.message
        });
    }
};

// Obtener una área por ID
exports.obtenerAreaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const area = await Area.findByPk(id);

        if (!area) {
            return res.status(404).json({
                success: false,
                message: 'Área no encontrada'
            });
        }

        res.json({
            success: true,
            data: area
        });
    } catch (error) {
        console.error('Error al obtener área:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el área',
            error: error.message
        });
    }
};

// Crear una nueva área (solo superadmin)
exports.crearArea = async (req, res) => {
    try {
        const { nombre, categoria } = req.body;

        // Verificar si ya existe
        const existe = await Area.findOne({ where: { nombre } });
        if (existe) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un área con ese nombre'
            });
        }

        const area = await Area.create({
            nombre,
            categoria: categoria || 'General'
        });

        res.status(201).json({
            success: true,
            data: area,
            message: 'Área creada exitosamente'
        });
    } catch (error) {
        console.error('Error al crear área:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el área',
            error: error.message
        });
    }
};

// Actualizar área (solo superadmin)
exports.actualizarArea = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, categoria, activo } = req.body;

        const area = await Area.findByPk(id);
        if (!area) {
            return res.status(404).json({
                success: false,
                message: 'Área no encontrada'
            });
        }

        await area.update({ nombre, categoria, activo });

        res.json({
            success: true,
            data: area,
            message: 'Área actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar área:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el área',
            error: error.message
        });
    }
};