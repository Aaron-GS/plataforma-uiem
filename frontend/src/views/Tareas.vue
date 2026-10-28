<!-- frontend/src/views/Tareas.vue -->
<template>
  <div class="page-container">
    <!-- Acceso denegado -->
    <div v-if="!authStore.puedeCrearTareas" class="acceso-denegado">
      <div class="denegado-card">
        <span class="icono">🔒</span>
        <h1>Acceso Restringido</h1>
        <p>Solo los administradores pueden crear y asignar tareas.</p>
        <p class="detalle">
          Si necesitas crear una tarea, contacta a RECTORÍA, ADMINISTRACIÓN Y FINANZAS o CONTROL ESCOLAR.
        </p>
        <button @click="volver" class="btn-primary">
          ← Volver a Mis Tareas
        </button>
      </div>
    </div>

    <!-- Formulario -->
    <div v-else>
      <h1>
        <img src="/src/assets/icons/icon-crear.png" alt="" class="title-icon" />
        Gestión de Tareas
      </h1>
      <p class="subtitle">Crear y administrar tareas para las áreas de la universidad</p>

      <div class="form-container">
        <h2>Crear Nueva Tarea</h2>
        <form @submit.prevent="crearTarea">
          <div class="form-grid">
            <div class="field full-width">
              <label>Título *</label>
              <input v-model="nuevaTarea.titulo" type="text" required placeholder="Ej: Revisión de expedientes" />
            </div>

            <div class="field full-width">
              <label>Descripción</label>
              <textarea v-model="nuevaTarea.descripcion" rows="2" placeholder="Describe el objetivo..."></textarea>
            </div>

            <div class="field">
              <label>Prioridad</label>
              <select v-model="nuevaTarea.prioridad">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div class="field">
              <label>Fecha Límite General</label>
              <input v-model="nuevaTarea.fecha_limite" type="datetime-local" />
            </div>
          </div>

          <!-- Selector de áreas -->
          <div class="areas-section">
            <div class="areas-header">
              <h3>
                <img src="/src/assets/icons/icon-area.png" alt="" class="section-icon-white" />
                Áreas Destino ({{ areasSeleccionadas.length }} seleccionadas)
              </h3>
              <div class="areas-actions">
                <button type="button" @click="seleccionarTodas" class="btn-mini">Todas</button>
                <button type="button" @click="limpiarSeleccion" class="btn-mini">Limpiar</button>
              </div>
            </div>

            <div v-for="cat in areasAgrupadas" :key="cat.categoria" class="categoria-grupo">
              <div class="categoria-titulo">{{ cat.categoria }}</div>
              <div class="categoria-areas">
                <div 
                  v-for="area in cat.areas" 
                  :key="area.id" 
                  class="area-item"
                  :class="{ seleccionada: areasSeleccionadas.includes(area.id) }"
                >
                  <label class="area-checkbox">
                    <input 
                      type="checkbox" 
                      :value="area.id" 
                      v-model="areasSeleccionadas"
                    />
                    <span class="area-nombre">{{ area.nombre }}</span>
                  </label>
                  
                  <div v-if="areasSeleccionadas.includes(area.id)" class="area-usuario">
                    <select 
                      v-model="areasUsuarios[area.id]" 
                      class="select-usuario"
                    >
                      <option :value="null">Sin asignar (toda el área)</option>
                      <option 
                        v-for="user in getUsuariosDeArea(area.id)" 
                        :key="user.id" 
                        :value="user.id"
                      >
                        {{ user.nombre }} {{ user.apellidos }}
                      </option>
                    </select>
                    <input 
                      type="datetime-local" 
                      v-model="areasFechas[area.id]"
                      class="input-fecha-area"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="areasSeleccionadas.length > 0" class="resumen-seleccion">
            <strong>📌 Se creará 1 tarea para {{ areasSeleccionadas.length }} área(s):</strong>
            <div class="resumen-lista">
              <div v-for="areaId in areasSeleccionadas" :key="areaId" class="resumen-item">
                <span class="area-nombre-resumen">{{ getAreaNombre(areaId) }}</span>
                <span class="area-usuario-resumen">
                  <img src="/src/assets/icons/icon-usuario.png" alt="" class="meta-icon-small" />
                  {{ getUsuarioNombre(areasUsuarios[areaId]) || 'Sin asignar' }}
                </span>
              </div>
            </div>
          </div>

          <button type="submit" class="btn-primary" :disabled="areasSeleccionadas.length === 0">
            <img src="/src/assets/icons/icon-crear.png" alt="" class="btn-icon" />
            Crear Tarea ({{ areasSeleccionadas.length }} área{{ areasSeleccionadas.length !== 1 ? 's' : '' }})
          </button>
        </form>
      </div>

      <!-- Lista de tareas -->
      <div class="tareas-list">
        <h2>Tareas Existentes</h2>
        <div v-if="loading" class="loading">Cargando...</div>
        <div v-else-if="tareas.length === 0" class="empty">No hay tareas creadas</div>
        <div v-else class="tareas-grid">
          <div v-for="tarea in tareas" :key="tarea.id" class="tarea-card">
            <div class="tarea-header">
              <h3>{{ tarea.titulo }}</h3>
              <span class="estado" :class="tarea.estado">
                {{ getEstadoLabel(tarea.estado) }}
              </span>
            </div>
            <p class="descripcion">{{ tarea.descripcion || 'Sin descripción' }}</p>
            
            <!-- Progreso -->
            <div v-if="tarea.areas_asignadas && tarea.areas_asignadas.length > 0" class="progreso-container">
              <div class="progreso-header">
                <span class="progreso-label">
                  Progreso: {{ getProgreso(tarea).completadas }} de {{ getProgreso(tarea).total }} áreas
                </span>
                <span class="progreso-porcentaje">{{ getProgreso(tarea).porcentaje }}%</span>
              </div>
              <div class="progreso-bar">
                <div 
                  class="progreso-fill" 
                  :style="{ width: getProgreso(tarea).porcentaje + '%' }"
                  :class="getProgreso(tarea).porcentaje === 100 ? 'completo' : ''"
                ></div>
              </div>
            </div>

            <!-- Áreas con estados -->
            <div v-if="tarea.areas_asignadas && tarea.areas_asignadas.length > 0" class="areas-estados">
              <div 
                v-for="ta in tarea.areas_asignadas" 
                :key="ta.id" 
                class="area-estado-item"
              >
                <img src="/src/assets/icons/icon-area.png" alt="" class="meta-icon-small" />
                <span class="area-nombre-small">{{ ta.area?.nombre }}</span>
                <span class="estado-small" :class="ta.estado">
                  {{ getEstadoLabel(ta.estado) }}
                </span>
                <span v-if="ta.asignado" class="asignado-small">
                  <img src="/src/assets/icons/icon-usuario.png" alt="" class="meta-icon-small" />
                  {{ ta.asignado.nombre }}
                </span>
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
              <span class="creador">
                <img src="/src/assets/icons/icon-creador.png" alt="" class="meta-icon-small" />
                Creado por: {{ tarea.creador?.nombre || 'N/A' }}
              </span>
            </div>
          </div>
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
const areas = ref([]);
const usuarios = ref([]);
const loading = ref(false);
const areasSeleccionadas = ref([]);
const areasUsuarios = ref({});
const areasFechas = ref({});

