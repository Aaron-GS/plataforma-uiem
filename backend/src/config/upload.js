// backend/src/config/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');

// Crear carpeta uploads si no existe
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Carpeta de uploads creada');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tareaId = req.params.id || 'temp';
        const tareaDir = path.join(uploadDir, `tarea_${tareaId}`);
        if (!fs.existsSync(tareaDir)) {
            fs.mkdirSync(tareaDir, { recursive: true });
        }
        cb(null, tareaDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `evidencia-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = upload;