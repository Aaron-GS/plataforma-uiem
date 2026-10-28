<!-- frontend/src/components/SubirEvidencia.vue -->
<template>
  <div class="subir-evidencia">
    <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
      
      <!-- INPUT OCULTO -->
      <input 
        type="file" 
        ref="fileInput" 
        @change="handleFileSelect"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.zip,.rar"
        style="display: none"
      />
      
      <!-- ✅ BOTÓN CORREGIDO -->
      <button type="button" @click="abrirSelector" class="btn-upload">
        <img src="/src/assets/icons/icon-subir.png" alt="" class="btn-icon" />
        Seleccionar Archivo
      </button>
      
      <span class="upload-hint">o arrastra y suelta aquí</span>
      
      <!-- INFO DEL ARCHIVO SELECCIONADO -->
      <div v-if="archivoSeleccionado" class="archivo-info">
        <span>📄 {{ archivoSeleccionado.name }}</span>
        <span class="tamaño">({{ (archivoSeleccionado.size / 1024).toFixed(1) }} KB)</span>
        <button type="button" @click="subirArchivo" :disabled="subiendo" class="btn-subir">
          <img src="/src/assets/icons/icon-subir.png" alt="" class="btn-icon-small" />
          {{ subiendo ? 'Subiendo...' : 'Subir' }}
        </button>
        <button type="button" @click="cancelar" class="btn-cancelar">✖</button>
      </div>
      
      <!-- MENSAJES -->
      <div v-if="mensaje" class="mensaje" :class="mensajeTipo">
        {{ mensaje }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '../services/api';

const props = defineProps({
  tareaId: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['archivo-subido']);

const fileInput = ref(null);
const archivoSeleccionado = ref(null);
const subiendo = ref(false);
const mensaje = ref('');
const mensajeTipo = ref('');

// ✅ NUEVA FUNCIÓN PARA ABRIR EL SELECTOR
const abrirSelector = () => {
  console.log('📂 Abriendo selector...');
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    console.log('📄 Archivo seleccionado:', file.name);
    archivoSeleccionado.value = file;
    mensaje.value = '';
  }
};

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0];
  if (file) {
    archivoSeleccionado.value = file;
    mensaje.value = '';
  }
};

const subirArchivo = async () => {
  if (!archivoSeleccionado.value) return;
  
  subiendo.value = true;
  mensaje.value = '';
  
  try {
    const formData = new FormData();
    formData.append('archivo', archivoSeleccionado.value);
    
    await api.post(`/tareas/${props.tareaId}/evidencias`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    mensaje.value = '✅ Archivo subido exitosamente';
    mensajeTipo.value = 'success';
    archivoSeleccionado.value = null;
    
    if (fileInput.value) fileInput.value.value = '';
    
    emit('archivo-subido');
    
    setTimeout(() => { mensaje.value = ''; }, 3000);
    
  } catch (error) {
    console.error('Error al subir archivo:', error);
    mensaje.value = '❌ Error al subir el archivo';
    mensajeTipo.value = 'error';
  } finally {
    subiendo.value = false;
  }
};

const cancelar = () => {
  archivoSeleccionado.value = null;
  mensaje.value = '';
  if (fileInput.value) fileInput.value.value = '';
};
</script>

<style scoped>
.subir-evidencia {
  margin: 16px 0;
}

.upload-area {
  border: 2px dashed #c1d4ca;
  padding: 24px;
  border-radius: 10px;
  text-align: center;
  transition: all 0.3s;
  background: #f5faf7;
}

.upload-area:hover {
  border-color: #1a5c40;
  background: #e0ebe5;
}

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #0d3d2a 0%, #1a5c40 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.25s;
  box-shadow: 0 4px 12px rgba(13, 61, 42, 0.3);
}

.btn-upload:hover {
  background: linear-gradient(135deg, #1a5c40 0%, #2d7a55 100%);
  transform: translateY(-2px);
}

.btn-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;

}

.btn-icon-small {
  width: 14px;
  height: 14px;
  object-fit: contain;
  
}

.upload-hint {
  display: block;
  font-size: 12px;
  color: #888;
  margin-top: 12px;
  font-style: italic;
}

.archivo-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  border: 2px solid #1a5c40;
  flex-wrap: wrap;
}

.archivo-info span:first-child {
  flex: 1;
  font-weight: 700;
  color: #0d3d2a;
  word-break: break-all;
}

.tamaño {
  font-size: 12px;
  color: #888;
}

.btn-subir {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: linear-gradient(135deg, #1a5c40 0%, #2d7a55 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.btn-subir:hover:not(:disabled) {
  background: linear-gradient(135deg, #0d3d2a 0%, #1a5c40 100%);
}

.btn-subir:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancelar {
  background: #ffebee;
  border: none;
  color: #b71c1c;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
}

.btn-cancelar:hover {
  background: #f44336;
  color: white;
}

.mensaje {
  margin-top: 12px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.mensaje.success {
  background: #e0ebe5;
  color: #0d3d2a;
  border-left: 4px solid #1a5c40;
}

.mensaje.error {
  background: #ffebee;
  color: #b71c1c;
  border-left: 4px solid #f44336;
}
</style>