const areasAgrupadas = computed(() => {
  const grupos = {};
  areas.value.forEach(area => {
    if (!grupos[area.categoria]) {
      grupos[area.categoria] = { categoria: area.categoria, areas: [] };
    }
    grupos[area.categoria].areas.push(area);
  });
  return Object.values(grupos);
});

const nuevaTarea = ref({
  titulo: '',
  descripcion: '',
  prioridad: 'media',
  fecha_limite: ''
});

const volver = () => router.push('/mis-tareas');

const getAreaNombre = (id) => {
  const area = areas.value.find(a => a.id === id);
  return area ? area.nombre : 'N/A';
};

const getUsuarioNombre = (userId) => {
  if (!userId) return null;
  const user = usuarios.value.find(u => u.id === userId);
  return user ? `${user.nombre} ${user.apellidos}` : null;
};

const getUsuariosDeArea = (areaId) => {
  return usuarios.value.filter(u => u.area_id === areaId);
};

const seleccionarTodas = () => {
  areasSeleccionadas.value = areas.value.map(a => a.id);
};

const limpiarSeleccion = () => {
  areasSeleccionadas.value = [];
  areasUsuarios.value = {};
  areasFechas.value = {};
};

const getProgreso = (tarea) => {
  if (!tarea.areas_asignadas || tarea.areas_asignadas.length === 0) {
    return { total: 0, completadas: 0, porcentaje: 0 };
  }
  const total = tarea.areas_asignadas.length;
  const completadas = tarea.areas_asignadas.filter(a => a.estado === 'completada').length;
  const porcentaje = Math.round((completadas / total) * 100);
  return { total, completadas, porcentaje };
};

const cargarTareas = async () => {
  loading.value = true;
  try {
    const response = await api.get('/tareas');
    tareas.value = response.data.data || [];
  } catch (error) {
    console.error('Error al cargar tareas:', error);
  } finally {
    loading.value = false;
  }
};

const cargarAreas = async () => {
  try {
    const response = await api.get('/areas');
    areas.value = response.data.data || [];
  } catch (error) {
    console.error('Error al cargar áreas:', error);
  }
};

