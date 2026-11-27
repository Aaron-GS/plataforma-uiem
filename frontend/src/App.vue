<!-- frontend/src/App.vue -->
<template>
  <div id="app">
    <nav 
      v-if="authStore.isAuthenticated && authStore.inicializado && $route.path !== '/login'" 
      class="navbar"
    >
      <div class="nav-container">
        
        <!-- ============================================ -->
        <!-- MARCA: LOGO + TEXTO INSTITUCIONAL (MEJORADO) -->
        <!-- ============================================ -->
        <div class="nav-brand">
          <img src="/src/assets/icons/logo-uiem.png" alt="UIEM" class="brand-logo" />
          <div class="brand-text-container">
            <span class="brand-title">SISTEMA DE CONTROL DE PENDIENTES INSTITUCIONALES</span>
            <span class="brand-subtitle">UNIVERSIDAD INTERCULTURAL DEL ESTADO DE MÉXICO</span>
          </div>
        </div>

        <button class="btn-hamburger" @click="menuAbierto = !menuAbierto">
          <span v-if="!menuAbierto">☰</span>
          <span v-else>✕</span>
        </button>

        <div class="nav-links" :class="{ 'menu-abierto': menuAbierto }">
          
          <router-link to="/mis-tareas" class="nav-link" @click="menuAbierto = false">
            <img src="/src/assets/icons/icon-tareas.png" alt="" class="nav-icon" />
            <span>Mis Tareas</span>
          </router-link>
          
          <router-link to="/completadas" class="nav-link" @click="menuAbierto = false">
            <img src="/src/assets/icons/icon-tareacompletada.png" alt="" class="nav-icon" />
            <span>Tareas Completadas</span>
          </router-link>
          
          <router-link v-if="authStore.isSuperAdmin" to="/dashboard" class="nav-link" @click="menuAbierto = false">
            <img src="/src/assets/icons/icon-dashboard.png" alt="" class="nav-icon" />
            <span>Dashboard</span>
          </router-link>
          
          <router-link 
            v-if="authStore.isSuperAdmin && authStore.usuario?.email === 'antolin.celote@uiem.edu.mx'" 
            to="/calendario" class="nav-link" @click="menuAbierto = false"
          >
            <img src="/src/assets/icons/icon-fecha.png" alt="" class="nav-icon" />
            <span>Mi Calendario</span>
          </router-link>

          <div class="nav-divider"></div>
          
          <Notificaciones />
          
          <div class="user-menu">
            <span class="user-avatar">{{ getIniciales() }}</span>
            <div class="user-info">
              <span class="user-name">{{ authStore.nombreCompleto }}</span>
              <div class="user-details">
                <span class="user-rol" :class="authStore.usuario?.rol">
                  {{ authStore.rolLabel }}
                </span>
                <span class="user-area" v-if="authStore.usuario?.area">
                  {{ authStore.usuario.area.nombre }}
                </span>
              </div>
            </div>
          </div>
          
          <button @click="cerrarSesion" class="btn-logout" title="Cerrar sesión">
            <img src="/src/assets/icons/icon-logout.png" alt="Salir" class="logout-icon" />
            <span class="logout-text">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </nav>
    
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from './store/auth';
import { useNotificacionesStore } from './store/notificaciones';
import { useTareasStore } from './store/tareas';
import { useRouter, useRoute } from 'vue-router';
import Notificaciones from './components/Notificaciones.vue';

const authStore = useAuthStore();
const notificacionesStore = useNotificacionesStore();
const tareasStore = useTareasStore();
const router = useRouter();
const route = useRoute();

const menuAbierto = ref(false);

const getIniciales = () => {
  if (!authStore.usuario) return '?';
  const n = authStore.usuario.nombre?.charAt(0) || '';
  const a = authStore.usuario.apellidos?.charAt(0) || '';
  return (n + a).toUpperCase();
};

const cerrarSesion = () => {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    authStore.logout();
    router.push('/login');
  }
};

watch(() => route.path, () => {
  menuAbierto.value = false;
});

onMounted(() => {
  if (authStore.isAuthenticated) {
    // Cargar historial de la BD y luego escuchar en tiempo real
    notificacionesStore.cargarNotificaciones();
    tareasStore.iniciarEscucha();

    tareasStore.iniciarEscucha();
  }
});
</script>

<style>
/* ============================================
   RESET Y BASE
   ============================================ */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f5f7f6;
  color: #333;
  overflow-x: hidden;
}

html, body, #app {
  min-height: 100vh;
}

#app {
  display: flex;
  flex-direction: column;
}

/* ============================================
   NAVBAR
   ============================================ */
.navbar {
  background: linear-gradient(135deg, #0d3d2a 0%, #1a5c40 100%);
  color: white;
  padding: 0;
  box-shadow: 0 4px 20px rgba(13, 61, 42, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 3px solid #2d7a55;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 72px;
  position: relative;
  gap: 10px;
}

/* ============================================
   MARCA: LOGO + TEXTO (DESTACADO)
   ============================================ */
.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex-shrink: 0;
  max-width: 420px;
}

/* ✅ LOGO CON FONDO BLANCO CIRCULAR */
.brand-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  background-color: white;
  border-radius: 50%;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  flex-shrink: 0;
}

