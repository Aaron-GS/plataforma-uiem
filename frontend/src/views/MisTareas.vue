<!-- frontend/src/views/MisTareas.vue -->
<template>
  <div class="page-container">
    <!-- HEADER -->
    <div class="header">
      <div class="header-title">
        <h1>
          <img src="/src/assets/icons/icon-tareas.png" alt="" class="title-icon" />
          Mis Tareas
        </h1>
        <p class="subtitle">
          {{ authStore.isSuperAdmin ? 'Todas las tareas del sistema' : 'Tareas asignadas a tu área' }}
        </p>
      </div>

      <button 
        v-if="authStore.puedeCrearTareas" 
        @click="irACrearTarea" 
        class="btn-crear-tarea"
      >
        <img src="/src/assets/icons/icon-crear.png" alt="" class="btn-icon" />
        Crear Tarea
      </button>
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
          <div class="estados-container">
            <span v-if="estaVencida(tarea)" class="estado vencida">VENCIDA</span>
            <span class="estado" :class="tarea.estado">{{ getEstadoLabel(tarea.estado) }}</span>
          </div>
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
              class="progreso-fill" 
              :style="{ width: getPorcentaje(tarea) + '%' }"
              :class="{ 'completo': getPorcentaje(tarea) === 100 }"
            ></div>
          </div>
        </div>

        <div class="tarea-meta">
          <div class="meta-item">
            <span class="meta-label">Prioridad:</span>
            <span class="prioridad" :class="tarea.prioridad">
              <img src="/src/assets/icons/icon-prioridad.png" alt="" class="meta-icon" />
              {{ tarea.prioridad.toUpperCase() }}
            </span>
          </div>

          <div v-if="tarea.fecha_limite" class="meta-fecha-hora">
            <div class="meta-item">
              <span class="meta-label">Fecha Límite:</span>
              <span class="fecha" :class="{ 'texto-vencido': estaVencida(tarea) }">
                <img src="/src/assets/icons/icon-fecha.png" alt="" class="meta-icon" />
                {{ formatDateOnly(tarea.fecha_limite) }}
              </span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Hora Límite:</span>
              <span class="fecha" :class="{ 'texto-vencido': estaVencida(tarea) }">
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
          
          <div class="footer-botones">
            <button 
              v-if="authStore.isSuperAdmin" 
              @click.stop="confirmarEliminar(tarea.id)" 
              class="btn-accion btn-borrar"
              title="Eliminar Tarea"
            >
              🗑️ Eliminar
            </button>

            <button 
              v-if="authStore.isSuperAdmin" 
              @click.stop="abrirModalEditar(tarea)" 
              class="btn-accion btn-editar"
              title="Editar Tarea"
            >
              ✏️ Editar
            </button>

            <span class="btn-accion btn-ver">
              <img src="/src/assets/icons/icon-ver.png" alt="" class="btn-icon-small" />
              Ver Detalle
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE EDICIÓN -->
    <div v-if="modalEditarAbierto" class="modal-overlay" @click.self="cerrarModalEditar">
      <div class="modal-content modal-large">
        <h2>Editar Tarea</h2>
        
        <div class="form-grid">
          <div class="field full-width">
            <label>Título *</label>
            <input v-model="tareaEditando.titulo" type="text" required />
          </div>

          <div class="field full-width">
            <label>Descripción</label>
            <textarea v-model="tareaEditando.descripcion" rows="2"></textarea>
          </div>

          <div class="field">
            <label>Prioridad</label>
            <select v-model="tareaEditando.prioridad">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          
          <div class="field">
            <label>Fecha y Hora Límite</label>
            <div class="date-input-group">
              <input v-model="tareaEditando.fecha_limite" type="date" class="input-date" />
              <input v-model="tareaEditando.hora_limite" type="time" class="input-time" />
            </div>
          </div>
        </div>

        <div class="edit-areas-section">
          <label>Áreas Asignadas ({{ tareaEditando.areas_ids.length }} seleccionadas)</label>
          <div class="areas-checkbox-list">
            <label v-for="area in todasLasAreas" :key="area.id" class="area-checkbox-item">
              <input 
                type="checkbox" 
                :value="area.id" 
                v-model="tareaEditando.areas_ids"
              />
              {{ area.nombre }}
            </label>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="cerrarModalEditar" class="btn-cancel">Cancelar</button>
          <button @click="guardarCambios" class="btn-save">Guardar Cambios</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { useTareasStore } from '../store/tareas'; // ✅ Importamos el store