const cargarUsuarios = async () => {
  try {
    const response = await api.get('/usuarios');
    usuarios.value = response.data.data || [];
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
  }
};

const crearTarea = async () => {
  if (areasSeleccionadas.value.length === 0) {
    alert('⚠️ Debes seleccionar al menos un área destino');
    return;
  }

  try {
    const areasAsignadas = areasSeleccionadas.value.map(areaId => ({
      area_id: areaId,
      asignada_a: areasUsuarios.value[areaId] || null,
      fecha_limite: areasFechas.value[areaId] || nuevaTarea.value.fecha_limite || null
    }));

    const datosTarea = {
      titulo: nuevaTarea.value.titulo?.trim(),
      descripcion: nuevaTarea.value.descripcion?.trim() || null,
      prioridad: nuevaTarea.value.prioridad || 'media',
      fecha_limite: nuevaTarea.value.fecha_limite || null,
      areas_asignadas: areasAsignadas
    };

    const response = await api.post('/tareas', datosTarea);
    
    alert(`✅ ${response.data.message}`);
    
    nuevaTarea.value = { titulo: '', descripcion: '', prioridad: 'media', fecha_limite: '' };
    areasSeleccionadas.value = [];
    areasUsuarios.value = {};
    areasFechas.value = {};
    
    await cargarTareas();
    
  } catch (error) {
    console.error('❌ Error al crear tarea:', error);
    alert(`❌ Error: ${error.response?.data?.message || error.message}`);
  }
};

const getEstadoLabel = (estado) => {
  const labels = {
    'pendiente': 'Pendiente',
    'en_proceso': 'En Proceso',
    'por_validar': 'Por Validar',
    'completada': 'Completada',
    'rechazada': 'Rechazada'
  };
  return labels[estado] || estado;
};

const formatDate = (date) => {
  if (!date) return 'Sin fecha';
  return new Date(date).toLocaleDateString('es-MX');
};

onMounted(() => {
  if (!authStore.puedeCrearTareas) {
    router.push('/mis-tareas');
    return;
  }
  cargarTareas();
  cargarAreas();
  cargarUsuarios();
});
</script>

<style scoped>
.page-container {
  max-width: 1300px;
  margin: 0 auto;
}

h1 {
  color: #0d3d2a;
  font-size: 28px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 4px 0;
}

.title-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
}

