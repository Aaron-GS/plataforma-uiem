<!-- frontend/src/views/MisTareas.vue -->
<template>
  <div class="page-container">
    <div class="header">
      <div>
        <h1>
          <img src="/src/assets/icons/icon-tareas.png" alt="" class="title-icon" />
          Mis Tareas
        </h1>
        <p class="subtitle">
          {{ authStore.isSuperAdmin ? 'Todas las tareas del sistema' : 'Tareas asignadas a tu área' }}
        </p>
      </div>
    </div>

    <div v-if="authStore.esEjecutor" class="info-banner">
      <span>ℹ️</span>
      <span>Solo puedes ver las tareas asignadas a tu área. Para crear o asignar tareas, contacta a un administrador.</span>
    </div>

    <!-- Filtros -->
    <div class="filtros-container">
      <div class="filtros-row">
        <div class="filtro-group">
          <input v-model="filtros.busqueda" type="text" placeholder="Buscar por título..." class="input-busqueda" />
        </div>
        <div class="filtro-group">
          <select v-model="filtros.estado" class="select-filtro" :class="'estado-' + (filtros.estado || 'todos')">
            <option value="">Todos los estados</option>
            <option value="pendiente" class="opt-pendiente">🟡 Pendiente</option>
            <option value="en_proceso" class="opt-en_proceso">🔵 En Proceso</option>
            <option value="por_validar" class="opt-por_validar">🟣 Por Validar</option>
            <option value="completada" class="opt-completada">🟢 Completada</option>
            <option value="rechazada" class="opt-rechazada">🔴 Rechazada</option>
          </select>
        </div>
        <div class="filtro-group">
          <select v-model="filtros.prioridad" class="select-filtro" :class="'prioridad-' + (filtros.prioridad || 'todas')">
            <option value="">Todas las prioridades</option>
            <option value="baja" class="opt-baja">🟢 Baja</option>
            <option value="media" class="opt-media">🟠 Media</option>
            <option value="alta" class="opt-alta">🔴 Alta</option>
          </select>
        </div>
        <button @click="limpiarFiltros" class="btn-limpiar">
          <img src="/src/assets/icons/icon-limpiar.png" alt="" class="btn-icon-small" />
          Limpiar
        </button>
      </div>
      <div class="resultados-info">
        Mostrando {{ tareasFiltradas.length }} de {{ tareas.length }} tareas
      </div>
    </div>

    <!-- Lista de tareas -->
    <div v-if="loading" class="loading">Cargando tareas...</div>
    <div v-else-if="tareasFiltradas.length === 0" class="empty-state">
      <p>No hay tareas que coincidan con los filtros</p>
    </div>

    <div v-else class="tareas-grid">
      <div 
        v-for="tarea in tareasFiltradas" 
        :key="tarea.id" 
        class="tarea-card" 
        @click="verDetalle(tarea.id)"
      >
        <div class="tarea-header">
          <h3>{{ tarea.titulo }}</h3>
          <span class="estado" :class="tarea.estado">{{ getEstadoLabel(tarea.estado) }}</span>
        </div>
        <p class="descripcion">{{ tarea.descripcion || 'Sin descripción' }}</p>
        
        <!-- BARRA DE PROGRESO (Solo visible para Superadmins) -->
        <div 
          v-if="authStore.isSuperAdmin && tarea.areas_asignadas && tarea.areas_asignadas.length > 0" 
          class="progreso-resumen"
        >
          <div class="progreso-info">
            <span>Progreso de áreas:</span>
            <strong>{{ getAreasCompletadas(tarea) }} de {{ tarea.areas_asignadas.length }} completadas</strong>
          </div>
          <div class="progreso-barra">
            <div 
              class="progreso-fill" 
              :style="{ width: getPorcentaje(tarea) + '%' }"
              :class="{ 'completo': getPorcentaje(tarea) === 100 }"
            ></div>
          </div>
        </div>

        <div class="tarea-meta">
          <span class="prioridad" :class="tarea.prioridad">
            <img src="/src/assets/icons/icon-prioridad.png" alt="" class="meta-icon" />
            {{ tarea.prioridad.toUpperCase() }}
          </span>
          <span class="fecha" v-if="tarea.fecha_limite">
            <img src="/src/assets/icons/icon-fecha.png" alt="" class="meta-icon" />
            {{ formatDate(tarea.fecha_limite) }}
          </span>
        </div>
        
        <div class="tarea-footer">
          <span class="area">
            <img src="/src/assets/icons/icon-area.png" alt="" class="meta-icon-small" />
            {{ tarea.areas_asignadas?.length || 0 }} área(s)
          </span>
          <span class="btn-ver">
            <img src="/src/assets/icons/icon-ver.png" alt="" class="btn-icon-small" />
            Ver Detalle
          </span>
        </div>
      </div>
    </div>

    <!-- ✅ BOTÓN FLOTANTE (Solo visible para administradores) -->
    <button 
      v-if="authStore.puedeCrearTareas" 
      @click="irACrearTarea" 
      class="fab-crear-tarea"
      title="Crear Nueva Tarea"
    >
      <img src="/src/assets/icons/icon-crear.png" alt="" class="fab-icon" />
      <span>Crear Tarea</span>
    </button>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import api from '../services/api';

