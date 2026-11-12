<!-- frontend/src/views/DetalleTarea.vue -->
<template>
  <div class="page-container">
    <button @click="volver" class="btn-back">← Volver</button>
    
    <div v-if="loading" class="loading">Cargando detalles...</div>
    
    <div v-else-if="tarea" class="detalle-container">
      <!-- HEADER -->
      <div class="detalle-header">
        <h1>{{ tarea.titulo }}</h1>
        <span class="estado" :class="tarea.estado">{{ getEstadoLabel(tarea.estado) }}</span>
      </div>

      <div class="detalle-body">
        <!-- DESCRIPCIÓN E INFO -->
        <div class="info-section">
          <h3><img src="/src/assets/icons/icon-descripcion.png" alt="" class="section-icon" /> Descripción</h3>
          <p>{{ tarea.descripcion || 'Sin descripción' }}</p>
        </div>

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

        <!-- ACCIONES GENERALES (Solo para Admin) -->
        <div v-if="esAdmin" class="acciones-panel" style="background: white;">
          <h3><img src="/src/assets/icons/icon-acciones.png" alt="" class="section-icon" /> Acciones Generales de la Tarea</h3>
          <div class="acciones-buttons">
            <template v-if="tarea.estado !== 'completada'">
              <button @click="cambiarEstadoGeneral('completada')" class="btn-action success">✔ Aprobar y Completar Tarea General</button>
              <button @click="cambiarEstadoGeneral('en_proceso')" class="btn-action danger">✖ Rechazar Tarea General</button>
            </template>
            <div v-else class="status-completed">🎉 Esta tarea general ha sido validada y completada.</div>
          </div>
        </div>

        <!-- LISTADO DE ÁREAS -->
        <div class="areas-panel">
          <h4 style="color: #0d3d2a; font-size: 16px; margin-bottom: 12px;">Avance por Área:</h4>
          
          <div class="areas-lista-detalle">
            <div v-for="ta in tarea.areas_asignadas" :key="ta.id" class="area-detalle-card">
              
              <div class="area-detalle-header">
                <div class="area-info-principal">
                  <span class="area-nombre">{{ ta.area?.nombre || 'N/A' }}</span>
                  <span class="area-categoria">{{ ta.area?.categoria || '' }}</span>
                </div>
                <span class="estado" :class="ta.estado">{{ getEstadoLabel(ta.estado) }}</span>
              </div>
              
              <div class="area-detalle-info">
                <div class="info-row">
                  <span class="info-label">👤 Asignado:</span>
                  <span class="info-value">{{ ta.asignado ? `${ta.asignado.nombre} ${ta.asignado.apellidos}` : 'Sin asignar' }}</span>
                </div>
              </div>

              <!-- ✅ 1. EVIDENCIAS DEL ÁREA -->
              <div class="area-evidencias">
                <h5>📎 Evidencias de esta área</h5>
                
                <div v-if="!getEvidenciasArea(ta.area_id).length" class="sin-evidencias-area">No hay evidencias para esta área.</div>
                <div v-else class="evidencias-lista-area">
                  <div v-for="ev in getEvidenciasArea(ta.area_id)" :key="ev.id" class="evidencia-item-mini">
                    <span class="truncate">📄 {{ ev.nombre_archivo }}</span>
                    <button @click="descargarEvidencia(ev.id)" class="btn-descargar-mini">⬇</button>
                  </div>
                </div>
                
                <!-- Subir evidencia (solo visible si el área está EN PROCESO y no está completada) -->
                <div v-if="ta.estado === 'en_proceso'">
                  <SubirEvidencia :tareaId="tarea.id" :areaId="ta.area_id" @archivo-subido="cargarEvidencias" />
                </div>
              </div>

              <!-- ✅ 2. BOTONES DE ACCIÓN (Flujo estricto) -->
              <div class="area-detalle-acciones">
                
                <!-- VISTA PARA EL GESTOR (No Admin) -->
                <template v-if="!esAdmin">
                  <button 
                    v-if="ta.estado === 'pendiente'" 
                    @click="cambiarEstadoArea(ta.area_id, 'en_proceso')" 
                    class="btn-estado primary"
                  >
                    ▶ Iniciar Tarea
                  </button>

                  <button 
                    v-if="ta.estado === 'en_proceso'" 
                    @click="cambiarEstadoArea(ta.area_id, 'por_validar')" 
                    class="btn-estado warning"
                    :disabled="getEvidenciasArea(ta.area_id).length === 0"
                    :title="getEvidenciasArea(ta.area_id).length === 0 ? 'Debes subir al menos una evidencia para enviar a validación' : ''"
                  >
                    📤 Enviar a Validación
                  </button>

                  <div v-if="ta.estado === 'por_validar'" class="status-info">
                    ⏳ Esperando validación del administrador.
                  </div>
                  <div v-if="ta.estado === 'completada'" class="status-completed">
                    ✔ Tarea completada y validada.
                  </div>
                </template>

                <!-- VISTA PARA EL ADMINISTRADOR -->
                <template v-else>
                  <div v-if="ta.estado === 'por_validar'" class="admin-actions">
                    <button @click="cambiarEstadoArea(ta.area_id, 'completada')" class="btn-estado success">
                      ✔ Validar y Completar Área
                    </button>
                    <button @click="cambiarEstadoArea(ta.area_id, 'en_proceso')" class="btn-estado danger">
                      ✖ Rechazar (Regresar a Proceso)
                    </button>
                  </div>
                  <div v-else-if="ta.estado === 'completada'" class="status-completed">
                    ✔ Área completada y validada.
                  </div>
                  <div v-else class="status-info">
                    En espera de que el gestor complete el proceso.
                  </div>
                </template>

              </div>
            </div>
          </div>
        </div>

        <!-- COMENTARIOS -->
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

