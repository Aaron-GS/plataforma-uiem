<!-- frontend/src/views/DetalleTarea.vue -->
<template>
  <div class="page-container">
    <button @click="volver" class="btn-back">← Volver</button>
    
    <div v-if="loading" class="loading">Cargando detalles...</div>
    
    <div v-else-if="tarea" class="detalle-container">
      <!-- HEADER -->
      <div class="detalle-header">
        <h1>{{ tarea.titulo }}</h1>
        <span class="estado" :class="tarea.estado">
          {{ getEstadoLabel(tarea.estado) }}
        </span>
      </div>

      <div class="detalle-body">
        <!-- DESCRIPCIÓN -->
        <div class="info-section">
          <h3>
            <img src="/src/assets/icons/icon-descripcion.png" alt="" class="section-icon" />
            Descripción
          </h3>
          <p>{{ tarea.descripcion || 'Sin descripción' }}</p>
        </div>

        <!-- INFORMACIÓN GENERAL -->
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Prioridad</span>
            <span class="value prioridad" :class="tarea.prioridad">{{ tarea.prioridad.toUpperCase() }}</span>
          </div>
          <div class="info-item">
            <span class="label">Fecha Límite</span>
            <span class="value">{{ formatDate(tarea.fecha_limite) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Creado por</span>
            <span class="value">{{ tarea.creador?.nombre }} {{ tarea.creador?.apellidos }}</span>
          </div>
          <div class="info-item">
            <span class="label">Áreas asignadas</span>
            <span class="value">
              <span v-for="ta in tarea.areas_asignadas" :key="ta.id" class="area-chip">{{ ta.area?.nombre }}</span>
            </span>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- 1. ACCIONES GENERALES Y POR ÁREA -->
        <!-- ============================================ -->
        <div class="acciones-panel">
          <h3>
            <img src="/src/assets/icons/icon-acciones.png" alt="" class="section-icon" />
            Acciones de la Tarea
          </h3>
          
          <!-- ACCIONES GENERALES (Solo para Admin) -->
          <div v-if="esAdmin" class="acciones-buttons" style="margin-bottom: 20px;">
            <template v-if="tarea.estado === 'por_validar' || tarea.estado === 'en_proceso'">
              <button @click="cambiarEstadoGeneral('completada')" class="btn-action success">
                ✔ Aprobar y Completar Tarea General
              </button>
              <button @click="cambiarEstadoGeneral('en_proceso')" class="btn-action danger">
                ✖ Rechazar (Regresar a En Proceso)
              </button>
            </template>
            <div v-if="tarea.estado === 'completada'" class="status-completed">
              🎉 Esta tarea general ha sido validada y completada.
            </div>
            <span v-if="tarea.estado === 'pendiente'" class="status-info">
              Esperando a que las áreas inicien la tarea.
            </span>
          </div>

          <!-- ACCIONES PARA GESTORES (Iniciar general) -->
          <div v-if="!esAdmin && tarea.estado === 'pendiente'" class="acciones-buttons" style="margin-bottom: 20px;">
             <button @click="cambiarEstadoGeneral('en_proceso')" class="btn-action primary">
                ▶ Iniciar Tarea (Aceptar)
              </button>
          </div>

          <!-- ✅ LISTADO DE ÁREAS CON SUS SELECTORES INDEPENDIENTES -->
          <h4 style="margin-top: 20px; margin-bottom: 10px; color: #0d3d2a; font-size: 14px;">Avance por Área:</h4>
          <div class="areas-lista-detalle">
            <div 
              v-for="ta in tarea.areas_asignadas" 
              :key="ta.id" 
              class="area-detalle-card"
            >
              <div class="area-detalle-header">
                <div class="area-info-principal">
                  <span class="area-nombre">{{ ta.area?.nombre || 'N/A' }}</span>
                  <span class="area-categoria">{{ ta.area?.categoria || '' }}</span>
                </div>
                <span class="estado" :class="ta.estado">
                  {{ getEstadoLabel(ta.estado) }}
                </span>
              </div>
              
              <div class="area-detalle-info">
                <div class="info-row">
                  <span class="info-label">👤 Asignado:</span>
                  <span class="info-value">
                    {{ ta.asignado ? `${ta.asignado.nombre} ${ta.asignado.apellidos}` : 'Sin asignar' }}
                  </span>
                </div>
              </div>
              
              <!-- Selector de estado por área -->
              <div class="area-detalle-acciones">
                <label class="accion-label">Cambiar estado de esta área:</label>
                <select 
                  :value="ta.estado" 
                  @change="cambiarEstadoArea(ta.area_id, $event.target.value)"
                  class="select-estado"
                  :class="ta.estado"
                  :disabled="tarea.estado === 'completada'"
                >
                  <option value="pendiente" :disabled="!esAdmin">Pendiente</option>
                  <option value="en_proceso" :disabled="!esAdmin && ta.estado !== 'pendiente'">En Proceso</option>
                  <option value="por_validar" :disabled="!esAdmin && ta.estado !== 'en_proceso'">Enviar a Validación</option>
                  <option value="completada" :disabled="!esAdmin">Completada (Solo Admin)</option>
                  <option value="rechazada" :disabled="!esAdmin">Rechazada (Solo Admin)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- 2. EVIDENCIAS -->
        <!-- ============================================ -->
        <div class="evidencias-section">
          <h3>
            <img src="/src/assets/icons/icon-evidencias.png" alt="" class="section-icon" />
            Evidencias (Globales)
          </h3>
          
          <div v-if="evidencias.length === 0" class="sin-evidencias">No hay evidencias subidas</div>
          <div v-else class="evidencias-list">
            <div v-for="evidencia in evidencias" :key="evidencia.id" class="evidencia-item">
              <div class="evidencia-info">
                <span class="evidencia-nombre">📄 {{ evidencia.nombre_archivo }}</span>
                <span class="evidencia-tamaño">({{ formatSize(evidencia.tamaño) }})</span>
              </div>
              <button @click="descargarEvidencia(evidencia.id)" class="btn-descargar">Descargar</button>
            </div>
          </div>
          <SubirEvidencia :tareaId="tarea.id" @archivo-subido="cargarEvidencias" />
        </div>

        <!-- ============================================ -->
        <!-- 3. COMENTARIOS -->
        <!-- ============================================ -->
        <Comentarios :tareaId="tarea.id" />

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import api from '../services/api';
import SubirEvidencia from '../components/SubirEvidencia.vue';
import Comentarios from '../components/Comentarios.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const tarea = ref(null);
const evidencias = ref([]);
const loading = ref(true);

const esAdmin = computed(() => authStore.isSuperAdmin);

const cargarTarea = async () => {
  loading.value = true;
  try {
    const response = await api.get(`/tareas/${route.params.id}`);
    tarea.value = response.data.data;
  } catch (error) {
    alert('Error al cargar los detalles de la tarea');
  } finally {
    loading.value = false;
  }
};

const cargarEvidencias = async () => {
  try {
    const response = await api.get(`/tareas/${route.params.id}/evidencias`);
    evidencias.value = response.data.data || [];
  } catch (error) {
    console.error('Error evidencias', error);
  }
};

// Cambiar estado general (Aprobar tarea entera)
const cambiarEstadoGeneral = async (nuevoEstado) => {
  if (!confirm(`¿Cambiar el estado de la tarea GENERAL a "${getEstadoLabel(nuevoEstado)}"?`)) return;
  try {
    await api.put(`/tareas/${tarea.value.id}`, { estado: nuevoEstado });
    await cargarTarea();
  } catch (error) {
    alert('Error al cambiar estado general');
  }
};

// ✅ Cambiar estado de UNA SOLA área
const cambiarEstadoArea = async (areaId, nuevoEstado) => {
  if (!confirm(`¿Cambiar el estado de esta área a "${getEstadoLabel(nuevoEstado)}"?`)) {
    cargarTarea();
    return;
  }
  try {
    await api.put(`/tareas/${tarea.value.id}/areas/${areaId}`, { estado: nuevoEstado });
    await cargarTarea(); // Recarga para actualizar la barra visual
  } catch (error) {
    alert('Error al cambiar estado del área');
    cargarTarea();
  }
};

const descargarEvidencia = async (evidenciaId) => {
  try {
    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://172.16.100.30:3001/api';
    const response = await fetch(`${API_URL}/evidencias/${evidenciaId}/descargar`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'evidencia';
    a.click();
  } catch (error) {
    alert('Error al descargar');
  }
};

const volver = () => router.push('/mis-tareas');
const getEstadoLabel = (estado) => {
  const map = { 'pendiente': 'Pendiente', 'en_proceso': 'En Proceso', 'por_validar': 'Por Validar', 'completada': 'Completada', 'rechazada': 'Rechazada' };
  return map[estado] || estado;
};
const formatDate = (d) => d ? new Date(d).toLocaleString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Sin fecha';
const formatSize = (b) => !b ? '0 B' : (b < 1024*1024 ? (b/1024).toFixed(1) + ' KB' : (b/(1024*1024)).toFixed(1) + ' MB');

onMounted(() => {
  cargarTarea();
  cargarEvidencias();
});
</script>

<style scoped>
/* (Mismos estilos que tenías, solo asegúrate de tener estas clases) */
.page-container { max-width: 1000px; margin: 0 auto; }
.btn-back { background: none; border: none; color: #1a5c40; font-size: 15px; cursor: pointer; padding: 8px 0; margin-bottom: 20px; font-weight: 700; }
.detalle-container { background: white; border-radius: 14px; padding: 24px; box-shadow: 0 2px 8px rgba(13, 61, 42, 0.08); border-top: 4px solid #1a5c40; }
.detalle-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e0ebe5; gap: 16px; flex-wrap: wrap; }
.detalle-header h1 { font-size: 24px; color: #0d3d2a; margin: 0; flex: 1; font-weight: 800; }
.estado { font-size: 13px; font-weight: 700; padding: 6px 16px; border-radius: 20px; text-transform: uppercase; white-space: nowrap; }
.estado.pendiente { background: #fff3e0; color: #e65100; }
.estado.en_proceso { background: #e3f2fd; color: #0d47a1; }
.estado.por_validar { background: #f3e5f5; color: #6a1b9a; }
.estado.completada { background: #e0ebe5; color: #0d3d2a; }
.section-icon { width: 20px; height: 20px; object-fit: contain; vertical-align: middle; margin-right: 8px; }
.info-section h3, .evidencias-section h3, .acciones-panel h3 { display: flex; align-items: center; color: #0d3d2a; margin-bottom: 12px; font-size: 16px; font-weight: 700; }
.info-section p { color: #555; line-height: 1.6; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; padding: 16px; background: #f5faf7; border-radius: 10px; border: 1px solid #e0ebe5; }
.info-item .label { font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;}
.info-item .value { font-size: 15px; color: #333; font-weight: 600; }
.area-chip { display: inline-block; background: #e0ebe5; color: #0d3d2a; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; margin: 2px; }

/* Acciones y Áreas */
.acciones-panel { background: #f8f9fa; border: 2px solid #e0ebe5; padding: 20px; border-radius: 10px; margin-bottom: 24px; }
.acciones-buttons { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.btn-action { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; }
.btn-action.primary { background: #2196f3; color: white; }
.btn-action.success { background: #1a5c40; color: white; }
.btn-action.danger { background: #ffebee; color: #b71c1c; }
.status-completed { background: #e0ebe5; color: #0d3d2a; padding: 12px 20px; border-radius: 8px; font-weight: 700; width: 100%; text-align: center;}
.status-info { color: #666; font-style: italic; font-size: 14px; }

.areas-lista-detalle { display: flex; flex-direction: column; gap: 10px; }
.area-detalle-card { background: white; border: 1px solid #e0ebe5; border-radius: 8px; padding: 12px 16px; }
.area-detalle-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px dashed #e0ebe5; padding-bottom: 8px;}
.area-nombre { font-size: 14px; font-weight: 800; color: #0d3d2a; display: block;}
.area-categoria { font-size: 10px; color: #888; text-transform: uppercase; font-weight: 700; }
.area-detalle-info { font-size: 12px; color: #555; margin-bottom: 8px; }
.area-detalle-acciones { display: flex; align-items: center; gap: 10px; }
.accion-label { font-size: 11px; font-weight: 700; color: #666; text-transform: uppercase; }
.select-estado { flex: 1; padding: 6px 10px; border: 2px solid #e0ebe5; border-radius: 6px; font-size: 12px; font-weight: 700; background: white; outline: none; }
.select-estado.en_proceso { border-color: #2196f3; color: #0d47a1; }
.select-estado.por_validar { border-color: #9c27b0; color: #6a1b9a; }
.select-estado.completada { border-color: #1a5c40; color: #0d3d2a; }

/* Evidencias */
.evidencias-section { margin-bottom: 24px; padding: 20px; border: 1px solid #e0ebe5; border-radius: 10px; }
.sin-evidencias { color: #888; font-style: italic; padding: 10px 0; }
.evidencias-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.evidencia-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f5faf7; border-radius: 8px; border-left: 3px solid #1a5c40; }
.evidencia-nombre { font-weight: 700; color: #0d3d2a; font-size: 14px; }
.btn-descargar { padding: 6px 14px; background: #e0ebe5; color: #0d3d2a; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700; }
@media (max-width: 768px) { .info-grid { grid-template-columns: 1fr; } }
</style>