.brand-text-container {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

/* ✅ TEXTO MÁS GRANDE Y CON SOMBRA */
.brand-title {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: white;
  line-height: 1.2;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

.brand-subtitle {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.2;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

/* ============================================
   BOTÓN HAMBURGUESA
   ============================================ */
.btn-hamburger {
  display: none;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  font-size: 24px;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-hamburger:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* ============================================
   NAV LINKS
   ============================================ */
.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.25s;
  white-space: nowrap;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  box-shadow: inset 0 -2px 0 #4ade80;
}

.nav-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: none;
  opacity: 0.9;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.nav-link:hover .nav-icon {
  opacity: 1;
}

.nav-link.router-link-active .nav-icon {
  opacity: 1;
}

.nav-divider {
  display: none;
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.15);
  margin: 8px 0;
}

/* ============================================
   MENÚ DE USUARIO
   ============================================ */
.user-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  margin-left: 4px;
  max-width: 260px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4ade80, #2d7a55);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 12px;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.user-name {
  font-size: 12px;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-details {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 1px;
  flex-wrap: nowrap;
  overflow: hidden;
}

.user-rol {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  width: fit-content;
  white-space: nowrap;
}

.user-area {
  font-size: 8px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.15);
  padding: 1px 6px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

/* Colores de roles */
.user-rol.superadmin { background: rgba(255, 107, 107, 0.9); color: white; }
.user-rol.admin_area { background: rgba(78, 205, 196, 0.9); color: white; }
.user-rol.gestor { background: rgba(255, 230, 109, 0.9); color: #333; }
.user-rol.ejecutor { background: rgba(168, 230, 207, 0.9); color: #333; }
.user-rol.encargado { background: rgba(255, 193, 7, 0.9); color: #333; }

/* ============================================
   BOTÓN CERRAR SESIÓN
   ============================================ */
.btn-logout {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s;
  margin-left: 4px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: white;
  font-size: 12px;
  font-weight: 700;
  height: 40px;
  flex-shrink: 0;
}

.btn-logout:hover {
  background: rgba(220, 53, 69, 0.9);
  transform: scale(1.03);
}

.logout-text {
  white-space: nowrap;
}

.logout-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: none;
}

/* ============================================
   CONTENIDO PRINCIPAL
   ============================================ */
.main-content {
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  width: 100%;
}

/* ============================================
   RESPONSIVE - TABLET
   ============================================ */
@media (max-width: 1200px) {
  .brand-title { font-size: 9px; }
  .brand-subtitle { font-size: 8px; }
  .nav-link { padding: 6px 8px; font-size: 12px; }
  .nav-link span { display: none; }
  .nav-icon { margin: 0; }
}

@media (max-width: 1024px) {
  .user-info { display: none; }
  .user-menu { padding: 4px; max-width: none; }
}

/* ============================================
   RESPONSIVE - MÓVIL (MENÚ HAMBURGUESA)
   ============================================ */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 16px;
    height: 68px;
  }
  
  .btn-hamburger {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .brand-logo {
    width: 42px;
    height: 42px;
  }
  
  .brand-title {
    font-size: 8px;
    letter-spacing: 0.3px;
  }
  
  .brand-subtitle {
    font-size: 7px;
    letter-spacing: 0.4px;
  }
  
  .nav-links {
    position: fixed;
    top: 68px;
    left: 0;
    right: 0;
    background: linear-gradient(180deg, #0d3d2a 0%, #1a5c40 100%);
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
    gap: 6px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    max-height: calc(100vh - 68px);
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    border-top: 2px solid #2d7a55;
  }
  
  .nav-links.menu-abierto {
    transform: translateX(0);
  }
  
  .nav-link {
    padding: 14px 16px;
    font-size: 15px;
    border-radius: 8px;
    text-align: left;
  }
  
  .nav-link span {
    display: inline;
  }
  
  .nav-icon {
    width: 22px;
    height: 22px;
  }
  
  .nav-link.router-link-active {
    background: rgba(74, 222, 128, 0.2);
    box-shadow: inset 4px 0 0 #4ade80;
  }
  
  .nav-divider {
    display: block;
  }
  
  .user-menu {
    margin: 8px 0;
    padding: 12px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    max-width: none;
  }
  
  .user-info {
    display: flex;
  }
  
  .btn-logout {
    margin: 8px 0 0 0;
    padding: 14px;
    width: 100%;
    height: auto;
    gap: 10px;
    justify-content: center;
  }
  
  .btn-logout::after {
    content: 'Cerrar Sesión';
    font-size: 14px;
    font-weight: 700;
  }
  
  .main-content {
    padding: 16px;
  }
}

/* ============================================
   RESPONSIVE - MÓVIL PEQUEÑO
   ============================================ */
@media (max-width: 480px) {
  .nav-container {
    padding: 0 12px;
  }
  
  .brand-text-container {
    display: none;
  }
  
  .brand-logo {
    width: 44px;
    height: 44px;
  }
  
  .main-content {
    padding: 12px;
  }
}
</style>