
// frontend/src/main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './store/auth';


const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// ✅ Inicializar autenticación ANTES de montar
const authStore = useAuthStore();
authStore.initAuth().then(() => {
  app.mount('#app');
});