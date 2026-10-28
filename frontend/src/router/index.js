// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

// Importar vistas
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import Tareas from '../views/Tareas.vue';
import MisTareas from '../views/MisTareas.vue';
import DetalleTarea from '../views/DetalleTarea.vue';
import Calendario from '../views/Calendario.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },
  {
    path: '/',
    redirect: '/mis-tareas'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/tareas',
    name: 'Tareas',
    component: Tareas,
    meta: { requiresAuth: true }
  },
  {
    path: '/mis-tareas',
    name: 'MisTareas',
    component: MisTareas,
    meta: { requiresAuth: true }
  },
  {
    path: '/tareas/:id',
    name: 'DetalleTarea',
    component: DetalleTarea,
    meta: { requiresAuth: true }
  },
  {
  path: '/calendario',
  name: 'Calendario',
  component: Calendario,
  meta: { requiresAuth: true, requiresSuperAdmin: true }
}
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.public) {
    if (authStore.isAuthenticated && to.path === '/login') {
      next('/mis-tareas');
    } else {
      next();
    }
    return;
  }

  if (!authStore.isAuthenticated) {
    next('/login');
    return;
  }

  next();
});

export default router;