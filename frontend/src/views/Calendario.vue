<!-- frontend/src/views/Calendario.vue -->
<template>
  <div class="page-container">
    <div class="header">
      <div>
        <h1>
          <img src="/src/assets/icons/icon-fecha.png" alt="" class="title-icon" />
          Mi Calendario
        </h1>
        <p class="subtitle">Agenda de actividades exclusiva para RECTORÍA</p>
      </div>
      <button @click="abrirModal" class="btn-primary">
        + Agendar Evento
      </button>
    </div>

    <!-- Componente del Calendario -->
    <div class="calendar-container">
      <FullCalendar :options="calendarOptions" />
    </div>

    <!-- ========================================= -->
    <!-- MODAL 1: CREAR EVENTO -->
    <!-- ========================================= -->
    <div v-if="mostrarModal" class="modal-overlay" @click.self="mostrarModal = false">
      <div class="modal-content">
        <h2>Agendar Nuevo Evento</h2>
        
        <div class="field">
          <label>Título del Evento *</label>
          <input v-model="nuevoEvento.titulo" type="text" placeholder="Ej: Reunión con directivos" required />
        </div>

        <div class="field">
          <label>Descripción</label>
          <textarea v-model="nuevoEvento.descripcion" rows="2" placeholder="Detalles del evento..."></textarea>
        </div>

        <div class="form-row">
          <div class="field">
            <label>Inicio *</label>
            <input v-model="nuevoEvento.fecha_inicio" type="datetime-local" required />
          </div>
          <div class="field">
            <label>Fin</label>
            <input v-model="nuevoEvento.fecha_fin" type="datetime-local" />
          </div>
        </div>

        <div class="field checkbox-field">
          <label>
            <input type="checkbox" v-model="nuevoEvento.todo_el_dia" />
            Todo el día
          </label>
        </div>

        <div class="modal-actions">
          <button @click="mostrarModal = false" class="btn-cancel">Cancelar</button>
          <button @click="guardarEvento" class="btn-save">Guardar Evento</button>
        </div>
      </div>
    </div>

    <!-- ========================================= -->
    <!-- MODAL 2: DETALLE DE EVENTO PERSONAL -->
    <!-- ========================================= -->
    <div v-if="mostrarDetalleEvento" class="modal-overlay" @click.self="mostrarDetalleEvento = false">
      <div class="modal-content">
        <h2>Detalle del Evento</h2>
        
        <div class="evento-detalle">
          <h3>{{ eventoSeleccionado.titulo }}</h3>
          <p class="evento-descripcion">{{ eventoSeleccionado.descripcion || 'Sin descripción' }}</p>
          
          <div class="evento-info">
            <p><strong>📅 Fecha de Inicio:</strong> {{ formatDate(eventoSeleccionado.fecha_inicio) }}</p>
            <p v-if="eventoSeleccionado.fecha_fin"><strong>⏰ Fecha de Fin:</strong> {{ formatDate(eventoSeleccionado.fecha_fin) }}</p>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="mostrarDetalleEvento = false" class="btn-cancel">Cerrar</button>
          <button @click="eliminarEventoDesdeModal" class="btn-danger">Eliminar Evento</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../services/api';

const router = useRouter();

// Estados para los modales y datos
const mostrarModal = ref(false);
const mostrarDetalleEvento = ref(false);
const eventoSeleccionado = ref({});

const nuevoEvento = ref({
  titulo: '',
  descripcion: '',
  fecha_inicio: '',
  fecha_fin: '',
  todo_el_dia: false
});

// ==========================================
// FUNCIONES DECLARADAS PRIMERO
// ==========================================
const handleEventClick = (info) => {
  const { tipo, tareaId, eventoId, descripcion } = info.event.extendedProps;
  
  if (tipo === 'tarea') {
    // Si es tarea, pregunta y va al detalle de la tarea
    if (confirm(`¿Ver la tarea: "${info.event.title}"?`)) {
      router.push(`/tareas/${tareaId}`);
    }
  } else {
    // Si es evento personal, abre el modal con los datos
    eventoSeleccionado.value = {
      id: eventoId,
      titulo: info.event.title.replace('📅 ', ''), // Quita el emoji
      descripcion: descripcion || '',
      fecha_inicio: info.event.start,
      fecha_fin: info.event.end
    };
    mostrarDetalleEvento.value = true;
  }
};

const cargarEventos = async () => {
  try {
    const response = await api.get('/calendario/eventos');
    calendarOptions.value.events = response.data.data;
  } catch (error) {
    console.error('Error al cargar eventos:', error);
    alert('Error al cargar el calendario');
  }
};

