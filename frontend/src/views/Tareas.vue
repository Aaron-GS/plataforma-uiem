<!-- frontend/src/views/Tareas.vue -->
<template>
  <div class="page-container">
    <div v-if="!authStore.puedeCrearTareas" class="acceso-denegado">
      <div class="denegado-card">
        <span class="icono">🔒</span>
        <h1>Acceso Restringido</h1>
        <p>Solo los administradores pueden crear y asignar tareas.</p>
        <button @click="volver" class="btn-primary">← Volver a Mis Tareas</button>
      </div>
    </div>

    <div v-else>
      <h1>
        <img src="/src/assets/icons/icon-crear.png" alt="" class="title-icon" />
        Gestión de Tareas
      </h1>
      <p class="subtitle">Crear y administrar tareas para las áreas de la universidad</p>

      <div class="form-container">
        <h2>Crear Nueva Tarea</h2>
        
        <!-- Datos Generales -->
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

        <!-- Selector de áreas dinámico -->
        <div class="areas-section">
          <div class="areas-header">
            <h3>
              <!-- ✅ El ícono ahora tiene tamaño controlado desde el CSS -->
              <img src="/src/assets/icons/icon-area.png" alt="" class="section-icon-white" />
              Áreas Destino ({{ areasSeleccionadas.length }} seleccionadas)
            </h3>
            <div class="areas-actions">
              <button type="button" @click="seleccionarTodas" class="btn-mini">Todas</button>
              <button type="button" @click="limpiarSeleccion" class="btn-mini">Limpiar</button>
            </div>
          </div>

          <div class="areas-lista">
            <div v-for="cat in areasAgrupadas" :key="cat.categoria" class="categoria-grupo">
              <div class="categoria-titulo">{{ cat.categoria }}</div>
              
              <div class="categoria-areas">
                <div 
                  v-for="area in cat.areas" 
                  :key="area.id" 
                  class="area-item"
                  :class="{ seleccionada: areasSeleccionadas.includes(area.id) }"
                >
                  <div class="area-row">
                    <label class="area-checkbox">
                      <input 
                        type="checkbox" 
                        :value="area.id" 
                        v-model="areasSeleccionadas"
                      />
                      <span class="area-nombre">{{ area.nombre }}</span>
                    </label>

                    <!-- Botón para expandir y asignar usuario específico -->
                    <button 
                      v-if="areasSeleccionadas.includes(area.id)"
                      type="button"
                      class="btn-expand"
                      @click="toggleExpandir(area.id)"
                    >
                      {{ areasExpandidas.includes(area.id) ? 'Ocultar' : 'Asignar a...' }}
                    </button>
                  </div>

                  <!-- Panel desplegable para asignar usuario -->
                  <div v-if="areasExpandidas.includes(area.id)" class="area-usuario-panel">
                    <select v-model="areasUsuarios[area.id]" class="select-usuario">
                      <option :value="null">Sin asignar (toda el área)</option>
                      <option 
                        v-for="user in getUsuariosDeArea(area.id)" 
                        :key="user.id" 
                        :value="user.id"
                      >
                        {{ user.nombre }} {{ user.apellidos }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" @click="crearTarea" class="btn-primary" :disabled="areasSeleccionadas.length === 0">
          <img src="/src/assets/icons/icon-crear.png" alt="" class="btn-icon" />
          Crear Tarea ({{ areasSeleccionadas.length }} área{{ areasSeleccionadas.length !== 1 ? 's' : '' }})
        </button>
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

const areas = ref([]);
const usuarios = ref([]);
const areasSeleccionadas = ref([]);
const areasExpandidas = ref([]); // Para saber qué áreas tienen el panel abierto
const areasUsuarios = ref({});

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

const getUsuariosDeArea = (areaId) => {
  return usuarios.value.filter(u => u.area_id === areaId);
};

const toggleExpandir = (areaId) => {
  const index = areasExpandidas.value.indexOf(areaId);
  if (index > -1) {
    areasExpandidas.value.splice(index, 1); // Cerrar
  } else {
    areasExpandidas.value.push(areaId); // Abrir
  }
};

const seleccionarTodas = () => {
  areasSeleccionadas.value = areas.value.map(a => a.id);
};

const limpiarSeleccion = () => {
  areasSeleccionadas.value = [];
  areasUsuarios.value = {};
  areasExpandidas.value = [];
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
      fecha_limite: nuevaTarea.value.fecha_limite || null
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
    
    // Limpiar formulario
    nuevaTarea.value = { titulo: '', descripcion: '', prioridad: 'media', fecha_limite: '' };
    areasSeleccionadas.value = [];
    areasUsuarios.value = {};
    areasExpandidas.value = [];
    
  } catch (error) {
    console.error('❌ Error al crear tarea:', error);
    alert(`❌ Error: ${error.response?.data?.message || error.message}`);
  }
};

