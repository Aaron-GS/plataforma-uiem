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
          {{ authStore.puedeCrearTareas ? 'Tareas creadas y asignadas a tu área' : 'Tareas asignadas a tu área' }}
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
      <!-- ✅ TARJETA CLICKEABLE -->
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
            {{ tarea.area_destino?.nombre || 'Sin área' }}
          </span>
          <span class="btn-ver">
            <img src="/src/assets/icons/icon-ver.png" alt="" class="btn-icon-small" />
            Ver tarea
          </span>
        </div>
      </div>
    </div>
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
const getEstadoLabel = (e) => ({ 'pendiente': 'Pendiente', 'en_proceso': 'En Proceso', 'por_validar': 'Por Validar', 'completada': 'Completada', 'rechazada': 'Rechazada' }[e] || e);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-MX') : 'Sin fecha';

onMounted(() => cargarTareas());
</script>

<style scoped>
.page-container { max-width: 1300px; margin: 0 auto; }
.header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #1a5c40; }
.header h1 { font-size: 28px; color: #0d3d2a; font-weight: 800; display: flex; align-items: center; gap: 10px; margin: 0; }
.title-icon { width: 32px; height: 32px; object-fit: contain; }
.subtitle { color: #666; font-size: 14px; margin-top: 4px; }
.info-banner { display: flex; gap: 10px; background: #e0ebe5; color: #0d3d2a; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; border-left: 4px solid #1a5c40; }

/* Filtros */
.filtros-container { background: white; padding: 16px 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(13, 61, 42, 0.08); margin-bottom: 24px; border: 1px solid #e0ebe5; }
.filtros-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.filtro-group { flex: 1; min-width: 150px; }
.input-busqueda { width: 100%; padding: 8px 14px 8px 38px; border: 2px solid #e0ebe5; border-radius: 6px; font-size: 14px; background-image: url('/src/assets/icons/icon-buscar.png'); background-repeat: no-repeat; background-position: 12px center; background-size: 16px; }
.input-busqueda:focus { outline: none; border-color: #1a5c40; }
.select-filtro { width: 100%; padding: 8px 14px; border: 2px solid #e0ebe5; border-radius: 6px; font-size: 14px; background: white; font-weight: 600; }
.btn-limpiar { display: inline-flex; align-items: center; gap: 4px; padding: 8px 16px; background: #f0f0f0; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; color: #666; font-weight: 600; }
.btn-limpiar:hover { background: #e0ebe5; color: #0d3d2a; }
.btn-icon-small { width: 14px; height: 14px; }
.resultados-info { margin-top: 10px; font-size: 13px; color: #888; }

/* Colores de filtros */
.select-filtro.estado-pendiente { color: #e65100; border-color: #ff9800; }
.select-filtro.estado-en_proceso { color: #0d47a1; border-color: #2196f3; }
.select-filtro.estado-por_validar { color: #6a1b9a; border-color: #9c27b0; }
.select-filtro.estado-completada { color: #1b5e20; border-color: #4caf50; }
.select-filtro.estado-rechazada { color: #b71c1c; border-color: #f44336; }
.select-filtro.prioridad-baja { color: #1b5e20; border-color: #4caf50; }
.select-filtro.prioridad-media { color: #e65100; border-color: #ff9800; }
.select-filtro.prioridad-alta { color: #b71c1c; border-color: #f44336; }
option.opt-pendiente { background: #fff3e0; color: #e65100; }
option.opt-en_proceso { background: #e3f2fd; color: #0d47a1; }
option.opt-por_validar { background: #f3e5f5; color: #6a1b9a; }
option.opt-completada { background: #e8f5e9; color: #1b5e20; }
option.opt-rechazada { background: #ffebee; color: #b71c1c; }
option.opt-baja { background: #e8f5e9; color: #1b5e20; }
option.opt-media { background: #fff3e0; color: #e65100; }
option.opt-alta { background: #ffebee; color: #b71c1c; }

/* Tarjetas */
.tareas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.tarea-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(13, 61, 42, 0.08); transition: all 0.25s; border-left: 4px solid #1a5c40; border-top: 1px solid #e0ebe5; border-right: 1px solid #e0ebe5; border-bottom: 1px solid #e0ebe5; cursor: pointer; }
.tarea-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(13, 61, 42, 0.15); border-left-color: #2d7a55; }
.tarea-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px; }
.tarea-header h3 { font-size: 16px; color: #0d3d2a; margin: 0; flex: 1; font-weight: 700; }
.estado { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; white-space: nowrap; }
.estado.pendiente { background: #fff3e0; color: #e65100; }
.estado.en_proceso { background: #e3f2fd; color: #0d47a1; }
.estado.por_validar { background: #f3e5f5; color: #6a1b9a; }
.estado.completada { background: #e0ebe5; color: #0d3d2a; }
.estado.rechazada { background: #ffebee; color: #b71c1c; }
.descripcion { color: #666; font-size: 14px; margin: 8px 0 12px 0; line-height: 1.5; }
.tarea-meta { display: flex; gap: 12px; margin-bottom: 12px; font-size: 12px; }
.prioridad, .fecha, .area { display: inline-flex; align-items: center; }
.prioridad { padding: 2px 8px; border-radius: 4px; font-weight: 700; }
.prioridad.baja { background: #e0ebe5; color: #0d3d2a; }
.prioridad.media { background: #fff3e0; color: #e65100; }
.prioridad.alta { background: #ffebee; color: #b71c1c; }
.fecha { color: #888; }
.meta-icon { width: 14px; height: 14px; margin-right: 4px; }
.meta-icon-small { width: 12px; height: 12px; margin-right: 4px; opacity: 0.7; }
.tarea-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #e0ebe5; }
.area { font-size: 12px; color: #888; }
.btn-ver { display: inline-flex; align-items: center; gap: 4px; padding: 6px 16px; background: #e0ebe5; color: #0d3d2a; border-radius: 6px; font-size: 13px; font-weight: 700; transition: all 0.2s; }
.tarea-card:hover .btn-ver { background: #1a5c40; color: white; }
.loading, .empty-state { text-align: center; padding: 60px 20px; color: #888; font-size: 15px; }
</style>