const abrirModal = () => {
  nuevoEvento.value = { titulo: '', descripcion: '', fecha_inicio: '', fecha_fin: '', todo_el_dia: false };
  mostrarModal.value = true;
};

const guardarEvento = async () => {
  if (!nuevoEvento.value.titulo || !nuevoEvento.value.fecha_inicio) {
    alert('El título y la fecha de inicio son obligatorios');
    return;
  }

  try {
    await api.post('/calendario/eventos', nuevoEvento.value);
    alert('✅ Evento agendado');
    mostrarModal.value = false;
    await cargarEventos();
  } catch (error) {
    console.error('Error al guardar evento:', error);
    alert('❌ Error al guardar el evento');
  }
};

const eliminarEventoDesdeModal = async () => {
  if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) return;

  try {
    await api.delete(`/calendario/eventos/${eventoSeleccionado.value.id}`);
    alert('🗑️ Evento eliminado');
    mostrarDetalleEvento.value = false;
    await cargarEventos();
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    alert('❌ Error al eliminar el evento');
  }
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// ==========================================
// CONFIGURACIÓN DEL CALENDARIO
// ==========================================
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek'
  },
  locale: 'es',
  buttonText: { today: 'Hoy', month: 'Mes', week: 'Semana' },
  events: [],
  editable: false,
  selectable: true,
  eventClick: handleEventClick, // <-- Ya está declarada arriba, no dará error
  height: 'auto'
});

onMounted(() => {
  cargarEventos();
});
</script>

<style scoped>
.page-container {
  max-width: 1300px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 3px solid #1a5c40;
}

.header h1 {
  font-size: 28px;
  color: #0d3d2a;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
}

.title-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.subtitle {
  color: #666;
  font-size: 14px;
  margin-top: 4px;
}

.calendar-container {
  background: white;
  padding: 24px;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(13, 61, 42, 0.08);
  border-top: 4px solid #1a5c40;
}

.btn-primary {
  padding: 10px 24px;
  background: linear-gradient(135deg, #0d3d2a 0%, #1a5c40 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 61, 42, 0.3);
}

/* =========================================
   ESTILOS DE LOS MODALES
   ========================================= */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
}

.modal-content h2 {
  color: #0d3d2a;
  margin-bottom: 16px;
}

.field {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 13px;
  font-weight: 700;
  color: #333;
}

.field input,
.field textarea {
  padding: 10px;
  border: 2px solid #e0ebe5;
  border-radius: 6px;
  font-family: inherit;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: #1a5c40;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .field {
  flex: 1;
}

.checkbox-field {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.checkbox-field input {
  width: auto;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancel {
  padding: 10px 20px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-save {
  padding: 10px 20px;
  background: #1a5c40;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

/* =========================================
   ESTILOS DEL DETALLE DEL EVENTO
   ========================================= */
.evento-detalle {
  background: #f5faf7;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #2196F3;
  margin-bottom: 20px;
}

.evento-detalle h3 {
  color: #0d3d2a;
  margin-bottom: 8px;
  font-size: 18px;
}

.evento-descripcion {
  color: #555;
  margin-bottom: 16px;
  font-style: italic;
}

.evento-info p {
  color: #333;
  margin-bottom: 4px;
  font-size: 14px;
}

.btn-danger {
  padding: 10px 20px;
  background: #ffebee;
  color: #b71c1c;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-danger:hover {
  background: #f44336;
  color: white;
}

/* =========================================
   ESTILOS PERSONALIZADOS PARA FULLCALENDAR
   ========================================= */
:deep(.fc) {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

:deep(.fc .fc-button-primary) {
  background-color: #1a5c40;
  border-color: #1a5c40;
  font-weight: 600;
}

:deep(.fc .fc-button-primary:hover) {
  background-color: #0d3d2a;
  border-color: #0d3d2a;
}

:deep(.fc .fc-button-primary:not(:disabled).fc-button-active) {
  background-color: #0d3d2a;
  border-color: #0d3d2a;
}

:deep(.fc-theme-standard td), 
:deep(.fc-theme-standard th),
:deep(.fc-theme-standard .fc-scrollgrid) {
  border-color: #e0ebe5;
}

:deep(.fc .fc-col-header-cell-cushion),
:deep(.fc .fc-daygrid-day-number) {
  color: #0d3d2a;
  font-weight: 700;
}

:deep(.fc .fc-toolbar-title) {
  color: #0d3d2a;
  font-weight: 800;
  text-transform: capitalize;
}

:deep(.fc-event) {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}
</style>