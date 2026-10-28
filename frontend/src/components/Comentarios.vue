<!-- frontend/src/components/Comentarios.vue -->
<template>
  <div class="comentarios-container">
    <h3>
  <img src="/src/assets/icons/icon-comentario.png" alt="" class="title-icon" />
  Comentarios
</h3>
    
    <!-- Lista de comentarios -->
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
    
    <!-- Formulario para nuevo comentario -->
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
  tareaId: {
    type: Number,
    required: true
  }
});

const comentarios = ref([]);
const nuevoComentario = ref('');
const cargando = ref(false);

const cargarComentarios = async () => {
  cargando.value = true;
  try {
    const response = await api.get(`/tareas/${props.tareaId}/comentarios`);
    comentarios.value = response.data.data || [];
  } catch (error) {
    console.error('Error al cargar comentarios:', error);
  } finally {
    cargando.value = false;
  }
};

const enviarComentario = async () => {
  if (!nuevoComentario.value.trim()) return;
  
  try {
    await api.post(`/tareas/${props.tareaId}/comentarios`, {
      contenido: nuevoComentario.value
    });
    nuevoComentario.value = '';
    await cargarComentarios();
  } catch (error) {
    console.error('Error al enviar comentario:', error);
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
</script>

<style scoped>
.comentarios-container {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.comentarios-container h3 {
  margin-bottom: 16px;
  color: #333;
}

.sin-comentarios {
  color: #888;
  font-style: italic;
  padding: 16px;
  text-align: center;
}

.comentarios-list {
  margin-bottom: 16px;
}

.comentario {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.comentario-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.comentario-header strong {
  color: #333;
}

.comentario-header .fecha {
  font-size: 11px;
  color: #999;
}

.comentario-contenido {
  margin: 0;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.nuevo-comentario {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nuevo-comentario textarea {
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.nuevo-comentario textarea:focus {
  outline: none;
  border-color: #2d6a9f;
}

.btn-comentar {
  align-self: flex-end;
  padding: 8px 24px;
  background: #2d6a9f;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-comentar:hover:not(:disabled) {
  background: #1a4a7a;
}

.btn-comentar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint {
  font-size: 11px;
  color: #999;
  text-align: right;
}

.title-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  vertical-align: middle;
  margin-right: 6px;
}

.comentarios-container h3 {
  display: flex;
  align-items: center;
}

</style>