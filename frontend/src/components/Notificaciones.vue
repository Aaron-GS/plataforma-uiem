<!-- frontend/src/components/Notificaciones.vue -->
<template>
  <div class="notificaciones-container">
    <button @click="toggleMenu" class="btn-notificaciones" :class="{ active: menuVisible }">
      <img src="/src/assets/icons/icon-notificaciones.png" alt="Notificaciones" class="icon-notif" />
      <span v-if="totalNoLeidas > 0" class="badge">{{ totalNoLeidas }}</span>
    </button>

    <div v-if="menuVisible" class="dropdown-menu" ref="menuRef">
      <div class="menu-header">
        <span>Notificaciones</span>
        <button v-if="notificaciones.length > 0" @click="marcarTodasComoLeidas" class="btn-marcar-leidas">
          Marcar todas como leídas
        </button>
      </div>
      
      <div v-if="notificaciones.length === 0" class="empty-notificaciones">
        No tienes notificaciones
      </div>
      
      <div v-else class="lista-notificaciones">
        <div 
          v-for="noti in notificaciones.slice(0, 20)" 
          :key="noti.id" 
          class="notificacion-item"
          :class="{ noLeida: !noti.leida }"
          @click="verNotificacion(noti)"
        >
          <div class="noti-icon">{{ getIcono(noti.tipo) }}</div>
          <div class="noti-contenido">
            <div class="noti-mensaje">{{ noti.mensaje }}</div>
            <div class="noti-fecha">{{ formatDate(noti.fecha) }}</div>
          </div>
        </div>
      </div>
      
      <div v-if="notificaciones.length > 20" class="ver-mas">
        <span>Mostrando las 20 más recientes</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificacionesStore } from '../store/notificaciones';

const router = useRouter();
const notificacionesStore = useNotificacionesStore();
const menuVisible = ref(false);
const menuRef = ref(null);

const notificaciones = computed(() => notificacionesStore.notificaciones);
const totalNoLeidas = computed(() => notificacionesStore.totalNoLeidas);

const toggleMenu = () => {
  menuVisible.value = !menuVisible.value;
};

const marcarTodasComoLeidas = () => {
  notificacionesStore.marcarTodasComoLeidas();
};

const verNotificacion = (noti) => {
  notificacionesStore.marcarComoLeida(noti.id);
  if (noti.tarea_id) {
    router.push(`/tareas/${noti.tarea_id}`);
    menuVisible.value = false;
  }
};

const getIcono = (tipo) => {
  const iconos = {
    'asignacion': '📋',
    'cambio_estado': '📌',
    'comentario': '💬',
    'vencimiento': '⏰',
    'override': '⚡'
  };
  return iconos[tipo] || '📢';
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  
  if (diff < 60000) return 'Hace un momento';
  if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
  if (diff < 604800000) return `Hace ${Math.floor(diff / 86400000)} d`;
  
  return d.toLocaleDateString('es-MX');
};

const handleClickOutside = (event) => {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    const btn = event.target.closest('.btn-notificaciones');
    if (!btn) {
      menuVisible.value = false;
    }
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.notificaciones-container {
  position: relative;
}

.btn-notificaciones {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  position: relative;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-notificaciones:hover {
  background: rgba(255,255,255,0.2);
}

.btn-notificaciones.active {
  background: rgba(255,255,255,0.25);
}

.icon-notif {
  width: 22px;
  height: 22px;
  object-fit: contain;
  
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #f44336;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 50%;
  min-width: 18px;
  text-align: center;
  border: 2px solid #1a5c40;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 380px;
  max-height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
  overflow: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #0d3d2a, #1a5c40);
  color: white;
  font-weight: 600;
  flex-shrink: 0;
}

.btn-marcar-leidas {
  background: none;
  border: none;
  color: white;
  font-size: 11px;
  cursor: pointer;
  font-weight: 500;
  opacity: 0.9;
}

.btn-marcar-leidas:hover {
  text-decoration: underline;
  opacity: 1;
}

.lista-notificaciones {
  overflow-y: auto;
  flex: 1;
  max-height: 380px;
}

.notificacion-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;
}

.notificacion-item:hover {
  background: #f5faf7;
}

.notificacion-item.noLeida {
  background: #e0ebe5;
}

.notificacion-item.noLeida:hover {
  background: #d4e4dc;
}

.noti-icon {
  font-size: 20px;
  margin-right: 12px;
  flex-shrink: 0;
}

.noti-contenido {
  flex: 1;
  min-width: 0;
}

.noti-mensaje {
  font-size: 14px;
  color: #333;
  word-wrap: break-word;
}

.noti-fecha {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.empty-notificaciones {
  padding: 30px 16px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.ver-mas {
  padding: 8px 16px;
  text-align: center;
  color: #999;
  font-size: 12px;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}

.lista-notificaciones::-webkit-scrollbar {
  width: 4px;
}

.lista-notificaciones::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.lista-notificaciones::-webkit-scrollbar-thumb {
  background: #1a5c40;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .dropdown-menu {
    width: calc(100vw - 32px);
    right: 0;
  }
}
</style>