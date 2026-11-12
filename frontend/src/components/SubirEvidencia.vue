<!-- frontend/src/components/SubirEvidencia.vue -->
<template>
  <div class="subir-evidencia">
    <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
      
      <input 
        type="file" 
        ref="fileInput" 
        @change="handleFileSelect"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.zip,.rar"
        style="display: none"
      />
      
      <button type="button" @click="abrirSelector" class="btn-upload">
        <img src="/src/assets/icons/icon-subir.png" alt="" class="btn-icon" />
        Seleccionar Archivo
      </button>
      
      <span class="upload-hint">o arrastra y suelta aquí</span>
      
      <div v-if="archivoSeleccionado" class="archivo-info">
        <span class="archivo-nombre">📄 {{ archivoSeleccionado.name }}</span>
        <span class="tamaño">({{ (archivoSeleccionado.size / 1024).toFixed(1) }} KB)</span>
        
        <div class="archivo-botones">
          <button type="button" @click="subirArchivo" :disabled="subiendo" class="btn-subir">
            {{ subiendo ? 'Subiendo...' : 'Subir' }}
          </button>
          <button type="button" @click="cancelar" class="btn-cancelar">✖</button>
        </div>
      </div>
      
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
  tareaId: { type: Number, required: true },
  areaId: { type: Number, default: null } // ✅ Nueva prop para saber a qué área pertenece
});

const emit = defineEmits(['archivo-subido']);

const fileInput = ref(null);
const archivoSeleccionado = ref(null);
const subiendo = ref(false);
const mensaje = ref('');
const mensajeTipo = ref('');

const abrirSelector = () => {
  if (fileInput.value) fileInput.value.click();
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
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
    if (props.areaId) {
      formData.append('area_id', props.areaId); // ✅ Enviamos el ID del área al backend
    }
    
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
.subir-evidencia { margin-top: 10px; }
.upload-area { border: 2px dashed #c1d4ca; padding: 15px; border-radius: 8px; text-align: center; background: #f5faf7; }
.btn-upload { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #1a5c40; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700; }
.btn-icon { width: 16px; height: 16px; filter: brightness(0) invert(1); }
.upload-hint { display: block; font-size: 11px; color: #888; margin-top: 6px; }
.archivo-info { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px; padding: 8px; background: white; border-radius: 6px; border: 1px solid #1a5c40; font-size: 12px; }
.archivo-nombre { font-weight: 700; color: #0d3d2a; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tamaño { color: #888; }
.archivo-botones { display: flex; gap: 4px; }
.btn-subir { background: #4caf50; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 700; }
.btn-cancelar { background: #ffebee; color: #b71c1c; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: 700; }
.mensaje { margin-top: 8px; font-size: 12px; font-weight: 600; }
.mensaje.success { color: #1a5c40; }
.mensaje.error { color: #b71c1c; }
</style>