onMounted(() => {
  if (!authStore.puedeCrearTareas) {
    router.push('/mis-tareas');
    return;
  }
  cargarAreas();
  cargarUsuarios();
});
</script>

<style scoped>
.page-container { max-width: 1000px; margin: 0 auto; }
h1 { color: #0d3d2a; font-size: 28px; font-weight: 800; display: flex; align-items: center; gap: 10px; margin: 0 0 4px 0; }
.title-icon { width: 32px; height: 32px; object-fit: contain; }
.subtitle { color: #666; margin-bottom: 30px; }

.form-container { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(13, 61, 42, 0.08); border-top: 4px solid #1a5c40; }
.form-container h2 { margin-bottom: 16px; color: #0d3d2a; font-weight: 800; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field.full-width { grid-column: 1 / -1; }
.field label { display: block; font-weight: 700; margin-bottom: 4px; font-size: 13px; color: #0d3d2a; }
.field input, .field select, .field textarea { width: 100%; padding: 10px 14px; border: 2px solid #e0ebe5; border-radius: 6px; font-size: 14px; font-family: inherit; transition: all 0.2s; background: #f5faf7; box-sizing: border-box; }
.field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: #1a5c40; background: white; box-shadow: 0 0 0 3px rgba(26, 92, 64, 0.1); }

/* =========================================
   SELECTOR DE ÁREAS
   ========================================= */
.areas-section { margin-top: 24px; border: 2px solid #e0ebe5; border-radius: 10px; overflow: hidden; background: #f5faf7; }
.areas-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: linear-gradient(135deg, #0d3d2a 0%, #1a5c40 100%); color: white; }
.areas-header h3 { font-size: 14px; margin: 0; color: white; font-weight: 700; display: flex; align-items: center; gap: 8px; }

/* ✅ ARREGLO DEL ICONO GIGANTE */
.section-icon-white {
  width: 18px !important;
  height: 18px !important;
  object-fit: contain;
  filter: brightness(0) invert(1); /* Lo hace blanco */
}

.areas-actions { display: flex; gap: 8px; }
.btn-mini { background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3); padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; color: white; font-weight: 600; transition: all 0.2s; }
.btn-mini:hover { background: rgba(255, 255, 255, 0.3); }

.areas-lista { padding: 12px; max-height: 400px; overflow-y: auto; }
.categoria-grupo { margin-bottom: 16px; }
.categoria-titulo { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0d3d2a; margin-bottom: 8px; padding-left: 4px; }
.categoria-areas { display: flex; flex-direction: column; gap: 6px; }

.area-item { padding: 8px 12px; border-radius: 8px; border: 1px solid transparent; transition: all 0.2s; background: white; }
.area-item.seleccionada { border-color: #1a5c40; box-shadow: 0 2px 6px rgba(26, 92, 64, 0.1); }
.area-row { display: flex; justify-content: space-between; align-items: center; }
.area-checkbox { display: flex; align-items: center; cursor: pointer; font-size: 13px; user-select: none; flex: 1; }
.area-checkbox input { margin-right: 10px; width: 16px; height: 16px; cursor: pointer; accent-color: #1a5c40; }
.area-nombre { font-weight: 600; color: #333; }

/* Botón para asignar usuario */
.btn-expand { background: none; border: 1px solid #e0ebe5; padding: 4px 10px; border-radius: 20px; font-size: 11px; color: #1a5c40; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.btn-expand:hover { background: #e0ebe5; }

/* Panel de usuario */
.area-usuario-panel { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e0ebe5; display: flex; }
.select-usuario { width: 100%; padding: 8px 12px; border: 1px solid #1a5c40; border-radius: 6px; font-size: 12px; background: white; font-family: inherit; outline: none; }

.btn-primary { display: inline-flex; align-items: center; gap: 6px; margin-top: 24px; padding: 14px 28px; background: linear-gradient(135deg, #0d3d2a 0%, #1a5c40 100%); color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.25s; box-shadow: 0 4px 12px rgba(13, 61, 42, 0.3); width: 100%; justify-content: center; }
.btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, #1a5c40 0%, #2d7a55 100%); transform: translateY(-2px); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-icon { width: 18px; height: 18px; object-fit: contain; filter: brightness(0) invert(1); }

/* Acceso denegado */
.acceso-denegado { display: flex; justify-content: center; align-items: center; min-height: 60vh; }
.denegado-card { background: white; padding: 48px; border-radius: 16px; box-shadow: 0 8px 30px rgba(13, 61, 42, 0.15); text-align: center; max-width: 500px; border-top: 4px solid #1a5c40; }
.denegado-card .icono { font-size: 64px; display: block; margin-bottom: 16px; }
.denegado-card h1 { justify-content: center; }
.denegado-card p { color: #666; margin-bottom: 24px; }
</style>