// backend/src/controllers/reporteController.js
const { Tarea, Usuario, Area } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// =============================================
// EXPORTAR EXCEL
// =============================================
exports.exportarExcel = async (req, res) => {
    try {
        const usuario = req.usuario;
        
        if (usuario.rol !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para exportar reportes'
            });
        }

        const { fecha_inicio, fecha_fin, area_id, estado } = req.query;

        let where = {};
        if (fecha_inicio && fecha_fin) {
            where.creada_en = { [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)] };
        }
        if (area_id) where.area_destino_id = area_id;
        if (estado) where.estado = estado;

        const tareas = await Tarea.findAll({
            where,
            include: [
                { model: Usuario, as: 'creador', attributes: ['nombre', 'apellidos', 'email'] },
                { model: Usuario, as: 'asignado', attributes: ['nombre', 'apellidos', 'email'] },
                { model: Area, as: 'area_destino', attributes: ['nombre', 'categoria'] }
            ],
            order: [['creada_en', 'DESC']]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Tareas');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Título', key: 'titulo', width: 30 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Prioridad', key: 'prioridad', width: 12 },
            { header: 'Área Destino', key: 'area', width: 25 },
            { header: 'Creado por', key: 'creador', width: 25 },
            { header: 'Asignado a', key: 'asignado', width: 25 },
            { header: 'Fecha Límite', key: 'fecha_limite', width: 20 },
            { header: 'Fecha Creación', key: 'creada_en', width: 20 },
        ];

        tareas.forEach(tarea => {
            worksheet.addRow({
                id: tarea.id,
                titulo: tarea.titulo,
                estado: tarea.estado,
                prioridad: tarea.prioridad,
                area: tarea.area_destino?.nombre || 'N/A',
                creador: tarea.creador ? `${tarea.creador.nombre} ${tarea.creador.apellidos}` : 'N/A',
                asignado: tarea.asignado ? `${tarea.asignado.nombre} ${tarea.asignado.apellidos}` : 'Sin asignar',
                fecha_limite: tarea.fecha_limite ? new Date(tarea.fecha_limite).toLocaleString('es-MX') : 'N/A',
                creada_en: new Date(tarea.creada_en).toLocaleString('es-MX')
            });
        });

        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2D6A9F' }
        };
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=reporte_tareas_${new Date().toISOString().slice(0,10)}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error al exportar Excel:', error);
        res.status(500).json({
            success: false,
            message: 'Error al exportar reporte',
            error: error.message
        });
    }
};

// =============================================
// EXPORTAR PDF
// =============================================
exports.exportarPDF = async (req, res) => {
    try {
        const usuario = req.usuario;
        
        if (usuario.rol !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para exportar reportes'
            });
        }

        const { fecha_inicio, fecha_fin, area_id, estado } = req.query;

        let where = {};
        if (fecha_inicio && fecha_fin) {
            where.creada_en = { [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)] };
        }
        if (area_id) where.area_destino_id = area_id;
        if (estado) where.estado = estado;

        const tareas = await Tarea.findAll({
            where,
            include: [
                { model: Usuario, as: 'creador', attributes: ['nombre', 'apellidos'] },
                { model: Usuario, as: 'asignado', attributes: ['nombre', 'apellidos'] },
                { model: Area, as: 'area_destino', attributes: ['nombre'] }
            ],
            order: [['creada_en', 'DESC']]
        });

        const doc = new PDFDocument({ margin: 50 });
        const filename = `reporte_tareas_${new Date().toISOString().slice(0,10)}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        doc.pipe(res);

        // Título
        doc.fontSize(20).font('Helvetica-Bold').text('Reporte de Tareas - UIEM', { align: 'center' });
        doc.moveDown();

        // Resumen
        doc.fontSize(12).font('Helvetica');
        doc.text(`Fecha: ${new Date().toLocaleString('es-MX')}`);
        doc.text(`Total de tareas: ${tareas.length}`);
        doc.moveDown();

        // Tabla
        const tableTop = doc.y;
        const columns = ['ID', 'Título', 'Estado', 'Prioridad', 'Área'];
        const colWidths = [40, 150, 80, 80, 120];

        let x = 50;
        doc.font('Helvetica-Bold');
        columns.forEach((col, i) => {
            doc.text(col, x, tableTop, { width: colWidths[i], align: 'center' });
            x += colWidths[i];
        });

        doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();
        doc.moveDown();

        let y = tableTop + 30;
        doc.font('Helvetica');
        
        tareas.forEach(tarea => {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }
            
            let xPos = 50;
            const rowData = [
                tarea.id.toString(),
                tarea.titulo.substring(0, 30),
                tarea.estado,
                tarea.prioridad,
                tarea.area_destino?.nombre || 'N/A'
            ];
            
            rowData.forEach((text, i) => {
                doc.text(text, xPos, y, { width: colWidths[i] - 5, align: 'center' });
                xPos += colWidths[i];
            });
            
            y += 20;
        });

        doc.end();

    } catch (error) {
        console.error('Error al exportar PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Error al exportar reporte PDF',
            error: error.message
        });
    }
};