import api from '../services/api';
import { getSocket } from '../services/socket'; // ✅ Importamos el socket

const router = useRouter();
const authStore = useAuthStore();
const tareasStore = useTareasStore();

// Usamos las tareas del store global
const tareas = computed(() => tareasStore.tareas);
const loading = computed(() => tareasStore.loading);

const filtros = ref({ busqueda: '', estado: '', prioridad: '' });
const todasLasAreas = ref([]);

const modalEditarAbierto = ref(false);
const tareaEditando = ref({ id: null, titulo: '', descripcion: '', prioridad: '', fecha_limite: '', hora_limite: '', areas_ids: [] });

const tareasFiltradas = computed(() => {
  let resultado = tareas.value;
  if (filtros.value.busqueda) {
    const b = filtros.value.busqueda.toLowerCase();
    resultado = resultado.filter(t => t.titulo.toLowerCase().includes(b) || (t.descripcion && t.descripcion.toLowerCase().includes(b)));
  }
  if (filtros.value.estado) resultado = resultado.filter(t => t.estado === filtros.value.estado);
  if (filtros.value.prioridad) resultado = resultado.filter(t => t.prioridad === filtros.value.prioridad);
  
  return resultado.sort((a, b) => {
    if (!a.fecha_limite) return 1;
    if (!b.fecha_limite) return -1;
    return new Date(a.fecha_limite) - new Date(b.fecha_limite);
  });
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

const estaVencida = (tarea) => {
  if (!tarea.fecha_limite) return false;
  if (tarea.estado === 'completada') return false;
  return new Date(tarea.fecha_limite) < new Date();
};

const limpiarFiltros = () => { filtros.value = { busqueda: '', estado: '', prioridad: '' }; };
const verDetalle = (id) => router.push(`/tareas/${id}`);
const irACrearTarea = () => router.push('/tareas');
const getEstadoLabel = (e) => ({ 'pendiente': 'Pendiente', 'en_proceso': 'En Proceso', 'por_validar': 'Por Validar', 'completada': 'Completada', 'rechazada': 'Rechazada' }[e] || e);

const formatDateOnly = (d) => {
  if (!d) return 'Sin fecha';
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTimeOnly = (d) => {
  if (!d) return 'Sin hora';
  return new Date(d).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

const abrirModalEditar = (tarea) => {
  let fechaStr = '';
  let horaStr = '';
  if (tarea.fecha_limite) {
    const dateObj = new Date(tarea.fecha_limite);
    fechaStr = dateObj.toISOString().split('T')[0];
    horaStr = dateObj.toTimeString().slice(0, 5);
  }

  const areasIds = tarea.areas_asignadas ? tarea.areas_asignadas.map(a => a.area_id) : [];

  tareaEditando.value = {
    id: tarea.id,
    titulo: tarea.titulo,
    descripcion: tarea.descripcion || '',
    prioridad: tarea.prioridad,
    fecha_limite: fechaStr,
    hora_limite: horaStr,
    areas_ids: areasIds
  };
  modalEditarAbierto.value = true;
};

const cerrarModalEditar = () => {
  modalEditarAbierto.value = false;
};

const guardarCambios = async () => {
  if (!tareaEditando.value.titulo.trim()) {
    alert('El título es obligatorio');
    return;
  }

  try {
    let fechaCompleta = null;
    if (tareaEditando.value.fecha_limite) {
      const hora = tareaEditando.value.hora_limite || '23:59';
      fechaCompleta = `${tareaEditando.value.fecha_limite}T${hora}:00`;
    }

    const areasAsignadas = tareaEditando.value.areas_ids.map(areaId => ({
      area_id: areaId,
      asignada_a: null
    }));

    await api.put(`/tareas/${tareaEditando.value.id}`, {
      titulo: tareaEditando.value.titulo,
      descripcion: tareaEditando.value.descripcion,
      prioridad: tareaEditando.value.prioridad,
      fecha_limite: fechaCompleta,
      areas_asignadas: areasAsignadas
    });
    
    alert('✅ Tarea actualizada correctamente');
    cerrarModalEditar();
    
    // ✅ FORZAR RECARGA LOCAL INMEDIATA
    await tareasStore.cargarTareas(); 
    
  } catch (error) {
    console.error('Error al actualizar:', error);
    alert('❌ Error al guardar los cambios');
  }
};

const confirmarEliminar = async (id) => {
  if (confirm('⚠️ ¿Estás seguro de que deseas eliminar esta tarea permanentemente? Esta acción no se puede deshacer.')) {
    try {
      await api.delete(`/tareas/${id}`);
      alert('🗑️ Tarea eliminada correctamente');
      await tareasStore.cargarTareas(); // Recargar tras eliminar
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('❌ Error al eliminar la tarea: ' + (error.response?.data?.message || error.message));
    }
  }
};

onMounted(async () => {
  await tareasStore.cargarTareas(); // Cargar inicial
  try {
    const resAreas = await api.get('/areas');
    todasLasAreas.value = resAreas.data.data;
  } catch (error) {
    console.error('Error al cargar áreas', error);
  }

  // ✅ ESCUCHA DIRECTA DEL SOCKET EN ESTA VISTA (Por si el store falla)
  const socket = getSocket();
  if (socket) {
    socket.on('actualizar_tareas', () => {
      console.log('🔄 Actualizando lista de Mis Tareas por evento de socket...');
      tareasStore.cargarTareas(); // Recarga los datos del store
    });
  }
});

onUnmounted(() => {
  // Limpiar el listener al salir
  const socket = getSocket();
  if (socket) {
    socket.off('actualizar_tareas');
  }
});
</script>

<style scoped>
/* ... (Los mismos estilos de tu MisTareas.vue original, sin cambios) ... */
.page-container { max-width: 1300px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #1a5c40; gap: 16px; flex-wrap: wrap; }
.header-title h1 { font-size: 28px; color: #0d3d2a; font-weight: 800; display: flex; align-items: center; gap: 10px; margin: 0; }
.title-icon { width: 32px; height: 32px; object-fit: contain; }
.subtitle { color: #666; font-size: 14px; margin-top: 4px; }
.btn-crear-tarea { display: inline-flex; align-items: center; gap: 10px; padding: 14px 28px; background: linear-gradient(135deg, #0d3d2a 0%, #1a5c40 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 800; cursor: pointer; transition: all 0.25s; box-shadow: 0 4px 12px rgba(13, 61, 42, 0.3); }
.btn-crear-tarea:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(13, 61, 42, 0.4); }
.btn-icon { width: 22px; height: 22px; object-fit: contain; filter: none; }
.info-banner { display: flex; gap: 10px; background: #e0ebe5; color: #0d3d2a; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; border-left: 4px solid #1a5c40; }
.filtros-container { background: white; padding: 16px 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(13, 61, 42, 0.08); margin-bottom: 24px; border: 1px solid #e0ebe5; }
.filtros-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.filtro-group { flex: 1; min-width: 150px; }
.input-busqueda { width: 100%; padding: 8px 14px 8px 38px; border: 2px solid #e0ebe5; border-radius: 6px; font-size: 14px; background-image: url('/src/assets/icons/icon-buscar.png'); background-repeat: no-repeat; background-position: 12px center; background-size: 16px; box-sizing: border-box; }
.input-busqueda:focus { outline: none; border-color: #1a5c40; }
.select-filtro { width: 100%; padding: 8px 14px; border: 2px solid #e0ebe5; border-radius: 6px; font-size: 14px; background: white; font-weight: 600; box-sizing: border-box;}
.btn-limpiar { display: inline-flex; align-items: center; gap: 4px; padding: 8px 16px; background: #f0f0f0; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; color: #666; font-weight: 600; }
.btn-limpiar:hover { background: #e0ebe5; color: #0d3d2a; }
.btn-icon-small { width: 14px; height: 14px; }
.resultados-info { margin-top: 10px; font-size: 13px; color: #888; }
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
.tareas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
.tarea-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(13, 61, 42, 0.08); transition: all 0.25s; border-left: 4px solid #1a5c40; border-top: 1px solid #e0ebe5; border-right: 1px solid #e0ebe5; border-bottom: 1px solid #e0ebe5; cursor: pointer; }
.tarea-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(13, 61, 42, 0.15); border-left-color: #2d7a55; }
.tarea-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px; }
.tarea-header h3 { font-size: 16px; color: #0d3d2a; margin: 0; flex: 1; font-weight: 700; }
.estados-container { display: flex; gap: 6px; align-items: center; }
.estado { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; white-space: nowrap; }
.estado.pendiente { background: #fff3e0; color: #e65100; }
.estado.en_proceso { background: #e3f2fd; color: #0d47a1; }
.estado.por_validar { background: #f3e5f5; color: #6a1b9a; }
.estado.completada { background: #e0ebe5; color: #0d3d2a; }
.estado.rechazada { background: #ffebee; color: #b71c1c; }
.estado.vencida { background: #ffebee; color: #b71c1c; border: 1px solid #f44336; font-weight: 800; animation: pulse 2s infinite; }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
.descripcion { color: #666; font-size: 14px; margin: 8px 0 12px 0; line-height: 1.5; }
.progreso-resumen { background: #f8f9fa; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; border: 1px solid #e0ebe5; }
.progreso-info { display: flex; justify-content: space-between; font-size: 12px; color: #555; margin-bottom: 4px; }
.progreso-barra { height: 6px; background: #e0ebe5; border-radius: 3px; overflow: hidden; }
.progreso-fill { height: 100%; background: #1a5c40; border-radius: 3px; transition: width 0.5s; }
.progreso-fill.completo { background: #4caf50; }
.tarea-meta { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; font-size: 12px; }
.meta-fecha-hora { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
.meta-item { display: flex; align-items: center; gap: 4px; }
.meta-label { font-weight: 700; color: #666; text-transform: uppercase; font-size: 11px; }
.prioridad, .fecha { display: inline-flex; align-items: center; }
.prioridad { padding: 2px 8px; border-radius: 4px; font-weight: 700; }
.prioridad.baja { background: #e0ebe5; color: #0d3d2a; }
.prioridad.media { background: #fff3e0; color: #e65100; }
.prioridad.alta { background: #ffebee; color: #b71c1c; }
.fecha { color: #888; font-weight: 600; }
.fecha.texto-vencido { color: #b71c1c; font-weight: 700; }
.meta-icon { width: 14px; height: 14px; margin-right: 4px; }
.meta-icon-small { width: 12px; height: 12px; margin-right: 4px; opacity: 0.7; }
.tarea-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #e0ebe5; }
.area { font-size: 12px; color: #888; }
.footer-botones { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.btn-accion { display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; border: 1px solid transparent; }
.btn-borrar { background: #ffebee; color: #b71c1c; border-color: #f44336; }
.btn-borrar:hover { background: #f44336; color: white; }
.btn-editar { background: #fff3e0; color: #e65100; border-color: #ff9800; }
.btn-editar:hover { background: #ff9800; color: white; }
.btn-ver { background: #e0ebe5; color: #0d3d2a; border-color: #1a5c40; }
.tarea-card:hover .btn-ver { background: #1a5c40; color: white; }
.loading, .empty-state { text-align: center; padding: 60px 20px; color: #888; font-size: 15px; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; padding: 24px; border-radius: 12px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
.modal-large { max-width: 650px; }
.modal-content h2 { color: #0d3d2a; margin-bottom: 20px; font-weight: 800; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-grid .full-width { grid-column: 1 / -1; }
.modal-content .field { display: flex; flex-direction: column; gap: 4px; }
.modal-content .field label { font-weight: 700; font-size: 13px; color: #0d3d2a; }
.modal-content .field input, .modal-content .field select, .modal-content .field textarea { padding: 10px 14px; border: 2px solid #e0ebe5; border-radius: 6px; font-size: 14px; font-family: inherit; box-sizing: border-box; }
.modal-content .field input:focus, .modal-content .field select:focus, .modal-content .field textarea:focus { outline: none; border-color: #1a5c40; }
.date-input-group { display: flex; gap: 8px; }
.input-date { flex: 2; }
.input-time { flex: 1; }
.edit-areas-section { margin-top: 16px; border-top: 1px solid #e0ebe5; padding-top: 16px; }
.edit-areas-section > label { display: block; font-weight: 700; margin-bottom: 8px; color: #0d3d2a; font-size: 13px; }
.areas-checkbox-list { max-height: 150px; overflow-y: auto; background: #f8f9fa; border: 1px solid #e0ebe5; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
.area-checkbox-item { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; color: #333; }
.area-checkbox-item input { accent-color: #1a5c40; width: 16px; height: 16px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.btn-cancel { padding: 10px 20px; background: #f0f0f0; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-save { padding: 10px 20px; background: #1a5c40; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-save:hover { background: #0d3d2a; }
</style>