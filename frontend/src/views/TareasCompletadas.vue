<!-- frontend/src/views/TareasCompletadas.vue -->
<template>
  <div class="page-container">
    <div class="header">
      <div class="header-title">
        <h1>
          <img src="/src/assets/icons/icon-tareas.png" alt="" class="title-icon" />
          Tareas Completadas
        </h1>
        <p class="subtitle">Historial de tareas finalizadas</p>
      </div>
    </div>

    <!-- Filtros simples -->
    <div class="filtros-container">
      <div class="filtros-row">
        <div class="filtro-group">
          <input v-model="busqueda" type="text" placeholder="Buscar por título..." class="input-busqueda" />
        </div>
        <button @click="busqueda = ''" class="btn-limpiar">
          <img src="/src/assets/icons/icon-limpiar.png" alt="" class="btn-icon-small" />
          Limpiar
        </button>
      </div>
      <div class="resultados-info">
        Mostrando {{ tareasFiltradas.length }} tareas completadas
      </div>
    </div>

    <!-- Lista de tareas -->
    <div v-if="loading" class="loading">Cargando tareas...</div>
    <div v-else-if="tareasFiltradas.length === 0" class="empty-state">
      <p>No hay tareas completadas que coincidan.</p>
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
          <span class="estado completada">COMPLETADA</span>
        </div>
        <p class="descripcion">{{ tarea.descripcion || 'Sin descripción' }}</p>
        
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
              class="progreso-fill completo" 
              :style="{ width: getPorcentaje(tarea) + '%' }"
            ></div>
          </div>
        </div>

        <!-- ✅ ETIQUETAS ORGANIZADAS: PRIORIDAD A LA IZQ, FECHA Y HORA A LA DER -->
        <div class="tarea-meta">
          <!-- Prioridad a la izquierda -->
          <div class="meta-item">
            <span class="meta-label">Prioridad:</span>
            <span class="prioridad" :class="tarea.prioridad">
              <img src="/src/assets/icons/icon-prioridad.png" alt="" class="meta-icon" />
              {{ tarea.prioridad.toUpperCase() }}
            </span>
          </div>

          <!-- Fecha y Hora en columna a la derecha -->
          <div v-if="tarea.fecha_limite" class="meta-fecha-hora">
            <div class="meta-item">
              <span class="meta-label">Fecha Límite:</span>
              <span class="fecha">
                <img src="/src/assets/icons/icon-fecha.png" alt="" class="meta-icon" />
                {{ formatDateOnly(tarea.fecha_limite) }}
              </span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Hora Límite:</span>
              <span class="fecha">
                <img src="/src/assets/icons/icon-fecha.png" alt="" class="meta-icon" style="filter: grayscale(100%); opacity: 0.7;" />
                {{ formatTimeOnly(tarea.fecha_limite) }}
              </span>
            </div>
          </div>
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
const busqueda = ref('');

