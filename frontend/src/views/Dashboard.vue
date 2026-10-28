<!-- frontend/src/views/Dashboard.vue -->
<template>
  <div class="dashboard-container">
    
    <!-- ============================================ -->
    <!-- HEADER CON ICONO -->
    <!-- ============================================ -->
    <div class="dashboard-header">
      <div class="header-title">
        <img 
          src="/src/assets/icons/icon-dashboard.png" 
          alt="Dashboard" 
          class="title-icon" 
        />
        <div>
          <h1>Dashboard - RECTORÍA</h1>
          <p class="subtitle">Visión general de la gestión de pendientes</p>
        </div>
      </div>
      
      <button @click="cargarDatos" class="btn-refresh" :disabled="loading">
        <img 
          v-if="!loading"
          src="/src/assets/icons/icon-actualizar.png" 
          alt="Actualizar" 
          class="btn-icon" 
        />
        <span v-if="!loading">Actualizar</span>
        <span v-else>⏳ Cargando...</span>
      </button>
    </div>

    <!-- ============================================ -->
    <!-- TARJETAS DE RESUMEN CON ICONOS -->
    <!-- ============================================ -->
    <div class="cards-grid">
      
      <div class="card card-blue">
        <img 
          src="/src/assets/icons/icon-total.png" 
          alt="Total" 
          class="card-icon-img" 
        />
        <div class="card-info">
          <div class="card-value">{{ stats.totales?.total_tareas || 0 }}</div>
          <div class="card-label">Total Tareas</div>
        </div>
      </div>

      <div class="card card-orange">
        <img 
          src="/src/assets/icons/icon-pendientes.png" 
          alt="Pendientes" 
          class="card-icon-img" 
        />
        <div class="card-info">
          <div class="card-value">{{ tareasPendientes }}</div>
          <div class="card-label">Pendientes</div>
        </div>
      </div>

      <div class="card card-green">
        <img 
          src="/src/assets/icons/icon-completadas.png" 
          alt="Completadas" 
          class="card-icon-img" 
        />
        <div class="card-info">
          <div class="card-value">{{ tareasCompletadas }}</div>
          <div class="card-label">Completadas</div>
        </div>
      </div>

      <div class="card card-red">
        <img 
          src="/src/assets/icons/icon-vencidas.png" 
          alt="Vencidas" 
          class="card-icon-img" 
        />
        <div class="card-info">
          <div class="card-value">{{ stats.totales?.tareas_vencidas || 0 }}</div>
          <div class="card-label">Vencidas</div>
        </div>
      </div>

    </div>

    <!-- ============================================ -->
    <!-- GRÁFICOS -->
    <!-- ============================================ -->
    <div class="charts-grid">
      
      <!-- Gráfico: Estado de tareas -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>📊 Estado de Tareas</h3>
          <span class="chart-total">{{ stats.totales?.total_tareas || 0 }} total</span>
        </div>
        <div class="chart-body">
          <canvas ref="estadoChart"></canvas>
        </div>
      </div>

      <!-- Gráfico: Prioridad de tareas -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>⚡ Prioridad de Tareas</h3>
        </div>
        <div class="chart-body">
          <canvas ref="prioridadChart"></canvas>
        </div>
      </div>

      <!-- Gráfico: Actividad reciente -->
      <div class="chart-card chart-full">
        <div class="chart-header">
          <h3>📈 Actividad Reciente (Últimos 7 días)</h3>
        </div>
        <div class="chart-body">
          <canvas ref="actividadChart"></canvas>
        </div>
      </div>

      <!-- Gráfico: Top áreas -->
      <div class="chart-card chart-full">
        <div class="chart-header">
          <h3>🏢 Top 10 Áreas con Más Tareas</h3>
        </div>
        <div class="chart-body">
          <canvas ref="areasChart"></canvas>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { Chart, registerables } from 'chart.js';
import api from '../services/api';

Chart.register(...registerables);

const stats = ref({});
const loading = ref(false);

const estadoChart = ref(null);
const prioridadChart = ref(null);
const actividadChart = ref(null);
const areasChart = ref(null);

let estadoChartInstance = null;
let prioridadChartInstance = null;
let actividadChartInstance = null;
let areasChartInstance = null;

// ============================================
// COMPUTED
// ============================================
const tareasPendientes = computed(() => {
  const estadoData = stats.value.por_estado || [];
  const pendiente = estadoData.find(e => e.estado === 'pendiente')?.count || 0;
  const enProceso = estadoData.find(e => e.estado === 'en_proceso')?.count || 0;
  return parseInt(pendiente) + parseInt(enProceso);
});

