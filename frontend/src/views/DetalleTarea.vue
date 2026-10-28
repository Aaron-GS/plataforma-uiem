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
        <!-- ✅ 1. ACCIONES GENERALES (Movidas arriba) -->
        <!-- ============================================ -->
        <div class="acciones-panel">
          <h3>
            <img src="/src/assets/icons/icon-acciones.png" alt="" class="section-icon" />
            Acciones de la Tarea
          </h3>
          
          <div class="acciones-buttons">
            <!-- FLUJO PARA GESTORES -->
            <template v-if="!esAdmin">
              <button v-if="tarea.estado === 'pendiente'" @click="cambiarEstado('en_proceso')" class="btn-action primary">
                ▶ Iniciar Tarea
              </button>
              <button v-if="tarea.estado === 'en_proceso'" @click="cambiarEstado('por_validar')" class="btn-action success">
                ✅ Completar y Enviar a Validación
              </button>
              <div v-if="tarea.estado === 'por_validar'" class="status-info">
                ⏳ Esperando validación del administrador...
              </div>
            </template>

            <!-- FLUJO PARA ADMINISTRADORES -->
            <template v-else>
              <button v-if="tarea.estado === 'por_validar'" @click="cambiarEstado('completada')" class="btn-action success">
                ✔ Aprobar y Completar Tarea
              </button>
              <button v-if="tarea.estado === 'por_validar'" @click="cambiarEstado('en_proceso')" class="btn-action danger">
                ✖ Rechazar (Regresar a En Proceso)
              </button>
              <span v-if="tarea.estado !== 'por_validar' && tarea.estado !== 'completada'" class="status-info">
                Esperando a que el área responsable inicie o complete la tarea.
              </span>
            </template>

            <div v-if="tarea.estado === 'completada'" class="status-completed">
              🎉 Esta tarea ha sido validada y completada.
            </div>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- ✅ 2. EVIDENCIAS -->
        <!-- ============================================ -->
        <div class="evidencias-section" :class="{ 'disabled-section': tarea.estado === 'pendiente' && !esAdmin }">
          <h3>
            <img src="/src/assets/icons/icon-evidencias.png" alt="" class="section-icon" />
            Evidencias
          </h3>
          
          <div v-if="tarea.estado === 'pendiente' && !esAdmin" class="disabled-msg">
            Debes hacer clic en "Iniciar Tarea" para poder subir evidencias.
          </div>

          <template v-else>
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
          </template>
        </div>

        <!-- ============================================ -->
        <!-- ✅ 3. COMENTARIOS -->
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

// Identifica si el usuario actual es Admin (Superadmin, Admin Área o Encargado)
const esAdmin = computed(() => authStore.puedeCrearTareas);

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

const cambiarEstado = async (nuevoEstado) => {
  let msj = '';
  if (nuevoEstado === 'por_validar') msj = '¿Enviar a validación? Asegúrate de haber subido tus evidencias.';
  else if (nuevoEstado === 'completada') msj = '¿Aprobar y completar esta tarea?';
  else if (nuevoEstado === 'en_proceso') msj = '¿Iniciar la tarea o regresarla a proceso?';
  
  if (!confirm(msj)) return;
  
  try {
    await api.put(`/tareas/${tarea.value.id}`, { estado: nuevoEstado });
    await cargarTarea();
    alert('✅ Estado actualizado correctamente');
  } catch (error) {
    alert('❌ Error al cambiar el estado');
  }
};

const descargarEvidencia = async (evidenciaId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:3000/api/evidencias/${evidenciaId}/descargar`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'evidencia';
  a.click();
};

const volver = () => router.push('/mis-tareas');
const getEstadoLabel = (estado) => {
  const map = { 'pendiente': 'Pendiente', 'en_proceso': 'En Proceso', 'por_validar': 'Por Validar', 'completada': 'Completada', 'rechazada': 'Rechazada' };
  return map[estado] || estado;
};
const formatDate = (d) => d ? new Date(d).toLocaleString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha';
const formatSize = (b) => !b ? '0 B' : (b < 1024*1024 ? (b/1024).toFixed(1) + ' KB' : (b/(1024*1024)).toFixed(1) + ' MB');

onMounted(() => {
  cargarTarea();
  cargarEvidencias();
});
</script>

<style scoped>
.page-container { max-width: 900px; margin: 0 auto; }
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
.info-section { margin-bottom: 24px; }
.info-section p { color: #555; line-height: 1.6; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; padding: 16px; background: #f5faf7; border-radius: 10px; border: 1px solid #e0ebe5; }
.info-item .label { font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;}
.info-item .value { font-size: 15px; color: #333; font-weight: 600; }
.prioridad.alta { color: #b71c1c; }

/* Chips de áreas */
.area-chip { display: inline-block; background: #e0ebe5; color: #0d3d2a; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; margin: 2px; }

/* PANEL DE ACCIONES */
.acciones-panel { background: #f8f9fa; border: 2px solid #e0ebe5; padding: 20px; border-radius: 10px; margin-bottom: 24px; }
.acciones-buttons { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.btn-action { padding: 12px 24px; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-action:hover { transform: translateY(-2px); }
.btn-action.primary { background: #2196f3; color: white; }
.btn-action.success { background: #1a5c40; color: white; }
.btn-action.danger { background: #ffebee; color: #b71c1c; border: 1px solid #f44336; }
.status-info { color: #666; font-style: italic; font-size: 14px; font-weight: 600; }
.status-completed { background: #e0ebe5; color: #0d3d2a; padding: 12px 20px; border-radius: 8px; font-weight: 700; }

/* EVIDENCIAS */
.evidencias-section { margin-bottom: 24px; padding: 20px; border: 1px solid #e0ebe5; border-radius: 10px; }
.evidencias-section.disabled-section { opacity: 0.5; background: #f5f5f5; pointer-events: none; }
.disabled-msg { color: #888; font-weight: 600; padding: 10px 0; }
.sin-evidencias { color: #888; font-style: italic; padding: 10px 0; }
.evidencias-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.evidencia-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f5faf7; border-radius: 8px; border-left: 3px solid #1a5c40; }
.evidencia-nombre { font-weight: 700; color: #0d3d2a; font-size: 14px; }
.evidencia-tamaño { font-size: 12px; color: #888; margin-left: 8px; }
.btn-descargar { padding: 6px 14px; background: #e0ebe5; color: #0d3d2a; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700; }

@media (max-width: 768px) {
  .info-grid { grid-template-columns: 1fr; }
  .detalle-header { flex-direction: column; align-items: flex-start; }
  .acciones-buttons { flex-direction: column; align-items: stretch; }
}
</style>