/* Acceso denegado */
.acceso-denegado {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.denegado-card {
  background: white;
  padding: 48px;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(13, 61, 42, 0.15);
  text-align: center;
  max-width: 500px;
  border-top: 4px solid #1a5c40;
}

.denegado-card .icono {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.denegado-card h1 {
  color: #0d3d2a;
  margin-bottom: 12px;
  justify-content: center;
}

.denegado-card p {
  color: #666;
  margin-bottom: 8px;
}

.denegado-card .detalle {
  font-size: 13px;
  color: #999;
  margin-bottom: 24px;
}

/* Formulario */
.form-container {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(13, 61, 42, 0.08);
  margin-bottom: 30px;
  border-top: 4px solid #1a5c40;
}

.form-container h2 {
  margin-bottom: 16px;
  color: #0d3d2a;
  font-weight: 800;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field.full-width {
  grid-column: 1 / -1;
}

.field label {
  display: block;
  font-weight: 700;
  margin-bottom: 4px;
  font-size: 13px;
  color: #0d3d2a;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e0ebe5;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: #f5faf7;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: #1a5c40;
  background: white;
  box-shadow: 0 0 0 3px rgba(26, 92, 64, 0.1);
}

/* Botones */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #0d3d2a 0%, #1a5c40 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 4px 12px rgba(13, 61, 42, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #1a5c40 0%, #2d7a55 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(13, 61, 42, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.btn-icon-small {
  width: 12px;
  height: 12px;
  object-fit: contain;
  vertical-align: middle;
  margin-right: 4px;
  opacity: 0.7;
}

.section-icon-white {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

/* Áreas */
.areas-section {
  margin-top: 20px;
  border: 2px solid #e0ebe5;
  border-radius: 10px;
  overflow: hidden;
  background: #f5faf7;
}

.areas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #0d3d2a 0%, #1a5c40 100%);
  color: white;
}

.areas-header h3 {
  font-size: 14px;
  margin: 0;
  color: white;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.areas-actions {
  display: flex;
  gap: 8px;
}

.btn-mini {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  color: white;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-mini:hover {
  background: rgba(255, 255, 255, 0.3);
}

.categoria-grupo {
  padding: 12px 16px;
  border-bottom: 1px solid #e0ebe5;
}

.categoria-grupo:last-child {
  border-bottom: none;
}

.categoria-titulo {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: #0d3d2a;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.categoria-areas {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.area-item {
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.area-item.seleccionada {
  background: white;
  border-color: #1a5c40;
  box-shadow: 0 2px 6px rgba(26, 92, 64, 0.15);
}

.area-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 13px;
  user-select: none;
}

.area-checkbox input[type="checkbox"] {
  margin-right: 8px;
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #1a5c40;
}

.area-nombre {
  flex: 1;
  font-weight: 600;
  color: #333;
}

.area-usuario {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  margin-left: 24px;
}

.select-usuario {
  flex: 2;
  padding: 6px 10px;
  border: 1px solid #e0ebe5;
  border-radius: 4px;
  font-size: 12px;
  background: white;
  font-family: inherit;
}

.select-usuario:focus {
  outline: none;
  border-color: #1a5c40;
}

.input-fecha-area {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #e0ebe5;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
}

.input-fecha-area:focus {
  outline: none;
  border-color: #1a5c40;
}

/* Resumen */
.resumen-seleccion {
  background: linear-gradient(135deg, #e0ebe5 0%, #d4e4dc 100%);
  border-left: 4px solid #1a5c40;
  padding: 14px 18px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 14px;
  color: #0d3d2a;
}

.resumen-lista {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.resumen-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: white;
  border-radius: 4px;
  font-size: 12px;
}

.area-nombre-resumen {
  font-weight: 700;
  color: #0d3d2a;
}

.area-usuario-resumen {
  color: #666;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
}

/* Tarjetas */
.tareas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

.tarea-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(13, 61, 42, 0.08);
  transition: all 0.25s;
  border-left: 4px solid #1a5c40;
}

.tarea-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(13, 61, 42, 0.15);
}

.tarea-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 8px;
}

.tarea-header h3 {
  font-size: 15px;
  margin: 0;
  flex: 1;
  color: #0d3d2a;
  font-weight: 700;
}

.estado {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
  text-transform: uppercase;
  white-space: nowrap;
}

.estado.pendiente { background: #fff3e0; color: #e65100; }
.estado.en_proceso { background: #e3f2fd; color: #0d47a1; }
.estado.por_validar { background: #f3e5f5; color: #6a1b9a; }
.estado.completada { background: #e0ebe5; color: #0d3d2a; }
.estado.rechazada { background: #ffebee; color: #b71c1c; }

.descripcion {
  color: #666;
  font-size: 13px;
  margin: 8px 0 12px 0;
}

.tarea-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  margin-bottom: 12px;
}

.prioridad,
.fecha,
.creador,
.asignado-small,
.area-estado-item {
  display: inline-flex;
  align-items: center;
}

.prioridad {
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
}

.prioridad.baja { background: #e0ebe5; color: #0d3d2a; }
.prioridad.media { background: #fff3e0; color: #e65100; }
.prioridad.alta { background: #ffebee; color: #b71c1c; }

.fecha {
  color: #888;
}

.meta-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
  vertical-align: middle;
  margin-right: 4px;
}

.meta-icon-small {
  width: 12px;
  height: 12px;
  object-fit: contain;
  vertical-align: middle;
  margin-right: 4px;
  opacity: 0.7;
}

/* Progreso */
.progreso-container {
  margin: 12px 0;
}

.progreso-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.progreso-label {
  font-weight: 700;
  color: #0d3d2a;
}

.progreso-porcentaje {
  font-weight: 800;
  color: #1a5c40;
}

.progreso-bar {
  height: 8px;
  background: #e0ebe5;
  border-radius: 4px;
  overflow: hidden;
}

.progreso-fill {
  height: 100%;
  background: linear-gradient(90deg, #1a5c40, #4ade80);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progreso-fill.completo {
  background: linear-gradient(90deg, #1a5c40, #2d7a55);
}

/* Áreas estados */
.areas-estados {
  margin: 12px 0;
  padding: 10px;
  background: #f5faf7;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid #e0ebe5;
}

.area-estado-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 4px 8px;
  background: white;
  border-radius: 4px;
}

.area-nombre-small {
  flex: 1;
  font-weight: 700;
  color: #0d3d2a;
}

.estado-small {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.estado-small.pendiente { background: #fff3e0; color: #e65100; }
.estado-small.en_proceso { background: #e3f2fd; color: #0d47a1; }
.estado-small.completada { background: #e0ebe5; color: #0d3d2a; }
.estado-small.por_validar { background: #f3e5f5; color: #6a1b9a; }
.estado-small.rechazada { background: #ffebee; color: #b71c1c; }

.asignado-small {
  color: #888;
  font-size: 10px;
}

.tarea-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #e0ebe5;
  font-size: 12px;
  color: #888;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #888;
}
</style>