const router = useRouter();
const authStore = useAuthStore();

const tareas = ref([]);
const loading = ref(true);
const filtros = ref({ busqueda: '', estado: '', prioridad: '' });

const tareasFiltradas = computed(() => {
  let resultado = tareas.value;
  if (filtros.value.busqueda) {
    const b = filtros.value.busqueda.toLowerCase();
    resultado = resultado.filter(t => t.titulo.toLowerCase().includes(b) || (t.descripcion && t.descripcion.toLowerCase().includes(b)));
  }
  if (filtros.value.estado) resultado = resultado.filter(t => t.estado === filtros.value.estado);
  if (filtros.value.prioridad) resultado = resultado.filter(t => t.prioridad === filtros.value.prioridad);
  return resultado;
});

const getAreasCompletadas = (tarea) => {
  if (!tarea.areas_asignadas || tarea.areas_asignadas.length === 0) return 0;
  return tarea.areas_asignadas.filter(a => a.estado === 'completada').length;
};

const getPorcentaje = (tarea) => {
  if (!tarea.areas_asignadas || tarea.areas_asignadas.length === 0) return 0;
  const total = tarea.areas_asignadas.length;
  const completadas = getAreasCompletadas(tarea);
  return Math.round((completadas / total) * 100);
};

const cargarTareas = async () => {
  loading.value = true;
  try {
    const response = await api.get('/tareas');
    tareas.value = response.data.data || [];
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const limpiarFiltros = () => { filtros.value = { busqueda: '', estado: '', prioridad: '' }; };
const verDetalle = (id) => router.push(`/tareas/${id}`);
const irACrearTarea = () => router.push('/tareas');
const getEstadoLabel = (e) => ({ 'pendiente': 'Pendiente', 'en_proceso': 'En Proceso', 'por_validar': 'Por Validar', 'completada': 'Completada', 'rechazada': 'Rechazada' }[e] || e);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-MX') : 'Sin fecha';

onMounted(() => cargarTareas());
</script>

<style scoped>
/* ... (Todo el CSS anterior se mantiene igual) ... */
.page-container { max-width: 1300px; margin: 0 auto; padding-bottom: 80px; /* Espacio para el botón flotante */ }
/* ... */

/* ✅ ESTILOS DEL BOTÓN FLOTANTE (FAB) */
.fab-crear-tarea {
  position: fixed;
  bottom: 30px;
  right: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #0d3d2a 0%, #1a5c40 100%);
  color: white;
  border: none;
  border-radius: 30px; /* Bordes muy redondeados */
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 25px rgba(13, 61, 42, 0.4);
  transition: all 0.3s ease;
  z-index: 1000;
}

.fab-crear-tarea:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 30px rgba(13, 61, 42, 0.5);
  background: linear-gradient(135deg, #1a5c40 0%, #2d7a55 100%);
}

.fab-crear-tarea:active {
  transform: translateY(0) scale(1);
}

.fab-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}
</style>