const tareasCompletadas = computed(() => {
  const estadoData = stats.value.por_estado || [];
  return parseInt(estadoData.find(e => e.estado === 'completada')?.count || 0);
});

// ============================================
// CARGAR DATOS
// ============================================
const cargarDatos = async () => {
  loading.value = true;
  try {
    const response = await api.get('/dashboard/estadisticas');
    stats.value = response.data.data;
    console.log('📊 Estadísticas:', stats.value);
    
    await nextTick();
    renderizarGraficos();
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  } finally {
    loading.value = false;
  }
};

// ============================================
// RENDERIZAR GRÁFICOS
// ============================================
const renderizarGraficos = () => {
  renderizarEstadoChart();
  renderizarPrioridadChart();
  renderizarActividadChart();
  renderizarAreasChart();
};

// Gráfico 1: Estado de tareas (Doughnut)
const renderizarEstadoChart = () => {
  if (estadoChartInstance) estadoChartInstance.destroy();
  if (!estadoChart.value) return;

  const estados = stats.value.por_estado || [];
  const labels = estados.map(e => getEstadoLabel(e.estado));
  const data = estados.map(e => parseInt(e.count));
  const colores = estados.map(e => getEstadoColor(e.estado));

  estadoChartInstance = new Chart(estadoChart.value, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colores,
        borderWidth: 3,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: { size: 12, weight: '600' },
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: '#0d3d2a',
          padding: 12,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          callbacks: {
            label: (context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const porcentaje = ((context.parsed / total) * 100).toFixed(1);
              return ` ${context.label}: ${context.parsed} (${porcentaje}%)`;
            }
          }
        }
      }
    }
  });
};

// Gráfico 2: Prioridad (Bar)
const renderizarPrioridadChart = () => {
  if (prioridadChartInstance) prioridadChartInstance.destroy();
  if (!prioridadChart.value) return;

  const prioridades = stats.value.por_prioridad || [];
  const labels = prioridades.map(p => getPrioridadLabel(p.prioridad));
  const data = prioridades.map(p => parseInt(p.count));
  const colores = prioridades.map(p => getPrioridadColor(p.prioridad));

  prioridadChartInstance = new Chart(prioridadChart.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Tareas',
        data,
        backgroundColor: colores,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 50
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d3d2a',
          padding: 12,
          callbacks: {
            label: (context) => ` ${context.parsed.y} tareas`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: '#666' },
          grid: { color: '#e0ebe5' }
        },
        x: {
          ticks: { color: '#333', font: { weight: '600' } },
          grid: { display: false }
        }
      }
    }
  });
};

// Gráfico 3: Actividad reciente (Line)
const renderizarActividadChart = () => {
  if (actividadChartInstance) actividadChartInstance.destroy();
  if (!actividadChart.value) return;

  const actividad = stats.value.actividad_reciente || [];
  
  const ultimos7Dias = [];
  for (let i = 6; i >= 0; i--) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - i);
    ultimos7Dias.push(fecha.toISOString().split('T')[0]);
  }

  const labels = ultimos7Dias.map(fecha => {
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
  });

  const data = ultimos7Dias.map(fecha => {
    const encontrado = actividad.find(a => {
      const fechaActividad = new Date(a.fecha).toISOString().split('T')[0];
      return fechaActividad === fecha;
    });
    return encontrado ? parseInt(encontrado.count) : 0;
  });

  actividadChartInstance = new Chart(actividadChart.value, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Tareas creadas',
        data,
        borderColor: '#1a5c40',
        backgroundColor: 'rgba(26, 92, 64, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#1a5c40',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d3d2a',
          padding: 12,
          callbacks: {
            label: (context) => ` ${context.parsed.y} tareas creadas`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: '#666' },
          grid: { color: '#e0ebe5' }
        },
        x: {
          ticks: { color: '#333', font: { weight: '600' } },
          grid: { display: false }
        }
      }
    }
  });
};

