<!-- frontend/src/components/Comentarios.vue -->
<template>
  <div class="comentarios-container">
    <h3>
      <img src="/src/assets/icons/icon-comentario.png" alt="" class="title-icon" />
      Comentarios {{ areaId ? 'del Área' : 'Generales' }}
    </h3>
    
    <div v-if="comentarios.length === 0" class="sin-comentarios">
      No hay comentarios aún. Sé el primero en comentar.
    </div>
    
    <div v-else class="comentarios-list">
      <div v-for="comentario in comentarios" :key="comentario.id" class="comentario">
        <div class="comentario-header">
          <strong>{{ comentario.usuario?.nombre || 'Usuario' }}</strong>
          <span class="fecha">{{ formatDate(comentario.fecha) }}</span>
        </div>
        <p class="comentario-contenido">{{ comentario.contenido }}</p>
      </div>
    </div>
    
    <div class="nuevo-comentario">
      <textarea 
        v-model="nuevoComentario" 
        placeholder="Escribe un comentario..."
        rows="2"
        @keydown.ctrl.enter="enviarComentario"
      ></textarea>
      <button @click="enviarComentario" :disabled="!nuevoComentario.trim()" class="btn-comentar">
        Comentar
      </button>
      <span class="hint">Presiona Ctrl+Enter para enviar</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import api from '../services/api';

const props = defineProps({
  tareaId: { type: Number, required: true },
  areaId: { type: Number, default: null } // ✅ Nueva prop
});

const comentarios = ref([]);
const nuevoComentario = ref('');

const cargarComentarios = async () => {
  try {
    let url = `/tareas/${props.tareaId}/comentarios`;
    if (props.areaId) {
      url += `?area_id=${props.areaId}`;
    }
    const response = await api.get(url);
    comentarios.value = response.data.data || [];
  } catch (error) {
    console.error('Error al cargar comentarios:', error);
  }
};

const enviarComentario = async () => {
  if (!nuevoComentario.value.trim()) return;
  
  try {
    const payload = { contenido: nuevoComentario.value };
    if (props.areaId) payload.area_id = props.areaId;

    await api.post(`/tareas/${props.tareaId}/comentarios`, payload);
    nuevoComentario.value = '';
    await cargarComentarios();
  } catch (error) {
    alert('❌ Error al enviar el comentario');
  }
};

const formatDate = (date) => {
  if (!date) return 'Sin fecha';
  return new Date(date).toLocaleString('es-MX');
};

onMounted(() => {
  cargarComentarios();
});

// Si el ID del área cambia, recargar
watch(() => props.areaId, () => {
  cargarComentarios();
});
</script>

<style scoped>
.comentarios-container { margin-top: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e0ebe5; }
.comentarios-container h3 { margin-bottom: 16px; color: #0d3d2a; display: flex; align-items: center; font-size: 16px; font-weight: 700; }
.title-icon { width: 20px; height: 20px; margin-right: 8px; }
.sin-comentarios { color: #888; font-style: italic; padding: 16px; text-align: center; font-size: 13px; }
.comentarios-list { margin-bottom: 16px; }
.comentario { background: white; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.comentario-header { display: flex; justify-content: space-between; font-size: 13px; color: #666; margin-bottom: 4px; }
.comentario-header strong { color: #0d3d2a; }
.comentario-header .fecha { font-size: 11px; color: #999; }
.comentario-contenido { margin: 0; font-size: 14px; color: #333; line-height: 1.5; }
.nuevo-comentario { display: flex; flex-direction: column; gap: 8px; }
.nuevo-comentario textarea { padding: 10px 14px; border: 2px solid #e0ebe5; border-radius: 6px; font-size: 14px; resize: vertical; font-family: inherit; }
.nuevo-comentario textarea:focus { outline: none; border-color: #1a5c40; }
.btn-comentar { align-self: flex-end; padding: 8px 24px; background: #1a5c40; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-comentar:disabled { opacity: 0.5; cursor: not-allowed; }
.hint { font-size: 11px; color: #999; text-align: right; }
</style>