const getEvidenciasArea = (areaId) => {
  return evidencias.value.filter(e => e.area_id === areaId);
};

const cambiarEstadoGeneral = async (nuevoEstado) => {
  if (!confirm(`¿Cambiar el estado de la tarea GENERAL a "${getEstadoLabel(nuevoEstado)}"?`)) return;
  try {
    await api.put(`/tareas/${tarea.value.id}`, { estado: nuevoEstado });
    await cargarTarea();
  } catch (error) {
    alert('Error al cambiar estado general');
  }
};

const cambiarEstadoArea = async (areaId, nuevoEstado) => {
  if (!confirm(`¿Cambiar el estado de esta área a "${getEstadoLabel(nuevoEstado)}"?`)) {
    cargarTarea();
    return;
  }
  try {
    await api.put(`/tareas/${tarea.value.id}/areas/${areaId}`, { estado: nuevoEstado });
    await cargarTarea();
  } catch (error) {
    alert('Error al cambiar estado del área');
    cargarTarea();
  }
};

const descargarEvidencia = async (evidenciaId) => {
  try {
    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://172.16.100.30:3001/api';
    const response = await fetch(`${API_URL}/evidencias/${evidenciaId}/descargar`, { headers: { 'Authorization': `Bearer ${token}` } });
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

onMounted(() => {
  cargarTarea();
  cargarEvidencias();
});
</script>

<style scoped>
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
.info-section h3, .acciones-panel h3 { display: flex; align-items: center; color: #0d3d2a; margin-bottom: 12px; font-size: 16px; font-weight: 700; }
.info-section p { color: #555; line-height: 1.6; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; padding: 16px; background: #f5faf7; border-radius: 10px; border: 1px solid #e0ebe5; }
.info-item .label { font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;}
.info-item .value { font-size: 15px; color: #333; font-weight: 600; }
.area-chip { display: inline-block; background: #e0ebe5; color: #0d3d2a; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; margin: 2px; }

.acciones-panel { background: #f8f9fa; border: 2px solid #e0ebe5; padding: 20px; border-radius: 10px; margin-bottom: 24px; }
.acciones-buttons { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.btn-action { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; }
.btn-action.primary { background: #2196f3; color: white; }
.btn-action.success { background: #1a5c40; color: white; }
.btn-action.danger { background: #ffebee; color: #b71c1c; }
.status-completed { background: #e0ebe5; color: #0d3d2a; padding: 12px 20px; border-radius: 8px; font-weight: 700; width: 100%; text-align: center;}
.status-info { color: #666; font-style: italic; font-size: 14px; }

.areas-panel { margin-bottom: 24px; }
.areas-lista-detalle { display: flex; flex-direction: column; gap: 10px; }
.area-detalle-card { background: white; border: 1px solid #e0ebe5; border-radius: 8px; padding: 12px 16px; }
.area-detalle-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px dashed #e0ebe5; padding-bottom: 8px;}
.area-nombre { font-size: 14px; font-weight: 800; color: #0d3d2a; display: block;}
.area-categoria { font-size: 10px; color: #888; text-transform: uppercase; font-weight: 700; }
.area-detalle-info { font-size: 12px; color: #555; margin-bottom: 8px; }

.area-detalle-acciones { display: flex; gap: 8px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #e0ebe5; align-items: center; }
.admin-actions { display: flex; gap: 8px; width: 100%; }
.btn-estado { flex: 1; padding: 8px; border: none; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-estado.primary { background: #e3f2fd; color: #0d47a1; }
.btn-estado.warning { background: #f3e5f5; color: #6a1b9a; }
.btn-estado.success { background: #1a5c40; color: white; }
.btn-estado.danger { background: #ffebee; color: #b71c1c; }
.btn-estado:hover:not(:disabled) { opacity: 0.8; transform: translateY(-1px); }
.btn-estado:disabled { opacity: 0.4; cursor: not-allowed; }

.area-evidencias { margin-top: 12px; background: #f8f9fa; padding: 12px; border-radius: 8px; }
.area-evidencias h5 { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 8px; }
.evidencias-lista-area { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.evidencia-item-mini { display: flex; justify-content: space-between; align-items: center; background: white; padding: 6px 10px; border-radius: 4px; border: 1px solid #e0ebe5; font-size: 12px; }
.truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80%; }
.btn-descargar-mini { background: none; border: none; color: #1a5c40; cursor: pointer; font-size: 14px; }
.sin-evidencias-area { font-size: 12px; color: #999; font-style: italic; }
@media (max-width: 768px) { .info-grid { grid-template-columns: 1fr; } }
</style>