// Gráfico 4: Top áreas (Horizontal Bar)
const renderizarAreasChart = () => {
  if (areasChartInstance) areasChartInstance.destroy();
  if (!areasChart.value) return;

  const areas = stats.value.por_area || [];
  const labels = areas.map(a => a.area_destino?.nombre || 'N/A');
  const data = areas.map(a => parseInt(a.count));

  areasChartInstance = new Chart(areasChart.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Tareas',
        data,
        backgroundColor: labels.map((_, i) => {
          const colores = ['#0d3d2a', '#1a5c40', '#2d7a55', '#4ade80', '#a8e6cf'];
          return colores[i % colores.length];
        }),
        borderRadius: 6,
        barThickness: 24
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d3d2a',
          padding: 12,
          callbacks: {
            label: (context) => ` ${context.parsed.x} tareas`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: '#666' },
          grid: { color: '#e0ebe5' }
        },
        y: {
          ticks: { color: '#333', font: { size: 11, weight: '600' } },
          grid: { display: false }
        }
      }
    }
  });
};

// ============================================
// UTILIDADES
// ============================================
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

const getEstadoColor = (estado) => {
  const colores = {
    'pendiente': '#FF9800',
    'en_proceso': '#2196F3',
    'por_validar': '#9C27B0',
    'completada': '#4CAF50',
    'rechazada': '#F44336'
  };
  return colores[estado] || '#999';
};

const getPrioridadLabel = (prioridad) => {
  const labels = {
    'baja': 'Baja',
    'media': 'Media',
    'alta': 'Alta'
  };
  return labels[prioridad] || prioridad;
};

const getPrioridadColor = (prioridad) => {
  const colores = {
    'baja': '#4CAF50',
    'media': '#FF9800',
    'alta': '#F44336'
  };
  return colores[prioridad] || '#999';
};

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  cargarDatos();
});

onBeforeUnmount(() => {
  if (estadoChartInstance) estadoChartInstance.destroy();
  if (prioridadChartInstance) prioridadChartInstance.destroy();
  if (actividadChartInstance) actividadChartInstance.destroy();
  if (areasChartInstance) areasChartInstance.destroy();
});
</script>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
}

/* ============================================
   HEADER
   ============================================ */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 3px solid #1a5c40;
  gap: 16px;
  flex-wrap: wrap;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.title-icon {
  width: 44px;
  height: 44px;
  object-fit: contain;
  flex-shrink: 0;
}

.dashboard-header h1 {
  color: #0d3d2a;
  font-weight: 800;
  font-size: 28px;
  margin: 0 0 4px 0;
}

.subtitle {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
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

.btn-refresh:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(13, 61, 42, 0.4);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

/* ============================================
   CARDS
   ============================================ */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: white;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(13, 61, 42, 0.08);
  transition: all 0.25s;
  border-left: 5px solid;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(13, 61, 42, 0.15);
}

.card-blue { border-left-color: #2196F3; }
.card-orange { border-left-color: #FF9800; }
.card-green { border-left-color: #4CAF50; }
.card-red { border-left-color: #F44336; }

.card-icon-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
  flex-shrink: 0;
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 32px;
  font-weight: 900;
  color: #0d3d2a;
  line-height: 1;
  margin-bottom: 4px;
}

.card-label {
  font-size: 12px;
  color: #666;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ============================================
   CHARTS
   ============================================ */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card {
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(13, 61, 42, 0.08);
  border-top: 4px solid #1a5c40;
  display: flex;
  flex-direction: column;
}

.chart-card.chart-full {
  grid-column: 1 / -1;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0ebe5;
}

.chart-header h3 {
  margin: 0;
  color: #0d3d2a;
  font-size: 15px;
  font-weight: 700;
}

.chart-total {
  font-size: 12px;
  color: #1a5c40;
  background: #e0ebe5;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 700;
}

.chart-body {
  position: relative;
  height: 280px;
}

.chart-card.chart-full .chart-body {
  height: 300px;
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-card.chart-full {
    grid-column: auto;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-title {
    width: 100%;
  }
  
  .title-icon {
    width: 36px;
    height: 36px;
  }
  
  .dashboard-header h1 {
    font-size: 22px;
  }
  
  .btn-refresh {
    width: 100%;
    justify-content: center;
  }
  
  .cards-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .card {
    padding: 14px;
    gap: 10px;
  }
  
  .card-icon-img {
    width: 36px;
    height: 36px;
  }
  
  .card-value {
    font-size: 24px;
  }
  
  .card-label {
    font-size: 10px;
  }
  
  .chart-body {
    height: 240px;
  }
}

@media (max-width: 480px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-card {
    padding: 16px;
  }
  
  .chart-body {
    height: 220px;
  }
}
</style>