const tareasFiltradas = computed(() => {
  let resultado = tareas.value;
  if (busqueda.value) {
    const b = busqueda.value.toLowerCase();
    resultado = resultado.filter(t => t.titulo.toLowerCase().includes(b));
  }
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

const cargarTareasCompletadas = async () => {
  loading.value = true;
  try {
    const response = await api.get('/tareas?estado=completada');
    tareas.value = response.data.data || [];
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const verDetalle = (id) => router.push(`/tareas/${id}`);

// ✅ Funciones para separar fecha y hora
const formatDateOnly = (d) => {
  if (!d) return 'Sin fecha';
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTimeOnly = (d) => {
  if (!d) return 'Sin hora';
  return new Date(d).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => cargarTareasCompletadas());
</script>

<style scoped>
.page-container { max-width: 1300px; margin: 0 auto; }

.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #1a5c40; gap: 16px; flex-wrap: wrap; }
.header-title h1 { font-size: 28px; color: #0d3d2a; font-weight: 800; display: flex; align-items: center; gap: 10px; margin: 0; }
.title-icon { width: 32px; height: 32px; object-fit: contain; }
.subtitle { color: #666; font-size: 14px; margin-top: 4px; }

.filtros-container { background: white; padding: 16px 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(13, 61, 42, 0.08); margin-bottom: 24px; border: 1px solid #e0ebe5; }
.filtros-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.filtro-group { flex: 1; min-width: 150px; }
.input-busqueda { width: 100%; padding: 8px 14px 8px 38px; border: 2px solid #e0ebe5; border-radius: 6px; font-size: 14px; background-image: url('/src/assets/icons/icon-buscar.png'); background-repeat: no-repeat; background-position: 12px center; background-size: 16px; box-sizing: border-box; }
.input-busqueda:focus { outline: none; border-color: #1a5c40; }
.btn-limpiar { display: inline-flex; align-items: center; gap: 4px; padding: 8px 16px; background: #f0f0f0; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; color: #666; font-weight: 600; }
.btn-limpiar:hover { background: #e0ebe5; color: #0d3d2a; }
.btn-icon-small { width: 14px; height: 14px; }
.resultados-info { margin-top: 10px; font-size: 13px; color: #888; }

.tareas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
.tarea-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(13, 61, 42, 0.08); transition: all 0.25s; border-left: 4px solid #1a5c40; border-top: 1px solid #e0ebe5; border-right: 1px solid #e0ebe5; border-bottom: 1px solid #e0ebe5; cursor: pointer; opacity: 0.9; }
.tarea-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(13, 61, 42, 0.15); border-left-color: #2d7a55; opacity: 1; }
.tarea-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px; }
.tarea-header h3 { font-size: 16px; color: #0d3d2a; margin: 0; flex: 1; font-weight: 700; }
.estado { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; white-space: nowrap; }
.estado.completada { background: #e0ebe5; color: #0d3d2a; }
.descripcion { color: #666; font-size: 14px; margin: 8px 0 12px 0; line-height: 1.5; }

.progreso-resumen { background: #f8f9fa; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; border: 1px solid #e0ebe5; }
.progreso-info { display: flex; justify-content: space-between; font-size: 12px; color: #555; margin-bottom: 4px; }
.progreso-barra { height: 6px; background: #e0ebe5; border-radius: 3px; overflow: hidden; }
.progreso-fill { height: 100%; background: #1a5c40; border-radius: 3px; transition: width 0.5s; }
.progreso-fill.completo { background: #4caf50; }

/* ✅ CONTENEDOR PRINCIPAL DE LA FILA (Prioridad Izq, Fecha y Hora Der) */
.tarea-meta { 
  display: flex; 
  justify-content: space-between; 
  align-items: flex-start;
  margin-bottom: 16px; 
  font-size: 12px; 
}

/* ✅ COLUMNA DE FECHA Y HORA (Alineada a la derecha) */
.meta-fecha-hora {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end; 
}

.meta-item { display: flex; align-items: center; gap: 4px; }
.meta-label { font-weight: 700; color: #666; text-transform: uppercase; font-size: 11px; }
.prioridad, .fecha { display: inline-flex; align-items: center; }
.prioridad { padding: 2px 8px; border-radius: 4px; font-weight: 700; }
.prioridad.baja { background: #e0ebe5; color: #0d3d2a; }
.prioridad.media { background: #fff3e0; color: #e65100; }
.prioridad.alta { background: #ffebee; color: #b71c1c; }
.fecha { color: #888; font-weight: 600; }

.meta-icon { width: 14px; height: 14px; margin-right: 4px; }
.meta-icon-small { width: 12px; height: 12px; margin-right: 4px; opacity: 0.7; }
.tarea-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #e0ebe5; }
.area { font-size: 12px; color: #888; }
.btn-ver { display: inline-flex; align-items: center; gap: 4px; padding: 6px 16px; background: #e0ebe5; color: #0d3d2a; border-radius: 6px; font-size: 13px; font-weight: 700; transition: all 0.2s; }
.tarea-card:hover .btn-ver { background: #1a5c40; color: white; }
.loading, .empty-state { text-align: center; padding: 60px 20px; color: #888; font-size: 15px; }
</style>